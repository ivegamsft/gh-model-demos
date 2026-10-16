import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseSlug, releasePath } from '../src/release.mjs';

test('normalizes mixed-case release names', () => {
  assert.equal(releaseSlug('  Autumn Launch  '), 'autumn-launch');
});

test('collapses whitespace in release names', () => {
  assert.equal(releaseSlug('autumn   launch'), 'autumn-launch');
});

test('builds the release path', () => {
  assert.equal(releasePath('autumn launch'), '/releases/autumn-launch');
});
