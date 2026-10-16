import { access, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { atomicJson, inside, relativeLinks } from './harness-lib.mjs';
import { runDirectories } from './result-paths.mjs';

async function exists(path) {
  try { await access(path); return true; }
  catch (error) { if (error.code !== 'ENOENT') throw error; return false; }
}

export async function migrateResults(root) {
  const registryPath = join(root, 'locations.json');
  const locations = await exists(registryPath) ? JSON.parse(await readFile(registryPath, 'utf8')) : {};
  const matrices = join(root, 'matrices');
  await mkdir(matrices, { recursive: true });
  const matrixNames = (await readdir(matrices, { withFileTypes: true }))
    .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  let matrixNumber = Math.max(0, ...matrixNames.map(name => Number(/^matrix-(\d+)$/.exec(name)?.[1] ?? 0)));
  for (const name of matrixNames) {
    const key = `matrices/${name}`;
    if (!/^matrix-\d+$/.test(name) && !locations[key]) {
      locations[key] = `matrices/matrix-${String(++matrixNumber).padStart(6, '0')}`;
    }
  }
  const pending = new Set();
  for (const name of matrixNames) {
    const path = join(matrices, name);
    if (await exists(join(path, 'runner.lock'))) throw new Error(`Stop the matrix controller before migrating: ${name}`);
    const plan = JSON.parse(await readFile(join(path, 'plan.json'), 'utf8'));
    const state = JSON.parse(await readFile(join(path, 'state.json'), 'utf8'));
    const matrix = locations[`matrices/${name}`] ?? `matrices/${name}`;
    for (const job of plan.jobs) {
      const cell = plan.cells.find(cell => cell.id === job.cellId);
      if (!cell) throw new Error(`Unknown cell: ${job.cellId}`);
      const folder = `cell-${String(Number(job.cellId.slice(5))).padStart(4, '0')}-trial-${String(job.trial).padStart(4, '0')}`;
      const destination = `${matrix}/runs/${cell.pattern}/${folder}`;
      if (job.runId !== destination) locations[job.runId] ??= destination;
      if (state.find(saved => saved.id === job.id)?.state === 'pending') pending.add(job.runId);
    }
  }
  const runs = await runDirectories(root);
  const counters = new Map();
  for (const path of runs) {
    const key = relative(root, path).replaceAll('\\', '/');
    if (key.includes('/') || locations[key]) continue;
    const manifest = JSON.parse(await readFile(join(path, 'manifest.json'), 'utf8'));
    inside(root, manifest.pattern);
    if (manifest.matrix) {
      const matrix = locations[`matrices/${manifest.matrix.id}`] ?? `matrices/${manifest.matrix.id}`;
      const cell = Number(manifest.matrix.cellId.replace('cell-', ''));
      const trial = manifest.matrix.trial;
      if (!Number.isInteger(cell) || !Number.isInteger(trial)) throw new Error(`Invalid matrix coordinates: ${key}`);
      locations[key] = `${matrix}/runs/${manifest.pattern}/cell-${String(cell).padStart(4, '0')}-trial-${String(trial).padStart(4, '0')}`;
    } else {
      if (!counters.has(manifest.pattern)) {
        const parent = inside(root, manifest.pattern);
        const names = await exists(parent) ? await readdir(parent) : [];
        counters.set(manifest.pattern, Math.max(0, ...names.map(name => Number(/^run-(\d+)$/.exec(name)?.[1] ?? 0))));
      }
      const number = counters.get(manifest.pattern) + 1;
      counters.set(manifest.pattern, number);
      locations[key] = `${manifest.pattern}/run-${String(number).padStart(6, '0')}`;
    }
  }
  if (new Set(Object.values(locations)).size !== Object.keys(locations).length) throw new Error('Duplicate migration destinations.');
  await atomicJson(registryPath, locations);
  const existingRuns = new Set(runs.map(path => relative(root, path).replaceAll('\\', '/')));
  let moved = 0;
  for (const [old, destination] of Object.entries(locations)) {
    if (pending.has(old) && !existingRuns.has(old)) continue;
    const source = inside(root, old);
    const target = inside(root, destination);
    if (!await exists(source)) {
      if (!await exists(target) && !pending.has(old)) throw new Error(`Missing migration source and destination: ${old}`);
      continue;
    }
    if (await exists(target)) throw new Error(`Migration destination already exists: ${destination}`);
    await mkdir(dirname(target), { recursive: true });
    await rename(source, target);
    moved++;
  }
  const mappings = Object.entries(locations).map(([old, destination]) =>
    [inside(root, old), inside(root, destination)]).sort((a, b) => b[0].length - a[0].length);
  const relocate = path => {
    const mapping = mappings.find(([old]) => path === old || path.startsWith(`${old}${sep}`));
    return mapping ? join(mapping[1], relative(mapping[0], path)) : path;
  };
  const documents = [];
  async function repair(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'snapshot') await repair(path);
      } else if (['report.md', 'index.md'].includes(entry.name)) {
        const mapping = mappings.find(([, target]) => path.startsWith(`${target}${sep}`));
        const oldPath = mapping ? join(mapping[0], relative(mapping[1], path)) : path;
        const original = await readFile(path, 'utf8');
        let fence = null;
        const updated = original.split('\n').map(line => {
          const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
          if (marker) {
            if (!fence) fence = marker[1];
            else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
            return line;
          }
          if (fence) return line;
          return line.replace(/(\[[^\]\n]+\])\(([^)\n]+)\)/g, (match, label, value) => {
            const target = value.replace(/^<|>$/g, '');
            if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) return match;
            const [pathname, ...fragment] = target.split('#');
            const absolute = relocate(resolve(dirname(oldPath), decodeURIComponent(pathname)));
            return relativeLinks(`${label}(<${pathToFileURL(absolute).href}${fragment.length ? `#${fragment.join('#')}` : ''}>)`, path);
          });
        }).join('\n');
        if (updated !== original) documents.push({ path: relative(root, path), content: updated });
      }
    }
  }
  const marker = join(root, 'layout-migration.json');
  let journal = await exists(marker) ? JSON.parse(await readFile(marker, 'utf8')) : null;
  if (!journal) {
    await repair(root);
    journal = { documents };
    await atomicJson(marker, journal);
  }
  let repaired = 0;
  if (journal.documents) {
    for (const document of journal.documents) await writeFile(inside(root, document.path), document.content);
    repaired = journal.documents.length;
    await atomicJson(marker, { migratedAt: new Date().toISOString(), moved, repaired });
  }
  return { moved, repaired };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  migrateResults(join(dirname(fileURLToPath(import.meta.url)), 'results'))
    .then(result => console.log(JSON.stringify(result)))
    .catch(error => { console.error(error.stack); process.exitCode = 1; });
}
