import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { spawn } from 'child_process';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Build overlay after main renderer build completes
    {
      name: 'build-overlay',
      closeBundle() {
        console.log('Building overlay renderer...');
        
        // Run vite build for overlay
        const viteBuild = spawn('npx', [
          'vite',
          'build',
          '--config',
          'vite.overlay.config.ts'
        ], {
          stdio: 'inherit',
          shell: true
        });
        
        viteBuild.on('close', (code) => {
          if (code === 0) {
            console.log('✓ Overlay build complete');
          } else {
            console.error('✗ Overlay build failed');
          }
        });
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
