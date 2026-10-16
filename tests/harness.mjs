import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlan, comparison, hash, inside, positive } from './harness-lib.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
const resultsRoot = join(directory, 'results');

function options(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (!['--pattern', '--config', '--trials', '--budget', '--variant', '--run', '--dry-run', '--watch', '--review'].includes(key)) {
      throw new Error(`Unknown argument: ${key}`);
    }
    if (['--dry-run', '--watch'].includes(key)) parsed[key.slice(2)] = true;
    else {
      if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Missing value for ${key}`);
      parsed[key.slice(2)] = args[++index];
    }
  }
  return parsed;
}

function exec(args, { timeoutMs = 60000, inherit = false, onLine } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let pending = '';
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.stdout?.on('data', chunk => {
      const text = chunk.toString();
      stdout += text;
      pending += text;
      const lines = pending.split('\n');
      pending = lines.pop();
      lines.forEach(line => onLine?.(line));
    });
    child.stderr?.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (pending) onLine?.(pending);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}

async function docker(args, opts) {
  const result = await exec(args, opts);
  if (result.code !== 0 || result.timedOut) {
    throw new Error(`docker ${args[0]} failed (${result.timedOut ? 'timeout' : result.code}): ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

async function json(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function loadConfig(opts) {
  const config = JSON.parse(await readFile(opts.config ? resolve(opts.config) : join(directory, 'config.json'), 'utf8'));
  config.trials = positive(Number(opts.trials ?? config.trials), 'trials', true);
  config.maxPlannedAiCredits = positive(Number(opts.budget ?? config.maxPlannedAiCredits), 'budget');
  positive(config.cpus, 'cpus');
  positive(config.pidsLimit, 'pidsLimit', true);
  if (typeof config.image !== 'string' || !config.image || config.image.startsWith('-')) throw new Error('Invalid image name.');
  if (!/^\d+[bkmg]$/i.test(config.memory)) throw new Error('memory must be an explicit Docker memory limit, e.g. 2g.');
  for (const variant of ['good', 'bad']) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/.test(config.authVolumes?.[variant] ?? '')) throw new Error(`Invalid ${variant} auth volume.`);
  }
  if (config.authVolumes.good === config.authVolumes.bad) throw new Error('Good and bad must use separate auth volumes.');
  if (!config.modelClasses || !config.toolProfiles) throw new Error('Missing model/tool mappings.');
  return config;
}

function containerArgs(config, name, variant) {
  return ['create', '--name', name, '--init', '--cap-drop=ALL',
    '--security-opt=no-new-privileges', '--cpus', String(config.cpus), '--memory', config.memory,
    '--pids-limit', String(config.pidsLimit), '--mount',
    `type=volume,source=${config.authVolumes[variant]},target=/auth,readonly`, config.image];
}

async function engineAndImage(config) {
  if (await docker(['info', '--format', '{{.OSType}}']) !== 'linux') throw new Error('Linux Docker containers are required.');
  return JSON.parse(await docker(['image', 'inspect', config.image]))[0];
}

async function preflight(config) {
  const image = await engineAndImage(config);
  const checks = { imageId: image.Id, variants: {} };
  for (const variant of ['good', 'bad']) {
    const name = `model-preflight-${variant}-${randomUUID().slice(0, 8)}`;
    let created = false;
    try {
      await docker(['volume', 'inspect', config.authVolumes[variant]]);
      await docker([...containerArgs(config, name, variant), 'node', '/opt/harness/worker.mjs', '--preflight']);
      created = true;
      const result = await exec(['start', '--attach', name], { timeoutMs: 120000 });
      const inspection = JSON.parse(await docker(['inspect', name]))[0];
      checks.variants[variant] = {
        passed: result.code === 0 && !result.timedOut && inspection.State.ExitCode === 0,
        output: result.stdout.trim(), error: result.stderr.trim(),
      };
    } catch (error) {
      checks.variants[variant] = { passed: false, error: error.message };
    } finally {
      if (created) await docker(['rm', '--force', name]);
    }
  }
  const path = join(resultsRoot, 'container-preflight.json');
  await mkdir(resultsRoot, { recursive: true });
  await json(path, checks);
  console.log(JSON.stringify(checks, null, 2));
  if (Object.values(checks.variants).some(check => !check.passed)) {
    throw new Error(`Container preflight failed. Authenticate both variants with the login command. Evidence: ${path}`);
  }
}

async function collect(name, destination) {
  await mkdir(destination, { recursive: true });
  const copy = await exec(['cp', `${name}:/evidence/.`, destination]);
  if (copy.code !== 0) throw new Error(`Evidence collection failed for ${name}: ${copy.stderr}`);
}

async function executePair(config, plan, runPath, trial, repetition, manifest, writeStatus) {
  const order = (trial + repetition) % 2 === 0 ? ['good', 'bad'] : ['bad', 'good'];
  const containers = [];
  let failed = false;
  try {
    // Both containers are prepared before either model is invoked.
    for (const variant of order) {
      const name = `model-${variant}-${randomUUID().slice(0, 12)}`;
      const path = join(runPath, `trial-${trial}`, `repetition-${repetition}`, variant);
      await mkdir(path, { recursive: true });
      const job = { ...plan.variants[variant], trial, repetition,
        batch: plan.variants[variant].batches?.[repetition - 1] };
      const jobPath = join(path, 'plan.json');
      await json(jobPath, job);
      await docker(containerArgs(config, name, variant));
      const container = { name, variant, path, job, collected: false };
      containers.push(container);
      await docker(['cp', jobPath, `${name}:/job/plan.json`]);
      const snapshot = join(runPath, 'snapshot');
      await docker(['cp', snapshot, `${name}:/job/snapshot`]);
    }
    for (const container of containers) {
      const { name, path, variant, job } = container;
      await writeStatus({ state: 'running', trial, repetition, variant, container: name });
      manifest.executionOrder.push({ trial, repetition, variant, container: name, startedAt: new Date().toISOString() });
      await json(join(runPath, 'manifest.json'), manifest);
      const started = Date.now();
      const execution = await exec(['start', '--attach', name], {
        timeoutMs: job.caps.timeout_minutes * 60000 + 180000,
        onLine(line) {
          console.log(`[${trial}/${repetition}/${variant}] ${line}`);
        },
      });
      // A timed-out attach client does not imply the model process stopped.
      if (execution.timedOut) await docker(['stop', '--time', '2', name]);
      await writeFile(join(path, 'controller-stdout.log'), execution.stdout);
      await writeFile(join(path, 'controller-stderr.log'), execution.stderr);
      const inspection = JSON.parse(await docker(['inspect', name]))[0];
      await json(join(path, 'container-state.json'), {
        exitCode: inspection.State.ExitCode, oomKilled: inspection.State.OOMKilled,
        startedAt: inspection.State.StartedAt, finishedAt: inspection.State.FinishedAt,
        controllerTimedOut: execution.timedOut,
      });
      await collect(name, path);
      container.collected = true;
      let result;
      try { result = JSON.parse(await readFile(join(path, 'result.json'), 'utf8')); }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        result = {
          pattern: plan.pattern, variant, trial, repetition, status: 'failed',
          error: 'Worker did not produce a result; inspect controller logs and container state.',
          acceptance: job.acceptance.map(criterion => ({ criterion, status: 'needs-review', evidence: null })),
          elapsedMs: Date.now() - started, metrics: null,
        };
      }
      if (execution.code !== 0 || inspection.State.ExitCode !== 0 || execution.timedOut || inspection.State.OOMKilled) {
        result.status = execution.timedOut ? 'capped' : 'failed';
        result.error ??= `Container exit ${inspection.State.ExitCode}; controller timeout ${execution.timedOut}; OOM ${inspection.State.OOMKilled}`;
      }
      await json(join(path, 'result.json'), result);
      if (result.status !== 'completed') failed = true;
      await writeStatus({ state: 'collecting', trial, repetition, variant, outcome: result.status });
    }
  } finally {
    const cleanupErrors = [];
    for (const container of containers) {
      try {
        if (!container.collected) await collect(container.name, container.path);
      } catch (error) { cleanupErrors.push(error.message); }
      try { await docker(['rm', '--force', container.name]); }
      catch (error) { cleanupErrors.push(error.message); }
    }
    if (cleanupErrors.length) {
      await json(join(runPath, 'cleanup-errors.json'), cleanupErrors);
      throw new Error(`Container cleanup/evidence errors: ${cleanupErrors.join('; ')}`);
    }
  }
  return failed;
}

async function resultPaths(path) {
  const found = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name === 'snapshot') continue;
    const child = join(path, entry.name);
    if (entry.isDirectory()) found.push(...await resultPaths(child));
    else if (entry.name === 'result.json') found.push(child);
  }
  return found.sort();
}

async function report(runPath) {
  const manifest = JSON.parse(await readFile(join(runPath, 'manifest.json'), 'utf8'));
  const paths = await resultPaths(runPath);
  const results = await Promise.all(paths.map(async path => {
    const result = JSON.parse(await readFile(path, 'utf8'));
    try {
      const review = JSON.parse(await readFile(join(dirname(path), 'review.json'), 'utf8'));
      if (review.sourceHash !== hash(JSON.stringify(result)) || !review.reviewer || !review.evidence ||
          !Array.isArray(review.acceptance) || review.acceptance.length !== result.acceptance.length ||
          review.acceptance.some((check, index) => check.criterion !== result.acceptance[index].criterion ||
            !['pass', 'fail'].includes(check.status) || !check.evidence)) {
        throw new Error(`Invalid or stale review: ${dirname(path)}`);
      }
      result.acceptance = review.acceptance;
      result.reviewedBy = review.reviewer;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return result;
  }));
  const summary = comparison(results);
  const expected = manifest.config.trials * manifest.repetitions * 2;
  const complete = results.length === expected && results.every(result => result.status === 'completed');
  await json(join(runPath, 'comparison.json'), {
    complete, expectedAttempts: expected, collectedAttempts: results.length, summary, results,
  });
  const lines = [
    `# Experiment: ${manifest.pattern}`, '',
    `Run: ${manifest.runId}`, `Cache condition: ${manifest.config.cacheCondition}`,
    `Execution: ${complete ? 'completed' : 'incomplete/failed'} (${results.length}/${expected} attempts collected)`,
    '', '| Variant | Attempts | Accepted | Needs review | Total nano-AIU | nano-AIU / accepted | Elapsed ms |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...Object.entries(summary).map(([variant, value]) =>
      `| ${variant} | ${value.attempts} | ${value.accepted} | ${value.needsReview} | ${value.totalNanoAiu ?? 'unknown'} | ${value.nanoAiuPerAcceptedCompletion ?? 'undefined/unknown'} | ${value.elapsedMs} |`),
    '', 'Missing usage is unknown, not zero. No dollar or AI-credit conversion is assumed.',
    'Failures remain in totals. No savings claim is valid without complete cost and acceptance evidence.',
    '', '## Evidence', '',
    ...paths.map(path => `- [${relative(runPath, path).replaceAll('\\', '/')}](${relative(runPath, path).replaceAll('\\', '/')})`),
    '',
  ];
  await writeFile(join(runPath, 'report.md'), lines.join('\n'));
  console.log(`Report: ${join(runPath, 'report.md')}`);
  return { complete, summary };
}

async function run(config, opts) {
  const plan = await buildPlan(root, opts.pattern ?? 'one-shot', config);
  if (plan.variants.good.repetitions !== plan.variants.bad.repetitions) throw new Error('Paired repetitions must match.');
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${plan.pattern}-${randomUUID().slice(0, 8)}`;
  const runPath = join(resultsRoot, runId);
  await mkdir(runPath, { recursive: true });
  const manifest = {
    runId, pattern: plan.pattern, createdAt: new Date().toISOString(), config,
    plannedAiCredits: plan.plannedAiCredits, repetitions: plan.variants.good.repetitions,
    promptHashes: Object.fromEntries(Object.entries(plan.variants).map(([variant, value]) => [variant, value.sourceHash])),
    fixtureHashes: plan.variants.good.fixtures, executionOrder: [], dryRun: Boolean(opts['dry-run']),
  };
  const writeStatus = async status => {
    await json(join(runPath, 'status.json'), { ...status, updatedAt: new Date().toISOString(), runId });
  };
  await json(join(runPath, 'manifest.json'), manifest);
  await json(join(runPath, 'resolved-plan.json'), plan);
  console.log(`Run: ${runId}\nPlanned session caps: ${plan.plannedAiCredits} AI credits (soft limits)\nEvidence: ${runPath}`);
  if (opts['dry-run']) {
    await writeStatus({ state: 'dry-run-passed', inferenceRequests: 0 });
    return;
  }
  let failed = false;
  try {
    await writeStatus({ state: 'preflight' });
    const image = await engineAndImage(config);
    manifest.imageId = image.Id;
    manifest.repoDigests = image.RepoDigests;
    manifest.harnessHashes = Object.fromEntries(await Promise.all(
      ['harness.mjs', 'harness-lib.mjs', 'worker.mjs', 'Dockerfile', 'package-lock.json'].map(async name =>
        [name, hash(await readFile(join(directory, name)))])));
    await preflight(config);
    const snapshot = join(runPath, 'snapshot');
    await mkdir(snapshot, { recursive: true });
    for (const [name, expectedHash] of Object.entries(plan.variants.good.fixtures)) {
      const destination = inside(snapshot, name);
      await mkdir(dirname(destination), { recursive: true });
      await cp(inside(root, name), destination);
      if (hash(await readFile(destination)) !== expectedHash) throw new Error(`Fixture changed while snapshotting: ${name}`);
    }
    await json(join(runPath, 'manifest.json'), manifest);
    for (let trial = 1; trial <= config.trials; trial++) {
      for (let repetition = 1; repetition <= manifest.repetitions; repetition++) {
        failed = await executePair(config, plan, runPath, trial, repetition, manifest, writeStatus) || failed;
      }
    }
    await writeStatus({ state: failed ? 'failed' : 'completed' });
  } catch (error) {
    failed = true;
    await writeFile(join(runPath, 'controller-error.log'), error.stack ?? String(error));
    await writeStatus({ state: 'failed', error: error.message });
    console.error(error.message);
  } finally {
    await report(runPath);
  }
  if (failed) process.exitCode = 1;
}

async function monitor(runPath, watch) {
  do {
    const record = JSON.parse(await readFile(join(runPath, 'status.json'), 'utf8'));
    console.log(JSON.stringify(record, null, 2));
    if (record.state === 'running' && record.container) {
      const result = await exec(['stats', '--no-stream', '--format', '{{json .}}', record.container], { timeoutMs: 15000 });
      if (result.code === 0) console.log(result.stdout.trim());
      else console.error(`Docker stats unavailable: ${result.stderr.trim()}`);
      const progress = await exec(['exec', record.container, 'node', '-e',
        "process.stdout.write(require('fs').readFileSync('/evidence/status.json','utf8'))"], { timeoutMs: 15000 });
      if (progress.code === 0) console.log(progress.stdout.trim());
      else console.error(`Worker status unavailable: ${progress.stderr.trim()}`);
    }
    if (!watch || ['failed', 'completed', 'dry-run-passed'].includes(record.state)) return;
    await new Promise(resolve => setTimeout(resolve, 3000));
  } while (true);
}

async function main() {
  const [action = 'help', ...args] = process.argv.slice(2);
  const opts = options(args);
  if (action === 'help') {
    console.log('Commands: build | login [--variant good|bad] | preflight | run [--pattern one-shot] [--trials N] [--budget N] [--dry-run] | monitor --run ID [--watch] | report --run ID | review-template --run ID\nAll commands accept --config PATH. Login requires an interactive terminal.');
    return;
  }
  const config = await loadConfig(opts);
  if (action === 'build') {
    await docker(['build', '--tag', config.image, '--file', join(directory, 'Dockerfile'), directory],
      { inherit: true, timeoutMs: 900000 });
  } else if (action === 'login') {
    await engineAndImage(config);
    const variants = opts.variant ? [opts.variant] : ['good', 'bad'];
    for (const variant of variants) {
      if (!['good', 'bad'].includes(variant)) throw new Error('variant must be good or bad.');
      await docker(['volume', 'create', config.authVolumes[variant]]);
      console.log(`Authorize ${variant} in your browser. No PAT is required.`);
      await docker(['run', '--rm', '--interactive', '--tty', '--cap-drop=ALL', '--security-opt=no-new-privileges',
        '--mount', `type=volume,source=${config.authVolumes[variant]},target=/auth`,
        '--env', 'COPILOT_HOME=/auth', config.image, 'copilot', 'login', '--device-code'],
      { inherit: true, timeoutMs: 900000 });
    }
  } else if (action === 'preflight') await preflight(config);
  else if (action === 'run') await run(config, opts);
  else if (['report', 'monitor', 'review-template'].includes(action)) {
    if (!opts.run || !/^[a-zA-Z0-9_.-]+$/.test(opts.run) || opts.run.startsWith('.')) throw new Error('Provide a run ID using --run.');
    const path = inside(resultsRoot, opts.run);
    if (action === 'report') await report(path);
    else if (action === 'monitor') await monitor(path, opts.watch);
    else {
      for (const resultPath of await resultPaths(path)) {
        const result = JSON.parse(await readFile(resultPath, 'utf8'));
        const template = {
          sourceHash: hash(JSON.stringify(result)), reviewer: '', evidence: '',
          acceptance: result.acceptance.map(check => ({ ...check, evidence: check.evidence ?? '' })),
        };
        await writeFile(join(dirname(resultPath), 'review-template.json'), `${JSON.stringify(template, null, 2)}\n`, { flag: 'wx' });
      }
      console.log('Created review-template.json beside each result. Fill reviewer, evidence, and pass/fail criteria; save as review.json, then regenerate the report.');
    }
  } else throw new Error(`Unknown command: ${action}`);
}

main().catch(error => { console.error(error.stack ?? String(error)); process.exitCode = 1; });
