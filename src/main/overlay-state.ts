/**
 * Overlay State Management
 * 
 * Manages overlay state for all tabs in main process.
 * Single source of truth for overlay visibility and type.
 */

import { OverlayState } from '../types/overlay.types';
import { getTabsManager } from './ipc';

/**
 * Map of tab ID to overlay state
 */
const overlayStates = new Map<number, OverlayState>();

/**
 * Get overlay state for a specific tab
 */
export function getOverlayState(tabId: number): OverlayState | null {
  return overlayStates.get(tabId) || null;
}

/**
 * Update overlay state for a specific tab
 * Automatically notifies the overlay view if it exists
 */
export function updateOverlayState(tabId: number, state: Partial<OverlayState>): void {
  const current = overlayStates.get(tabId) || { type: null, visible: false };
  const updated = { ...current, ...state };
  overlayStates.set(tabId, updated);
  
  // Push update to overlay view if it exists
  notifyOverlay(tabId, updated);
}

/**
 * Delete overlay state for a tab (called when tab is closed)
 */
export function deleteOverlayState(tabId: number): void {
  overlayStates.delete(tabId);
}

/**
 * Push state update to overlay view via IPC
 */
function notifyOverlay(tabId: number, state: OverlayState): void {
  const tabsManager = getTabsManager();
  if (!tabsManager) return;
  
  const tab = tabsManager.getTab(tabId);
  if (tab?.overlayView && !tab.overlayView.webContents.isDestroyed()) {
    tab.overlayView.webContents.send('overlay:update', state);
  }
}

