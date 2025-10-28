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
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  TOOLS_EXECUTE: 'tools:execute',
  TOOLS_GET_ALL: 'tools:getAll',
  BRIDGE_CONNECT: 'bridge:connect',
  BRIDGE_DISCONNECT: 'bridge:disconnect',
  BRIDGE_STATUS: 'bridge:status',
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
   * Tool Operations (AI Agent)
   */
  tools: {
    /**
     * Execute a tool call
     */
    execute: async (call: any): Promise<any> => {
      return await ipcRenderer.invoke(IpcChannel.TOOLS_EXECUTE, call);
    },
    
    /**
     * Get all available tools with their schemas
     */
    getAll: async (): Promise<{ tools: any[] }> => {
      return await ipcRenderer.invoke(IpcChannel.TOOLS_GET_ALL);
    }
  },
  
  /**
   * Agent Bridge Controls
   */
  bridge: {
    /**
     * Manually connect to agent server
     */
    connect: async (): Promise<void> => {
      return await ipcRenderer.invoke(IpcChannel.BRIDGE_CONNECT);
    },
    
    /**
     * Manually disconnect from agent server
     */
    disconnect: async (): Promise<void> => {
      return await ipcRenderer.invoke(IpcChannel.BRIDGE_DISCONNECT);
    },
    
    /**
     * Get connection status
     */
    status: async (): Promise<{ state: string }> => {
      return await ipcRenderer.invoke(IpcChannel.BRIDGE_STATUS);
    },
    
    /**
     * Send a prompt to the AI agent
     */
    sendPrompt: async (prompt: string): Promise<void> => {
      // Using string literal due to TypeScript enum resolution issue
      return await ipcRenderer.invoke('bridge:sendPrompt', { prompt });
    }
  }
};

// Expose API to renderer
contextBridge.exposeInMainWorld('Finbro', finbroApi);

// Type declaration for TypeScript in renderer
export type FinbroApi = typeof finbroApi;

