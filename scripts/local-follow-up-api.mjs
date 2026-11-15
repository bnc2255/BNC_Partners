import { followUpHandler } from '../server/follow-up.mjs';
import { zeptoMailWebhook } from '../server/zeptomail-webhook.mjs';

// Run the same authenticated Vercel handler during plain Vite development.
export function localFollowUpApi(env) {
  return {
    name: 'local-follow-up-api',
    apply: 'serve',
    configureServer(server) {
      for (const [path, handler] of [['/api/follow-up', followUpHandler], ['/api/zeptomail-webhook', zeptoMailWebhook]]) {
      server.middlewares.use(path, async (req, res) => {
        try {
          let body = '';
          for await (const chunk of req) {
            body += chunk.toString();
            if (body.length > 250000) {
              res.writeHead(413, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request is too large.' }));
              return;
            }
          }
          const headers = new Headers();
          for (const name of ['authorization', 'producer-signature', 'content-type']) if (req.headers[name]) headers.set(name, req.headers[name]);
          const request = new Request('http://localhost/api/follow-up', { method: req.method, headers, ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body } : {}) });
          const response = await handler(request, env);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(await response.text());
        } catch {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Local follow-up API could not complete the request.' }));
        }
      });
      }
    },
  };
}
