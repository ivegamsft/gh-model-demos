import test from 'node:test';
import assert from 'node:assert/strict';
import { page } from '../src/pagination.mjs';
import { searchOrders } from '../src/orders.mjs';

test('invalid page numbers are rejected', () => {
  assert.throws(() => page([], 0, 10), RangeError);
});

test('ordinary order search returns adapter rows', async () => {
  const rows = [{ id: 'order-1', reference: 'ref-1' }];
  const db = { query: async () => rows };
  assert.deepEqual(await searchOrders(db, 'ref-1'), rows);
});
