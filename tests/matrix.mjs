import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { accepted, atomicJson as json, buildPlan, fixtureFiles, hash, inside, parsePrompt, positive, relativeLinks, validateCatalog } from './harness-lib.mjs';
import { isInterrupted, loadConfig, preflight, run } from './harness.mjs';
import { reserveDirectory, resultLocation } from './result-paths.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = dirname(directory);
const resultsRoot = join(directory, 'results');
const matricesRoot = join(resultsRoot, 'matrices');
const contextVariants = ['none', 'good', 'bad'];
const driverFiles = ['matrix.mjs', 'harness.mjs', 'harness-lib.mjs', 'worker.mjs', 'report.mjs',
  'mock-observability.mjs', 'result-paths.mjs', 'Dockerfile', 'package.json', 'package-lock.json'];

async function optionalJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
}

async function driverHashes() {
  return Object.fromEntries(await Promise.all(driverFiles.map(async name =>
    [name, hash(await readFile(join(directory, name)))])));
}

export function commonCatalog(good, bad) {
  return good.filter(model => model.policy?.state !== 'disabled' &&
    bad.some(other => other.id === model.id && other.policy?.state !== 'disabled'))
    .map(model => {
      const other = bad.find(other => other.id === model.id);
      const efforts = model.supportedReasoningEfforts?.filter(effort => other.supportedReasoningEfforts?.includes(effort));
      return { ...model, supportedReasoningEfforts: efforts?.length ? efforts : undefined };
    }).sort((a, b) => a.id.localeCompare(b.id));
}

export async function instructionContext(repository, variant) {
  if (!contextVariants.includes(variant)) throw new Error(`Invalid instruction context: ${variant}`);
  const files = [];
  if (variant !== 'none') {
    const bundle = join('agent-assets', 'instructions', variant);
    for (const path of await fixtureFiles(repository, bundle)) {
      const content = await readFile(path, 'utf8');
      const destination = `.github/${relative(inside(repository, bundle), path).replaceAll('\\', '/')}`;
      files.push({ source: relative(repository, path).replaceAll('\\', '/'), destination,
        content, sha256: hash(content), bytes: Buffer.byteLength(content) });
    }
  }
  return { variant, files, bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    scope: 'Repository instructions only; no skills, agents, prompt-file activation, or progressive-disclosure claim.' };
}

export function adaptModel(plan, model, context) {
  const copy = structuredClone(plan);
  for (const variant of Object.values(copy.variants)) {
    variant.context = context;
    for (const phase of variant.phases) {
      phase.model = model.id;
      if (phase.subagentModel) phase.subagentModel = model.id;
      phase.requestedEffort = phase.requestedEffort ?? phase.effort ?? null;
      if (model.experimentalHydrafusion === true) {
        if (model.id !== 'hydrafusion') throw new Error('Invalid synthetic HydraFusion model.');
        phase.experimentalHydrafusion = true;
      }
      // Auto and models without effort metadata use the provider default, not an invented effort.
      if (!model.supportedReasoningEfforts?.length) delete phase.effort;
      phase.effortPolicy = phase.experimentalHydrafusion ? 'HydraFusion-managed; not effort-matched'
        : phase.effort ? 'explicit' : 'provider default; not effort-matched';
      phase.customInstructions = context.variant !== 'none';
    }
    validateCatalog(variant.phases, [model]);
  }
  return copy;
}

export async function planMatrix(repository, config, models, {
  trials = 5, contexts = contextVariants, patterns, seed = randomUUID(), id = 'matrix',
} = {}) {
  positive(trials, 'trials', true);
  if (!models.length || new Set(models.map(model => model.id)).size !== models.length) {
    throw new Error('Select at least one unique available model.');
  }
  if (!contexts.length || new Set(contexts).size !== contexts.length) throw new Error('Select unique contexts.');
  const bundles = await Promise.all(contexts.map(variant => instructionContext(repository, variant)));
  const names = patterns ?? (await readdir(join(repository, 'prompts'), { withFileTypes: true }))
    .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  if (!names.length || new Set(names).size !== names.length) throw new Error('Select unique prompt patterns.');
  const cells = [];
  const coverage = [];
  for (const pattern of names) {
    const source = await readFile(inside(repository, join('prompts', pattern, 'good.prompt.md')), 'utf8');
    const metadata = parsePrompt(source, pattern, 'good');
    const workload = metadata.workload;
    let base;
    let blocked;
    try {
      base = await buildPlan(repository, pattern, { ...config, trials: 1, maxPlannedAiCredits: Number.MAX_SAFE_INTEGER });
    } catch (error) {
      if (error.code !== 'ENOENT' && !/dedicated runner|Unsupported tool profile/.test(error.message)) throw error;
      blocked = error.message;
    }
    coverage.push({ pattern, workload, state: blocked ? 'blocked' : 'ready', reason: blocked ?? null });
    for (const model of models) {
      for (const context of bundles) {
        const cell = { id: `cell-${cells.length + 1}`, pattern, workload,
          model: model.id, context: context.variant, contextBytes: context.bytes };
        if (blocked) Object.assign(cell, { state: 'blocked', reason: blocked });
        else {
          try {
            const plan = adaptModel(base, model, context);
            Object.assign(cell, { state: 'ready', plan, pairAiCredits: plan.plannedAiCredits });
          } catch (error) {
            if (!/does not report support for effort/.test(error.message)) throw error;
            Object.assign(cell, { state: 'blocked', reason: error.message });
          }
        }
        cells.push(cell);
      }
    }
  }
  const ready = cells.filter(cell => cell.state === 'ready');
  const jobs = [];
  for (let trial = 1; trial <= trials; trial++) {
    const order = ready.toSorted((a, b) =>
      hash(`${seed}:${trial}:${a.id}`).localeCompare(hash(`${seed}:${trial}:${b.id}`)));
    for (const cell of order) {
      const jobId = `${cell.id}-trial-${trial}`;
      const folder = `cell-${String(Number(cell.id.slice(5))).padStart(4, '0')}-trial-${String(trial).padStart(4, '0')}`;
      jobs.push({ id: jobId, cellId: cell.id, trial, state: 'pending',
        runId: `matrices/${id}/runs/${cell.pattern}/${folder}`,
        pairAiCredits: cell.pairAiCredits });
    }
    if (models.some(model => model.experimentalHydrafusion)) {
      const validation = job => job.trial === 1 && cells.find(cell => cell.id === job.cellId)
        .plan.variants.good.phases.some(phase => phase.subagentModel);
      jobs.sort((a, b) => Number(validation(b)) - Number(validation(a)));
      for (const job of jobs.filter(validation)) job.validatesNestedHydrafusion = true;
    }
  }
  const plannedAiCredits = jobs.reduce((sum, job) => sum + job.pairAiCredits, 0);
  const attempts = ready.reduce((sum, cell) => sum + 2 * cell.plan.variants.good.repetitions, 0) * trials;
  const sessions = ready.reduce((sum, cell) => sum + Object.values(cell.plan.variants).reduce((n, variant) =>
    n + variant.phases.length * variant.repetitions, 0), 0) * trials;
  return { version: 1, id, createdAt: new Date().toISOString(), seed, trials, config, models, contexts,
    coverage, cells, jobs, plannedAiCredits, attempts, sessions,
    ensemble: models.filter(model => /hydra|ensemble/i.test(model.id)).map(model => model.id),
    methodology: 'Prompt good/bad paired within each model x instruction-context x pattern cell; five trial rounds in seeded shuffled cell order. Pair order alternates across trial and cell. Provider cache is uncontrolled. No custom ensemble.' };
}

export function summarizeGroup(results, expectedAttempts) {
  const known = field => results.length && results.every(result => Number.isFinite(result.metrics?.[field]))
    ? results.reduce((sum, result) => sum + result.metrics[field], 0) : null;
  const complete = results.length > 0 && results.every(result => result.metrics?.costComplete === true);
  const total = complete ? known('nanoAiu') : null;
  const acceptedCount = results.filter(accepted).length;
  return { expectedAttempts, attempts: results.length, accepted: acceptedCount,
    failed: results.filter(result => result.status !== 'completed').length,
    rejected: results.filter(result => result.status === 'completed' &&
      result.acceptance.some(check => check.status === 'fail')).length,
    needsReview: results.filter(result => result.status === 'completed' &&
      !result.acceptance.some(check => check.status === 'fail') &&
      result.acceptance.some(check => check.status === 'needs-review')).length,
    actualModels: [...new Set(results.flatMap(result => result.metrics?.actualModels ?? []))],
    totalAiu: total === null ? null : total / 1e9,
    aiuPerAccepted: total !== null && acceptedCount ? total / 1e9 / acceptedCount : null,
    inputTokens: known('inputTokens'), outputTokens: known('outputTokens'), cacheReadTokens: known('cacheReadTokens'),
    meanElapsedMs: results.length && results.every(result => Number.isFinite(result.elapsedMs))
      ? results.reduce((sum, result) => sum + result.elapsedMs, 0) / results.length : null,
    complete: results.length === expectedAttempts && total !== null };
}

export function matchedContrasts(rows) {
  const contrasts = [];
  const add = (factor, baseline, treatment) => {
    const ready = baseline.complete && treatment.complete &&
      baseline.needsReview === 0 && treatment.needsReview === 0 &&
      baseline.failed === 0 && treatment.failed === 0;
    const delta = (before, after) => ready && before !== null && after !== null ? after - before : null;
    contrasts.push({ factor, model: treatment.model, pattern: treatment.pattern,
      heldConstant: factor === 'prompt' ? treatment.context : factor === 'instructions' ? treatment.variant
        : `${treatment.context}/${treatment.variant}`,
      baseline: factor === 'prompt' ? baseline.variant : factor === 'instructions' ? baseline.context : baseline.model,
      treatment: factor === 'prompt' ? treatment.variant : factor === 'instructions' ? treatment.context : treatment.model,
      ready,
      acceptancePercentagePoints: ready ? 100 *
        (treatment.accepted / treatment.attempts - baseline.accepted / baseline.attempts) : null,
      totalAiuDelta: delta(baseline.totalAiu, treatment.totalAiu),
      aiuPerAcceptedDelta: delta(baseline.aiuPerAccepted, treatment.aiuPerAccepted),
      inputTokensDelta: delta(baseline.inputTokens, treatment.inputTokens),
      cacheReadTokensDelta: delta(baseline.cacheReadTokens, treatment.cacheReadTokens),
    });
  };
  const modelBaseline = rows.find(row => row.model === 'gpt-5-mini')?.model ?? rows[0]?.model;
  for (const row of rows) {
    if (row.variant === 'good') {
      const baseline = rows.find(other => other.cellId === row.cellId && other.variant === 'bad');
      if (baseline) add('prompt', baseline, row);
    }
    if (row.context !== 'none') {
      const baseline = rows.find(other => other.model === row.model && other.pattern === row.pattern &&
        other.variant === row.variant && other.context === 'none');
      if (baseline) add('instructions', baseline, row);
    }
    if (row.model !== modelBaseline) {
      const baseline = rows.find(other => other.model === modelBaseline && other.pattern === row.pattern &&
        other.variant === row.variant && other.context === row.context);
      if (baseline) add('model', baseline, row);
    }
  }
  return contrasts;
}

const text = value => String(value ?? 'unknown').replaceAll('|', '\\|').replaceAll('\n', ' ');
const number = value => value === null ? 'unknown' : Number(value.toFixed(5)).toLocaleString('en-US');

export function modelFamily(id) {
  if (id === 'auto') return 'Auto routing';
  if (id.startsWith('gpt-')) return 'GPT';
  if (id.startsWith('claude-')) return 'Claude';
  if (id.startsWith('grok-')) return 'Grok';
  if (id.startsWith('kimi-')) return 'Kimi';
  if (id.startsWith('mai-')) return 'MAI';
  return 'Other';
}

const sourceLink = (label, path) =>
  `[${text(label)}](${path.replaceAll('\\', '/').split('/').map(encodeURIComponent).join('/')})`;

export function renderMatrix(plan, summaries) {
  const ready = plan.cells.filter(cell => cell.state === 'ready').length;
  const observed = summaries.filter(row => row.attempts > 0);
  const impacts = matchedContrasts(summaries);
  const incompatibilities = new Map();
  for (const cell of plan.cells.filter(cell => cell.state === 'blocked')) {
    const key = `${cell.model}:${cell.reason}`;
    const group = incompatibilities.get(key) ?? { model: cell.model, reason: cell.reason, count: 0 };
    group.count++;
    incompatibilities.set(key, group);
  }
  const insights = [];
  for (const pattern of [...new Set(observed.map(row => row.pattern))]) {
    const rows = observed.filter(row => row.pattern === pattern);
    const counts = variant => {
      const selected = rows.filter(row => row.variant === variant);
      return `${selected.reduce((sum, row) => sum + row.accepted, 0)}/${selected.reduce((sum, row) => sum + row.attempts, 0)}`;
    };
    insights.push(`- **${pattern}:** good prompts ${counts('good')} accepted; bad prompts ${counts('bad')} accepted across observed models/contexts. Descriptive counts, not an isolated instruction or model effect.`);
  }
  const routed = [...new Set(observed.filter(row => row.model === 'auto').flatMap(row => row.actualModels))];
  if (routed.length) insights.push(`- **Observed Auto routing:** ${routed.map(text).join(', ')}. This does not guarantee the same route on future requests.`);
  const caches = observed.map(row => row.cacheReadTokens).filter(Number.isFinite);
  if (caches.length && Math.min(...caches) !== Math.max(...caches)) {
    insights.push(`- **Cache imbalance:** observed group cache-read totals range from ${Math.min(...caches)} to ${Math.max(...caches)} tokens. Do not attribute cost differences solely to prompts, instructions, or models.`);
  }
  const lines = [
    `# Model/context matrix: ${plan.displayId ?? plan.id}`, '',
    ...(plan.displayId && plan.displayId !== plan.id ? [`Original matrix ID: ${plan.id}`, ''] : []),
    `Created (UTC): ${text(plan.createdAt)}`, '',
    ...(plan.coverageUpdate ? [
      plan.jobs.every(job => job.state === 'pending')
        ? '**Historical planning snapshot, not an executed experiment.** Its frozen prerequisites have been superseded.'
        : '**Historical experiment snapshot.** Its frozen prerequisite assessment has been superseded; original run results remain below.',
      `Current prerequisite coverage: **${plan.coverageUpdate.coverage.filter(item => item.state === 'ready').length}/${plan.coverageUpdate.coverage.length} patterns ready**. ${sourceLink('Open the replacement plan and current coverage', `../${plan.coverageUpdate.id}/report.md`)}.`,
      ...(Number.isInteger(plan.coverageUpdate.readyCells) ? [
        `Replacement plan cells: **${plan.coverageUpdate.readyCells} ready**, **${plan.coverageUpdate.blockedCells} excluded by model/effort compatibility or other recorded constraints**. See the replacement report for exact reasons.`,
      ] : []),
      'The original plan, run state, and cost reservations below are preserved for provenance; refreshing coverage performs no inference.', '',
    ] : []),
    '## What did we test?', '',
    ...(plan.controllerUpdates ? [
      `**Controller provenance:** ${plan.controllerUpdates} recorded host-controller update(s). ${sourceLink('Inspect the migration ledger', 'controller-updates.json')}. The original execution image and inputs are pinned; controller versions are not identical across the entire experiment.`, '',
    ] : []),
    ...(plan.controllerError ? [
      `**Controller stopped:** ${text(plan.controllerError.message)} ${sourceLink('Controller diagnostics', 'controller-error.json')}. Completed attempt evidence is preserved; pending work is not a model-quality failure.`, '',
    ] : []),
    `${plan.models.length} catalog models (including Auto if available) x ${plan.contexts.join('/')} repository-instruction contexts x ${plan.coverage.length} prompt patterns x good/bad prompts x ${plan.trials} trial rounds.`,
    `${plan.coverageUpdate ? 'Original frozen plan (not current coverage): ' : ''}Ready cells: **${ready}**; blocked cells: **${plan.cells.length - ready}**. Planned attempts: **${plan.attempts}**; sessions: **${plan.sessions}**; summed session soft caps: **${plan.plannedAiCredits.toLocaleString('en-US')} AI credits**.`,
    `Hydra/ensemble: ${plan.ensemble.length ? plan.ensemble.join(', ') : 'not present in the selected authenticated catalog; not tested'}.`, '',
    '### Selected model families', '',
    'One selected model is not evidence about every member of its family. Auto is a routing treatment, not a model family.',
    '', '| Family | Selected model |', '|---|---|',
    ...plan.models.map(model => `| ${modelFamily(model.id)} | ${text(model.id)} |`),
    '', '### Source files', '',
    'Saved report links are relative to this Markdown file and remain portable with the checkout. Missing fixture paths in historical diagnostics are code, not links.',
    '',
    `${sourceLink('Harness methodology', '../../../README.md')} | ${sourceLink('Prompt methodology', '../../../../prompts/README.md')} | ${sourceLink('Instruction asset guide', '../../../../agent-assets/README.md')}`,
    '',
    ...[...new Map(plan.cells.filter(cell => cell.plan).flatMap(cell =>
      cell.plan.variants.good.context?.files ?? []).map(file => [file.source, file])).values()]
      .map(file => `- ${sourceLink(file.source, `../../../../${file.source}`)} (SHA-256: \`${file.sha256}\`)`),
    '',
    '## What did we expect?', '',
    'Test whether concise prompts and scoped repository instructions improve acceptance and total cost per accepted completion. Compare prompt variants only within the same model/context/pattern; compare instruction contexts holding model/prompt/pattern constant. Per-pattern hypotheses and rubrics are preserved in each linked paired report.',
    'The instruction factor changes the complete good/bad repository-instruction bundle, not only its length. Context bytes measure files staged, not tokens proven loaded. Discovery evidence is saved per attempt; it does not prove every scoped instruction was attached.',
    'This does not activate skill/agent/prompt-file/progressive-disclosure assets. Auto is a routing treatment: record actual models and do not interpret it as a fixed model. Models without effort metadata use provider defaults, not effort-matched settings.', '',
    ...(plan.models.some(model => model.experimentalHydrafusion) ? [
      'HydraFusion is an explicit rollout-enabled synthetic orchestration treatment, not a catalog model. Leads and configured workers request HydraFusion; this is homogeneous orchestration, not light/strong tier routing. Trial-one worker treatments run first as validation gates; missing or mismatched nested evidence stops further dispatch. Requested prompt effort is not matched. Original prompts remain unchanged.',
    ] : []), '',
    '## Coverage (blocked is not a model failure)', '',
    '| Pattern sources | Workload | Frozen plan | Current prerequisites | Frozen diagnostic |', '|---|---|---|---|---|',
    ...plan.coverage.map(item => `| ${text(item.pattern)}: ${['good', 'bad'].map(variant =>
      sourceLink(variant, `../../../../prompts/${item.pattern}/${variant}.prompt.md`)).join(' / ')} | ${text(item.workload)} | ${item.state} | ${plan.coverageUpdate?.coverage.find(current => current.pattern === item.pattern)?.state ?? item.state} | ${item.reason ? `\`${text(item.reason).replaceAll('`', "'")}\`` : '-'} |`),
    '', '### Cell compatibility and exclusions', '',
    'Ready pattern prerequisites do not imply every model supports every requested effort. Unsupported settings are excluded explicitly, never silently substituted or counted as failed answers.',
    '', '| Model | Excluded cells | Exact reason |', '|---|---|---|',
    ...[...incompatibilities.values()].map(group => `| ${text(group.model)} | ${group.count} | ${text(group.reason)} |`),
    ...(incompatibilities.size ? [] : ['No cell compatibility exclusions.']),
    '', '## What happened?', '',
    `${plan.jobs.filter(job => job.state === 'completed').length}/${plan.jobs.length} paired jobs completed; ${plan.jobs.filter(job => job.state === 'failed').length} execution failures; ${plan.jobs.filter(job => job.state === 'running').length} in flight/uncertain. Pending jobs are not quality failures.`,
    'AIU are usage units, not AI credits or dollars. Unknown cost stays unknown, including missing attempt evidence. Failed-attempt spend is included when known. Zero accepted completions has no cost-per-accepted value.',
    '', '| Model | Pattern / workload | Instructions (bytes) | Prompt | Attempts / planned | Accepted / rejected / review / failed | Total AIU | AIU / accepted | Input / output / cache-read tokens | Mean seconds | Actual models |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...summaries.map(row => `| ${text(row.model)} | ${text(row.pattern)} / ${text(row.workload)} | ${row.context} (${row.contextBytes}) | ${row.variant} | ${row.attempts} / ${row.expectedAttempts} | ${row.accepted} / ${row.rejected} / ${row.needsReview} / ${row.failed} | ${number(row.totalAiu)} | ${number(row.aiuPerAccepted)} | ${text(row.inputTokens)} / ${text(row.outputTokens)} / ${text(row.cacheReadTokens)} | ${number(row.meanElapsedMs === null ? null : row.meanElapsedMs / 1000)} | ${text(row.actualModels.join(', ') || 'unobserved')} |`),
    '', '## Insights and interpretation', '',
    ...insights, '',
    '- Compare like-for-like rows before pooling workloads; no overall winner is inferred from heterogeneous tasks or unresolved reviews.',
    `- ${plan.trials} trial(s) per cell are exploratory, not statistical proof${plan.trials === 1 ? '; this is a smoke test only' : ''}. Provider cache reuse and temporal routing can confound cost differences; cell order is shuffled reproducibly per trial round, not cache-controlled.`,
    '- Acceptance is the unchanged task rubric, not successful CLI exit. One-shot still requires semantic review; structured extraction has a complete deterministic grader.',
    '- Inspect cost per accepted completion, rejection/review rates, token/cache differences, latency, and actual routed models together. Repair retries are not measured.',
    '- Missing fixtures/tool profiles/subagent runners are coverage gaps, never evidence that a model performed poorly.',
    '', '### Matched factor impacts (treatment minus baseline)', '',
    'Only fully observed, execution-successful groups with resolved rubrics produce deltas. A negative AIU/accepted delta favors the treatment economically; unknown is not zero. These exploratory deltas do not establish causality under uncontrolled caching.',
    'Model deltas use gpt-5-mini as the baseline when selected, otherwise the first selected model. Auto/provider-default effort comparisons are not effort-matched.',
    '', '| Factor | Model / pattern | Held constant | Baseline -> treatment | Acceptance pp | Total AIU delta | AIU/accepted delta | Input token delta | Cache-read token delta |',
    '|---|---|---|---|---|---|---|---|---|',
    ...impacts.filter(row => row.ready).map(row =>
      `| ${row.factor} | ${text(row.model)} / ${text(row.pattern)} | ${row.heldConstant} | ${row.baseline} -> ${row.treatment} | ${number(row.acceptancePercentagePoints)} | ${number(row.totalAiuDelta)} | ${number(row.aiuPerAcceptedDelta)} | ${text(row.inputTokensDelta)} | ${text(row.cacheReadTokensDelta)} |`),
    ...(impacts.some(row => row.ready) ? [] : ['No fully evaluated matched groups yet.']),
    '', '## Paired reports and evidence', '',
    ...plan.jobs.filter(job => job.state !== 'pending').map(job =>
      `- ${job.id}: ${job.state} - ${job.evidenceAvailable ? `[paired report](${job.reportDirectory ?? `../../${job.runId}`}/report.md), [run status](${job.reportDirectory ?? `../../${job.runId}`}/status.json)` : 'paired report not yet available'}${job.error ? ` - ${text(job.error)}` : ''}`),
    '', 'Machine-readable factor rows: [summary.json](summary.json). Matched deltas: [contrasts.json](contrasts.json). Frozen plan, context contents/hashes, schedule, catalog and configuration: [plan.json](plan.json). Checkpoint: [state.json](state.json).', '',
  ];
  return lines.join('\n');
}

export async function matrixReport(path, plan) {
  plan.displayId = basename(path);
  plan.controllerError = await optionalJson(join(path, 'controller-error.json'));
  const controllerUpdates = await optionalJson(join(path, 'controller-updates.json'));
  plan.controllerUpdates = controllerUpdates?.length ?? 0;
  const update = await optionalJson(join(path, 'coverage-update.json'));
  if (update) {
    if (!/^matrix-[a-zA-Z0-9_.-]+$/.test(update.id)) throw new Error('Invalid replacement coverage plan ID.');
    const replacementPath = await resultLocation(resultsRoot, `matrices/${update.id}`);
    const replacement = JSON.parse(await readFile(join(replacementPath, 'plan.json'), 'utf8'));
    plan.coverageUpdate = { id: relative(dirname(path), replacementPath).replaceAll('\\', '/'), coverage: replacement.coverage,
      readyCells: replacement.cells.filter(cell => cell.state === 'ready').length,
      blockedCells: replacement.cells.filter(cell => cell.state === 'blocked').length };
  }
  const summaries = [];
  for (const cell of plan.cells.filter(cell => cell.state === 'ready')) {
    const results = [];
    for (const job of plan.jobs.filter(job => job.cellId === cell.id && job.state !== 'pending')) {
      const runPath = await resultLocation(resultsRoot, job.runId);
      job.reportDirectory = relative(path, runPath).replaceAll('\\', '/');
      const comparison = await optionalJson(join(runPath, 'comparison.json'));
      job.evidenceAvailable = Boolean(comparison);
      const actual = comparison?.results ?? [];
      for (const variant of ['good', 'bad']) {
        for (let repetition = 1; repetition <= cell.plan.variants[variant].repetitions; repetition++) {
          results.push(actual.find(result => result.variant === variant && result.repetition === repetition) ??
            { variant, status: 'missing-evidence', acceptance: [], metrics: null });
        }
      }
    }
    for (const variant of ['good', 'bad']) {
      summaries.push({ cellId: cell.id, model: cell.model, pattern: cell.pattern, workload: cell.workload,
        context: cell.context, contextBytes: cell.contextBytes, variant,
        ...summarizeGroup(results.filter(result => result.variant === variant),
          plan.trials * cell.plan.variants[variant].repetitions) });
    }
  }
  await json(join(path, 'summary.json'), summaries);
  await json(join(path, 'contrasts.json'), matchedContrasts(summaries));
  const reportPath = join(path, 'report.md');
  await writeFile(reportPath, relativeLinks(renderMatrix(plan, summaries), reportPath));
  return summaries;
}

export function assertRunnable(plan, budget, allowPartial) {
  positive(budget, 'budget');
  if (budget < plan.plannedAiCredits) throw new Error(`Matrix reserves ${plan.plannedAiCredits} AI credits; approved budget is ${budget}.`);
  if (!plan.jobs.length) throw new Error('No runnable jobs.');
  if (!allowPartial && plan.cells.some(cell => cell.state === 'blocked')) {
    throw new Error('Matrix has blocked coverage. Resolve prerequisites or explicitly pass --allow-partial.');
  }
  if (plan.jobs.some(job => job.state === 'running')) {
    throw new Error('Uncertain/in-flight job: inspect its paired run and containers before resuming. It will not be retried automatically.');
  }
}

export function applyCheckpoint(plan, state) {
  const keys = ['id', 'runId', 'cellId', 'trial', 'pairAiCredits'];
  if (!Array.isArray(state) || state.length !== plan.jobs.length || state.some((job, i) =>
    !job || keys.some(key => job[key] !== plan.jobs[i][key]) ||
    !['pending', 'running', 'completed', 'failed'].includes(job.state))) {
    throw new Error('Checkpoint does not match frozen plan.');
  }
  plan.jobs = state;
}

async function executeMatrix(path, plan, opts) {
  assertRunnable(plan, Number(opts.budget), opts['allow-partial']);
  const currentHashes = await driverHashes();
  const changedController = JSON.stringify(currentHashes) !== JSON.stringify(plan.driverHashes);
  if (changedController && !opts['accept-controller-update']) {
    throw new Error('Harness changed since planning. Replan, or explicitly accept a recorded host-controller update while retaining the frozen image and inputs.');
  }
  const lockPath = join(path, 'runner.lock');
  const lock = await open(lockPath, 'wx');
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    if (changedController) {
      const migrations = await optionalJson(join(path, 'controller-updates.json')) ?? [];
      migrations.push({ recordedAt: new Date().toISOString(), originalHashes: plan.driverHashes,
        currentHashes, pinnedImageId: plan.imageId, remainingJobs: plan.jobs.filter(job => job.state === 'pending').map(job => job.id),
        note: 'Explicit host-controller migration. Original container image, prompts, configuration, and completed evidence retained; not a homogeneous controller-version claim.' });
      await json(join(path, 'controller-updates.json'), migrations);
      console.error('Recording host-controller update; frozen execution image and inputs are unchanged.');
    }
    const checks = await preflight({ ...plan.config, image: plan.imageId });
    if (checks.imageId !== plan.imageId) throw new Error('Image changed since planning; create a new plan.');
    const models = commonCatalog(checks.variants.good.inventory.models, checks.variants.bad.inventory.models);
    for (const cell of plan.cells.filter(cell => cell.state === 'ready')) {
      for (const variant of Object.values(cell.plan.variants)) validateCatalog(variant.phases, models);
    }
    for (const job of plan.jobs) {
      if (isInterrupted()) throw new Error('Matrix interrupted.');
      if (job.state !== 'pending') continue;
      const cell = plan.cells.find(cell => cell.id === job.cellId);
      job.state = 'running';
      job.startedAt = new Date().toISOString();
      await json(join(path, 'state.json'), plan.jobs);
      console.log(`Matrix ${plan.id}: ${job.id}; ${cell.model}; ${cell.context}; ${cell.pattern}`);
      let result;
      try {
        result = await run({ ...plan.config, trials: 1, maxPlannedAiCredits: job.pairAiCredits,
          image: plan.imageId, orderOffset: job.trial + Number(cell.id.split('-')[1]) }, {
          plan: cell.plan, runId: job.runId, preflightChecked: true,
          matrix: { id: plan.id, cellId: cell.id, trial: job.trial, context: cell.context },
        });
      } catch (error) {
        job.error = error.message;
        await json(join(path, 'state.json'), plan.jobs);
        throw error;
      }
      job.state = result.failed ? 'failed' : 'completed';
      job.finishedAt = new Date().toISOString();
      await json(join(path, 'state.json'), plan.jobs);
      await matrixReport(path, plan);
      if (job.validatesNestedHydrafusion) {
        const comparison = await optionalJson(join(result.runPath, 'comparison.json'));
        const attempts = comparison?.results ?? [];
        const validation = { jobId: job.id, checkedAt: new Date().toISOString(), passed:
          !result.failed && attempts.length === 2 && attempts.every(attempt =>
            attempt.nestedHydrafusion?.verified === true) };
        await json(join(result.runPath, 'nested-validation.json'), validation);
        if (!validation.passed) throw new Error(`Nested HydraFusion validation failed for ${job.id}; remaining jobs were not dispatched. Inspect nested-validation.json and worker evidence.`);
      }
    }
  } catch (error) {
    await json(join(path, 'controller-error.json'), {
      at: new Date().toISOString(), message: error.message, stack: error.stack,
    });
    throw error;
  } finally {
    await lock.close();
    await unlink(lockPath);
    await matrixReport(path, plan);
  }
}

function options(args) {
  const opts = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index].replace(/^--/, '');
    if (['--allow-partial', '--accept-controller-update'].includes(args[index])) opts[key] = true;
    else if (['config', 'models', 'contexts', 'patterns', 'trials', 'seed', 'matrix', 'budget'].includes(key) &&
      args[index].startsWith('--') && args[index + 1] && !args[index + 1].startsWith('--')) opts[key] = args[++index];
    else throw new Error(`Invalid argument: ${args[index]}`);
  }
  return opts;
}

async function main() {
  const [action = 'help', ...args] = process.argv.slice(2);
  const opts = options(args);
  if (action === 'help') {
    console.log('Matrix: plan [--models id,id] [--patterns name,name] [--contexts none,good,bad] [--trials 5] [--seed TEXT] [--config PATH] | refresh --matrix ID | run --matrix ID --budget N [--allow-partial] | monitor --matrix ID | report --matrix ID');
    return;
  }
  if (action === 'plan' || action === 'refresh') {
    let previous;
    let previousPath;
    if (action === 'refresh') {
      if (!opts.matrix || !/^matrix-[a-zA-Z0-9_.-]+$/.test(opts.matrix)) throw new Error('Provide a matrix ID.');
      previousPath = await resultLocation(resultsRoot, `matrices/${opts.matrix}`);
      previous = JSON.parse(await readFile(join(previousPath, 'plan.json'), 'utf8'));
      opts.models ??= previous.models.map(model => model.id).join(',');
      opts.patterns ??= previous.coverage.map(item => item.pattern).join(',');
      opts.contexts ??= previous.contexts.join(',');
      opts.trials ??= String(previous.trials);
      opts.seed ??= previous.seed;
    }
    const config = await loadConfig(opts);
    const checks = await preflight(config);
    const catalog = commonCatalog(checks.variants.good.inventory.models, checks.variants.bad.inventory.models);
    const requested = opts.models?.split(',');
    if (requested?.includes('hydrafusion')) {
      if (config.enableHydrafusion !== true) throw new Error('HydraFusion planning requires enableHydrafusion: true.');
      catalog.push({ id: 'hydrafusion', name: 'Ensemble / HydraFusion', experimentalHydrafusion: true });
    }
    if (requested?.some(id => !catalog.some(model => model.id === id))) throw new Error('Requested model not available in both catalogs.');
    const models = requested ? requested.map(id => catalog.find(model => model.id === id)) : catalog;
    const { id, path } = await reserveDirectory(matricesRoot, 'matrix');
    const plan = await planMatrix(root, config, models, { id, trials: Number(opts.trials ?? 5),
      patterns: opts.patterns?.split(','), contexts: opts.contexts?.split(','), seed: opts.seed ?? randomUUID() });
    plan.imageId = checks.imageId;
    plan.pinnedImage = checks.pinnedImage;
    plan.catalogs = checks.variants;
    plan.driverHashes = await driverHashes();
    await mkdir(path, { recursive: true });
    await json(join(path, 'plan.json'), plan);
    await json(join(path, 'state.json'), plan.jobs);
    await matrixReport(path, plan);
    if (previous) {
      await json(join(previousPath, 'coverage-update.json'), { id, createdAt: new Date().toISOString() });
      applyCheckpoint(previous, JSON.parse(await readFile(join(previousPath, 'state.json'), 'utf8')));
      await matrixReport(previousPath, previous);
    }
    console.log(`Matrix: ${id}\nReport: ${join(path, 'report.md')}\n${plan.attempts} attempts; ${plan.sessions} sessions; ${plan.plannedAiCredits} AI credits in summed soft caps. No inference performed.`);
    return;
  }
  if (!['run', 'report', 'monitor'].includes(action)) throw new Error(`Unknown matrix command: ${action}`);
  if (!opts.matrix || !/^matrix-[a-zA-Z0-9_.-]+$/.test(opts.matrix)) throw new Error('Provide a matrix ID.');
  const path = await resultLocation(resultsRoot, `matrices/${opts.matrix}`);
  const plan = JSON.parse(await readFile(join(path, 'plan.json'), 'utf8'));
  const state = JSON.parse(await readFile(join(path, 'state.json'), 'utf8'));
  applyCheckpoint(plan, state);
  if (action === 'run') await executeMatrix(path, plan, opts);
  else {
    await matrixReport(path, plan);
    if (action === 'monitor') {
      console.log(JSON.stringify({ id: plan.id, budgetReserved: plan.jobs.filter(job => job.state !== 'pending')
        .reduce((sum, job) => sum + job.pairAiCredits, 0),
      counts: Object.fromEntries(['pending', 'running', 'completed', 'failed'].map(state =>
        [state, plan.jobs.filter(job => job.state === state).length])),
      current: plan.jobs.filter(job => job.state === 'running') }, null, 2));
    }
    console.log(`Report: ${join(path, 'report.md')}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.stack ?? String(error)); process.exitCode = 1; });
}
