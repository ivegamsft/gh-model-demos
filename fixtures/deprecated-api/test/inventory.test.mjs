import test from 'node:test';
import assert from 'node:assert/strict';
import { products, warehouses, shipments } from '../src/inventory/index.mjs';

test('inventory rows preserve their domain contracts', async () => {
  assert.deepEqual(await products(), [{ id: 'product-1', stock: 12 }]);
  assert.deepEqual(await warehouses(), [{ id: 'warehouse-1', region: 'US' }]);
  assert.deepEqual(await shipments(), [{ id: 'shipment-1', state: 'packed' }]);
});
