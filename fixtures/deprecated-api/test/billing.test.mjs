import test from 'node:test';
import assert from 'node:assert/strict';
import { invoices, credits, subscriptions } from '../src/billing/index.mjs';

test('billing rows preserve their domain contracts', async () => {
  assert.deepEqual(await invoices(), [{ id: 'invoice-1', cents: 1200 }]);
  assert.deepEqual(await credits(), [{ id: 'credit-1', cents: 100 }]);
  assert.deepEqual(await subscriptions(), [{ id: 'subscription-1', active: true }]);
});
