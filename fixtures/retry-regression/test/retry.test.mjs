import test from 'node:test';
import assert from 'node:assert/strict';
import { requestWithRetry } from '../src/retry.mjs';

test('successful request is not retried', async () => {
  let calls = 0;
  assert.equal(await requestWithRetry(async () => { calls += 1; return 'ok'; }), 'ok');
  assert.equal(calls, 1);
});

test('non-timeout errors are not retried', async () => {
  const error = new Error('malformed response');
  await assert.rejects(requestWithRetry(async () => { throw error; }), e => e === error);
});

test('retry-timeout: second attempt succeeds after the first attempt times out', async () => {
  let fireTimeout;
  const active = new Set();
  const timers = {
    setTimeout(callback) {
      active.add(callback);
      fireTimeout = callback;
      return callback;
    },
    clearTimeout(callback) { active.delete(callback); },
  };
  const attempts = [];
  const result = requestWithRetry(async ({ signal, attempt }) => {
    attempts.push(attempt);
    signal.throwIfAborted();
    if (attempt > 0) return 'recovered';
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  }, { timeoutMs: 10, retries: 1, timers });
  fireTimeout();
  await assert.doesNotReject(async () => assert.equal(await result, 'recovered'));
  assert.deepEqual(attempts, [0, 1]);
  assert.equal(active.size, 0);
});
