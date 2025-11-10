/**
 * Preload Script
 * 
 * Secure bridge between renderer and main process.
 * Exposes limited, type-safe API to renderer via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

// Inline IPC channel names (can't import types in preload)
const IpcChannel = {
  TABS_CREATE: 'tabs:create',
  TABS_SWITCH: 'tabs:switch',
  TABS_CLOSE: 'tabs:close',
  TABS_GET_CURRENT: 'tabs:getCurrent',
  TABS_GET_ALL: 'tabs:getAll',
  TABS_NAVIGATE: 'tabs:navigate',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  AUTH_SEND_TOKEN: 'auth:send-token',
} as const;

/**
 * Finbro API exposed to renderer
 * Accessible via window.Finbro in renderer process
 */
const finbroApi = {
  /**
   * Tab Management
   */
  tabs: {
    /**
     * Create a new tab
     */
    create: async (url: string): Promise<{ tabId: number }> => {
      return await ipcRenderer.invoke(IpcChannel.TABS_CREATE, { url });
    },
    
    /**
     * Switch to a tab
     */
    switch: async (tabId: number): Promise<void> => {
      return await ipcRenderer.invoke(IpcChannel.TABS_SWITCH, { tabId });
    },
    
    /**
     * Close a tab
     */
    close: async (tabId: number): Promise<void> => {
      return await ipcRenderer.invoke(IpcChannel.TABS_CLOSE, { tabId });
    },
    
    /**
     * Get current tab ID
     */
    getCurrent: async (): Promise<number> => {
      return await ipcRenderer.invoke(IpcChannel.TABS_GET_CURRENT);
    },
    
    /**
     * Get all tabs
     */
    getAll: async (): Promise<{ tabs: any[]; currentTabId: number }> => {
      return await ipcRenderer.invoke(IpcChannel.TABS_GET_ALL);
    },
    
    /**
     * Navigate tab to URL
     */
    navigate: async (tabId: number, url: string): Promise<void> => {
      return await ipcRenderer.invoke(IpcChannel.TABS_NAVIGATE, { tabId, url });
    }
  },
  
  /**
   * Configuration
   */
  config: {
    /**
     * Get configuration
     */
    get: async (): Promise<{ config: any }> => {
      return await ipcRenderer.invoke(IpcChannel.CONFIG_GET);
    },
    
    /**
     * Set configuration
     */
    set: async (config: any): Promise<void> => {
      return await ipcRenderer.invoke(IpcChannel.CONFIG_SET, { config });
    }
  },

  /**
   * Authentication (for finbro.me web app)
   */
  auth: {
    /**
     * Send JWT token from web app to Electron
     * @param token - JWT access token from Supabase (or null to logout)
     */
    sendAuthToken: async (token: string | null): Promise<void> => {
      return await ipcRenderer.invoke(IpcChannel.AUTH_SEND_TOKEN, { token });
    }
  },
  
  /**
   * Animation state listener
   */
  animation: {
    /**
     * Get current animation states
     */
    getStates: async (): Promise<{ states: Record<number, string> }> => {
      return await ipcRenderer.invoke('animation:get-states');
    },
    
    /**
     * Listen for animation state changes
     * @param callback - Called with object mapping tab IDs to their states
     */
    onStateChange: (callback: (states: Record<number, string>) => void): (() => void) => {
      const handler = (_event: any, states: Record<number, string>) => {
        callback(states);
      };
      ipcRenderer.on('animation:state-changed', handler);
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('animation:state-changed', handler);
      };
    }
  }
};

// Expose API to renderer
contextBridge.exposeInMainWorld('Finbro', finbroApi);

// Also expose as 'finbro' for web app compatibility
contextBridge.exposeInMainWorld('finbro', {
  sendAuthToken: async (token: string | null): Promise<void> => {
    return await ipcRenderer.invoke(IpcChannel.AUTH_SEND_TOKEN, { token });
  }
});

// Type declaration for TypeScript in renderer
export type FinbroApi = typeof finbroApi;
