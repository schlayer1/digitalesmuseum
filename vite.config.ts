import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { URL } from 'node:url';

function localApiPlugin(): Plugin {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '');
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith('/api/')) return next();

        const parsed = new URL(rawUrl, 'http://127.0.0.1');
        const routeName = parsed.pathname.replace(/^\/api\//, '').replace(/[^a-zA-Z0-9_-]/g, '');
        if (!routeName || routeName.startsWith('_')) return next();

        try {
          const mod = await server.ssrLoadModule(`/api/${routeName}.ts`);
          if (typeof mod.default !== 'function') return next();

          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const bodyText = Buffer.concat(chunks).toString('utf8');
          let parsedBody: any = bodyText;
          if (bodyText && (req.headers['content-type'] || '').includes('application/json')) {
            try {
              parsedBody = JSON.parse(bodyText);
            } catch {
              parsedBody = bodyText;
            }
          }

          const query: Record<string, string> = {};
          parsed.searchParams.forEach((v, k) => {
            query[k] = v;
          });

          const apiReq: any = Object.assign(req, { query, body: parsedBody });
          const apiRes: any = res;
          apiRes.status = (code: number) => {
            res.statusCode = code;
            return apiRes;
          };
          apiRes.json = (obj: unknown) => {
            if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(obj));
            return apiRes;
          };

          await mod.default(apiReq, apiRes);
        } catch (err: any) {
          console.error('Local API Error:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          }
          res.end(JSON.stringify({ error: err?.message || 'Local API error' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
