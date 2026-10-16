import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { cliArgs, hash, validateInstructionSources } from './harness-lib.mjs';
import { stageInstructions } from './worker.mjs';
import { adaptModel, applyCheckpoint, assertRunnable, commonCatalog, instructionContext, matrixReport,
  matchedContrasts, modelFamily, planMatrix, renderMatrix, summarizeGroup } from './matrix.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
const config = JSON.parse(await readFile(join(directory, 'config.json'), 'utf8'));
const models = [{ id: 'gpt-5-mini', supportedReasoningEfforts: ['low', 'medium', 'high'] }, { id: 'auto' }];
const options = { id: 'matrix-test', seed: 'repeatable', patterns: ['structured-extraction'] };

test('full HydraFusion plan preserves all patterns, explicit effort provenance, exact caps and nested validation gates', async () => {
  const hydraConfig = JSON.parse(await readFile(join(directory, 'config-hydrafusion.json'), 'utf8'));
  const plan = await planMatrix(root, hydraConfig,
    [{ id: 'hydrafusion', experimentalHydrafusion: true }],
    { id: 'matrix-hydra-test', contexts: ['none'], trials: 5, seed: 'hydra' });
  assert.equal(plan.coverage.length, 16);
  assert.equal(plan.cells.filter(cell => cell.state === 'ready').length, 16);
  assert.equal(plan.jobs.length, 80);
  assert.equal(plan.attempts, 200);
  assert.equal(plan.sessions, 205);
  assert.equal(plan.plannedAiCredits, 12800);
  assert.equal(plan.jobs.filter(job => job.validatesNestedHydrafusion).length, 2);
  assert.ok(plan.jobs.slice(0, 2).every(job => job.validatesNestedHydrafusion));
  for (const cell of plan.cells) {
    for (const variant of Object.values(cell.plan.variants)) {
      for (const phase of variant.phases) {
        assert.equal(phase.model, 'hydrafusion');
        assert.equal(phase.effort, undefined);
        assert.ok(phase.requestedEffort);
        assert.equal(phase.experimentalHydrafusion, true);
        if (phase.subagentModel) assert.equal(phase.subagentModel, 'hydrafusion');
      }
    }
  }
  assert.match(renderMatrix(plan, []), /homogeneous orchestration/);
});

test('family report links resolve from the report location and missing fixtures are not links', async () => {
  const plan = await planMatrix(root, config, models, options);
  const report = renderMatrix(plan, []);
  const reportDirectory = join(directory, 'results', 'matrices', 'matrix-test');
  for (const match of report.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (['summary.json', 'contrasts.json', 'plan.json', 'state.json'].includes(match[1])) continue;
    await access(resolve(reportDirectory, decodeURIComponent(match[1])));
    assert.ok(!match[1].includes('\\'), match[1]);
  }
  plan.coverage.push({ pattern: 'missing', workload: 'agentic', state: 'blocked', reason: 'ENOENT: missing fixture' });
  assert.match(renderMatrix(plan, []), /\| `ENOENT:/);
  assert.deepEqual(['gpt-5-mini', 'claude-sonnet-5.5', 'grok-4.7', 'kimi-k3', 'mai-code-1.1-flash', 'auto']
    .map(modelFamily), ['GPT', 'Claude', 'Grok', 'Kimi', 'MAI', 'Auto routing']);
});

test('catalog intersection excludes unavailable models and intersects effort support', () => {
  assert.deepEqual(commonCatalog([
    { id: 'auto' }, { id: 'named', supportedReasoningEfforts: ['low', 'high'] },
    { id: 'disabled', policy: { state: 'disabled' } }, { id: 'missing' },
  ], [{ id: 'auto' }, { id: 'named', supportedReasoningEfforts: ['low'] }, { id: 'disabled' }]),
  [{ id: 'auto', supportedReasoningEfforts: undefined }, { id: 'named', supportedReasoningEfforts: ['low'] }]);
});

test('refreshed coverage distinguishes historical blockers from current prerequisites without changing the frozen plan', async () => {
  const plan = await planMatrix(root, config, models, options);
  const frozen = structuredClone(plan);
  frozen.coverage[0].state = 'blocked';
  frozen.coverage[0].reason = 'Missing original fixture';
  frozen.coverageUpdate = { id: 'matrix-replacement', coverage: plan.coverage };
  const report = renderMatrix(frozen, []);
  assert.match(report, /Historical planning snapshot, not an executed experiment/);
  assert.match(report, /1\/1 patterns ready/);
  assert.match(report, /\.\.\/matrix-replacement\/report\.md/);
  assert.match(report, /\| blocked \| ready \|/);
  assert.equal(frozen.coverage[0].state, 'blocked');
  assert.match(report, /Missing original fixture/);
});

test('model effort incompatibility is distinct from missing workload support and appears in reports', async () => {
  const plan = await planMatrix(root, config, [
    models[0], { id: 'kimi-k3', supportedReasoningEfforts: ['low', 'high', 'max'] },
  ], { patterns: ['research-fan-out'], contexts: ['none'], trials: 1 });
  assert.equal(plan.coverage[0].state, 'ready');
  assert.equal(plan.cells.find(cell => cell.model === 'gpt-5-mini').state, 'ready');
  assert.equal(plan.cells.find(cell => cell.model === 'kimi-k3').state, 'blocked');
  const report = renderMatrix(plan, []);
  assert.match(report, /kimi-k3 \| 1 \| Model kimi-k3 does not report support for effort medium/);
  assert.match(report, /never silently substituted/);
});
test('full factorial isolates prompt/model/instruction factors and sums every trial cap exactly', async () => {
  const plan = await planMatrix(root, config, models, options);
  assert.equal(plan.trials, 5);
  assert.equal(plan.cells.length, 6);
  assert.equal(plan.jobs.length, 30);
  assert.equal(plan.attempts, 60);
  assert.equal(plan.sessions, 60);
  assert.equal(plan.plannedAiCredits, 1800);
  for (const cell of plan.cells) {
    assert.equal(plan.jobs.filter(job => job.cellId === cell.id).length, 5);
    const { good, bad } = cell.plan.variants;
    assert.deepEqual(good.context, bad.context);
    assert.equal(good.phases[0].model, bad.phases[0].model);
    assert.equal(good.phases[0].effort, bad.phases[0].effort);
    assert.notDeepEqual(good.phases[0].turns, bad.phases[0].turns);
  }
  assert.equal(new Set(plan.jobs.map(job => job.runId)).size, 30);
  assert.ok(plan.jobs.every(job =>
    /^matrices\/matrix-test\/runs\/structured-extraction\/cell-\d{4}-trial-\d{4}$/.test(job.runId)));
  assert.deepEqual(plan.jobs.map(job => job.id),
    (await planMatrix(root, config, models, options)).jobs.map(job => job.id));
  assert.notDeepEqual(plan.jobs.map(job => job.id),
    (await planMatrix(root, config, models, { ...options, seed: 'different' })).jobs.map(job => job.id));
});

test('Auto/nonreasoning models omit effort while named models retain supported effort', async () => {
  const plan = await planMatrix(root, config, models, options);
  const auto = plan.cells.find(cell => cell.model === 'auto');
  const phase = auto.plan.variants.good.phases[0];
  assert.equal(phase.effort, undefined);
  assert.equal(phase.requestedEffort, 'low');
  assert.match(phase.effortPolicy, /not effort-matched/);
  const args = cliArgs(phase, auto.plan.variants.good.caps, 'session');
  assert.ok(!args.includes('--reasoning-effort'));
  assert.ok(args.includes('--no-custom-instructions'));
  assert.ok(args.includes('--no-auto-update'));
  const named = plan.cells.find(cell => cell.model === 'gpt-5-mini' && cell.context === 'good');
  assert.equal(named.plan.variants.good.phases[0].effort, 'low');
  assert.ok(!cliArgs(named.plan.variants.good.phases[0], named.plan.variants.good.caps, 'session')
    .includes('--no-custom-instructions'));
  assert.throws(() => adaptModel(named.plan, { id: 'other', supportedReasoningEfforts: ['high'] },
    named.plan.variants.good.context), /does not report support/);
});

test('all patterns have fixture and runner prerequisites, without pretending semantic grading is automatic', async () => {
  const plan = await planMatrix(root, config, [models[0]]);
  assert.equal(plan.coverage.length, 16);
  assert.equal(plan.cells.length, 48);
  assert.ok(plan.cells.every(cell => cell.state === 'ready'));
  assert.ok(plan.coverage.some(item => item.pattern === 'structured-extraction' && item.state === 'ready'));
  assert.ok(plan.coverage.some(item => item.pattern === 'research-fan-out' && item.state === 'ready'));
  assert.equal(plan.jobs.length, plan.cells.filter(cell => cell.state === 'ready').length * 5);
  assert.equal(plan.plannedAiCredits, plan.jobs.reduce((sum, job) => sum + job.pairAiCredits, 0));
});

test('context staging preserves source hashes, scoped files, and exact bytes; rejects overwrite/tampering/escape', async () => {
  const context = await instructionContext(root, 'good');
  assert.equal(context.files.length, 5);
  assert.equal(context.bytes, context.files.reduce((sum, file) => sum + Buffer.byteLength(file.content), 0));
  assert.ok(context.files.some(file => file.destination === '.github/copilot-instructions.md'));
  assert.ok(context.files.some(file => file.destination === '.github/instructions/usage-data.instructions.md'));
  const temporary = await mkdtemp(join(tmpdir(), 'matrix-context-'));
  try {
    await stageInstructions(temporary, context);
    for (const file of context.files) assert.equal(hash(await readFile(join(temporary, file.destination))), file.sha256);
    await assert.rejects(stageInstructions(temporary, context), /EEXIST/);
    const tampered = structuredClone(context);
    tampered.files[0].content += 'changed';
    await assert.rejects(stageInstructions(temporary, tampered), /hash mismatch/);
    const escape = { files: [{ ...context.files[0], destination: '..\\outside.md' }] };
    await assert.rejects(stageInstructions(temporary, escape), /escapes/);
    assert.deepEqual((await instructionContext(root, 'none')).files, []);
    const sources = context.files.map(file => ({ sourcePath: file.destination, defaultDisabled: false }));
    assert.doesNotThrow(() => validateInstructionSources(context, sources));
    assert.throws(() => validateInstructionSources(context, sources.slice(1)), /not enabled/);
    assert.throws(() => validateInstructionSources(context, sources.map(source => ({ ...source, defaultDisabled: true }))), /not enabled/);
    assert.throws(() => validateInstructionSources(context, {}), /not return an array/);
    await assert.rejects(instructionContext(root, 'unknown'), /Invalid/);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('budget and uncertain-job gates prevent partial or duplicate-spend execution', async () => {
  const plan = await planMatrix(root, config, models, options);
  assert.throws(() => assertRunnable(plan, 1799, true), /reserves 1800/);
  assert.throws(() => assertRunnable(plan, NaN, true), /positive/);
  assert.doesNotThrow(() => assertRunnable(plan, 1800, false));
  plan.jobs[0].state = 'running';
  assert.throws(() => assertRunnable(plan, 1800, false), /not be retried/);
  plan.jobs[0].state = 'completed';
  assert.doesNotThrow(() => assertRunnable(plan, 1800, false));
  plan.cells.push({ state: 'blocked' });
  assert.throws(() => assertRunnable(plan, 1800, false), /blocked coverage/);
  assert.doesNotThrow(() => assertRunnable(plan, 1800, true));
});

test('checkpoint validation rejects modified budgets, identities, trials, and states', async () => {
  const plan = await planMatrix(root, config, models, options);
  for (const [key, value] of [['pairAiCredits', 1], ['runId', 'different'], ['trial', 99], ['state', 'unknown']]) {
    const state = structuredClone(plan.jobs);
    state[0][key] = value;
    assert.throws(() => applyCheckpoint(plan, state), /does not match/);
  }
  assert.throws(() => applyCheckpoint(plan, {}), /does not match/);
  const state = structuredClone(plan.jobs);
  state[0].state = 'completed';
  applyCheckpoint(plan, state);
  assert.equal(plan.jobs[0].state, 'completed');
});

test('matrix admission sums sessions, repetitions, variants, and all five trials', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'matrix-sessions-'));
  try {
    for (const variant of ['good', 'bad']) {
      const path = join(temporary, 'prompts', 'two-phase');
      await mkdir(path, { recursive: true });
      await writeFile(join(path, `${variant}.prompt.md`), `---
id: two-phase/${variant}
pattern: two-phase
variant: ${variant}
workload: multi-turn
config:
  surface: copilot-cli
  model_class: light
  reasoning_effort: low
  tools: none
caps:
  max_ai_credits: 30
  timeout_minutes: 1
fixtures: []
repetitions: 3
acceptance:
  - Returns an answer
---
First session.
<!-- session -->
Second session.
`);
    }
    const plan = await planMatrix(temporary, config, [models[0]], { contexts: ['none'], trials: 5 });
    assert.equal(plan.attempts, 30);
    assert.equal(plan.sessions, 60);
    assert.equal(plan.plannedAiCredits, 1800);
    assert.equal(plan.jobs[0].pairAiCredits, 360);
    assert.equal(plan.jobs.length, 5);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('aggregation includes failed spend, keeps missing telemetry unknown, and separates review/rejection', () => {
  const result = { status: 'completed', elapsedMs: 1000, acceptance: [{ status: 'pass' }],
    metrics: { costComplete: true, nanoAiu: 2e9, inputTokens: 100, outputTokens: 10,
      cacheReadTokens: 20, actualModels: ['selected-model'] } };
  const failed = { ...result, status: 'failed', metrics: { ...result.metrics, nanoAiu: 1e9 } };
  const summary = summarizeGroup([result, failed], 2);
  assert.equal(summary.totalAiu, 3);
  assert.equal(summary.aiuPerAccepted, 3);
  assert.equal(summary.accepted, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.inputTokens, 200);
  assert.equal(summary.meanElapsedMs, 1000);
  assert.equal(summary.complete, true);
  const missing = summarizeGroup([result, { status: 'missing-evidence', acceptance: [], metrics: null }], 2);
  assert.equal(missing.totalAiu, null);
  assert.equal(missing.aiuPerAccepted, null);
  assert.equal(missing.inputTokens, null);
  assert.equal(missing.complete, false);
  assert.equal(summarizeGroup([failed], 1).aiuPerAccepted, null);
  const review = { ...result, acceptance: [{ status: 'needs-review' }] };
  const rejected = { ...result, acceptance: [{ status: 'fail' }, { status: 'needs-review' }] };
  const quality = summarizeGroup([review, rejected], 2);
  assert.equal(quality.needsReview, 1);
  assert.equal(quality.rejected, 1);
});

test('planning/reporting persists factor rows without inference or treating pending jobs as failures', async () => {
  const plan = await planMatrix(root, config, models, options);
  const temporary = await mkdtemp(join(tmpdir(), 'matrix-report-'));
  try {
    const rows = await matrixReport(temporary, plan);
    assert.equal(rows.length, 12);
    assert.ok(rows.every(row => row.attempts === 0 && row.failed === 0 && row.totalAiu === null));
    const report = renderMatrix(plan, rows);
    for (const heading of ['What did we test?', 'What did we expect?', 'What happened?', 'Insights']) {
      assert.ok(report.includes(heading));
    }
    assert.match(report, /not present.*not tested/);
    assert.match(report, /not effort-matched/);
    assert.match(report, /not tokens proven loaded/);
    assert.match(report, /1,800 AI credits/);
    assert.deepEqual(JSON.parse(await readFile(join(temporary, 'summary.json'), 'utf8')), rows);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('matched impacts hold other factors constant and withhold incomplete or unresolved comparisons', () => {
  const base = { model: 'named', pattern: 'task', context: 'none', cellId: 'baseline', variant: 'bad',
    complete: true, attempts: 5, accepted: 2, needsReview: 0, failed: 0,
    totalAiu: 10, aiuPerAccepted: 5, inputTokens: 1000, cacheReadTokens: 100 };
  const prompt = { ...base, variant: 'good', accepted: 5, totalAiu: 8, aiuPerAccepted: 1.6 };
  const context = { ...prompt, context: 'good', cellId: 'instructions', totalAiu: 7, aiuPerAccepted: 1.4 };
  const impacts = matchedContrasts([base, prompt, context]);
  assert.equal(impacts.length, 2);
  assert.equal(impacts[0].factor, 'prompt');
  assert.equal(impacts[0].heldConstant, 'none');
  assert.equal(impacts[0].acceptancePercentagePoints, 60);
  assert.equal(impacts[0].totalAiuDelta, -2);
  assert.equal(impacts[1].factor, 'instructions');
  assert.equal(impacts[1].heldConstant, 'good');
  assert.equal(impacts[1].totalAiuDelta, -1);
  assert.equal(matchedContrasts([base, { ...prompt, needsReview: 1 }])[0].totalAiuDelta, null);
  assert.equal(matchedContrasts([base, { ...prompt, complete: false }])[0].ready, false);
  const model = matchedContrasts([base, { ...base, model: 'auto', cellId: 'auto', totalAiu: 6 }]);
  assert.equal(model[0].factor, 'model');
  assert.equal(model[0].baseline, 'named');
  assert.equal(model[0].treatment, 'auto');
  assert.equal(model[0].heldConstant, 'none/bad');
  assert.equal(model[0].totalAiuDelta, -4);
});

test('Docker discovers staged repository instructions using the real CLI without inference', {
  skip: process.env.HARNESS_DOCKER_TESTS !== '1',
}, () => {
  const result = spawnSync('docker', ['run', '--rm', '--cap-drop=ALL', '--security-opt=no-new-privileges',
    '--env', 'COPILOT_AUTO_UPDATE=false', config.image, 'node', '--input-type=module', '-e',
    "import assert from 'node:assert/strict';import{command,stageInstructions}from'./worker.mjs';import{hash}from'./harness-lib.mjs';const content='Return the requested format.';await stageInstructions('/workspace',{files:[{source:'synthetic',destination:'.github/copilot-instructions.md',content,sha256:hash(content)}]});assert.equal((await command('git',['init','-q'])).code,0);const sources=await command('copilot',['instruction','list','--json']);assert.equal(sources.code,0,sources.stderr);assert.ok(JSON.parse(sources.stdout).some(source=>source.sourcePath==='.github/copilot-instructions.md'&&source.defaultDisabled===false));console.log('instruction discovery passed');"],
  { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout, /instruction discovery passed/);
});
