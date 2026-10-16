import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

// Independent oracles: do not copy this file into a model's fixture workspace.
const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = join(root, 'fixtures');
const text = async name => (await readFile(join(fixtures, name), 'utf8')).replace(/\r\n/g, '\n');
const json = async name => JSON.parse(await text(name));
const sourceModule = source => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('all thirteen declared fixture paths exist for both prompt variants', async () => {
  let patterns = 0;
  const uniquePaths = new Set();
  for (const folder of await readdir(join(root, 'prompts'), { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const sets = [];
    for (const variant of ['good', 'bad']) {
      const prompt = await readFile(join(root, 'prompts', folder.name, `${variant}.prompt.md`), 'utf8');
      const block = prompt.match(/^fixtures:\s*\r?\n((?:  - .+\r?\n)+)/m)?.[1] ?? '';
      const paths = [...block.matchAll(/^  - (fixtures\/[^\r\n]+)/gm)].map(match => match[1]);
      sets.push(paths);
      for (const path of paths) {
        const local = join(root, ...path.split('/'));
        assert.ok((await stat(local)).isDirectory() || (await stat(local)).isFile(), path);
        uniquePaths.add(path);
      }
    }
    assert.deepEqual(sets[0], sets[1], folder.name);
    if (sets[0].length) patterns += 1;
  }
  assert.equal(uniquePaths.size, 13);
  assert.equal(patterns, 12);
});

test('generator is deterministic and checked-in files have no drift', () => {
  const result = spawnSync(process.execPath, [join(fixtures, 'generate.mjs'), '--check'], {
    cwd: root, encoding: 'utf8', timeout: 30_000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('actual cl100k_base tokenization meets guide and long-document thresholds', () => {
  const result = spawnSync('python', ['-c',
    'import json,sys,tiktoken; from pathlib import Path; e=tiktoken.get_encoding("cl100k_base"); print(json.dumps([len(e.encode(Path(p).read_text(encoding="utf-8"))) for p in sys.argv[1:]]))',
    join(fixtures, 'batch-classification', 'label-guide.md'),
    join(fixtures, 'long-context', 'design-doc.md'),
  ], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 0,
    'Token audit needs the validation-only Python tiktoken package, not an inferred word count.\n' + result.stderr);
  const [guide, document] = JSON.parse(result.stdout);
  assert.ok(guide >= 1500, `guide: ${guide} tokens`);
  assert.ok(document >= 38_000 && document <= 42_000, `design: ${document} tokens`);
});

test('five arrays of five tickets have independent known gold labels and unique ids', async () => {
  const batches = (await text('batch-classification/tickets.jsonl')).trim().split(/\r?\n/).map(JSON.parse);
  const labels = ['billing', 'bug', 'how-to', 'account', 'feature-request'];
  assert.equal(batches.length, 5);
  assert.equal(new Set(batches.flat().map(ticket => ticket.id)).size, 25);
  for (const [b, batch] of batches.entries()) {
    assert.equal(batch.length, 5);
    for (const [i, ticket] of batch.entries()) {
      assert.deepEqual(Object.keys(ticket), ['id', 'text', 'gold_label']);
      assert.equal(ticket.id, `ticket-${b + 1}-${i + 1}`);
      assert.equal(ticket.gold_label, labels[i]);
      assert.ok(ticket.text.length > 40);
    }
  }
  const guide = await text('batch-classification/label-guide.md');
  for (const label of labels) assert.ok(guide.includes(`## ${label}\n`));
});

test('long document has exactly three seeded decisions at exact numbered sections', async () => {
  const document = await text('long-context/design-doc.md');
  const blocks = document.split(/^## /m).slice(1);
  assert.equal(blocks.length, 100);
  assert.deepEqual(blocks.map(block => Number(block.match(/^\d+/)[0])),
    Array.from({ length: 100 }, (_, i) => i + 1));
  const decisions = blocks.filter(block => block.includes('**Decision D'));
  assert.deepEqual(decisions.map(block => Number(block.match(/^\d+/)[0])), [12, 48, 84]);
  assert.equal((document.match(/\*\*Decision D[123]:\*\*/g) ?? []).length, 3);
  assert.match(blocks[11], /small model first.*strong model only when the fixed extraction quality gate fails/);
  assert.match(blocks[47], /24 hours.*content digest and tenant-scoped cache key/);
  assert.match(blocks[83], /Reserve each request's maximum token allowance.*daily token budget before dispatch/);
  assert.equal((document.match(/\*\*Open risk R\d:\*\*/g) ?? []).length, 2);
  assert.match(blocks[30], /Provider usage reports may arrive late/);
  assert.match(blocks[66], /rare document layouts/);
  assert.match(blocks[91], /\*\*Explicitly deferred:\*\* Active-active multi-region dispatch/);
});

test('policy applicability is based on purchase date, not edit date or region', async () => {
  const current = await text('rag/policies/us-annual-v2026-10.md');
  const prior = await text('rag/policies/us-annual-v2025-01.md');
  const eu = await text('rag/policies/eu-annual-v2026-10.md');
  const monthly = await text('rag/policies/us-monthly-v2026-10.md');
  assert.match(current, /Document ID: REF-US-ANNUAL/);
  assert.match(current, /Version: 2026\.10/);
  assert.match(current, /Effective from: 2026-10-01 \(inclusive\)/);
  assert.match(current, /## 2\. Initial purchase[\s\S]*within 14 calendar days[\s\S]*no more than 10 export jobs/);
  assert.match(current, /## 3\. Renewal[\s\S]*within seven calendar days[\s\S]*no export jobs/);
  assert.match(current, /does not\s+create a prorated refund/);
  assert.match(prior, /Effective until: 2026-09-30/);
  assert.match(prior, /Last edited: 2026-10-10/);
  assert.match(prior, /within 30 calendar days/);
  assert.match(eu, /Region: EU/);
  assert.match(monthly, /Product: monthly subscription/);
});

test('ADR states concrete requirements and three independently supported material gaps', async () => {
  const adr = await text('architecture/notifications-adr.md');
  assert.match(adr, /Status: proposed; review owner: Messaging lead/);
  assert.deepEqual([...adr.matchAll(/^- (R\d):/gm)].map(match => match[1]),
    ['R1', 'R2', 'R3', 'R4', 'R5']);
  assert.match(adr, /20,000 jobs\/day and bursts of 50 jobs\/second/);
  assert.match(adr, /Every acknowledged enqueue must\s+survive a process crash/);
  assert.match(adr, /Suppress duplicate user-visible email sends for 24 hours/);
  assert.match(adr, /resume dispatch\s+within 15 minutes, without database surgery/);
  assert.match(adr, /Delete completed payloads within seven days/);
  assert.match(adr, /ten-second lease[\s\S]*provider may take 30 seconds/);
  assert.match(adr, /Idempotency is held only in\s+the current worker's memory/);
  assert.match(adr, /no failed-job view, dead-letter state, or operator replay command/);
  assert.match(adr, /complete payloads remain in the database indefinitely/);
  assert.match(adr, /Messaging lead owns delivery identity and provider timeout experiments/);
  assert.match(adr, /Operations lead owns a timed poison-job recovery drill/);
  assert.match(adr, /Data governance owner owns payload retention approval/);
});

test('telemetry establishes spike, predecessor deployment, and bounded-log opportunity', async () => {
  const metrics = await json('mock-observability/metrics.json');
  const deployments = await json('mock-observability/deployments.json');
  const logs = await json('mock-observability/logs.json');
  const service = 'staging-api';
  const start = '2026-10-14T14:00:00Z';
  const end = '2026-10-14T14:15:00Z';
  for (const rows of [metrics, deployments, logs]) {
    assert.ok(Array.isArray(rows));
    for (const row of rows) assert.ok(Number.isFinite(Date.parse(row.timestamp ?? row.deployed_at)));
    assert.ok(rows.some(row => row.service !== service), 'unrelated service distractor');
  }
  for (const metric of metrics) {
    assert.deepEqual(Object.keys(metric).sort(),
      ['timestamp', 'service', 'p95_latency_ms', 'error_rate', 'request_count'].sort());
    assert.equal(typeof metric.service, 'string');
    assert.ok(Number.isFinite(metric.p95_latency_ms) && metric.p95_latency_ms >= 0);
    assert.ok(Number.isFinite(metric.error_rate) && metric.error_rate >= 0 && metric.error_rate <= 1);
    assert.ok(Number.isInteger(metric.request_count) && metric.request_count >= 0);
  }
  for (const deployment of deployments) {
    assert.deepEqual(Object.keys(deployment).sort(),
      ['deployed_at', 'service', 'deployment_id', 'version', 'change'].sort());
    for (const value of Object.values(deployment)) assert.ok(typeof value === 'string' && value.length);
  }
  for (const log of logs) {
    const keys = ['timestamp', 'service', 'level', 'event', 'deployment_id', 'message'];
    if (log.event === 'DB_POOL_WAIT_TIMEOUT') keys.push('pool_limit', 'wait_ms', 'request_id');
    assert.deepEqual(Object.keys(log).sort(), keys.sort());
    assert.ok(['info', 'error'].includes(log.level));
    assert.ok(deployments.some(deployment => deployment.deployment_id === log.deployment_id &&
      deployment.service === log.service && deployment.deployed_at <= log.timestamp));
  }
  const window = metrics.filter(row => row.service === service && row.timestamp >= start && row.timestamp <= end);
  assert.equal(window.length, 16);
  assert.ok(window.every(row => row.p95_latency_ms >= 1700 && row.error_rate >= 0.08));
  assert.ok(metrics.filter(row => row.service === service && row.timestamp < start)
    .every(row => row.p95_latency_ms < 200 && row.error_rate < 0.01));
  assert.ok(metrics.filter(row => row.service === service && row.timestamp > end)
    .every(row => row.p95_latency_ms < 200 && row.error_rate < 0.01));
  const active = deployments.filter(row => row.service === service && row.deployed_at <= start).at(-1);
  assert.equal(active.deployment_id, 'deploy-142');
  assert.equal(active.deployed_at, '2026-10-14T13:59:00Z');
  const errors = logs.filter(row => row.service === service && row.level === 'error' &&
    row.timestamp >= start && row.timestamp <= end);
  assert.equal(errors.length, 46);
  assert.ok(errors.every(row => row.deployment_id === active.deployment_id && row.pool_limit === 4));
  assert.ok(errors.slice(0, 20).every(row => row.event === 'DB_POOL_WAIT_TIMEOUT'));
  const serialized = JSON.stringify({ metrics, deployments, logs });
  assert.doesNotMatch(serialized, /password|authorization|api[_-]?key|@|Bearer /i);
});

for (const [name, passed, failed, failureName] of [
  ['checkout-app', 2, 1, 'mobile timeout then Retry creates exactly one order'],
  ['retry-regression', 2, 1, 'retry-timeout: second attempt succeeds after the first attempt times out'],
  ['ci-failure', 2, 1, 'normalizes mixed-case release names'],
  ['api-client', 3, 0],
  ['rate-limit-app', 3, 0],
  ['review-diff', 2, 0],
  ['deprecated-api', 3, 0],
]) {
  test(`${name}: public baseline has ${passed} passes and ${failed} expected failures`, async () => {
    const directory = join(fixtures, name);
    const packageJson = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
    assert.equal(packageJson.scripts.test, 'node --test');
    assert.equal(Object.keys(packageJson.dependencies ?? {}).length, 0);
    assert.equal(Object.keys(packageJson.devDependencies ?? {}).length, 0);
    assert.ok((await readFile(join(directory, 'README.md'), 'utf8')).includes('npm test'));
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], {
      cwd: directory, encoding: 'utf8', timeout: 10_000, env,
    });
    assert.equal(result.status, failed ? 1 : 0, result.stderr || result.stdout);
    assert.match(result.stdout, new RegExp(`# pass ${passed}\\b`));
    assert.match(result.stdout, new RegExp(`# fail ${failed}\\b`));
    if (failureName) assert.ok(result.stdout.includes(`not ok ${name === 'ci-failure' ? 1 : 3} - ${failureName}`));
    assert.match(result.stdout, /# cancelled 0/);
    assert.match(result.stdout, /# skipped 0/);
    assert.match(result.stdout, /# todo 0/);
  });
}

test('checkout baseline produces two orders; minimal retry-state correction produces one', async () => {
  const { createPaymentApi } = await import(pathToFileURL(join(fixtures, 'checkout-app/src/payment.mjs')));
  const source = await text('checkout-app/src/checkout/mobile.mjs');
  const baseline = await sourceModule(source);
  const fixed = await sourceModule(source.replace(
    '      } catch (error) {\n        pendingKey = undefined;',
    '      } catch (error) {'));
  for (const [module, expected] of [[baseline, 2], [fixed, 1]]) {
    const payment = createPaymentApi({ timeoutFirstResponse: true });
    const checkout = module.createMobileCheckout(payment, 'external-cart');
    await assert.rejects(checkout.submit(), { code: 'PAYMENT_TIMEOUT' });
    await checkout.submit();
    assert.equal(payment.orders().length, expected);
  }
});

test('retry baseline reuses aborted signal; fresh per-attempt signal restores recovery', async () => {
  const source = await text('retry-regression/src/retry.mjs');
  const fixedSource = source.replace('  const controller = new AbortController();\n', '')
    .replace('for (let attempt = 0; ; attempt += 1) {',
      'for (let attempt = 0; ; attempt += 1) {\n    const controller = new AbortController();');
  for (const [module, succeeds] of [[await sourceModule(source), false], [await sourceModule(fixedSource), true]]) {
    let expire;
    const timers = { setTimeout: callback => { expire = callback; return callback; }, clearTimeout() {} };
    const signals = [];
    const result = module.requestWithRetry(async ({ signal, attempt }) => {
      signals.push(signal);
      signal.throwIfAborted();
      if (attempt === 1) return 'recovered';
      return new Promise((resolve, reject) =>
        signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    }, { timers });
    expire();
    if (succeeds) {
      assert.equal(await result, 'recovered');
      assert.notEqual(signals[0], signals[1]);
    } else {
      await assert.rejects(result, { code: 'TIMEOUT' });
      assert.equal(signals[0], signals[1]);
    }
  }
});

test('CI failure is case normalization in release.mjs, not whitespace or path handling', async () => {
  const source = await text('ci-failure/src/release.mjs');
  const baseline = await sourceModule(source);
  const fixed = await sourceModule(source.replace('name.trim()', 'name.trim().toLowerCase()'));
  assert.equal(baseline.releaseSlug('  Autumn Launch  '), 'Autumn-Launch');
  assert.equal(fixed.releaseSlug('  Autumn Launch  '), 'autumn-launch');
  assert.equal(fixed.releasePath('AUTUMN LAUNCH'), '/releases/autumn-launch');
  assert.match(await text('ci-failure/ci.log'), /not ok 1 - normalizes mixed-case release names/);
});

test('rate-limit baseline admits request 101 and keeps API keys independent', async () => {
  const { createApp } = await import(pathToFileURL(join(fixtures, 'rate-limit-app/src/app.mjs')));
  const app = createApp({ now: () => 0 });
  const request = key => ({ method: 'GET', path: '/widgets', headers: { 'x-api-key': key } });
  for (let i = 0; i < 101; i += 1) assert.equal(app.handle(request('synthetic-a')).statusCode, 200);
  assert.equal(app.handle(request('synthetic-b')).statusCode, 200);
});

test('client baseline accepts injected transport but has no timeout signal or option handling', async () => {
  const { createClient } = await import(pathToFileURL(join(fixtures, 'api-client/src/client.mjs')));
  let options;
  await createClient({
    baseUrl: 'https://fixture.invalid/', timeoutMs: 1,
    transport: async (url, requestOptions) => {
      options = requestOptions;
      return { status: 200, body: 'ok' };
    },
  }).get('health');
  assert.equal(options.signal, undefined);
  assert.doesNotMatch(await text('api-client/src/client.mjs'), /setTimeout|AbortController|timeoutMs/);
});

test('review diff exactly matches post-image lines and exposes only intended seeded defects', async () => {
  const pagination = await text('review-diff/src/pagination.mjs');
  const orders = await text('review-diff/src/orders.mjs');
  assert.equal(pagination.split('\n')[4], '  return items.slice(start, start + pageSize - 1);');
  assert.equal(orders.split('\n')[2], "  const sql = `SELECT id, reference FROM orders WHERE reference = '${search}'`;");
  const diff = await text('review-diff/change.diff');
  assert.match(diff, /\+  return items\.slice\(start, start \+ pageSize - 1\);/);
  assert.match(diff, /-  return db\.query\(sql, \[search\]\);/);
  const { page } = await sourceModule(pagination);
  assert.deepEqual(page([1, 2, 3, 4], 1, 2), [1]);
  const { searchOrders } = await sourceModule(orders);
  let call;
  await searchOrders({ query: async (...args) => { call = args; return []; } }, "x' OR '1'='1");
  assert.equal(call.length, 1);
  assert.equal(call[0], "SELECT id, reference FROM orders WHERE reference = 'x' OR '1'='1'");
});

test('migration baseline contains three modules with three calls each and one shared adapter', async () => {
  for (const module of ['billing', 'inventory', 'reports']) {
    const source = await text(`deprecated-api/src/${module}/index.mjs`);
    assert.equal((source.match(/legacy_fetch\(/g) ?? []).length, 3);
    assert.match(source, /from '\.\.\/common\/api\.mjs'/);
    await stat(join(fixtures, 'deprecated-api/test', `${module}.test.mjs`));
  }
  const shared = await text('deprecated-api/src/common/api.mjs');
  assert.match(shared, /export async function legacy_fetch/);
  assert.doesNotMatch(shared, /export async function fetch_v2/);
  assert.match(await text('deprecated-api/src/common/transport.mjs'), /requestV2\(resource/);
});
