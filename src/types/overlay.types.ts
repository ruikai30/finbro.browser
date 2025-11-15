/**
 * Overlay Type Definitions
 * 
 * Shared types between main process and overlay renderer.
 */

/**
 * Overlay state for a single tab
 */
export interface OverlayState {
  type: 'purple_glow' | null;
  visible: boolean;
}

/**
 * IPC request/response types
 */
export interface OverlayGetStateRequest {
  tabId: number;
}

export interface OverlayGetStateResponse {
  state: OverlayState | null;
}

