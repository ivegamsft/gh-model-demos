export function createApp({ now = Date.now } = {}) {
  const middleware = [
    (request, response) => {
      if (!request.headers['x-api-key']) {
        response.statusCode = 401;
        response.body = { error: 'API key required' };
      }
    },
  ];

  function handle(request) {
    const response = { statusCode: 200, headers: {}, body: null };
    request.receivedAt = now();
    for (const run of middleware) {
      run(request, response);
      if (response.statusCode !== 200) return response;
    }
    if (request.method === 'GET' && request.path === '/widgets') {
      response.body = [{ id: 'widget-1', name: 'Standard widget' }];
    } else {
      response.statusCode = 404;
      response.body = { error: 'Not found' };
    }
    return response;
  }

  return { handle };
}

export function createHttpHandler(options) {
  const app = createApp(options);
  return (req, res) => {
    const response = app.handle({
      method: req.method,
      path: new URL(req.url, 'http://fixture.invalid').pathname,
      headers: req.headers,
    });
    res.writeHead(response.statusCode, {
      'content-type': 'application/json', ...response.headers,
    });
    res.end(JSON.stringify(response.body));
  };
}
