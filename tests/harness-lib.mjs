import { createHash, randomUUID } from 'node:crypto';
import files from 'node:fs/promises';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export function inside(root, path) {
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error(`Path escapes root: ${path}`);
  return absolute;
}

export function positive(value, label, integer = false) {
  if (!Number.isFinite(value) || value <= 0 || (integer && !Number.isInteger(value))) {
    throw new Error(`${label} must be a positive ${integer ? 'integer' : 'number'}.`);
  }
  return value;
}

export function parsePrompt(text, pattern, variant) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(text);
  if (!match) throw new Error(`Invalid frontmatter/body: ${pattern}/${variant}`);
  const metadata = parse(match[1], { uniqueKeys: true });
  if (metadata?.id !== `${pattern}/${variant}` ||
      metadata.pattern !== pattern || metadata.variant !== variant) {
    throw new Error(`Prompt identity mismatch: ${pattern}/${variant}`);
  }
  if (!Array.isArray(metadata.acceptance) || !metadata.acceptance.length ||
      metadata.acceptance.some(item => typeof item !== 'string')) {
    throw new Error(`Missing acceptance criteria: ${metadata.id}`);
  }
  if (!Array.isArray(metadata.fixtures) || metadata.fixtures.some(path =>
    typeof path !== 'string' || !path.startsWith('fixtures/'))) {
    throw new Error(`Fixtures must be paths beneath fixtures/: ${metadata.id}`);
  }
  positive(metadata.caps?.max_ai_credits, 'max_ai_credits');
  if (metadata.caps.max_ai_credits < 30) throw new Error('Copilot CLI 1.0.98 requires a session cap of at least 30 AI credits.');
  positive(metadata.caps?.timeout_minutes, 'timeout_minutes');
  positive(metadata.repetitions ?? 1, 'repetitions', true);
  const sessions = match[2].trim().split(/<!--\s*session\s*-->/).map(body =>
    body.split(/<!--\s*turn\s*-->/).map(turn => turn.trim()));
  if (sessions.some(turns => turns.some(turn => !turn))) throw new Error('Empty session or turn.');
  if (metadata.phases && metadata.phases.length !== sessions.length) {
    throw new Error(`Phase count does not match sessions: ${metadata.id}`);
  }
  return { ...metadata, sessions, sourceHash: hash(text) };
}

export function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function relativeLinks(markdown, reportPath) {
  let fence = null;
  return markdown.split('\n').map(line => {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return line;
    }
    if (fence) return line;
    return line.replace(/(\[[^\]\n]+\])\(([^)\n]+)\)/g, (match, label, target) => {
      const destination = target.replace(/^<|>$/g, '');
      if (destination.startsWith('#')) return match;
      const fileUri = /^file:/i.test(destination);
      if (!fileUri && !isAbsolute(destination) && /^[a-z][a-z0-9+.-]*:/i.test(destination)) return match;
      const fragmentAt = destination.indexOf('#');
      const fragment = fragmentAt < 0 ? '' : destination.slice(fragmentAt);
      const pathname = fragmentAt < 0 ? destination : destination.slice(0, fragmentAt);
      const absolute = fileUri ? fileURLToPath(pathname)
        : resolve(reportPath, '..', decodeURIComponent(pathname));
      const path = relative(resolve(reportPath, '..'), absolute);
      if (isAbsolute(path)) throw new Error(`Cannot make report link relative across filesystem roots: ${destination}`);
      const encoded = path.replaceAll('\\', '/').split('/').map(part =>
        encodeURIComponent(part).replaceAll('(', '%28').replaceAll(')', '%29')).join('/');
      return `${label}(${encoded}${fragment})`;
    });
  }).join('\n');
}

export async function atomicJson(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await files.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  try {
    for (let attempt = 0; ; attempt++) {
      try { await files.rename(temporary, path); return; }
      catch (error) {
        if (!['EPERM', 'EBUSY', 'EACCES'].includes(error.code) || attempt >= 5) throw error;
        console.error(`Retrying JSON replacement after ${error.code}: ${path} (attempt ${attempt + 1}/5).`);
        await new Promise(resolve => setTimeout(resolve, 50 * 2 ** attempt));
      }
    }
  } catch (error) {
    await files.rm(temporary, { force: true });
    throw error;
  }
}

export async function fixtureFiles(root, fixture) {
  const path = inside(root, fixture);
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) throw new Error(`Fixture symlinks are not allowed: ${fixture}`);
  if (stat.isFile()) return [path];
  if (!stat.isDirectory()) throw new Error(`Unsupported fixture: ${fixture}`);
  const nested = await readdir(path);
  return (await Promise.all(nested.sort().map(name =>
    fixtureFiles(root, relative(root, join(path, name)))))).flat();
}

export function resolveConfig(prompt, config) {
  if (prompt.config?.surface !== 'copilot-cli') throw new Error('Only copilot-cli is supported.');
  return prompt.sessions.map((turns, index) => {
    const phase = { ...prompt.config, ...prompt.phases?.[index] };
    if (phase.subagent_mechanism && phase.subagent_mechanism !== 'subagents-or-fleet') {
      throw new Error(`Unsupported subagent mechanism: ${phase.subagent_mechanism}`);
    }
    const model = config.modelClasses[phase.model_class];
    if (!model) throw new Error(`No model mapping for ${phase.model_class}`);
    if (!Object.hasOwn(config.toolProfiles, phase.tools)) {
      throw new Error(`Unsupported tool profile: ${phase.tools}. Configure an explicit tool allowlist first.`);
    }
    const tools = config.toolProfiles[phase.tools];
    if (tools !== null && (!Array.isArray(tools) || tools.some(tool => typeof tool !== 'string' || !tool))) {
      throw new Error(`Invalid tool allowlist: ${phase.tools}`);
    }
    const subagentModel = phase.subagent_model_class ? config.modelClasses[phase.subagent_model_class] : null;
    if (phase.subagent_model_class && !subagentModel) throw new Error(`No worker model mapping for ${phase.subagent_model_class}`);
    if (model === 'hydrafusion' && config.enableHydrafusion !== true) {
      throw new Error('HydraFusion requires explicit enableHydrafusion: true configuration.');
    }
    return { model, effort: model === 'hydrafusion' ? undefined : phase.reasoning_effort, tools, turns, toolProfile: phase.tools,
      ...(model === 'hydrafusion' ? { experimentalHydrafusion: true, requestedEffort: phase.reasoning_effort,
        effortPolicy: 'HydraFusion-managed; not effort-matched', customInstructions: false } : {}),
      ...(subagentModel ? { subagentModel, subagentMechanism: phase.subagent_mechanism ? 'fleet' : 'native-subagents' } : {}) };
  });
}

export function validateCatalog(phases, models) {
  for (const phase of phases) {
    if (phase.experimentalHydrafusion === true) {
      if (phase.model !== 'hydrafusion' || phase.effort ||
          (phase.subagentModel && phase.subagentModel !== 'hydrafusion')) {
        throw new Error('Invalid experimental HydraFusion phase.');
      }
      continue;
    }
    const model = models.find(model => model.id === phase.model);
    if (!model || model.policy?.state === 'disabled') throw new Error(`Unavailable model: ${phase.model}`);
    if (phase.effort && !model.supportedReasoningEfforts?.includes(phase.effort)) {
      throw new Error(`Model ${phase.model} does not report support for effort ${phase.effort}`);
    }
    if (phase.subagentModel) {
      const worker = models.find(model => model.id === phase.subagentModel);
      if (!worker || worker.policy?.state === 'disabled') throw new Error(`Unavailable worker model: ${phase.subagentModel}`);
    }
  }
}

export function validateInstructionSources(context, sources) {
  if (!Array.isArray(sources)) throw new Error('Instruction discovery did not return an array.');
  for (const file of context.files) {
    if (!sources.some(source => source.sourcePath === file.destination && source.defaultDisabled === false)) {
      throw new Error(`Staged instruction not enabled in CLI discovery: ${file.destination}`);
    }
  }
}

export async function buildPlan(root, pattern, config) {
  if (!/^[a-z0-9-]+$/.test(pattern)) throw new Error('Invalid pattern name.');
  const variants = {};
  for (const variant of ['good', 'bad']) {
    const path = inside(root, join('prompts', pattern, `${variant}.prompt.md`));
    const prompt = parsePrompt(await readFile(path, 'utf8'), pattern, variant);
    const phases = resolveConfig(prompt, config);
    const fixtures = {};
    for (const fixture of prompt.fixtures) {
      for (const path of await fixtureFiles(root, fixture)) {
        fixtures[relative(root, path).replaceAll('\\', '/')] = hash(await readFile(path));
      }
    }
    const files = {};
    for (const match of prompt.sessions.flat().join('\n').matchAll(/\{\{file:([^}]+)\}\}/g)) {
      const name = match[1];
      if (!Object.hasOwn(fixtures, name)) throw new Error(`Undeclared fixture substitution: ${name}`);
      files[name] = await readFile(inside(root, name), 'utf8');
    }
    let batches;
    if (prompt.sessions.flat().some(turn => turn.includes('{{batch}}'))) {
      const name = `fixtures/${pattern}/tickets.jsonl`;
      if (!Object.hasOwn(fixtures, name)) throw new Error(`Missing batch fixture: ${name}`);
      batches = (await readFile(inside(root, name), 'utf8')).trim().split(/\r?\n/).map(JSON.parse);
      if (batches.length !== (prompt.repetitions ?? 1)) {
        throw new Error('Batch fixture must contain one JSON array of tickets per repetition.');
      }
      if (batches.some(batch => !Array.isArray(batch))) throw new Error('Each batch must be a JSON array.');
    }
    variants[variant] = {
      pattern, variant, acceptance: prompt.acceptance, caps: prompt.caps,
      repetitions: prompt.repetitions ?? 1, phases, files, batches,
      fixtures, sourceHash: prompt.sourceHash, runSafety: prompt.run_safety ?? null,
      expectations: {
        processing: prompt.expected_processing ?? null,
        result: prompt.expected_result ?? null,
        source: 'captured prompt frontmatter',
      },
    };
  }
  if (JSON.stringify(variants.good.acceptance) !== JSON.stringify(variants.bad.acceptance)) {
    throw new Error('Good/bad acceptance criteria must match.');
  }
  if (JSON.stringify(variants.good.fixtures) !== JSON.stringify(variants.bad.fixtures)) {
    throw new Error('Good/bad fixtures must match.');
  }
  if (!['plan-then-implement', 'orchestration'].includes(pattern)) {
    for (const key of ['caps', 'repetitions']) {
      if (JSON.stringify(variants.good[key]) !== JSON.stringify(variants.bad[key])) {
        throw new Error(`Prompt-only comparison changes ${key}.`);
      }
    }
    const settings = plan => plan.phases.map(({ turns, ...settings }) => settings);
    if (JSON.stringify(settings(variants.good)) !== JSON.stringify(settings(variants.bad))) {
      throw new Error('Prompt-only comparison changes model/effort/tool settings.');
    }
  }
  const plannedAiCredits = Object.values(variants).reduce((sum, plan) =>
    sum + plan.caps.max_ai_credits * plan.phases.length * plan.repetitions, 0) * config.trials;
  if (plannedAiCredits > config.maxPlannedAiCredits) {
    throw new Error(`Planned session caps total ${plannedAiCredits} AI credits; budget is ${config.maxPlannedAiCredits}.`);
  }
  return { pattern, plannedAiCredits, variants };
}

export function expandPrompt(text, { files, batch, previousOutput, now }) {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, marker) => {
    if (marker === 'now') return now;
    if (marker === 'previous_output') {
      if (previousOutput === undefined) throw new Error('No previous session output.');
      return previousOutput;
    }
    if (marker === 'batch') {
      if (batch === undefined) throw new Error('No batch input.');
      return JSON.stringify(batch.map(({ gold_label, goldLabel, label, ...ticket }) => ticket));
    }
    if (marker.startsWith('file:') && Object.hasOwn(files, marker.slice(5))) return files[marker.slice(5)];
    throw new Error(`Unknown prompt marker: ${marker}`);
  });
}

export function cliArgs(phase, caps, sessionId) {
  const args = ['--model', phase.model, '--session-id', sessionId,
    '--max-ai-credits', String(caps.max_ai_credits), '--no-ask-user',
    '--output-format', 'json', '--stream', 'on', '--disable-builtin-mcps', '--allow-all-tools', '--no-auto-update'];
  if (phase.experimentalHydrafusion) args.push('--experimental', '--context', 'default');
  if (phase.customInstructions === false) args.push('--no-custom-instructions');
  if (phase.subagentMechanism === 'fleet') args.push('--fleet');
  if (phase.toolProfile === 'mock-observability') {
    args.push('--additional-mcp-config', JSON.stringify({ mcpServers: {
      observability: { type: 'stdio', command: 'node', args: ['/opt/harness/mock-observability.mjs',
        '/workspace/fixtures/mock-observability', '/evidence/mock-observability.jsonl'], tools: ['*'] },
    } }));
  }
  if (phase.toolProfile === 'read-only+shell-test') {
    args.splice(args.indexOf('--allow-all-tools'), 1);
    args.push('--allow-tool', 'read', '--allow-tool', 'shell(node --test:*)', '--allow-tool', 'shell(npm test:*)',
      '--allow-tool', 'shell(cd:*)',
      '--deny-tool', 'write', '--deny-tool', 'shell(git:*)');
  }
  if (phase.effort) args.push('--reasoning-effort', phase.effort);
  if (phase.tools !== null) args.push('--available-tools', ...new Set([
    ...phase.tools, ...(phase.subagentModel ? ['task', 'read_agent', 'write_agent', 'list_agents'] : []),
  ]));
  return args;
}

export function summarizeEvents(events) {
  const usage = events.filter(event => event.type === 'assistant.usage');
  const sessions = new Set(events.map(event => event.harnessSessionId).filter(Boolean));
  const shutdowns = new Map();
  for (const event of events) {
    if (event.type === 'session.shutdown' && !event.agentId && event.harnessSessionId) {
      shutdowns.set(event.harnessSessionId, event.data);
    }
  }
  const completeSessions = sessions.size > 0 && shutdowns.size === sessions.size;
  const modelMetrics = [...shutdowns.values()].flatMap(data => Object.entries(data.modelMetrics ?? {}));
  const summarizedTokens = field => completeSessions && modelMetrics.length > 0 &&
    modelMetrics.every(([, metric]) => Number.isFinite(metric.usage?.[field]))
    ? modelMetrics.reduce((sum, [, metric]) => sum + metric.usage[field], 0) : null;
  const total = field => usage.length && usage.every(event => Number.isFinite(event.data?.[field]))
    ? usage.reduce((sum, event) => sum + event.data[field], 0) : null;
  const partialNanoAiu = usage.length && usage.every(event =>
    Number.isFinite(event.data?.copilotUsage?.totalNanoAiu))
    ? usage.reduce((sum, event) => sum + event.data.copilotUsage.totalNanoAiu, 0) : null;
  const costComplete = completeSessions &&
    [...shutdowns.values()].every(data => Number.isFinite(data.totalNanoAiu));
  const nanoAiu = costComplete
    ? [...shutdowns.values()].reduce((sum, data) => sum + data.totalNanoAiu, 0) : partialNanoAiu;
  return {
    reportedUsageCalls: usage.length || null,
    modelCalls: completeSessions && modelMetrics.length > 0 &&
      modelMetrics.every(([, metric]) => Number.isFinite(metric.requests?.count))
      ? modelMetrics.reduce((sum, [, metric]) => sum + metric.requests.count, 0) : usage.length || null,
    actualModels: [...new Set([...usage.map(event => event.data?.model), ...modelMetrics.map(([model]) => model)].filter(Boolean))],
    inputTokens: summarizedTokens('inputTokens') ?? total('inputTokens'),
    outputTokens: summarizedTokens('outputTokens') ?? total('outputTokens'),
    cacheReadTokens: summarizedTokens('cacheReadTokens') ?? total('cacheReadTokens'),
    cacheWriteTokens: summarizedTokens('cacheWriteTokens') ?? total('cacheWriteTokens'),
    nanoAiu, costUnit: 'nano-AIU', costComplete,
    usageSource: completeSessions ? 'latest session.shutdown per session' : 'assistant.usage; completeness unknown',
    toolCalls: events.filter(event => event.type === 'tool.execution_start').length,
    subagents: events.filter(event => event.type === 'subagent.started').length,
    note: 'Cumulative shutdown summaries are counted once per session, never added to per-call usage. Missing fields remain unknown; no dollar/credit conversion is assumed.',
  };
}

export function finalOutput(events) {
  const messages = events.filter(event => event.type === 'assistant.message' && !event.agentId &&
    !event.data?.parentToolCallId && event.data?.content && !event.data?.toolRequests?.length);
  return messages.at(-1)?.data.content ?? null;
}

export function grade(pattern, output, criteria) {
  const checks = criteria.map(criterion => ({ criterion, status: 'needs-review', evidence: null }));
  const set = (index, passed, evidence) => {
    if (checks[index]) checks[index] = { ...checks[index], status: passed ? 'pass' : 'fail', evidence };
  };
  if (pattern === 'one-shot') {
    const lines = output.trim().split(/\r?\n/);
    const bullets = lines.filter(line => /^[-*]\s+/.test(line));
    set(0, lines.length === 3 && bullets.length === 3, `${bullets.length} bullets, ${lines.length} lines`);
    set(1, bullets.length === 3 && bullets.every(line => line.replace(/^[-*]\s+/, '').trim().split(/\s+/).length <= 20), 'Whitespace-delimited word counts');
    set(2, output.includes('2.4') && output.includes('10,000 rows') &&
      /admin/i.test(output) && /disabl/i.test(output), 'Literal version/limit plus administrator/disable keyword check; semantic accuracy still needs review');
  }
  if (pattern === 'structured-extraction') {
    let value;
    try { value = JSON.parse(output); }
    catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      set(0, false, 'Output is not a bare JSON object.');
      return checks;
    }
    const keys = ['invoice_number', 'issue_date', 'vendor', 'po_number', 'currency', 'line_items', 'total'];
    const items = value?.line_items;
    const exactKeys = (object, expected) => object && typeof object === 'object' &&
      !Array.isArray(object) && JSON.stringify(Object.keys(object).sort()) === JSON.stringify([...expected].sort());
    set(0, exactKeys(value, keys) && value.issue_date === '2026-03-04' &&
      value.vendor === 'Northwind Supplies' && Array.isArray(items) &&
      items.every(item => exactKeys(item, ['description', 'quantity', 'unit_price']) &&
        typeof item.description === 'string' && typeof item.quantity === 'number' &&
        typeof item.unit_price === 'number'), 'Exact schema, source vendor/date, and item field types');
    set(1, value?.invoice_number === 'INV-20931' && value?.total === 1284.50, 'Source invoice number and total');
    set(2, value?.currency === 'USD', 'Source currency');
    set(3, value?.po_number === null, 'Absent PO remains null');
    set(4, Array.isArray(items) && items.length === 2 &&
      typeof items[0]?.description === 'string' && items[0].description.toLowerCase() === 'ergonomic chair' && items[0]?.quantity === 2 &&
      items[0]?.unit_price === 489 && typeof items[1]?.description === 'string' && items[1].description.toLowerCase() === 'standing desk frame' &&
      items[1]?.quantity === 1 && items[1]?.unit_price === 306.50, 'Source line item descriptions, quantities, and prices');
  }
  return checks;
}

export function accepted(result) {
  return result.status === 'completed' && result.acceptance.length > 0 &&
    result.acceptance.every(check => check.status === 'pass');
}

export function comparison(results) {
  return Object.fromEntries(['good', 'bad'].map(variant => {
    const runs = results.filter(result => result.variant === variant);
    const acceptedCount = runs.filter(accepted).length;
    const complete = runs.length > 0 && runs.every(result =>
      result.metrics?.costComplete === true && Number.isFinite(result.metrics?.nanoAiu));
    const total = complete ? runs.reduce((sum, run) => sum + run.metrics.nanoAiu, 0) : null;
    return [variant, { attempts: runs.length, accepted: acceptedCount,
      needsReview: runs.filter(run => run.acceptance.some(check => check.status === 'needs-review')).length,
      totalNanoAiu: total, costComplete: complete,
      nanoAiuPerAcceptedCompletion: total !== null && acceptedCount ? total / acceptedCount : null,
      elapsedMs: runs.reduce((sum, run) => sum + (run.elapsedMs ?? 0), 0) }];
  }));
}
