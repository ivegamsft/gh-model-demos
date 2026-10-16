import { appendFile, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const kinds = ['metrics', 'deployments', 'logs'];

export async function query(directory, kind, args) {
  if (!kinds.includes(kind)) throw new Error(`Unknown observability tool: ${kind}`);
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Tool arguments must be an object.');
  const allowed = ['service', 'start', 'end', 'limit'];
  if (Object.keys(args).some(key => !allowed.includes(key))) throw new Error('Unknown query argument.');
  if (args.service !== undefined && typeof args.service !== 'string') throw new Error('service must be a string.');
  for (const field of ['start', 'end']) {
    if (args[field] !== undefined && (typeof args[field] !== 'string' || !Number.isFinite(Date.parse(args[field])))) {
      throw new Error(`${field} must be an ISO timestamp.`);
    }
  }
  if (args.start && args.end && Date.parse(args.start) > Date.parse(args.end)) throw new Error('start must not follow end.');
  const limit = args.limit ?? (kind === 'logs' ? 100 : 1000);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('limit must be an integer between 1 and 1000.');
  const records = JSON.parse(await readFile(join(directory, `${kind}.json`), 'utf8'));
  if (!Array.isArray(records)) throw new Error(`Invalid ${kind} dataset.`);
  const filtered = records.filter(record => {
    const timestamp = Date.parse(record.timestamp ?? record.deployed_at);
    if (!Number.isFinite(timestamp)) throw new Error(`Invalid ${kind} record timestamp.`);
    return (!args.service || record.service === args.service) &&
      (!args.start || timestamp >= Date.parse(args.start)) && (!args.end || timestamp <= Date.parse(args.end));
  });
  return { records: filtered.slice(0, limit), matching: filtered.length, truncated: filtered.length > limit };
}

export async function dispatch(request, directory, evidence) {
  if (!request || request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    return { jsonrpc: '2.0', id: request?.id ?? null, error: { code: -32600, message: 'Invalid JSON-RPC request.' } };
  }
  if (!Object.hasOwn(request, 'id')) return null;
  const result = value => ({ jsonrpc: '2.0', id: request.id, result: value });
  if (request.method === 'initialize') return result({
    protocolVersion: request.params?.protocolVersion ?? '2024-11-05', capabilities: { tools: {} },
    serverInfo: { name: 'fixture-observability', version: '1.0.0' },
  });
  if (request.method === 'ping') return result({});
  if (request.method === 'tools/list') return result({ tools: kinds.map(name => ({
    name, description: `Read synthetic ${name} for service staging-api. Filter by service and ISO UTC start/end; use limit for bounded records. Deployments are events: use a start before the spike to find the active deployment.`,
    inputSchema: { type: 'object', properties: {
      service: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 1000 },
    }, additionalProperties: false },
  })) });
  if (request.method !== 'tools/call') return {
    jsonrpc: '2.0', id: request.id, error: { code: -32601, message: `Unknown method: ${request.method}` },
  };
  const { name, arguments: args = {} } = request.params ?? {};
  let response;
  try {
    const value = await query(directory, name, args);
    response = { content: [{ type: 'text', text: JSON.stringify(value) }] };
  } catch (error) {
    if (error.code || error instanceof SyntaxError) throw error;
    response = { isError: true, content: [{ type: 'text', text: error.message }] };
  }
  if (evidence) await appendFile(evidence, `${JSON.stringify({
    timestamp: new Date().toISOString(), tool: name, arguments: args, response,
  })}\n`);
  return result(response);
}

async function main() {
  if (!process.argv[2]) throw new Error('Supply the synthetic fixture directory.');
  for await (const line of createInterface({ input: process.stdin })) {
    if (!line.trim()) continue;
    let request;
    try { request = JSON.parse(line); }
    catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Invalid JSON.' } })}\n`);
      continue;
    }
    const response = await dispatch(request, process.argv[2], process.argv[3]);
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.stack ?? String(error)); process.exitCode = 1; });
}
