import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite config for overlay renderer
export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'src/renderer-overlay'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/renderer-overlay'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, 'src/renderer-overlay/index.html'),
    },
  },
});

