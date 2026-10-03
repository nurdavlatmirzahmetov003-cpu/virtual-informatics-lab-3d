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
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        advancedChunks: {
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
