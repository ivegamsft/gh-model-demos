import { accepted, comparison } from './harness-lib.mjs';

function text(value) {
  return String(value ?? 'unknown').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
}

function number(value, digits = 0) {
  return Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: digits }) : 'unknown';
}

function aiu(value) {
  return Number.isFinite(value) ? number(value / 1e9, 6) : 'unknown';
}

function excerpt(value) {
  if (!value) return '_Not captured._';
  const preview = value.length > 1400 ? `${value.slice(0, 1400)}\n[Preview truncated; open the full evidence link.]` : value;
  const fence = '`'.repeat(Math.max(3, ...[...preview.matchAll(/`+/g)].map(match => match[0].length + 1)));
  return `${fence}text\n${preview}\n${fence}`;
}

export function outcome(result) {
  if (result.status !== 'completed') return `Execution ${result.status}`;
  if (accepted(result)) return 'Accepted';
  if (result.acceptance.some(check => check.status === 'fail')) return 'Not accepted';
  return 'Awaiting review';
}

export function renderReport({ manifest, plan, records, controllerError = null, location = manifest.runId }) {
  const results = records.map(record => record.result);
  const summary = comparison(results);
  const expected = manifest.config.trials * manifest.repetitions * 2;
  const dryRun = manifest.dryRun === true;
  const complete = !dryRun && results.length === expected && results.every(result => result.status === 'completed');
  const execution = dryRun ? 'Dry run only; no model experiment was dispatched'
    : complete ? 'All model executions completed' : 'Incomplete or failed execution';
  const completedResults = results.filter(result => result.status === 'completed');
  const verdict = dryRun ? 'Configuration validation only, not a model-quality or cost result.'
    : results.length === 0 ? 'No attempt results were collected; there is no model-quality conclusion.'
      : completedResults.length === 0 ? 'No completed model answers to grade; execution failures are not prompt-quality findings.'
      : `Good: ${summary.good.accepted}/${summary.good.attempts} accepted. Bad: ${summary.bad.accepted}/${summary.bad.attempts} accepted.`;
  const lines = [
    `# ${manifest.pattern}: experiment report`, '',
    '## At a glance', '',
    `- **Run:** ${location}`,
    ...(location !== manifest.runId ? [`- **Original run ID:** ${manifest.runId}`] : []),
    `- **Created (UTC):** ${text(manifest.createdAt)}`,
    `- **Execution:** ${execution} (${results.length}/${expected} planned attempts collected).`,
    `- **Quality verdict:** ${verdict}`,
    '- **Interpretation:** Execution success means the CLI finished, not that its answer met the task requirements.',
    '',
  ];
  for (const { result, resultLink } of records) {
    const passed = result.acceptance.filter(check => check.status === 'pass').length;
    const failures = result.acceptance.filter(check => check.status === 'fail');
    const explanation = result.status !== 'completed' ? result.error ?? 'See execution diagnostics below.'
      : failures.length ? failures.map(check => `${check.criterion}: ${check.evidence ?? 'failed check'}`).join('; ')
        : accepted(result) ? `All ${passed} required checks passed.` : 'Some required checks have not been evaluated.';
    lines.push(`- **[${result.variant}, trial ${result.trial}, rep ${result.repetition}](${resultLink}): ${outcome(result)}.** ${text(explanation)}`);
  }
  lines.push('', '## What did we test?', '',
    `We compared the captured good and bad prompts for **${manifest.pattern}** against the same acceptance rubric.`,
    manifest.pattern === 'structured-extraction'
      ? 'Task: extract invoice INV-20931 into machine-readable JSON, preserving the source values and leaving the absent purchase-order number null. The good prompt specifies the schema and JSON-only output; the bad prompt asks for nicely organized information and explanations.'
      : 'The captured prompt excerpts below show the assigned task and the actual difference between variants.',
    '',
    `Design: ${manifest.config.trials} paired trial(s), ${manifest.repetitions} repetition(s) per variant. Separate disposable containers; sequential dispatch.`,
    `Provider cache condition: **${text(manifest.config.cacheCondition)}**. A fresh container does not imply a cold provider cache.`,
    `Planned soft session caps: **${number(manifest.plannedAiCredits)} AI credits** across the experiment; these are not measured spend.`,
    '',
    '| Variant | Requested model / effort / tools by phase | Sessions x turns |',
    '|---|---|---|');
  for (const variant of ['good', 'bad']) {
    const phases = plan.variants[variant].phases;
    lines.push(`| ${variant} | ${phases.map(phase =>
      `${text(phase.model)} / ${text(phase.effort ?? phase.effortPolicy)} / ${text(phase.toolProfile)}`).join('; ')} | ${phases.map(phase => `1 x ${phase.turns.length}`).join('; ')} |`);
  }
  if (manifest.matrix) {
    const context = plan.variants.good.context;
    lines.push('', `Matrix **${text(manifest.matrix.id)}**, cell **${text(manifest.matrix.cellId)}**, trial round **${manifest.matrix.trial}**.`,
      `Repository-instruction context held constant across prompt variants: **${text(context?.variant)}**, ${context?.bytes ?? 'unknown'} staged bytes.`,
      'Instruction source contents/hashes and CLI discovery evidence are linked per attempt. Discovery is not proof that every scoped instruction was attached.',
      'Provider-default effort (including Auto) is not effort-matched to named-model settings.');
  }
  lines.push('', '### Prompt contrast (captured templates)', '');
  for (const variant of ['good', 'bad']) {
    lines.push(`**${variant}: first turn**`, '', excerpt(plan.variants[variant].phases[0]?.turns[0]), '');
  }
  lines.push('Templates are not a substitute for the expanded per-turn inputs linked below.',
    '', '## What did we expect?', '',
    'These are pre-run hypotheses, not measured findings. Both variants must satisfy the same rubric.', '');
  for (const variant of ['good', 'bad']) {
    const expectations = plan.variants[variant].expectations;
    lines.push(`### ${variant}`, '',
      `- **Expected processing:** ${text(expectations?.processing ?? 'Not captured in this historical plan.')}`,
      `- **Expected result:** ${text(expectations?.result ?? 'Not captured in this historical plan.')}`,
      `- **Provenance:** ${text(expectations?.source ?? 'Unavailable; current prompt content was not substituted.')}`, '');
  }
  lines.push('### Shared definition of success', '',
    ...plan.variants.good.acceptance.map((criterion, index) => `${index + 1}. ${text(criterion)}`),
    '', '## What happened?', '',
    '| Attempt | Execution | Quality outcome | Checks: pass / fail / unreviewed | Time (s) |',
    '|---|---|---|---|---:|');
  for (const { result, resultLink } of records) {
    const count = status => result.acceptance.filter(check => check.status === status).length;
    lines.push(`| [Trial ${result.trial}, rep ${result.repetition}, ${result.variant}](${resultLink}) | ${text(result.status)} | ${outcome(result)} | ${count('pass')} / ${count('fail')} / ${count('needs-review')} | ${number(result.elapsedMs / 1000, 2)} |`);
  }
  if (!records.length) lines.push('| No attempt results | Not measured | No quality conclusion | - | - |');
  if (records.some(record => record.fusionRoutes?.length)) {
    lines.push('', '### HydraFusion / Ensemble routing', '',
      'Observed routing decisions, not inferred from the selected synthetic model. Full phase events remain in the linked model/tool evidence.',
      '', '| Attempt | Workflow | Primary model | Secondary model | Routing rule |',
      '|---|---|---|---|---|');
    for (const { result, fusionRoutes = [] } of records) {
      for (const route of fusionRoutes) {
        lines.push(`| ${result.trial}/${result.repetition}/${result.variant} | ${text(route.pattern)} | ${text(route.primaryModel)} | ${text(route.secondaryModel ?? 'none')} | ${text(route.ruleId)} |`);
      }
    }
  }
  if (controllerError) lines.push('', '**Controller failure:**', '', excerpt(controllerError));
  lines.push('', '### Measured model usage', '',
    '| Attempt | Actual model(s) | Input tokens | Cache-read tokens | Output tokens | Model / tool calls | Cost (AIU) | Cost evidence |',
    '|---|---|---:|---:|---:|---|---:|---|');
  for (const { result } of records) {
    const metrics = result.metrics;
    lines.push(`| ${result.trial}/${result.repetition}/${result.variant} | ${text(metrics?.actualModels?.join(', ') || null)} | ${number(metrics?.inputTokens)} | ${number(metrics?.cacheReadTokens)} | ${number(metrics?.outputTokens)} | ${number(metrics?.modelCalls)} / ${number(metrics?.toolCalls)} | ${aiu(metrics?.nanoAiu)} | ${metrics?.costComplete === true ? 'Complete' : 'Incomplete/unknown'} |`);
  }
  lines.push('', '**Units:** 1 AIU = 1,000,000,000 nano-AIU (display scaling only). AIU is not an AI credit or a dollar amount. Raw units remain in the JSON.',
    'Input/cache categories can overlap; do not add them. Missing values mean unknown, not zero. Elapsed time includes worker setup.',
    '', '### Cost per accepted completion', '',
    '| Variant | Accepted / attempts | Total cost (AIU) | AIU per accepted completion |',
    '|---|---|---:|---|');
  for (const [variant, value] of Object.entries(summary)) {
    const ratio = !value.accepted ? 'Undefined: zero accepted completions'
      : !value.costComplete ? 'Unknown: incomplete cost evidence' : aiu(value.nanoAiuPerAcceptedCompletion);
    lines.push(`| ${variant} | ${value.accepted} / ${value.attempts} | ${aiu(value.totalNanoAiu)} | ${ratio} |`);
  }
  lines.push('', '## Insights and next steps', '');
  if (dryRun) {
    lines.push('- This was a dry run. Do not interpret its lack of outputs as model failure. Run a live pair after preflight.');
  } else if (!complete) {
    lines.push('- Resolve execution/setup failures before drawing model-quality or prompt-economics conclusions. Failed execution is not proof that a prompt is intrinsically worse.');
  }
  const rejected = results.filter(result => outcome(result) === 'Not accepted');
  if (rejected.length) {
    lines.push(`- **Task fit matters:** ${rejected.length} completed answer(s) failed at least one required criterion. See the criterion-level evidence below; a readable or lower-cost answer is not automatically usable.`);
  }
  if (manifest.pattern === 'structured-extraction' &&
      results.some(result => result.variant === 'good' && accepted(result)) &&
      rejected.some(result => result.variant === 'bad' && result.acceptance[0]?.status === 'fail')) {
    lines.push('- **Expectation versus observation:** the schema-explicit prompt yielded accepted JSON; the open-ended prompt failed the JSON/schema requirement. This is consistent with the format hypothesis, not evidence that the model disobeyed the bad prompt: that prompt explicitly requested explanations.',
      '- **Action:** for machine-consumed extraction, specify the schema, missing-value rules, and JSON-only output. A repair/reformat retry was not tested, so its cost and success rate are not measured here.');
  }
  const good = results.filter(result => result.variant === 'good');
  const bad = results.filter(result => result.variant === 'bad');
  if (good.length && bad.length) {
    const sum = (runs, field) => runs.every(run => Number.isFinite(run.metrics?.[field]))
      ? runs.reduce((total, run) => total + run.metrics[field], 0) : null;
    const goodOutput = sum(good, 'outputTokens');
    const badOutput = sum(bad, 'outputTokens');
    if (goodOutput !== null && badOutput !== null) {
      lines.push(`- **Output volume:** good produced ${number(goodOutput)} output tokens; bad produced ${number(badOutput)}. These are provider-reported generation tokens, not a count of visible words.`);
    }
    const goodCache = sum(good, 'cacheReadTokens');
    const badCache = sum(bad, 'cacheReadTokens');
    if (goodCache !== null && badCache !== null && goodCache !== badCache) {
      lines.push(`- **Cache confound:** cache-read totals differed (good ${number(goodCache)}; bad ${number(badCache)}). Observed cost differences cannot be attributed to prompt wording alone. Repeat with balanced order and separately analyzed cache conditions.`);
    }
    if (summary.good.costComplete && summary.bad.costComplete &&
        summary.bad.totalNanoAiu < summary.good.totalNanoAiu && summary.bad.accepted === 0) {
      lines.push('- **Cheaper is not a saving here:** bad consumed less measured AIU but delivered zero accepted completions. Its cost per accepted completion is undefined, not zero.');
    }
  }
  if (completedResults.some(result => result.acceptance.some(check => check.status === 'needs-review'))) {
    lines.push('- **Review gap:** unreviewed criteria are not passes. A failed criterion already makes that answer not accepted; reviewing the remaining criteria would explain its other strengths or defects, not erase the failure.');
  }
  if (!dryRun && completedResults.length) {
    lines.push(`- **Evidence strength:** ${manifest.config.trials} paired trial(s) in this run. This is descriptive evidence, not a statistically established model ranking or savings estimate. Repeat at least five paired trials before interpreting a trend.`);
  }
  lines.push('', '## Evidence: inputs, outputs, and acceptance decisions', '',
    'Each preview is verbatim, not an AI-generated interpretation. Open the full files for context. Review decisions, when present, supersede automated checks and are identified below.', '');
  for (const record of records) {
    const { result, artifacts, output, resultLink, diagnostic } = record;
    lines.push(`### Trial ${result.trial}, repetition ${result.repetition}: ${result.variant}`, '',
      `**${outcome(result)}.** ${result.error ? `Execution error: ${text(result.error)}` : 'No execution error reported.'}`,
      result.reviewedBy ? `Reviewed by: ${text(result.reviewedBy)}.` : 'Grading: automated checks; unreviewed criteria remain unresolved.',
      '', artifacts.map(artifact => `[${artifact.label}](${artifact.link})`).join(' | '), '',
      '**Observed response (preview)**', '', excerpt(output), '');
    if (result.status !== 'completed') {
      lines.push('This attempt did not complete. Stored automated checks below describe the captured/missing output, not a validated model-quality result.', '');
    }
    if (diagnostic) lines.push('**Execution diagnostic (preview)**', '', excerpt(diagnostic), '');
    lines.push('| Required criterion | Decision | Evidence / reason |', '|---|---|---|',
      ...result.acceptance.map(check => `| ${text(check.criterion)} | ${text(check.status)} | ${text(check.evidence ?? 'Not evaluated; no evidence recorded.')} |`),
      '', `Machine-readable result: [result.json](${resultLink}).`, '');
  }
  lines.push('## Reproducibility', '',
    '[Captured plan](resolved-plan.json) | [Run manifest](manifest.json) | [Comparison data](comparison.json)',
    '', 'The plan records prompt/config snapshots; the manifest records hashes, dispatch order, and image identity when available. This report never runs inference or changes original attempt results.', '');
  return { markdown: lines.join('\n'), summary, complete, execution, verdict };
}
