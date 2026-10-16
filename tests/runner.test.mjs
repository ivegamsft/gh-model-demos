import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import fs from 'node:fs/promises';
import { atomicJson, cliArgs, relativeLinks, resolveConfig, validateCatalog } from './harness-lib.mjs';
import { configureSubagents } from './worker.mjs';
import { dispatch, query } from './mock-observability.mjs';
import { reserveDirectory, resultLocation, runDirectories } from './result-paths.mjs';
import { migrateResults } from './migrate-results.mjs';

const directory = dirname(fileURLToPath(import.meta.url));

test('HydraFusion requires explicit rollout opt-in and records non-effort-matched CLI settings', () => {
  const prompt = { config: { surface: 'copilot-cli', model_class: 'mid', reasoning_effort: 'medium', tools: 'none' },
    sessions: [['test']] };
  const config = { modelClasses: { mid: 'hydrafusion' }, toolProfiles: { none: [] } };
  assert.throws(() => resolveConfig(prompt, config), /enableHydrafusion/);
  const [phase] = resolveConfig(prompt, { ...config, enableHydrafusion: true });
  assert.equal(phase.effort, undefined);
  assert.equal(phase.requestedEffort, 'medium');
  assert.equal(phase.experimentalHydrafusion, true);
  assert.doesNotThrow(() => validateCatalog([phase], []));
  assert.throws(() => validateCatalog([{ model: 'hydrafusion' }], []), /Unavailable/);
  assert.throws(() => validateCatalog([{ ...phase, effort: 'medium' }], []), /Invalid experimental/);
  assert.doesNotThrow(() => validateCatalog([{ ...phase, subagentModel: 'hydrafusion' }], []));
  assert.throws(() => validateCatalog([{ ...phase, subagentModel: 'other' }], []), /Invalid experimental/);
  const args = cliArgs(phase, { max_ai_credits: 40 }, 'session');
  assert.ok(args.includes('--experimental'));
  assert.deepEqual(args.slice(args.indexOf('--context'), args.indexOf('--context') + 2), ['--context', 'default']);
  assert.ok(!args.includes('--reasoning-effort'));
});

test('result folders use atomic sortable reservations and migrate without changing frozen evidence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'result-layout-'));
  try {
    const reserved = await Promise.all(Array.from({ length: 3 }, () => reserveDirectory(join(root, 'sample'), 'run')));
    assert.deepEqual(reserved.map(item => item.id).sort(), ['run-000001', 'run-000002', 'run-000003']);
    const matrix = await reserveDirectory(join(root, 'matrices'), 'matrix');
    const matrixPlan = JSON.stringify({ id: matrix.id, jobs: [], cells: [] });
    await writeFile(join(matrix.path, 'plan.json'), matrixPlan);
    await writeFile(join(matrix.path, 'state.json'), '[]');
    const legacy = join(root, '2026-old-run');
    await fs.mkdir(legacy);
    const manifest = '{"runId":"2026-old-run","pattern":"sample","createdAt":"2026-01-01T00:00:00.000Z"}';
    await writeFile(join(legacy, 'manifest.json'), manifest);
    await writeFile(join(legacy, 'result.json'), '{"untouched":true}');
    await writeFile(join(legacy, 'report.md'), '[result](result.json)\n[index](../index.md)');
    await writeFile(join(root, 'index.md'), '[run](2026-old-run/report.md)');
    assert.deepEqual(await migrateResults(root), { moved: 1, repaired: 2 });
    const location = await resultLocation(root, '2026-old-run');
    assert.equal(location, join(root, 'sample', 'run-000004'));
    assert.equal(await readFile(join(location, 'manifest.json'), 'utf8'), manifest);
    assert.equal(await readFile(join(location, 'result.json'), 'utf8'), '{"untouched":true}');
    assert.equal(await readFile(join(root, 'index.md'), 'utf8'), '[run](sample/run-000004/report.md)');
    assert.equal(await readFile(join(location, 'report.md'), 'utf8'), '[result](result.json)\n[index](../../index.md)');
    assert.deepEqual(await runDirectories(root), [location]);
    assert.deepEqual(await migrateResults(root), { moved: 0, repaired: 0 });
    assert.equal(await resultLocation(root, 'sample/run-000004'), location);
    await assert.rejects(resultLocation(root, '../escape'), /escaping/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('matrix migration groups evidence, resolves pending jobs, and retains immutable plans', async () => {
  const root = await mkdtemp(join(tmpdir(), 'matrix-layout-'));
  try {
    const oldMatrix = 'matrix-2026-old';
    const matrixPath = join(root, 'matrices', oldMatrix);
    await fs.mkdir(matrixPath, { recursive: true });
    const jobs = [1, 2].map(trial => ({
      id: `cell-1-trial-${trial}`, cellId: 'cell-1', trial,
      runId: `${oldMatrix}-cell-1-trial-${trial}`, state: trial === 1 ? 'completed' : 'pending',
    }));
    const plan = JSON.stringify({ id: oldMatrix, jobs, cells: [{ id: 'cell-1', pattern: 'sample' }] });
    await writeFile(join(matrixPath, 'plan.json'), plan);
    await writeFile(join(matrixPath, 'state.json'), JSON.stringify(jobs));
    const runPath = join(root, jobs[0].runId);
    await fs.mkdir(runPath);
    await writeFile(join(runPath, 'manifest.json'), JSON.stringify({
      runId: jobs[0].runId, pattern: 'sample', matrix: { id: oldMatrix, cellId: 'cell-1', trial: 1 },
    }));
    await writeFile(join(runPath, 'report.md'), '[matrix](../matrices/matrix-2026-old/report.md)');
    await writeFile(join(matrixPath, 'report.md'), `[run](../../${jobs[0].runId}/report.md)`);
    await writeFile(join(matrixPath, 'runner.lock'), 'active');
    await assert.rejects(migrateResults(root), /Stop the matrix controller/);
    await fs.unlink(join(matrixPath, 'runner.lock'));
    assert.deepEqual(await migrateResults(root), { moved: 2, repaired: 2 });
    const newMatrix = join(root, 'matrices', 'matrix-000001');
    assert.equal(await resultLocation(root, `matrices/${oldMatrix}`), newMatrix);
    assert.equal(await resultLocation(root, jobs[1].runId), join(newMatrix, 'runs', 'sample', 'cell-0001-trial-0002'));
    assert.equal(await readFile(join(newMatrix, 'plan.json'), 'utf8'), plan);
    assert.equal(await readFile(join(newMatrix, 'report.md'), 'utf8'), '[run](runs/sample/cell-0001-trial-0001/report.md)');
    assert.equal(await readFile(join(newMatrix, 'runs', 'sample', 'cell-0001-trial-0001', 'report.md'), 'utf8'),
      '[matrix](../../../report.md)');
    assert.deepEqual(await migrateResults(root), { moved: 0, repaired: 0 });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('checkpoint writes retry transient file locks, preserve existing data on permanent error, and clean temporary files', async t => {
  const path = await mkdtemp(join(tmpdir(), 'checkpoint-'));
  const target = join(path, 'state.json');
  const rename = fs.rename;
  let calls = 0;
  const replacement = t.mock.method(fs, 'rename', async (...args) => {
    if (calls++ === 0) throw Object.assign(new Error('Temporary viewer lock'), { code: 'EPERM' });
    return rename(...args);
  });
  try {
    await atomicJson(target, { state: 'saved' });
    assert.equal(calls, 2);
    assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), { state: 'saved' });
    replacement.mock.mockImplementation(async () => { throw Object.assign(new Error('Read only'), { code: 'EROFS' }); });
    await assert.rejects(atomicJson(target, { state: 'lost' }), { code: 'EROFS' });
    assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), { state: 'saved' });
    assert.deepEqual(await fs.readdir(path), ['state.json']);
  } finally { replacement.mock.restore(); await rm(path, { recursive: true, force: true }); }
});

test('report links are relative, escaped, portable, and idempotent', () => {
  const path = join(tmpdir(), 'report folder', 'report.md');
  const source = '[output](nested/output.md) | [space](a%20b.md) | [web](https://example.com) | [section](#heading)';
  const linked = relativeLinks(source, path);
  assert.equal(linked, source);
  const absolute = pathToFileURL(join(dirname(path), '..', 'a b(1).md')).href.replaceAll(')', '%29');
  assert.equal(relativeLinks(`[file](<${absolute}#section>)`, path), '[file](../a%20b%281%29.md#section)');
  assert.equal(relativeLinks(`[file](<${join(dirname(path), 'output.md')}>)`, path), '[file](output.md)');
  assert.equal(relativeLinks('[space](a b.md)', path), '[space](a%20b.md)');
  assert.equal(relativeLinks(source, join(tmpdir(), 'moved', 'report.md')), linked);
  assert.match(linked, /\[web\]\(https:\/\/example.com\)/);
  assert.match(linked, /\[section\]\(#heading\)/);
  assert.equal(relativeLinks(linked, path), linked);
  assert.equal(relativeLinks('[file](../a%20b%281%29.md#section)', path), '[file](../a%20b%281%29.md#section)');
  const quoted = '```markdown\n[verbatim model output](not-a-real-file.md)\n```\n[outside](real.md)';
  assert.equal(relativeLinks(quoted, path), quoted);
  assert.equal(relativeLinks(`~~~markdown\n[file](<${absolute}>)\n~~~`, path),
    `~~~markdown\n[file](<${absolute}>)\n~~~`);
});

test('subagent settings pin supported built-in workers and preserve unrelated settings', async () => {
  const home = await mkdtemp(join(tmpdir(), 'subagent-settings-'));
  try {
    await writeFile(join(home, 'settings.json'), JSON.stringify({ theme: 'dark', subagents: { extra: true } }));
    const settings = await configureSubagents(home, { subagentModel: 'test-model', subagentMechanism: 'fleet' });
    assert.equal(settings.mechanism, 'fleet');
    assert.equal(settings.agents.explore.model, 'test-model');
    assert.equal(settings.agents['general-purpose'].model, 'test-model');
    const saved = JSON.parse(await readFile(join(home, 'settings.json'), 'utf8'));
    assert.equal(saved.theme, 'dark');
    assert.equal(saved.subagents.extra, true);
    assert.deepEqual(saved.subagents.agents, settings.agents);
    assert.equal(await configureSubagents(home, {}), null);
    await writeFile(join(home, 'settings.json'), '{invalid');
    await assert.rejects(configureSubagents(home, { subagentModel: 'model' }), SyntaxError);
  } finally { await rm(home, { recursive: true, force: true }); }
});

test('runner bindings enable native worker tools, fleet mode, mock MCP, and shell-test permissions', () => {
  const caps = { max_ai_credits: 200 };
  const args = cliArgs({ model: 'lead', effort: 'medium', tools: ['web_fetch'],
    subagentModel: 'worker', subagentMechanism: 'fleet' }, caps, 's');
  for (const tool of ['task', 'read_agent', 'write_agent', 'list_agents', 'web_fetch']) assert.ok(args.includes(tool));
  assert.ok(args.includes('--fleet'));
  const mcp = cliArgs({ model: 'lead', tools: ['mcp:*'], toolProfile: 'mock-observability' }, caps, 's');
  const servers = JSON.parse(mcp[mcp.indexOf('--additional-mcp-config') + 1]);
  assert.equal(servers.mcpServers.observability.command, 'node');
  assert.ok(servers.mcpServers.observability.args.includes('/evidence/mock-observability.jsonl'));
  const readOnly = cliArgs({ model: 'lead', tools: ['bash'], toolProfile: 'read-only+shell-test' }, caps, 's');
  assert.ok(!readOnly.includes('--allow-all-tools'));
  assert.ok(readOnly.includes('shell(node --test:*)'));
  assert.ok(readOnly.includes('shell(git:*)'));
  assert.ok(readOnly.includes('write'));
  assert.throws(() => validateCatalog([{ model: 'lead', subagentModel: 'missing' }], [{ id: 'lead' }]),
    /Unavailable worker model/);
});

test('synthetic MCP filters by exact window/service, bounds log output, and records every tool query', async () => {
  const path = await mkdtemp(join(tmpdir(), 'observability-'));
  try {
    const records = [
      { service: 'staging-api', timestamp: '2026-10-14T13:59:00Z', p95_ms: 100 },
      { service: 'staging-api', timestamp: '2026-10-14T14:05:00Z', p95_ms: 900 },
      { service: 'other', timestamp: '2026-10-14T14:05:00Z', p95_ms: 100 },
    ];
    for (const kind of ['metrics', 'deployments', 'logs']) await writeFile(join(path, `${kind}.json`), JSON.stringify(records));
    const args = { service: 'staging-api', start: '2026-10-14T14:00:00Z', end: '2026-10-14T14:15:00Z', limit: 1 };
    const filtered = await query(path, 'metrics', args);
    assert.equal(filtered.records.length, 1);
    assert.equal(filtered.records[0].p95_ms, 900);
    assert.equal(filtered.matching, 1);
    assert.equal((await query(path, 'logs', { limit: 1 })).truncated, true);
    await assert.rejects(query(path, 'secrets', {}), /Unknown observability/);
    await assert.rejects(query(path, 'logs', { limit: -1 }), /limit/);
    await assert.rejects(query(path, 'logs', { start: 'yesterday' }), /ISO/);
    await assert.rejects(query(path, 'logs', { extra: true }), /Unknown query/);
    const evidence = join(path, 'evidence.jsonl');
    const response = await dispatch({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'metrics', arguments: args } }, path, evidence);
    assert.equal(JSON.parse(response.result.content[0].text).records.length, 1);
    assert.equal(JSON.parse((await readFile(evidence, 'utf8')).trim()).tool, 'metrics');
    const error = await dispatch({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'logs', arguments: { limit: 0 } } }, path, evidence);
    assert.equal(error.result.isError, true);
    const missing = await dispatch({ jsonrpc: '2.0', id: 3, method: 'missing' }, path, evidence);
    assert.equal(missing.error.code, -32601);
    assert.equal(await dispatch({ jsonrpc: '2.0', method: 'notifications/initialized' }, path), null);
    const init = await dispatch({ jsonrpc: '2.0', id: 4, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, path);
    assert.equal(init.result.protocolVersion, '2025-06-18');
    const process = spawnSync(globalThis.process.execPath, [join(directory, 'mock-observability.mjs'), path], {
      input: '{bad\n{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n', encoding: 'utf8',
    });
    assert.equal(process.status, 0, process.stderr);
    const messages = process.stdout.trim().split('\n').map(JSON.parse);
    assert.equal(messages[0].error.code, -32700);
    assert.deepEqual(messages[1].result.tools.map(tool => tool.name), ['metrics', 'deployments', 'logs']);
  } finally { await rm(path, { recursive: true, force: true }); }
});

test('authenticated Docker CLI connects the configured mock MCP and reads pinned worker models without inference', {
  skip: process.env.HARNESS_AUTH_TESTS !== '1',
}, async () => {
  const config = JSON.parse(await readFile(join(directory, 'config.json'), 'utf8'));
  const script = `
import assert from 'node:assert/strict';
import {cp,mkdir,writeFile} from 'node:fs/promises';
import {CopilotClient} from '@github/copilot-sdk';
import {configureSubagents,command} from './worker.mjs';
await cp('/auth','/home/node/.copilot',{recursive:true,filter:p=>
  !['session-state','logs','session-store.db','session-store.db-shm','session-store.db-wal','mcp-config.json']
  .some(n=>p.endsWith('/'+n))});
process.env.COPILOT_HOME='/home/node/.copilot';
await configureSubagents(process.env.COPILOT_HOME,{subagentModel:'gpt-5-mini',subagentMechanism:'fleet'});
const configured=await command('copilot',['config','subagents.agents']);
assert.equal(configured.code,0,configured.stderr);
assert.equal(JSON.parse(configured.stdout).research.model,'gpt-5-mini');
await mkdir('/workspace/fixtures/mock-observability',{recursive:true});
for(const k of ['metrics','deployments','logs']) await writeFile('/workspace/fixtures/mock-observability/'+k+'.json','[]');
const mcpServers={observability:{type:'stdio',command:'node',
  args:['/opt/harness/mock-observability.mjs','/workspace/fixtures/mock-observability'],tools:['*']}};
const c=new CopilotClient({cliPath:'/usr/local/lib/node_modules/@github/copilot/npm-loader.js',
  cliArgs:['--disable-builtin-mcps']});
try {
  await c.start();
  const s=await c.createSession({model:'gpt-5-mini',workingDirectory:'/workspace',availableTools:['mcp:*'],mcpServers});
  const tools=await s.rpc.mcp.listTools({serverName:'observability'});
  assert.deepEqual(tools.tools.map(t=>t.name),['metrics','deployments','logs']);
  const builtin=await c.rpc.tools.list({model:'gpt-5-mini'});
  for(const name of ['bash','task','read_agent','web_fetch']) assert.ok(builtin.tools.some(t=>t.name===name));
  console.log('MCP and worker settings verified; inferenceRequests=0');
} finally { await c.stop(); }
`;
  const result = spawnSync('docker', ['run', '--rm', '--cap-drop=ALL', '--security-opt=no-new-privileges',
    '--mount', `type=volume,source=${config.authVolumes.good},target=/auth,readonly`,
    '--env', 'COPILOT_AUTO_UPDATE=false', config.image, 'node', '--input-type=module', '-e', script],
  { encoding: 'utf8', timeout: 120000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout, /inferenceRequests=0/);
});
