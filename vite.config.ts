import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/** Matches a package directory inside node_modules on any OS path separator. */
const pkg = (names: string) => new RegExp(`node_modules[/\\\\](${names})[/\\\\]`);

/**
 * The lab server (npm run server: accounts, progress sync, AI assistant).
 * When it is not running the proxy answers 503 quietly and the site stays
 * in guest mode with the local engine.
 */
const apiProxy: Record<string, ProxyOptions> = {
  '/api': {
    // 127.0.0.1, not localhost: the server listens on IPv4 loopback only by default
    target: `http://127.0.0.1:${process.env.SERVER_PORT ?? process.env.AI_PORT ?? 8787}`,
    // X-Forwarded-For: the server sees each visitor's IP (rate limits, IP blocks)
    xfwd: true,
    // live games (V2-11b): /api/live/ws is a WebSocket
    ws: true,
    configure: (proxy) => {
      proxy.on('error', (_error, _req, res) => {
        if ('writeHead' in res && !res.headersSent) {
          res.writeHead(503, { 'content-type': 'application/json' });
          res.end('{"error":"server-offline"}');
        }
      });
    },
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // PORT lets a second dev server (preview tooling, parallel sessions) run next to the default one
    port: Number(process.env.PORT) || 5173,
    open: false,
    proxy: apiProxy,
  },
  // the production preview (npm run preview) talks to the same server
  preview: { proxy: apiProxy },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Shared React/Zustand dependencies must not be absorbed into the
          // lazy WebGL chunk, which would pull Three into every route.
          includeDependenciesRecursively: false,
          groups: [
            { name: 'three', test: pkg('three') },
            { name: 'r3f', test: pkg('@react-three|postprocessing|three-stdlib|maath|camera-controls') },
            // Vite's preload helper lives with React: react-router and the lazy
            // locale chunks both use it, and outside this group it would create
            // a react ⇄ useT import cycle (evaluation order breaks at startup)
            { name: 'react', test: (id: string) => pkg('react|react-dom|react-router|react-router-dom|scheduler').test(id) || /vite\/preload-helper/.test(id) },
          ],
        },
      },
    },
  },
});
