import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import fs from 'node:fs/promises';
import { atomicJson, cliArgs, previewLinks, validateCatalog } from './harness-lib.mjs';
import { configureSubagents } from './worker.mjs';
import { dispatch, query } from './mock-observability.mjs';

const directory = dirname(fileURLToPath(import.meta.url));

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

test('VS Code preview links are absolute file URIs with escaped Windows-safe paths and remain idempotent', () => {
  const path = join(tmpdir(), 'report folder', 'report.md');
  const source = '[output](nested/output.md) | [space](a%20b.md) | [web](https://example.com) | [section](#heading)';
  const linked = previewLinks(source, path);
  const targets = [...linked.matchAll(/\]\(<(file:[^>]+)>\)/g)].map(match => fileURLToPath(match[1]));
  assert.deepEqual(targets, [join(dirname(path), 'nested', 'output.md'), join(dirname(path), 'a b.md')]);
  assert.match(linked, /report%20folder/);
  assert.match(linked, /\[web\]\(https:\/\/example.com\)/);
  assert.match(linked, /\[section\]\(#heading\)/);
  assert.equal(previewLinks(linked, path), linked);
  const quoted = '```markdown\n[verbatim model output](not-a-real-file.md)\n```\n[outside](real.md)';
  assert.ok(previewLinks(quoted, path).includes('[verbatim model output](not-a-real-file.md)'));
  assert.match(previewLinks(quoted, path), /\[outside\]\(<file:/);
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
