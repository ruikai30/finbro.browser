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
  AUTOFILL_EXECUTE: 'autofill:execute',
  API_SYNC_PROFILE: 'api:syncProfile',
  API_SYNC_TARGETS: 'api:syncTargets',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
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
    }
  },
  
  /**
   * Autofill Operations
   */
  autofill: {
    /**
     * Execute autofill on current tab
     */
    execute: async (profile: any, tabId?: number): Promise<{
      success: boolean;
      fieldsFilled: number;
      errors?: string[];
    }> => {
      return await ipcRenderer.invoke(IpcChannel.AUTOFILL_EXECUTE, {
        profile,
        tabId
      });
    }
  },
  
  /**
   * API Sync
   */
  api: {
    /**
     * Sync profile from backend
     */
    syncProfile: async (): Promise<{ profile: any }> => {
      return await ipcRenderer.invoke(IpcChannel.API_SYNC_PROFILE);
    },
    
    /**
     * Sync target URLs from backend
     */
    syncTargets: async (): Promise<{ targets: any[] }> => {
      return await ipcRenderer.invoke(IpcChannel.API_SYNC_TARGETS);
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
  }
};

// Expose API to renderer
contextBridge.exposeInMainWorld('Finbro', finbroApi);

// Type declaration for TypeScript in renderer
export type FinbroApi = typeof finbroApi;

