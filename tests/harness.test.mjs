import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { accepted, buildPlan, cliArgs, comparison, expandPrompt, finalOutput, fixtureFiles,
  grade, hash, inside, parsePrompt, resolveConfig, summarizeEvents, validateCatalog } from './harness-lib.mjs';

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
  assert.throws(() => parsePrompt(oneShot.replace('max_ai_credits: 10', 'max_ai_credits: 0'), 'one-shot', 'good'), /positive/);
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

test('real inline pairs resolve and sum all planned session caps', async () => {
  const plan = await buildPlan(root, 'one-shot', config);
  assert.equal(plan.plannedAiCredits, 20);
  assert.equal(plan.variants.good.phases[0].model, 'gpt-5-mini');
  assert.deepEqual(plan.variants.good.phases[0].tools, []);
  await assert.rejects(buildPlan(root, 'one-shot', { ...config, trials: 2 }), /total 40/);
  await assert.rejects(buildPlan(root, '../one-shot', config), /pattern/);
  await assert.rejects(buildPlan(root, 'multi-tool', config), /Unsupported tool profile/);
  await assert.rejects(buildPlan(root, 'orchestration', config), /dedicated runner/);
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
  const args = cliArgs({ model: 'test', effort: 'low', tools: [] }, { max_ai_credits: 10 }, 'session', 'body');
  assert.equal(args[args.indexOf('--session-id') + 1], 'session');
  assert.equal(args[args.indexOf('--max-ai-credits') + 1], '10');
  assert.equal(args.at(-1), '--available-tools');
  assert.ok(args.includes('--no-ask-user'));
  assert.ok(args.includes('--disable-builtin-mcps'));
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
    { variant: 'good', status: 'completed', acceptance, metrics: { nanoAiu: 10 }, elapsedMs: 1 },
    { variant: 'good', status: 'failed', acceptance, metrics: { nanoAiu: 20 }, elapsedMs: 2 },
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
