import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.mjs';

test('authorized widget request preserves response contract', () => {
  const response = createApp().handle({
    method: 'GET', path: '/widgets', headers: { 'x-api-key': 'synthetic-key-a' },
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, [{ id: 'widget-1', name: 'Standard widget' }]);
});

test('missing key is rejected before routing', () => {
  assert.equal(createApp().handle({
    method: 'GET', path: '/widgets', headers: {},
  }).statusCode, 401);
});

test('unknown route returns not found', () => {
  assert.equal(createApp().handle({
    method: 'GET', path: '/missing', headers: { 'x-api-key': 'synthetic-key-a' },
  }).statusCode, 404);
});
