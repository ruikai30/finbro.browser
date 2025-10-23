/**
 * Main Process Entry Point
 * 
 * Electron application lifecycle management.
 * This is the first file that runs when the app starts.
 */

import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './windows';
import { registerIpcHandlers } from './ipc';
import { getConfig } from './config';

console.log('='.repeat(60));
console.log('Finbro Browser - Starting');
console.log('Version:', app.getVersion());
console.log('Electron:', process.versions.electron);
console.log('Chrome:', process.versions.chrome);
console.log('Node:', process.versions.node);
console.log('='.repeat(60));

/**
 * App Ready Handler
 * Called when Electron has finished initialization
 */
app.whenReady().then(async () => {
  console.log('[Main] App ready, initializing...');
  
  // Log configuration
  const config = getConfig();
  console.log('[Main] Debug mode:', config.debugMode);
  console.log('[Main] API URL:', config.apiBaseUrl);
  console.log('[Main] Startup tabs:', config.startupTabs.length);
  
  // Register IPC handlers
  registerIpcHandlers();
  
  // Create main window
  await createMainWindow();
  
  console.log('[Main] Initialization complete');
  
  // On macOS, re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[Main] Activate event - creating window');
      createMainWindow();
    }
  });
});

/**
 * Window All Closed Handler
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  console.log('[Main] All windows closed');
  
  // On macOS, apps typically stay active until user quits explicitly
  if (process.platform !== 'darwin') {
    console.log('[Main] Quitting app');
    app.quit();
  }
});

/**
 * Before Quit Handler
 * Clean up before app quits
 */
app.on('before-quit', () => {
  console.log('[Main] App shutting down...');
});

/**
 * Will Quit Handler
 * Final cleanup
 */
app.on('will-quit', () => {
  console.log('[Main] App quit');
});

/**
 * Unhandled Error Handlers
 */
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled rejection at:', promise, 'reason:', reason);
});

/**
 * Security: Prevent window creation from renderer
 */
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navEvent, navigationUrl) => {
    // Allow navigation in BrowserViews (tabs)
    // This is handled per-view in tabs.ts
  });
  
  contents.setWindowOpenHandler(() => {
    // Prevent new windows from being opened
    console.warn('[Security] Prevented window.open() call');
    return { action: 'deny' };
  });
});

console.log('[Main] Main process initialized, waiting for app ready...');

