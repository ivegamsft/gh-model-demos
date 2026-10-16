import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient, ApiError } from '../src/client.mjs';

test('existing callers receive the response body', async () => {
  const calls = [];
  const client = createClient({
    baseUrl: 'https://fixture.invalid/v1/',
    transport: async (...args) => {
      calls.push(args);
      return { status: 200, body: { ready: true } };
    },
  });
  assert.deepEqual(await client.get('health'), { ready: true });
  assert.equal(calls[0][0], 'https://fixture.invalid/v1/health');
  assert.equal(calls[0][1].method, 'GET');
  assert.equal(calls[0][1].headers.accept, 'application/json');
});

test('HTTP errors use the existing ApiError contract', async () => {
  const client = createClient({
    baseUrl: 'https://fixture.invalid/',
    transport: async () => ({ status: 503, body: null }),
  });
  await assert.rejects(client.get('health'), { name: 'ApiError', code: 'HTTP_ERROR' });
});

test('transport failures preserve their cause', async () => {
  const cause = new Error('offline simulated failure');
  const client = createClient({
    baseUrl: 'https://fixture.invalid/', transport: async () => { throw cause; },
  });
  await assert.rejects(client.get('health'), error =>
    error instanceof ApiError && error.code === 'REQUEST_FAILED' && error.cause === cause);
});
