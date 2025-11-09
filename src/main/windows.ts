/**
 * Window Manager
 * 
 * Creates and manages the main browser window.
 * Coordinates with tabs manager and renderer.
 */

import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { createTabsManager, TabsManager } from './tabs';
import { setTabsManager, setMainWindow } from './ipc';
import { getConfig } from './config';

let mainWindow: BrowserWindow | null = null;
let tabsManager: TabsManager | null = null;

/**
 * Create the main application window
 */
export async function createMainWindow(): Promise<BrowserWindow> {
  console.log('[Windows] Creating main window...');
  
  const config = getConfig();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Create window
  mainWindow = new BrowserWindow({
    width: Math.min(width, 1400),
    height: Math.min(height, 900),
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: 'finbro.me',
    backgroundColor: '#f0f0f0',
    show: false // Show after ready-to-show event
  });
  
  // Show window when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('[Windows] Window ready and visible');
  });
  
  // Load toolbar HTML
  const rendererPath = path.join(__dirname, '../renderer/index.html');
  console.log('[Windows] Loading renderer from:', rendererPath);
  
  await mainWindow.loadFile(rendererPath);
  
  // Create tabs manager with updated dimensions (no sidebar)
  const toolbarHeight = 46;  // Toolbar height (tabs only) - updated for glassmorphism
  const urlbarHeight = 48;   // URL bar height - updated for glassmorphism
  tabsManager = createTabsManager(mainWindow, toolbarHeight, urlbarHeight);
  setTabsManager(tabsManager);
  setMainWindow(mainWindow);
  
  // Open DevTools in debug mode
  if (config.debugMode) {
    mainWindow.webContents.openDevTools({ mode: 'right' });
  }
  
  // Set up window event handlers
  setupWindowHandlers(mainWindow, tabsManager);
  
  // Create startup tabs
  await createStartupTabs(tabsManager, config.startupTabs);
  
  console.log('[Windows] Main window created successfully');
  
  return mainWindow;
}

/**
 * Create tabs specified in config
 */
async function createStartupTabs(
  manager: TabsManager,
  urls: string[]
): Promise<void> {
  console.log('[Windows] Creating startup tabs:', urls.length);
  
  for (const url of urls) {
    try {
      await manager.createTab(url);
    } catch (error) {
      console.error('[Windows] Failed to create tab:', url, error);
    }
  }
  
  // Switch to first tab
  if (urls.length > 0) {
    manager.switchTo(0);
  }
}

/**
 * Set up window event handlers
 */
function setupWindowHandlers(
  window: BrowserWindow,
  manager: TabsManager
): void {
  // Handle resize
  window.on('resize', () => {
    manager.layoutAll();
  });
  
  // Handle close
  window.on('closed', () => {
    console.log('[Windows] Main window closed');
    manager.destroy();
    mainWindow = null;
    tabsManager = null;
  });
  
  // Handle focus
  window.on('focus', () => {
    if (getConfig().debugMode) {
      console.log('[Windows] Window focused');
    }
  });
  
  // Prevent navigation in the main window
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault();
    console.warn('[Windows] Navigation prevented in main window');
  });
}

// Removed unused exports: getMainWindow, getTabsManager (duplicate), closeAllWindows

