import { access, mkdir, readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { inside } from './harness-lib.mjs';

export async function resultLocation(root, id) {
  if (typeof id !== 'string' || id.split(/[\\/]/).some(part => !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(part))) {
    throw new Error('Invalid run ID or results-relative path; paths escaping the results root are not allowed.');
  }
  let locations;
  try { locations = JSON.parse(await readFile(join(root, 'locations.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return inside(root, locations?.[id] ?? id);
}

export async function reserveDirectory(parent, prefix) {
  await mkdir(parent, { recursive: true });
  const names = await readdir(parent);
  const expression = new RegExp(`^${prefix}-(\\d+)$`);
  let next = Math.max(0, ...names.map(name => Number(expression.exec(name)?.[1] ?? 0))) + 1;
  for (;;) {
    const id = `${prefix}-${String(next++).padStart(6, '0')}`;
    const path = join(parent, id);
    try { await mkdir(path); return { id, path }; }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
}

export async function runDirectories(root) {
  const found = [];
  async function visit(path) {
    try { await access(join(path, 'manifest.json')); found.push(path); return; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'catalogs') await visit(join(path, entry.name));
    }
  }
  await visit(root);
  return found.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
}
