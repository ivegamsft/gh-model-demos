import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { access, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicJson as json, buildPlan, hash, inside, positive, relativeLinks } from './harness-lib.mjs';
import { parse } from 'yaml';
import { renderReport } from './report.mjs';
import { reserveDirectory, resultLocation, runDirectories } from './result-paths.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
const resultsRoot = join(directory, 'results');
const activeContainers = new Set();
const activeClients = new Set();
let interrupted = false;

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (interrupted) return;
    interrupted = true;
    console.error(`${signal}: stopping this run's containers and collecting available evidence.`);
    for (const child of activeClients) child.kill();
    for (const name of activeContainers) {
      exec(['stop', '--time', '2', name]).then(result => {
        if (result.code !== 0) console.error(`Could not stop ${name}: ${result.stderr}`);
      }).catch(error => console.error(error.message));
    }
  });
}

function options(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (!['--pattern', '--config', '--trials', '--budget', '--variant', '--run', '--dry-run', '--watch', '--all'].includes(key)) {
      throw new Error(`Unknown argument: ${key}`);
    }
    if (['--dry-run', '--watch', '--all'].includes(key)) parsed[key.slice(2)] = true;
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
    activeClients.add(child);
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
    child.on('error', error => { clearTimeout(timer); activeClients.delete(child); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      activeClients.delete(child);
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

async function prepareBuild() {
  const architecture = await docker(['info', '--format', '{{.Architecture}}']);
  const arch = { x86_64: 'amd64', aarch64: 'arm64', amd64: 'amd64', arm64: 'arm64' }[architecture];
  if (!arch) throw new Error(`Unsupported Docker architecture: ${architecture}`);
  const candidates = [
    process.env.npm_execpath,
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    resolve(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ].filter(Boolean);
  let npmPath;
  for (const candidate of candidates) {
    try { await access(candidate); npmPath = candidate; break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!npmPath) throw new Error('Cannot locate npm-cli.js. Run this command via npm run build in tests.');
  const destination = join(directory, '.build-packages', arch, 'runtime');
  await mkdir(destination, { recursive: true });
  // Only public package tarballs enter the build context, never host npm credentials.
  const lock = JSON.parse(await readFile(join(directory, 'package-lock.json'), 'utf8'));
  const packages = ['@github/copilot@1.0.98',
    `@github/copilot-linux-${arch === 'amd64' ? 'x64' : 'arm64'}@1.0.98`, 'detect-libc@2.1.2'];
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmPath, 'pack', ...packages, '--pack-destination', destination, '--ignore-scripts', '--loglevel', 'error'],
      { stdio: 'inherit' });
    const timer = setTimeout(() => child.kill(), 300000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`Preparing public build packages failed (${code}).`));
    });
  });
  const cpu = arch === 'amd64' ? 'x64' : 'arm64';
  for (const [name, metadata] of Object.entries(lock.packages)) {
    if (!name.startsWith('node_modules/') ||
        (metadata.os && !metadata.os.includes('linux')) ||
        (metadata.cpu && !metadata.cpu.includes(cpu))) continue;
    const url = new URL(metadata.resolved);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Invalid public package URL: ${name}`);
    const archive = join(destination, `locked-${hash(name).slice(0, 16)}.tgz`);
    let bytes;
    try { bytes = await readFile(archive); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error(`Package download failed: ${name} (${response.status})`);
      bytes = Buffer.from(await response.arrayBuffer());
    }
    const integrities = metadata.integrity?.split(/\s+/) ?? [];
    const valid = integrities.some(integrity => {
      const [algorithm, expected] = integrity.split('-');
      if (!['sha1', 'sha256', 'sha384', 'sha512'].includes(algorithm)) return false;
      return createHash(algorithm).update(bytes).digest('base64') === expected;
    });
    if (!valid) throw new Error(`Downloaded package failed locked integrity verification: ${name}`);
    await writeFile(archive, bytes);
    // Normalize verified legacy SHA-1 locks for npm's offline content-addressed cache.
    metadata.integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
  }
  await json(join(destination, 'package-lock.json'), lock);
}

async function loadConfig(opts) {
  const config = JSON.parse(await readFile(opts.config ? resolve(opts.config) : join(directory, 'config.json'), 'utf8'));
  config.trials = positive(Number(opts.trials ?? config.trials), 'trials', true);
  config.maxPlannedAiCredits = positive(Number(opts.budget ?? config.maxPlannedAiCredits), 'budget');
  positive(config.cpus, 'cpus');
  positive(config.pidsLimit, 'pidsLimit', true);
  if (typeof config.image !== 'string' || !config.image || config.image.startsWith('-')) throw new Error('Invalid image name.');
  if (!/^[1-9]\d*[bkmg]$/i.test(config.memory)) throw new Error('memory must be an explicit positive Docker memory limit, e.g. 2g.');
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

async function pinImage(reference, id) {
  const pin = `gh-model-experiment-pins:image-${id.replace(/^sha256:/, '')}`;
  await docker(['tag', reference, pin]);
  return pin;
}

export async function preflight(config) {
  const image = await engineAndImage(config);
  const checks = { imageId: image.Id, pinnedImage: await pinImage(config.image, image.Id), variants: {} };
  for (const variant of ['good', 'bad']) {
    const name = `model-preflight-${variant}-${randomUUID().slice(0, 8)}`;
    let created = false;
    try {
      await docker(['volume', 'inspect', config.authVolumes[variant]]);
      await docker([...containerArgs(config, name, variant), 'node', '/opt/harness/worker.mjs', '--preflight']);
      created = true;
      activeContainers.add(name);
      const result = await exec(['start', '--attach', name], { timeoutMs: 120000 });
      const inspection = JSON.parse(await docker(['inspect', name]))[0];
      checks.variants[variant] = {
        passed: result.code === 0 && !result.timedOut && inspection.State.ExitCode === 0,
        output: result.stdout.trim(), error: result.stderr.trim(),
      };
      if (checks.variants[variant].passed) {
        const destination = join(resultsRoot, 'catalogs', variant);
        await mkdir(destination, { recursive: true });
        await docker(['cp', `${name}:/evidence/model-inventory.json`, join(destination, 'model-inventory.json')]);
        checks.variants[variant].inventory = JSON.parse(await readFile(join(destination, 'model-inventory.json'), 'utf8'));
      }
    } catch (error) {
      checks.variants[variant] = { passed: false, error: error.message };
    } finally {
      if (created) await docker(['rm', '--force', name]);
      activeContainers.delete(name);
    }
  }
  const path = join(resultsRoot, 'container-preflight.json');
  await mkdir(resultsRoot, { recursive: true });
  await json(path, checks);
  console.log(JSON.stringify({ imageId: checks.imageId, variants: Object.fromEntries(
    Object.entries(checks.variants).map(([variant, { inventory, ...check }]) =>
      [variant, { ...check, models: inventory?.models.length }])) }, null, 2));
  if (Object.values(checks.variants).some(check => !check.passed)) {
    throw new Error(`Container preflight failed. Authenticate both variants with the login command. Evidence: ${path}`);
  }
  return checks;
}

async function collect(name, destination) {
  await mkdir(destination, { recursive: true });
  const copy = await exec(['cp', `${name}:/evidence/.`, destination]);
  if (copy.code !== 0) throw new Error(`Evidence collection failed for ${name}: ${copy.stderr}`);
}

async function executePair(config, plan, runPath, trial, repetition, manifest, writeStatus) {
  const order = (trial + repetition + (config.orderOffset ?? 0)) % 2 === 0 ? ['good', 'bad'] : ['bad', 'good'];
  const containers = [];
  let failed = false;
  try {
    // Both containers are prepared before either model is invoked.
    for (const variant of order) {
      if (interrupted) throw new Error('Experiment interrupted.');
      const name = `model-${variant}-${randomUUID().slice(0, 12)}`;
      const path = join(runPath, `trial-${trial}`, `repetition-${repetition}`, variant);
      await mkdir(path, { recursive: true });
      const job = { ...plan.variants[variant], trial, repetition,
        batch: plan.variants[variant].batches?.[repetition - 1] };
      const jobPath = join(path, 'plan.json');
      await json(jobPath, job);
      await docker(containerArgs(config, name, variant));
      activeContainers.add(name);
      const container = { name, variant, path, job, collected: false };
      containers.push(container);
      await docker(['cp', jobPath, `${name}:/job/plan.json`]);
      const snapshot = join(runPath, 'snapshot');
      await docker(['cp', snapshot, `${name}:/job/snapshot`]);
    }
    for (const container of containers) {
      if (interrupted) throw new Error('Experiment interrupted.');
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
      if (interrupted) throw new Error('Experiment interrupted.');
    }
  } finally {
    const cleanupErrors = [];
    for (const container of containers) {
      try {
        if (!container.collected) await collect(container.name, container.path);
      } catch (error) { cleanupErrors.push(error.message); }
      try { await docker(['rm', '--force', container.name]); }
      catch (error) { cleanupErrors.push(error.message); }
      activeContainers.delete(container.name);
    }
    if (cleanupErrors.length) {
      await json(join(runPath, 'cleanup-errors.json'), cleanupErrors);
      throw new Error(`Container cleanup/evidence errors: ${cleanupErrors.join('; ')}`);
    }
  }
  return failed;
}

export async function resultPaths(path) {
  const found = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name === 'snapshot') continue;
    const child = join(path, entry.name);
    if (entry.isDirectory()) found.push(...await resultPaths(child));
    else if (entry.name === 'result.json') found.push(child);
  }
  return found.sort();
}

export async function report(runPath) {
  const manifest = JSON.parse(await readFile(join(runPath, 'manifest.json'), 'utf8'));
  const plan = JSON.parse(await readFile(join(runPath, 'resolved-plan.json'), 'utf8'));
  // Historical plans omitted hypotheses. Recover them only from an exact source-hash match.
  for (const [variant, value] of Object.entries(plan.variants)) {
    if (value.expectations) continue;
    let source;
    try { source = await readFile(inside(root, join('prompts', manifest.pattern, `${variant}.prompt.md`)), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; continue; }
    if (hash(source) !== value.sourceHash) continue;
    const header = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
    if (!header) throw new Error(`Invalid prompt frontmatter: ${manifest.pattern}/${variant}`);
    const metadata = parse(header[1]);
    value.expectations = {
      processing: metadata.expected_processing ?? null, result: metadata.expected_result ?? null,
      source: 'recovered from prompt with exact recorded SHA-256 match',
    };
  }
  const paths = await resultPaths(runPath);
  const records = await Promise.all(paths.map(async path => {
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
    const location = dirname(path);
    const names = await readdir(location);
    const link = name => relative(runPath, join(location, name)).replaceAll('\\', '/');
    const labels = new Map([
      ['output.md', 'Full response'], ['result.json', 'Result and metrics'],
      ['events.jsonl', 'Model/tool events'], ['changes.patch', 'Workspace diff'],
      ['container-state.json', 'Container exit state'], ['versions.json', 'CLI versions'],
      ['review.json', 'Human review'], ['error.log', 'Worker error'],
      ['fatal-error.log', 'Fatal error'], ['controller-stderr.log', 'Controller stderr'],
      ['instruction-context.json', 'Staged instruction context'], ['instruction-sources.json', 'Discovered instruction sources'],
      ['mock-observability.jsonl', 'Synthetic MCP queries and results'],
      ['experimental-features.json', 'Experimental rollout configuration'],
      ['nested-hydrafusion.json', 'Nested HydraFusion worker validation'],
    ]);
    const artifacts = [];
    for (const name of names.sort()) {
      const label = labels.get(name) ??
        (/^session-.*-input\.md$/.test(name) ? `Input: ${name}` :
          /^session-\d+-subagents\.json$/.test(name) ? `Worker model configuration: ${name}` :
          /^session-.*-(?:stderr|stdout)\.log$/.test(name) ? name : null);
      if (label) artifacts.push({ label, link: link(name) });
    }
    const priority = label => label.startsWith('Input:') ? 0
      : ['Full response', 'Result and metrics', 'Human review'].includes(label) ? 1 : 2;
    artifacts.sort((a, b) => priority(a.label) - priority(b.label));
    const output = names.includes('output.md') ? await readFile(join(location, 'output.md'), 'utf8') : null;
    const fusionRoutes = names.includes('events.jsonl')
      ? (await readFile(join(location, 'events.jsonl'), 'utf8')).split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
        .filter(event => event.type === 'session.fusion_resolved').map(event => event.data)
      : [];
    const diagnostics = names.filter(name =>
      /^session-.*-stderr\.log$/.test(name) || ['fatal-error.log', 'error.log'].includes(name));
    const diagnostic = result.status !== 'completed' ? (await Promise.all(diagnostics.map(async name =>
      `${name}:\n${await readFile(join(location, name), 'utf8')}`))).join('\n\n') : null;
    return { result, resultLink: link('result.json'), artifacts, output, diagnostic, fusionRoutes };
  }));
  let controllerError = null;
  try { controllerError = await readFile(join(runPath, 'controller-error.log'), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const location = relative(resultsRoot, runPath).replaceAll('\\', '/');
  const rendered = renderReport({ manifest, plan, records, controllerError, location });
  const { summary, complete } = rendered;
  const results = records.map(record => record.result);
  const expected = manifest.config.trials * manifest.repetitions * 2;
  await json(join(runPath, 'comparison.json'), {
    complete, expectedAttempts: expected, collectedAttempts: results.length, summary, results,
  });
  const reportPath = join(runPath, 'report.md');
  await writeFile(reportPath, relativeLinks(rendered.markdown, reportPath));
  console.log(`Report: ${join(runPath, 'report.md')}`);
  return { complete, summary, runId: manifest.runId, location, pattern: manifest.pattern,
    execution: rendered.execution, verdict: rendered.verdict };
}

async function reportAll() {
  const reports = [];
  for (const path of await runDirectories(resultsRoot)) {
    reports.push(await report(path));
  }
  const cell = value => String(value).replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
  const lines = [
    '# Experiment run index', '',
    'Start with a run report for the task, hypotheses, actual responses, acceptance decisions, usage, and insights.',
    'Dry runs validate configuration only. Execution failures are not prompt-quality findings. Repeated smoke tests are separate runs, not an aggregated controlled study.',
    '', '| Run | Pattern | Execution | Quality verdict |', '|---|---|---|---|',
    ...reports.map(report => `| [${report.location}](${report.location}/report.md) | ${cell(report.pattern)} | ${cell(report.execution)} | ${cell(report.verdict)} |`), '',
  ];
  const indexPath = join(resultsRoot, 'index.md');
  await writeFile(indexPath, relativeLinks(lines.join('\n'), indexPath));
  console.log(`Run index: ${join(resultsRoot, 'index.md')}`);
}

export async function run(config, opts) {
  const plan = opts.plan ?? await buildPlan(root, opts.pattern ?? 'one-shot', config);
  if (plan.variants.good.repetitions !== plan.variants.bad.repetitions) throw new Error('Paired repetitions must match.');
  let runId = opts.runId;
  let runPath;
  if (runId) {
    runPath = await resultLocation(resultsRoot, runId);
    await mkdir(dirname(runPath), { recursive: true });
    await mkdir(runPath);
  } else {
    const reserved = await reserveDirectory(inside(resultsRoot, plan.pattern), 'run');
    runPath = reserved.path;
    runId = relative(resultsRoot, runPath).replaceAll('\\', '/');
  }
  const manifest = {
    runId, pattern: plan.pattern, createdAt: new Date().toISOString(), config,
    plannedAiCredits: plan.plannedAiCredits, repetitions: plan.variants.good.repetitions,
    promptHashes: Object.fromEntries(Object.entries(plan.variants).map(([variant, value]) => [variant, value.sourceHash])),
    fixtureHashes: plan.variants.good.fixtures, executionOrder: [], dryRun: Boolean(opts['dry-run']),
    matrix: opts.matrix ?? null,
  };
  const writeStatus = async status => {
    await json(join(runPath, 'status.json'), { ...status, updatedAt: new Date().toISOString(), runId });
  };
  await json(join(runPath, 'manifest.json'), manifest);
  await json(join(runPath, 'resolved-plan.json'), plan);
  console.log(`Run: ${runId}\nPlanned session caps: ${plan.plannedAiCredits} AI credits (soft limits)\nEvidence: ${runPath}`);
  if (opts['dry-run']) {
    await writeStatus({ state: 'dry-run-passed', inferenceRequests: 0 });
    return { runId, runPath, failed: false };
  }
  let failed = false;
  try {
    await writeStatus({ state: 'preflight' });
    const image = await engineAndImage(config);
    manifest.imageId = image.Id;
    manifest.pinnedImage = await pinImage(config.image, image.Id);
    manifest.repoDigests = image.RepoDigests;
    manifest.harnessHashes = Object.fromEntries(await Promise.all(
      ['harness.mjs', 'harness-lib.mjs', 'worker.mjs', 'Dockerfile', 'package-lock.json'].map(async name =>
        [name, hash(await readFile(join(directory, name)))])));
    const executionConfig = { ...config, image: image.Id };
    if (!opts.preflightChecked) await preflight(executionConfig);
    if (interrupted) throw new Error('Experiment interrupted.');
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
        failed = await executePair(executionConfig, plan, runPath, trial, repetition, manifest, writeStatus) || failed;
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
  return { runId, runPath, failed };
}

async function monitor(runPath, watch) {
  do {
    if (interrupted) return;
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
    console.log('Commands: build | login [--variant good|bad] | preflight | run [--pattern one-shot] [--trials N] [--budget N] [--dry-run] | monitor --run ID [--watch] | report (--run ID | --all) | review-template --run ID\nAll commands accept --config PATH. Login requires an interactive terminal.');
    return;
  }
  const config = await loadConfig(opts);
  if (action === 'build') {
    await prepareBuild();
    await docker(['build', '--tag', config.image, '--file', join(directory, 'Dockerfile'), directory],
      { inherit: true, timeoutMs: 900000 });
  } else if (action === 'login') {
    await engineAndImage(config);
    const variants = opts.variant ? [opts.variant] : ['good', 'bad'];
    for (const variant of variants) {
      if (!['good', 'bad'].includes(variant)) throw new Error('variant must be good or bad.');
      await docker(['volume', 'create', config.authVolumes[variant]]);
      console.log(`Authorize ${variant} in your browser. No PAT is required.`);
      const name = `model-login-${variant}-${randomUUID().slice(0, 8)}`;
      activeContainers.add(name);
      try {
        await docker(['run', '--name', name, '--interactive', '--tty', '--cap-drop=ALL', '--security-opt=no-new-privileges',
          '--mount', `type=volume,source=${config.authVolumes[variant]},target=/auth`,
          '--env', 'COPILOT_HOME=/auth', config.image, 'copilot', 'login', '--device-code'],
        { inherit: true, timeoutMs: 900000 });
      } finally {
        const cleanup = await exec(['rm', '--force', name]);
        activeContainers.delete(name);
        if (cleanup.code !== 0) throw new Error(`Login container cleanup failed: ${cleanup.stderr}`);
      }
      if (interrupted) throw new Error('Login interrupted.');
    }
  } else if (action === 'preflight') await preflight(config);
  else if (action === 'run') await run(config, opts);
  else if (['report', 'monitor', 'review-template'].includes(action)) {
    if (opts.all) {
      if (action !== 'report' || opts.run) throw new Error('--all is only valid for report, without --run.');
      await reportAll();
      return;
    }
    if (!opts.run) throw new Error('Provide a run ID or results-relative path using --run.');
    const path = await resultLocation(resultsRoot, opts.run);
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

export const isInterrupted = () => interrupted;
export { loadConfig };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.stack ?? String(error)); process.exitCode = 1; });
}
