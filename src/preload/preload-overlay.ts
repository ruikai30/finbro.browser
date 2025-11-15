/**
 * Preload Script for Overlay
 * 
 * Secure bridge between overlay renderer and main process.
 * Exposes limited, type-safe API for overlay state management.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { OverlayState } from '../types/overlay.types';

/**
 * Overlay API exposed to renderer
 * Accessible via window.OverlayAPI in overlay renderer process
 */
const overlayApi = {
  /**
   * Get initial overlay state for this tab
   * @param tabId - Tab ID from query parameter
   */
  getState: async (tabId: number): Promise<OverlayState | null> => {
    const response = await ipcRenderer.invoke('overlay:get-state', { tabId });
    return response.state;
  },
  
  /**
   * Listen for real-time overlay state updates
   * @param callback - Called when overlay state changes
   * @returns Cleanup function to remove listener
   */
  onUpdate: (callback: (state: OverlayState) => void): (() => void) => {
    const handler = (_event: any, state: OverlayState) => {
      callback(state);
    };
    ipcRenderer.on('overlay:update', handler);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('overlay:update', handler);
    };
  }
};

// Expose API to overlay renderer
contextBridge.exposeInMainWorld('OverlayAPI', overlayApi);

// Type declaration for TypeScript in renderer
export type OverlayAPI = typeof overlayApi;