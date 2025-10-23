/**
 * Tab Manager
 * 
 * Manages BrowserView instances (tabs) within the main window.
 * Handles creation, switching, layout, and code execution in tab contexts.
 */

import { BrowserWindow, BrowserView } from 'electron';
import { getConfigValue } from './config';

/**
 * Tab data structure
 */
interface Tab {
  id: number;
  view: BrowserView;
  url: string;
  title?: string;
}

/**
 * Tabs Manager
 * Singleton per window
 */
export class TabsManager {
  private tabs: Tab[] = [];
  private currentTabId: number = -1;
  private nextId: number = 0;
  private window: BrowserWindow;
  private toolbarHeight: number;

  constructor(window: BrowserWindow, toolbarHeight: number = 100) {
    this.window = window;
    this.toolbarHeight = toolbarHeight;
  }

  /**
   * Create a new tab
   * @param url - URL to load in the new tab
   * @returns Tab ID
   */
  async createTab(url: string): Promise<number> {
    const debugMode = getConfigValue('debugMode');
    
    if (debugMode) {
      console.log('[Tabs] Creating tab:', url);
    }
    
    // Create BrowserView with security settings
    const view = new BrowserView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        // Disable web security only in debug mode if needed
        webSecurity: !debugMode,
      }
    });
    
    // Add to window
    this.window.addBrowserView(view);
    
    // Create tab object
    const tab: Tab = {
      id: this.nextId++,
      view,
      url
    };
    
    this.tabs.push(tab);
    
    // Set up event listeners
    this.setupTabListeners(tab);
    
    // Load URL
    try {
      await view.webContents.loadURL(url);
      if (debugMode) {
        console.log('[Tabs] Tab', tab.id, 'loaded:', url);
      }
    } catch (error) {
      console.error('[Tabs] Failed to load URL:', url, error);
    }
    
    // Layout the tab
    this.layoutTab(tab);
    
    return tab.id;
  }

  /**
   * Switch to a specific tab
   * @param tabId - ID of the tab to switch to
   */
  switchTo(tabId: number): void {
    const tab = this.tabs.find(t => t.id === tabId);
    
    if (!tab) {
      console.error('[Tabs] Tab not found:', tabId);
      return;
    }
    
    // Set as top view (brings to front)
    this.window.setTopBrowserView(tab.view);
    this.currentTabId = tabId;
    
    // Re-layout to ensure proper bounds
    this.layoutTab(tab);
    
    if (getConfigValue('debugMode')) {
      console.log('[Tabs] Switched to tab', tabId, ':', tab.url);
    }
  }

  /**
   * Close a tab
   * @param tabId - ID of the tab to close
   */
  closeTab(tabId: number): void {
    const index = this.tabs.findIndex(t => t.id === tabId);
    
    if (index === -1) {
      console.error('[Tabs] Tab not found:', tabId);
      return;
    }
    
    const tab = this.tabs[index];
    
    // Remove from window
    this.window.removeBrowserView(tab.view);
    
    // Destroy the view
    (tab.view.webContents as any).destroy();
    
    // Remove from array
    this.tabs.splice(index, 1);
    
    console.log('[Tabs] Closed tab', tabId);
    
    // Switch to another tab if this was current
    if (this.currentTabId === tabId && this.tabs.length > 0) {
      this.switchTo(this.tabs[0]!.id);
    }
  }

  /**
   * Get current tab ID
   */
  getCurrentTabId(): number {
    return this.currentTabId;
  }

  /**
   * Get tab by ID
   */
  getTab(tabId: number): Tab | undefined {
    return this.tabs.find(t => t.id === tabId);
  }

  /**
   * Get all tabs
   */
  getAllTabs(): Tab[] {
    return [...this.tabs];
  }

  /**
   * Get tab info for renderer (simplified data)
   */
  getTabInfo(): Array<{ id: number; url: string; title?: string }> {
    return this.tabs.map(tab => ({
      id: tab.id,
      url: tab.url,
      title: tab.title
    }));
  }

  /**
   * Get tab URL
   */
  getTabUrl(tabId: number): string {
    const tab = this.getTab(tabId);
    return tab?.url || '';
  }

  /**
   * Execute JavaScript code in a tab's context
   * @param tabId - Tab ID
   * @param code - JavaScript code to execute
   * @returns Result of execution
   */
  async executeInTab(tabId: number, code: string): Promise<any> {
    const tab = this.getTab(tabId);
    
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }
    
    if (getConfigValue('debugMode')) {
      console.log('[Tabs] Executing code in tab', tabId);
    }
    
    try {
      const result = await tab.view.webContents.executeJavaScript(code, true);
      return result;
    } catch (error) {
      console.error('[Tabs] Execution error:', error);
      throw error;
    }
  }

  /**
   * Layout a specific tab
   */
  private layoutTab(tab: Tab): void {
    const contentSize = this.window.getContentSize();
    const width = contentSize[0] || 1024;
    const height = contentSize[1] || 768;
    
    tab.view.setBounds({
      x: 0,
      y: this.toolbarHeight,
      width: width,
      height: height - this.toolbarHeight
    });
  }

  /**
   * Layout all tabs (called on window resize)
   */
  layoutAll(): void {
    for (const tab of this.tabs) {
      this.layoutTab(tab);
    }
  }

  /**
   * Set up event listeners for a tab
   */
  private setupTabListeners(tab: Tab): void {
    const { webContents } = tab.view;
    
    // Track title changes
    webContents.on('page-title-updated', (event, title) => {
      tab.title = title;
      if (getConfigValue('debugMode')) {
        console.log('[Tabs] Tab', tab.id, 'title:', title);
      }
    });
    
    // Track navigation
    webContents.on('did-navigate', (event, url) => {
      tab.url = url;
      if (getConfigValue('debugMode')) {
        console.log('[Tabs] Tab', tab.id, 'navigated to:', url);
      }
    });
    
    // Log console messages in debug mode
    if (getConfigValue('debugMode')) {
      webContents.on('console-message', (event, level, message) => {
        console.log(`[Tab ${tab.id}]:`, message);
      });
    }
    
    // Handle errors
    webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('[Tabs] Tab', tab.id, 'failed to load:', errorDescription);
    });
  }

  /**
   * Clean up all tabs
   */
  destroy(): void {
    console.log('[Tabs] Destroying all tabs');
    
    for (const tab of this.tabs) {
      this.window.removeBrowserView(tab.view);
      (tab.view.webContents as any).destroy();
    }
    
    this.tabs = [];
    this.currentTabId = -1;
  }
}

/**
 * Create and manage tabs for a window
 */
export function createTabsManager(
  window: BrowserWindow,
  toolbarHeight?: number
): TabsManager {
  return new TabsManager(window, toolbarHeight);
}

