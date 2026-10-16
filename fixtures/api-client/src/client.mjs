export class ApiError extends Error {
  constructor(message, code, options) {
    super(message, options);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function createClient({ baseUrl, transport }) {
  if (!baseUrl || typeof transport !== 'function') {
    throw new TypeError('baseUrl and transport required');
  }
  return {
    async get(path) {
      try {
        const response = await transport(new URL(path, baseUrl).href, {
          method: 'GET', headers: { accept: 'application/json' },
        });
        if (response.status < 200 || response.status >= 300) {
          throw new ApiError(`HTTP ${response.status}`, 'HTTP_ERROR');
        }
        return response.body;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Request failed', 'REQUEST_FAILED', { cause: error });
      }
    },
  };
}
