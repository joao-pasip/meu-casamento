import { existsSync, readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { parseEnv } from 'node:util';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { onRequest } from './functions/api/wedding.js';

export default defineConfig(({ mode }) => {
  // Read server credentials locally without exposing them through VITE_ variables.
  const vars = existsSync('.dev.vars') ? parseEnv(readFileSync('.dev.vars', 'utf8')) : {};
  const env = { ...vars, ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const connected = Boolean(env.APPS_SCRIPT_URL && env.APPS_SCRIPT_SECRET);
  return {
    server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.dev.vars', '**/.dev.vars.*', '**/.verification/**'] } },
    optimizeDeps: { esbuildOptions: { tsconfigRaw: {} } },
    define: { 'import.meta.env.VITE_DEMO_MODE': JSON.stringify(connected ? 'false' : env.VITE_DEMO_MODE || 'true') },
    plugins: [react(), {
      name: 'local-wedding-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== '/api/wedding') return next();
          try {
            const address = server.httpServer?.address();
            const port = address && typeof address === 'object' ? address.port : 5173;
            const headers = new Headers();
            for (const [name, value] of Object.entries(req.headers)) {
              if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
            }
            const request = new Request(new URL(req.url, `http://${req.headers.host || `127.0.0.1:${port}`}`), {
              method: req.method,
              headers,
              ...(!['GET', 'HEAD'].includes(req.method) ? { body: Readable.toWeb(req), duplex: 'half' } : {}),
            });
            const response = await onRequest({ request, env });
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch {
            res.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify({ ok: false, message: 'Não foi possível acessar a integração local.' }));
          }
        });
      },
    }],
  };
});
