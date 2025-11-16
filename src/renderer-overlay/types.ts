/**
 * Overlay Renderer Types
 * 
 * Type definitions for overlay React components.
 */

import { OverlayState } from '../types/overlay.types';

/**
 * Global API exposed by preload-overlay
 */
declare global {
  interface Window {
    OverlayAPI: {
      getState: (tabId: number) => Promise<OverlayState | null>;
      onUpdate: (callback: (state: OverlayState) => void) => () => void;
      stopAgent: (tabId: number) => Promise<void>;
    };
  }
}

export type { OverlayState };

