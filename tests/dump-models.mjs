import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function capabilityGroup(model) {
  if (model.id === 'auto') return 'Automatic routing';
  const supports = model.capabilities?.supports;
  if (typeof supports?.vision !== 'boolean' ||
      typeof supports?.reasoningEffort !== 'boolean') {
    return 'Capabilities not fully reported';
  }
  if (supports.vision && supports.reasoningEffort) return 'Vision + configurable reasoning';
  if (supports.vision) return 'Vision; no configurable reasoning';
  if (supports.reasoningEffort) return 'Configurable reasoning; no vision';
  return 'Neither vision nor configurable reasoning reported';
}

function cell(value) {
  return String(value ?? 'unknown').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
}

function tokenLimit(value) {
  return Number.isFinite(value) && value > 0 ? value : 'unknown';
}

export function renderInventory(inventory) {
  const groups = new Map();
  const models = [...inventory.models].sort((a, b) => a.id.localeCompare(b.id));
  for (const model of models) {
    const group = capabilityGroup(model);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(model);
  }

  const lines = [
    '# Authenticated Copilot CLI model inventory',
    '',
    `Captured: ${inventory.capturedAt}`,
    `Connected CLI version: ${cell(inventory.cliVersion)}`,
    `Catalog entries: ${models.length}`,
    '',
    'Source: authenticated Copilot SDK `listModels()`; no inference requests made.',
    'Grouped by declared capabilities, not inferred quality, price, or light/mid/strong tiers.',
    'Unknown means not reported (including zero/unspecified context limits).',
    'Auto is a router. Policy state is not proof of successful inference access.',
    'Billing multipliers are metadata, not measured cost. See [methodology](README.md).',
    '',
  ];
  for (const [group, entries] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${group} (${entries.length})`, '',
      '| Model ID | Name | Context tokens | Max prompt tokens | Reasoning efforts | Default effort | Policy | Billing multiplier |',
      '|---|---|---:|---:|---|---|---|---:|');
    for (const model of entries) {
      const limits = model.capabilities?.limits;
      lines.push(`| ${[
        model.id, model.name,
        tokenLimit(limits?.max_context_window_tokens),
        tokenLimit(limits?.max_prompt_tokens),
        model.supportedReasoningEfforts?.length ? model.supportedReasoningEfforts.join(', ') : 'not reported',
        model.defaultReasoningEffort, model.policy?.state, model.billing?.multiplier,
      ].map(cell).join(' | ')} |`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const [sdkPath, cliPath, outputPath, ...extra] = process.argv.slice(2);
  if (!sdkPath || !cliPath || extra.length) {
    throw new Error('Usage: node tests\\dump-models.mjs <SDK entry path> <CLI executable or JS entry path> [output directory]');
  }
  const { CopilotClient } = await import(pathToFileURL(resolve(sdkPath)).href);
  if (typeof CopilotClient !== 'function') {
    throw new Error('The SDK module must export CopilotClient.');
  }
  const client = new CopilotClient({ cliPath: resolve(cliPath) });
  let inventory;
  try {
    await client.start();
    const auth = await client.getAuthStatus();
    if (!auth.isAuthenticated) {
      throw new Error('Copilot is not authenticated. Run copilot login before exporting models.');
    }
    const status = await client.getStatus();
    const models = await client.listModels();
    if (!Array.isArray(models) || models.length === 0) {
      throw new Error('Copilot returned an empty or invalid model catalog.');
    }
    if (models.some(model => typeof model?.id !== 'string' || !model.id) ||
        new Set(models.map(model => model.id)).size !== models.length) {
      throw new Error('Copilot returned missing or duplicate model IDs.');
    }
    inventory = {
      capturedAt: new Date().toISOString(),
      source: 'Copilot SDK listModels',
      cliVersion: status.version,
      models,
    };
  } finally {
    const errors = await client.stop();
    if (errors.length) throw new AggregateError(errors, 'Failed to stop the Copilot catalog client.');
  }
  const directory = outputPath ? resolve(outputPath) : dirname(fileURLToPath(import.meta.url));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'model-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`);
  await writeFile(join(directory, 'model-inventory.md'), renderInventory(inventory));
  console.log(`Exported ${inventory.models.length} catalog entries to ${directory}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
