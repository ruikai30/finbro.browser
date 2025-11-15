import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Copy overlay HTML to dist after build
    {
      name: 'copy-overlay',
      closeBundle() {
        const overlaySource = path.join(__dirname, 'src/renderer-overlay/index.html');
        const overlayDest = path.join(__dirname, 'dist/renderer-overlay');
        
        if (!fs.existsSync(overlayDest)) {
          fs.mkdirSync(overlayDest, { recursive: true });
        }
        
        fs.copyFileSync(overlaySource, path.join(overlayDest, 'index.html'));
        console.log('✓ Copied overlay HTML to dist/renderer-overlay/');
      }
    }
  ],
  root: path.join(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, 'src/renderer/index.html'),
    },
  },
  server: {
    port: 3000,
  },
});
