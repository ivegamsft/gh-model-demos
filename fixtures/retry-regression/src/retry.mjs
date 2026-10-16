export class TimeoutError extends Error {
  constructor() {
    super('Request attempt timed out');
    this.code = 'TIMEOUT';
  }
}

export async function requestWithRetry(transport, {
  timeoutMs = 1000, retries = 1, timers = globalThis,
} = {}) {
  const controller = new AbortController();
  for (let attempt = 0; ; attempt += 1) {
    const timer = timers.setTimeout(() => controller.abort(new TimeoutError()), timeoutMs);
    try {
      return await transport({ signal: controller.signal, attempt });
    } catch (error) {
      if (error.code !== 'TIMEOUT' || attempt >= retries) throw error;
    } finally {
      timers.clearTimeout(timer);
    }
  }
}
