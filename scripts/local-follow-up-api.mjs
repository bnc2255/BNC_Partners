import { followUpHandler } from '../server/follow-up.mjs';

// Run the same authenticated Vercel handler during plain Vite development.
export function localFollowUpApi(env) {
  return {
    name: 'local-follow-up-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/follow-up', async (req, res) => {
        try {
          let body = '';
          for await (const chunk of req) {
            body += chunk.toString();
            if (body.length > 80000) {
              res.writeHead(413, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request is too large.' }));
              return;
            }
          }
          const headers = new Headers();
          if (req.headers.authorization) headers.set('Authorization', req.headers.authorization);
          headers.set('Content-Type', 'application/json');
          const request = new Request('http://localhost/api/follow-up', { method: req.method, headers, ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body } : {}) });
          const response = await followUpHandler(request, env);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(await response.text());
        } catch {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Local follow-up API could not complete the request.' }));
        }
      });
    },
  };
}
