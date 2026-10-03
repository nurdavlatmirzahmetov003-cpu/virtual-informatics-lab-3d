import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/** Matches a package directory inside node_modules on any OS path separator. */
const pkg = (names: string) => new RegExp(`node_modules[/\\\\](${names})[/\\\\]`);

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
    // AI assistant backend (npm run ai:server). When it is not running the
    // proxy answers 503 quietly and the browser stays on the local engine.
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.AI_PORT ?? 8787}`,
        configure: (proxy) => {
          proxy.on('error', (_error, _req, res) => {
            if ('writeHead' in res && !res.headersSent) {
              res.writeHead(503, { 'content-type': 'application/json' });
              res.end('{"error":"ai-server-offline"}');
            }
          });
        },
      },
    },
  },
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
            { name: 'react', test: pkg('react|react-dom|react-router|react-router-dom|scheduler') },
          ],
        },
      },
    },
  },
});
