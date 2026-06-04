import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Capacitor loads the built assets from disk inside the WebView, so every URL
// must be relative (base: './') — absolute '/assets/...' paths break there.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Pin an empty PostCSS config so Vite doesn't walk up and pick up the parent
  // repo's Tailwind PostCSS config (this is a standalone app in a subfolder).
  css: { postcss: { plugins: [] } },
  build: {
    outDir: 'dist',
    target: 'es2018',
  },
});
