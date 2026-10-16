import test from 'node:test';
import assert from 'node:assert/strict';
import { sales, usage, health } from '../src/reports/index.mjs';

test('report rows preserve their domain contracts', async () => {
  assert.deepEqual(await sales(), [{ day: '2026-10-14', cents: 1200 }]);
  assert.deepEqual(await usage(), [{ day: '2026-10-14', requests: 42 }]);
  assert.deepEqual(await health(), [{ service: 'offline-api', ready: true }]);
});
