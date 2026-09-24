import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => ({
  // Keep relative asset paths so the production bundle works on GitHub Pages.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    // v5.1.1 diagnostic/stability build: keep module boundaries intact and
    // disable production minification while we eliminate the remaining
    // runtime TDZ (Temporal Dead Zone) failure. Source maps make any future
    // production stack trace point back to the real TS/TSX source.
    minify: false,
    sourcemap: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
