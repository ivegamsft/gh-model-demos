import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { cliArgs, expandPrompt, finalOutput, grade, summarizeEvents, validateCatalog } from './harness-lib.mjs';

const evidence = '/evidence';
const workspace = '/workspace';
const cliRoot = '/usr/local/lib/node_modules/@github/copilot';

function redact(text) {
  return text.replace(/\b(?:gh[oopsur]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]+)\b/g, '[REDACTED]')
    .replace(/(authorization["':\s]+bearer\s+)\S+/gi, '$1[REDACTED]');
}

async function json(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function status(value) {
  const record = { ...value, updatedAt: new Date().toISOString() };
  await json(join(evidence, 'status.json'), record);
  console.log(JSON.stringify(record));
}

export function command(file, args, { cwd = workspace, timeoutMs = 60000, onLine } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd, env: process.env, detached: true });
    let stdout = '';
    let stderr = '';
    let pending = '';
    let timedOut = false;
    const stop = () => {
      try { process.kill(-child.pid, 'SIGKILL'); }
      catch (error) { if (error.code !== 'ESRCH') reject(error); }
    };
    const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
    child.stdout.on('data', chunk => {
      const text = redact(chunk.toString());
      stdout += text;
      pending += text;
      const lines = pending.split('\n');
      pending = lines.pop();
      for (const line of lines) onLine?.(line);
    });
    child.stderr.on('data', chunk => { stderr += redact(chunk.toString()); });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (pending) onLine?.(pending);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}

async function checked(file, args, options) {
  const result = await command(file, args, options);
  if (result.code !== 0 || result.timedOut) {
    throw new Error(`${file} failed (${result.timedOut ? 'timeout' : result.code}): ${result.stderr}`);
  }
  return result.stdout;
}

async function prepareAuth() {
  await mkdir(evidence, { recursive: true });
  const home = join(process.env.HOME, '.copilot');
  await cp('/auth', home, { recursive: true, filter: path =>
    !['session-state', 'logs', 'session-store.db', 'session-store.db-shm', 'session-store.db-wal']
      .some(name => path.endsWith(`/${name}`)) });
  process.env.COPILOT_HOME = home;
  delete process.env.GH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.COPILOT_GITHUB_TOKEN;
}

async function catalog() {
  await checked(process.execPath, [
    '/opt/harness/dump-models.mjs', join(cliRoot, 'copilot-sdk/index.js'),
    join(cliRoot, 'npm-loader.js'), evidence,
  ]);
  const inventory = JSON.parse(await readFile(join(evidence, 'model-inventory.json'), 'utf8'));
  await json(join(evidence, 'versions.json'), {
    node: process.version,
    gh: (await checked('gh', ['--version'])).trim(),
    copilot: inventory.cliVersion,
  });
  return inventory.models;
}

async function persistedEvents(sessionId) {
  const path = join(process.env.COPILOT_HOME, 'session-state', sessionId, 'events.jsonl');
  try { await access(path); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  return (await readFile(path, 'utf8')).trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(redact(line)));
}

async function main() {
  await prepareAuth();
  if (process.argv[2] === '--preflight') {
    const models = await catalog();
    await status({ state: 'ready', models: models.length, inferenceRequests: 0 });
    return;
  }
  const plan = JSON.parse(await readFile(process.argv[2], 'utf8'));
  const began = Date.now();
  const events = [];
  const turns = [];
  const seen = new Set();
  const eventLog = createWriteStream(join(evidence, 'events.jsonl'));
  let logFailure;
  eventLog.on('error', error => { logFailure = error; });
  const record = event => {
    if (!event?.type || (event.id && seen.has(event.id))) return;
    if (event.id) seen.add(event.id);
    events.push(event);
    eventLog.write(`${redact(JSON.stringify(event))}\n`);
  };
  let state = 'failed';
  let failure = null;
  let capHit = null;
  let lastOutput = '';
  try {
    await status({ state: 'preflight', variant: plan.variant });
    validateCatalog(plan.phases, await catalog());
    await cp('/job/snapshot', workspace, { recursive: true });
    await checked('git', ['init', '-q']);
    await checked('git', ['config', 'user.name', 'Harness']);
    await checked('git', ['config', 'user.email', 'harness@localhost']);
    await checked('git', ['add', '.']);
    await checked('git', ['commit', '-qm', 'Fixture baseline', '--allow-empty']);
    const deadline = Date.now() + plan.caps.timeout_minutes * 60000;
    let previousOutput;
    for (const [phaseIndex, phase] of plan.phases.entries()) {
      const sessionId = randomUUID();
      let previousStoredCount = 0;
      for (const [turnIndex, template] of phase.turns.entries()) {
        const input = expandPrompt(template, {
          files: plan.files, batch: plan.batch, previousOutput, now: new Date().toISOString(),
        });
        const prefix = `session-${phaseIndex + 1}-turn-${turnIndex + 1}`;
        await writeFile(join(evidence, `${prefix}-input.md`), input);
        await status({ state: 'running', variant: plan.variant, phase: phaseIndex + 1, turn: turnIndex + 1, sessionId });
        const remaining = deadline - Date.now();
        if (remaining <= 0) { capHit = 'wall-clock'; throw new Error('Trial wall-clock cap exceeded.'); }
        const streamed = [];
        const result = await command('copilot', cliArgs(phase, plan.caps, sessionId, input), {
          timeoutMs: remaining,
          onLine(line) {
            if (!line.trim()) return;
            try {
              const parsed = JSON.parse(line);
              const event = parsed.event ?? parsed;
              streamed.push(event);
              record(event);
            } catch (error) {
              if (!(error instanceof SyntaxError)) throw error;
              // Raw non-JSON lines are retained in stdout, not interpreted as successful events.
            }
          },
        });
        await writeFile(join(evidence, `${prefix}-stdout.log`), result.stdout);
        await writeFile(join(evidence, `${prefix}-stderr.log`), result.stderr);
        const stored = await persistedEvents(sessionId);
        stored.forEach(record);
        const newStored = stored.slice(previousStoredCount);
        previousStoredCount = stored.length;
        lastOutput = finalOutput(streamed) ?? finalOutput(newStored) ?? '';
        const turn = { sessionId, phase: phaseIndex + 1, turn: turnIndex + 1,
          requestedModel: phase.model, exitCode: result.code, timedOut: result.timedOut,
          output: lastOutput, acceptance: grade(plan.pattern, lastOutput, plan.acceptance) };
        turns.push(turn);
        await json(join(evidence, 'turns.json'), turns);
        if (result.timedOut) {
          capHit = 'wall-clock';
          throw new Error('Trial wall-clock cap exceeded.');
        }
        if (result.code !== 0) throw new Error(`Copilot exited with status ${result.code}. See ${prefix}-stderr.log.`);
        const errors = [...streamed, ...newStored].filter(event => event.type === 'session.error');
        if (errors.length) throw new Error(`Copilot session error: ${redact(JSON.stringify(errors.at(-1).data))}`);
        if (!lastOutput) throw new Error('No final assistant response found; inspect raw stdout and events.');
        if (logFailure) throw logFailure;
      }
      previousOutput = lastOutput;
    }
    state = 'completed';
  } catch (error) {
    failure = error.message;
    state = capHit ? 'capped' : 'failed';
    await writeFile(join(evidence, 'error.log'), redact(error.stack ?? error.message));
  } finally {
    await new Promise((resolve, reject) => {
      if (logFailure) return reject(logFailure);
      eventLog.end(error => error ? reject(error) : resolve());
    });
    // Intent-to-add includes newly created fixture files in the patch without staging their content.
    const add = await command('git', ['add', '-N', '.']);
    const diff = await command('git', ['diff', '--binary', 'HEAD']);
    await writeFile(join(evidence, 'changes.patch'), diff.stdout);
    if (add.code !== 0 || diff.code !== 0) {
      failure = `${failure ?? ''}\nCould not collect complete workspace diff: ${add.stderr}${diff.stderr}`.trim();
      state = 'failed';
    }
    await writeFile(join(evidence, 'output.md'), lastOutput);
    const result = {
      pattern: plan.pattern, variant: plan.variant, trial: plan.trial, repetition: plan.repetition,
      status: state, error: failure, capHit, elapsedMs: Date.now() - began,
      acceptance: grade(plan.pattern, lastOutput, plan.acceptance),
      metrics: summarizeEvents(events), turns: turns.map(({ output, acceptance, ...turn }) => turn),
      telemetryComplete: false,
    };
    await json(join(evidence, 'result.json'), result);
    await status({ state, variant: plan.variant, error: failure });
  }
  if (state !== 'completed') process.exitCode = 1;
}

if (process.argv[1]?.endsWith('worker.mjs')) {
  main().catch(async error => {
    console.error(redact(error.stack ?? String(error)));
    await mkdir(evidence, { recursive: true });
    await writeFile(join(evidence, 'fatal-error.log'), redact(error.stack ?? String(error)));
    process.exitCode = 1;
  });
}
