import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { accepted, buildPlan, cliArgs, comparison, expandPrompt, finalOutput, fixtureFiles,
  grade, hash, inside, parsePrompt, resolveConfig, summarizeEvents, validateCatalog } from './harness-lib.mjs';
import { outcome, renderReport } from './report.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
const config = JSON.parse(await readFile(join(directory, 'config.json'), 'utf8'));
const oneShot = await readFile(join(root, 'prompts', 'one-shot', 'good.prompt.md'), 'utf8');

test('parses real prompt, strips frontmatter, validates identity and safety caps', () => {
  const prompt = parsePrompt(oneShot, 'one-shot', 'good');
  assert.equal(prompt.sessions.length, 1);
  assert.equal(prompt.sessions[0].length, 1);
  assert.ok(!prompt.sessions[0][0].includes('expected_processing:'));
  assert.equal(prompt.sourceHash, hash(oneShot));
  assert.throws(() => parsePrompt(oneShot, 'one-shot', 'bad'), /identity/);
  assert.throws(() => parsePrompt(oneShot.replace('max_ai_credits: 30', 'max_ai_credits: 0'), 'one-shot', 'good'), /positive/);
  assert.throws(() => parsePrompt(oneShot.replace('max_ai_credits: 30', 'max_ai_credits: 10'), 'one-shot', 'good'), /at least 30/);
  assert.throws(() => parsePrompt(oneShot.replace('variant: good', 'variant: good\nvariant: bad'), 'one-shot', 'good'), /unique/);
});

test('real multi-turn and multi-session markers retain their correct boundaries', async () => {
  const turn = parsePrompt(await readFile(join(root, 'prompts', 'multi-turn', 'bad.prompt.md'), 'utf8'), 'multi-turn', 'bad');
  assert.equal(turn.sessions.length, 1);
  assert.equal(turn.sessions[0].length, 4);
  const phased = parsePrompt(await readFile(join(root, 'prompts', 'plan-then-implement', 'good.prompt.md'), 'utf8'), 'plan-then-implement', 'good');
  assert.equal(phased.sessions.length, 2);
  assert.equal(resolveConfig(phased, config).length, 2);
  assert.throws(() => parsePrompt(oneShot.replace('config:', 'phases: []\nconfig:'), 'one-shot', 'good'), /Phase count/);
});

test('all existing prompt pairs share their rubric and meet the real CLI minimum cap', async () => {
  let pairs = 0;
  for (const entry of await readdir(join(root, 'prompts'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pair = await Promise.all(['good', 'bad'].map(async variant =>
      parsePrompt(await readFile(join(root, 'prompts', entry.name, `${variant}.prompt.md`), 'utf8'), entry.name, variant)));
    assert.deepEqual(pair[0].acceptance, pair[1].acceptance);
    assert.deepEqual(pair[0].caps, pair[1].caps);
    pairs++;
  }
  assert.equal(pairs, 16);
});

test('real inline pairs resolve and sum all planned session caps', async () => {
  const plan = await buildPlan(root, 'one-shot', config);
  assert.equal(plan.plannedAiCredits, 60);
  assert.equal(plan.variants.good.phases[0].model, 'gpt-5-mini');
  assert.deepEqual(plan.variants.good.phases[0].tools, []);
  assert.match(plan.variants.good.expectations.processing, /Transforms the supplied text/);
  assert.equal(plan.variants.good.expectations.source, 'captured prompt frontmatter');
  await assert.rejects(buildPlan(root, 'one-shot', { ...config, trials: 2 }), /total 120/);
  await assert.rejects(buildPlan(root, '../one-shot', config), /pattern/);
  const unsupported = { ...config, toolProfiles: { none: [] } };
  await assert.rejects(buildPlan(root, 'multi-tool', unsupported), /Unsupported tool profile/);
  const research = resolveConfig(parsePrompt(await readFile(join(root, 'prompts', 'research-fan-out', 'good.prompt.md'), 'utf8'),
    'research-fan-out', 'good'), config);
  assert.equal(research[0].subagentModel, 'gpt-5-mini');
  assert.equal(research[0].subagentMechanism, 'native-subagents');
});

test('fixture path checks reject escapes and undeclared substitutions', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'model-harness-'));
  try {
    assert.throws(() => inside(temporary, '..\\outside'), /escapes/);
    await mkdir(join(temporary, 'prompts', 'one-shot'), { recursive: true });
    for (const variant of ['good', 'bad']) {
      const prompt = oneShot.replaceAll('one-shot/good', `one-shot/${variant}`)
        .replace('variant: good', `variant: ${variant}`) + '\n{{file:fixtures/hidden.txt}}';
      await writeFile(join(temporary, 'prompts', 'one-shot', `${variant}.prompt.md`), prompt);
    }
    await assert.rejects(buildPlan(temporary, 'one-shot', config), /Undeclared fixture/);
    await writeFile(join(temporary, 'fixture.txt'), 'content');
    const files = await fixtureFiles(temporary, 'fixture.txt');
    assert.equal(files.length, 1);
    if (process.platform !== 'win32') {
      await symlink(join(temporary, 'fixture.txt'), join(temporary, 'link'));
      await assert.rejects(fixtureFiles(temporary, 'link'), /symlink/);
    }
  } finally { await rm(temporary, { recursive: true }); }
});

test('prompt expansions are non-recursive, preserve phase handoff, and exclude gold labels', () => {
  assert.equal(expandPrompt('{{file:x}} {{now}} {{previous_output}}', {
    files: { x: '{{now}}' }, now: 'timestamp', previousOutput: 'plan',
  }), '{{now}} timestamp plan');
  assert.equal(expandPrompt('{{batch}}', {
    files: {}, batch: [{ id: 1, text: 'ticket', label: 'bug', gold_label: 'bug', goldLabel: 'bug' }],
  }), '[{"id":1,"text":"ticket"}]');
  assert.throws(() => expandPrompt('{{previous_output}}', { files: {} }), /previous session/);
  assert.throws(() => expandPrompt('{{batch}}', { files: {} }), /batch/);
  assert.throws(() => expandPrompt('{{unknown}}', { files: {} }), /Unknown/);
});

test('catalog validation rejects disabled, missing, and unsupported effort settings', () => {
  const phases = [{ model: 'test', effort: 'low' }];
  validateCatalog(phases, [{ id: 'test', supportedReasoningEfforts: ['low'] }]);
  assert.throws(() => validateCatalog(phases, []), /Unavailable/);
  assert.throws(() => validateCatalog(phases, [{ id: 'test', policy: { state: 'disabled' } }]), /Unavailable/);
  assert.throws(() => validateCatalog(phases, [{ id: 'test' }]), /does not report/);
});

test('CLI arguments enforce credit caps, exact session IDs, and an empty tool set', () => {
  const args = cliArgs({ model: 'test', effort: 'low', tools: [] }, { max_ai_credits: 30 }, 'session', 'body');
  assert.equal(args[args.indexOf('--session-id') + 1], 'session');
  assert.equal(args[args.indexOf('--max-ai-credits') + 1], '30');
  assert.equal(args.at(-1), '--available-tools');
  assert.ok(args.includes('--no-ask-user'));
  assert.ok(args.includes('--disable-builtin-mcps'));
  assert.ok(!args.includes('--prompt'));
  const defaults = cliArgs({ model: 'test', tools: null }, { max_ai_credits: 1 }, 's', 'body');
  assert.ok(!defaults.includes('--available-tools'));
});

test('usage totals preserve unknown fields, include workers, and never reinterpret multiplier cost', () => {
  const events = [
    { type: 'assistant.usage', data: { model: 'main', inputTokens: 10, outputTokens: 2, cacheReadTokens: 0, cost: 5, copilotUsage: { totalNanoAiu: 100 } } },
    { type: 'assistant.usage', agentId: 'worker', data: { model: 'worker', inputTokens: 3, outputTokens: 1, copilotUsage: { totalNanoAiu: 40 } } },
    { type: 'tool.execution_start' }, { type: 'subagent.started' },
  ];
  const metrics = summarizeEvents(events);
  assert.equal(metrics.inputTokens, 13);
  assert.equal(metrics.outputTokens, 3);
  assert.equal(metrics.cacheReadTokens, null);
  assert.equal(metrics.cacheWriteTokens, null);
  assert.equal(metrics.nanoAiu, 140);
  assert.equal(metrics.toolCalls, 1);
  assert.deepEqual(metrics.actualModels, ['main', 'worker']);
  assert.equal(summarizeEvents([]).nanoAiu, null);
  assert.equal(summarizeEvents([{ type: 'assistant.usage', data: { cost: 1 } }]).nanoAiu, null);
});

test('final output excludes worker messages and tool-request intermediates', () => {
  assert.equal(finalOutput([
    { type: 'assistant.message', data: { content: 'final' } },
    { type: 'assistant.message', agentId: 'worker', data: { content: 'worker' } },
    { type: 'assistant.message', data: { content: 'intermediate', toolRequests: [{}] } },
  ]), 'final');
  assert.equal(finalOutput([]), null);
});

test('cumulative shutdown metrics are counted once per session, never added to request usage', () => {
  const metric = (inputTokens, totalNanoAiu) => ({
    modelMetrics: { model: { requests: { count: 1 }, usage: { inputTokens, outputTokens: 2, cacheReadTokens: 0, cacheWriteTokens: 0 } } },
    totalNanoAiu,
  });
  const events = [
    { type: 'session.start', harnessSessionId: 'one' },
    { type: 'session.shutdown', harnessSessionId: 'one', data: metric(10, 20) },
    { type: 'session.shutdown', harnessSessionId: 'one', data: metric(30, 50) },
    { type: 'assistant.usage', harnessSessionId: 'one', data: { inputTokens: 30, copilotUsage: { totalNanoAiu: 50 } } },
    { type: 'session.start', harnessSessionId: 'two' },
    { type: 'session.shutdown', harnessSessionId: 'two', data: metric(7, 9) },
  ];
  const summary = summarizeEvents(events);
  assert.equal(summary.inputTokens, 37);
  assert.equal(summary.nanoAiu, 59);
  assert.equal(summary.costComplete, true);
  assert.equal(summary.modelCalls, 2);
  assert.equal(summarizeEvents(events.slice(0, -1)).costComplete, false);
});

const invoiceCriteria = [
  'schema', 'invoice and total', 'currency', 'po', 'line items',
];
const invoice = {
  invoice_number: 'INV-20931', issue_date: '2026-03-04', vendor: 'Northwind Supplies',
  po_number: null, currency: 'USD', total: 1284.50,
  line_items: [
    { description: 'Ergonomic chair', quantity: 2, unit_price: 489 },
    { description: 'Standing desk frame', quantity: 1, unit_price: 306.50 },
  ],
};

test('invoice grader checks exact schema and every source value; malformed shapes do not crash', () => {
  assert.ok(grade('structured-extraction', JSON.stringify(invoice), invoiceCriteria).every(check => check.status === 'pass'));
  for (const malformed of ['not JSON', 'null', '[]', '{"line_items":[{},{}]}', '{"line_items":[null,null]}']) {
    assert.doesNotThrow(() => grade('structured-extraction', malformed, invoiceCriteria));
    assert.ok(grade('structured-extraction', malformed, invoiceCriteria).some(check => check.status === 'fail'));
  }
  const extra = grade('structured-extraction', JSON.stringify({ ...invoice, extra: true }), invoiceCriteria);
  assert.equal(extra[0].status, 'fail');
  assert.equal(grade('structured-extraction', JSON.stringify({ ...invoice, issue_date: 'wrong' }), invoiceCriteria)[0].status, 'fail');
});

test('one-shot grader never assumes unverified semantic acceptance', () => {
  const result = grade('one-shot',
    '- Version 2.4 adds CSV export.\n- Exports support 10,000 rows.\n- Administrators can disable export.',
    ['bullets', 'length', 'preserved facts', 'no invented facts']);
  assert.deepEqual(result.map(check => check.status), ['pass', 'pass', 'pass', 'needs-review']);
  assert.equal(accepted({ status: 'completed', acceptance: result }), false);
});

test('comparisons include failed spend; zero accepted and incomplete cost stay undefined', () => {
  const acceptance = [{ status: 'pass' }];
  const results = [
    { variant: 'good', status: 'completed', acceptance, metrics: { nanoAiu: 10, costComplete: true }, elapsedMs: 1 },
    { variant: 'good', status: 'failed', acceptance, metrics: { nanoAiu: 20, costComplete: true }, elapsedMs: 2 },
    { variant: 'bad', status: 'failed', acceptance: [{ status: 'needs-review' }], metrics: null },
  ];
  const summary = comparison(results);
  assert.equal(summary.good.accepted, 1);
  assert.equal(summary.good.totalNanoAiu, 30);
  assert.equal(summary.good.nanoAiuPerAcceptedCompletion, 30);
  assert.equal(summary.bad.totalNanoAiu, null);
  assert.equal(summary.bad.nanoAiuPerAcceptedCompletion, null);
  assert.equal(comparison([]).good.costComplete, false);
});

test('controller rejects unknown commands and malformed CLI arguments before Docker calls', () => {
  const run = args => spawnSync(process.execPath, [join(directory, 'harness.mjs'), ...args], { encoding: 'utf8' });
  assert.equal(run(['help']).status, 0);
  assert.match(run(['run', '--pattern']).stderr, /Missing value/);
  assert.match(run(['run', '--unexpected']).stderr, /Unknown argument/);
  assert.match(run(['monitor', '--run', '../bad']).stderr, /run ID/);
  assert.match(run(['run', '--budget', '0', '--dry-run']).stderr, /positive/);
});

test('reports explain task, expectations, actual outcomes, units, and cache confounds with evidence', async () => {
  const plan = await buildPlan(root, 'structured-extraction', config);
  const criteria = plan.variants.good.acceptance;
  const manifest = {
    runId: 'test-run', pattern: 'structured-extraction', config,
    repetitions: 1, plannedAiCredits: 60, dryRun: false,
  };
  const result = (variant, output, nanoAiu, outputTokens, cacheReadTokens) => ({
    variant, pattern: manifest.pattern, trial: 1, repetition: 1, status: 'completed',
    acceptance: grade(manifest.pattern, output, criteria), elapsedMs: 11000,
    metrics: { nanoAiu, costComplete: true, inputTokens: 12000, outputTokens, cacheReadTokens,
      actualModels: ['gpt-5-mini'], modelCalls: 1, toolCalls: 0 },
  });
  const records = [
    { result: result('good', JSON.stringify(invoice), 400000000, 200, 0),
      output: JSON.stringify(invoice), resultLink: 'good/result.json',
      artifacts: [{ label: 'Full response', link: 'good/output.md' }, { label: 'Input', link: 'good/input.md' }] },
    { result: result('bad', 'Readable prose, not JSON.', 100000000, 400, 10000),
      output: 'Readable prose, not JSON.', resultLink: 'bad/result.json',
      artifacts: [{ label: 'Full response', link: 'bad/output.md' }] },
  ];
  const report = renderReport({ manifest, plan, records });
  assert.equal(report.complete, true);
  for (const heading of ['What did we test?', 'What did we expect?', 'What happened?', 'Insights and next steps']) {
    assert.ok(report.markdown.includes(`## ${heading}`));
  }
  assert.match(report.markdown, /invoice INV-20931/);
  assert.match(report.markdown, /Readable prose, not JSON/);
  assert.match(report.markdown, /0\.4/);
  assert.match(report.markdown, /AIU is not an AI credit or a dollar amount/);
  assert.match(report.markdown, /Cache confound/);
  assert.match(report.markdown, /Cheaper is not a saving/);
  assert.match(report.markdown, /Expectation versus observation/);
  assert.match(report.markdown, /repair\/reformat retry was not tested/);
  assert.match(report.markdown, /Undefined: zero accepted/);
  assert.match(report.markdown, /Not accepted/);
  assert.match(report.markdown, /Output is not a bare JSON object/);
  assert.match(report.markdown, /\[Full response\]\(bad\/output.md\)/);
  assert.match(report.markdown, /not a statistically established/);
  assert.equal(outcome(records[1].result), 'Not accepted');
  records[0].fusionRoutes = [{ pattern: 'critique', primaryModel: 'solver', secondaryModel: 'critic', ruleId: 'test-route' }];
  const routed = renderReport({ manifest, plan, records });
  assert.match(routed.markdown, /### HydraFusion \/ Ensemble routing/);
  assert.match(routed.markdown, /\| 1\/1\/good \| critique \| solver \| critic \| test-route \|/);
});

test('reports distinguish dry runs, failures, missing hypotheses, and unresolved review', async () => {
  const plan = await buildPlan(root, 'one-shot', config);
  delete plan.variants.bad.expectations;
  const manifest = { runId: 'dry', pattern: 'one-shot', config, repetitions: 1, dryRun: true };
  const dry = renderReport({ manifest, plan, records: [] });
  assert.equal(dry.complete, false);
  assert.match(dry.markdown, /Dry run only/);
  assert.match(dry.markdown, /Not captured in this historical plan/);
  assert.match(dry.markdown, /current prompt content was not substituted/);
  assert.doesNotMatch(dry.markdown, /Cache confound/);
  const result = { variant: 'bad', trial: 1, repetition: 1, status: 'failed',
    acceptance: [{ criterion: 'A|B\nC', status: 'needs-review', evidence: null }],
    metrics: null, elapsedMs: 0, error: 'CLI cap rejected' };
  const failed = renderReport({ manifest: { ...manifest, dryRun: false }, plan,
    records: [{ result, artifacts: [], output: null, resultLink: 'result.json',
      diagnostic: 'Use at least 30 AI credits. ``` fenced text' }], controllerError: 'Setup failed' });
  assert.equal(failed.complete, false);
  assert.match(failed.markdown, /Execution failed/);
  assert.match(failed.markdown, /Use at least 30 AI credits/);
  assert.match(failed.markdown, /A\\\|B C/);
  assert.match(failed.markdown, /````text/);
  assert.match(failed.markdown, /No evidence recorded|no evidence recorded/);
  assert.equal(outcome({ ...result, status: 'completed' }), 'Awaiting review');
});

test('saved report regeneration preserves original evidence and recovers only hash-matching hypotheses', async () => {
  const runId = `report-test-${randomUUID()}`;
  const path = join(directory, 'results', runId);
  const attemptPath = join(path, 'trial-1', 'repetition-1', 'good');
  const plan = await buildPlan(root, 'one-shot', config);
  delete plan.variants.good.expectations;
  delete plan.variants.bad.expectations;
  plan.variants.bad.sourceHash = 'different historical prompt';
  const result = {
    variant: 'good', pattern: 'one-shot', trial: 1, repetition: 1, status: 'completed',
    acceptance: [{ criterion: 'criterion', status: 'needs-review', evidence: null }],
    metrics: null, elapsedMs: 100,
  };
  const original = JSON.stringify(result);
  try {
    await mkdir(attemptPath, { recursive: true });
    await writeFile(join(path, 'manifest.json'), JSON.stringify({
      runId, pattern: 'one-shot', config, repetitions: 1, dryRun: false, plannedAiCredits: 60,
    }));
    await writeFile(join(path, 'resolved-plan.json'), JSON.stringify(plan));
    await writeFile(join(attemptPath, 'result.json'), original);
    await writeFile(join(attemptPath, 'output.md'), 'saved output');
    await writeFile(join(attemptPath, 'session-1-turn-1-input.md'), 'saved input');
    const command = () => spawnSync(process.execPath, [join(directory, 'harness.mjs'), 'report', '--run', runId],
      { encoding: 'utf8' });
    const generated = command();
    assert.equal(generated.status, 0, generated.stderr);
    const report = await readFile(join(path, 'report.md'), 'utf8');
    assert.match(report, /exact recorded SHA-256 match/);
    assert.match(report, /Not captured in this historical plan/);
    assert.match(report, /saved output/);
    assert.match(report, /session-1-turn-1-input.md/);
    assert.equal(await readFile(join(attemptPath, 'result.json'), 'utf8'), original);
    assert.equal(JSON.parse(await readFile(join(path, 'comparison.json'), 'utf8')).complete, false);
    await writeFile(join(attemptPath, 'review.json'), JSON.stringify({
      sourceHash: hash(JSON.stringify(result)), reviewer: 'Tester', evidence: 'Reviewed saved output',
      acceptance: [{ criterion: 'criterion', status: 'pass', evidence: 'verified' }],
    }));
    assert.equal(command().status, 0);
    const reviewed = await readFile(join(path, 'report.md'), 'utf8');
    assert.match(reviewed, /Reviewed by: Tester/);
    assert.match(reviewed, /1 \/ 1/);
    assert.equal(await readFile(join(attemptPath, 'result.json'), 'utf8'), original);
  } finally { await rm(path, { recursive: true, maxRetries: 5, retryDelay: 100 }); }
});

test('Docker monitor reads live resource/worker state and timeout kills the CLI process group', {
  skip: process.env.HARNESS_DOCKER_TESTS !== '1',
}, async () => {
  const name = `model-monitor-test-${randomUUID().slice(0, 8)}`;
  const runId = `monitor-test-${randomUUID()}`;
  const path = join(directory, 'results', runId);
  const docker = args => {
    const result = spawnSync('docker', args, { encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout;
  };
  let created = false;
  try {
    await mkdir(path, { recursive: true });
    docker(['run', '--detach', '--name', name, '--cap-drop=ALL', '--security-opt=no-new-privileges',
      config.image, 'node', '-e',
      "require('fs').writeFileSync('/evidence/status.json',JSON.stringify({state:'running',synthetic:true}));setTimeout(()=>{},60000)"]);
    created = true;
    await writeFile(join(path, 'status.json'), JSON.stringify({ state: 'running', container: name, synthetic: true }));
    const monitor = spawnSync(process.execPath, [join(directory, 'harness.mjs'), 'monitor', '--run', runId],
      { encoding: 'utf8', timeout: 30000 });
    assert.equal(monitor.status, 0, monitor.stderr);
    assert.match(monitor.stdout, /synthetic/);
    assert.match(monitor.stdout, /CPUPerc/);
    assert.doesNotMatch(monitor.stderr, /unavailable/);
    const output = docker(['run', '--rm', config.image, 'node', '--input-type=module', '-e',
      "import assert from 'node:assert/strict';import {command} from './worker.mjs';const input='x'.repeat(200000);const echo=await command(process.execPath,['-e','process.stdin.pipe(process.stdout)'],{input});assert.equal(echo.stdout,input);assert.equal(echo.stdinError,null);const result=await command(process.execPath,['-e','setTimeout(()=>{},10000)'],{timeoutMs:100});assert.equal(result.timedOut,true);assert.notEqual(result.code,0);console.log('timeout passed')"]);
    assert.match(output, /timeout passed/);
  } finally {
    if (created) docker(['rm', '--force', name]);
    await rm(path, { recursive: true, maxRetries: 5, retryDelay: 100 });
  }
});
