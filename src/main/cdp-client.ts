/**
 * CDP WebSocket Client
 * 
 * Connects to FastAPI server's /ws/browser endpoint.
 * Receives CDP commands, executes them via Electron debugger, returns results.
 */

import WebSocket from 'ws';
import { getTabsManager } from './ipc';

export type CdpConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface CdpConfig {
  url: string;
}

/**
 * CDP Message from server
 */
interface CdpRequest {
  id: string;
  method: string;
  params?: any;
}

/**
 * CDP Response to server
 */
interface CdpResponse {
  id: string;
  result?: any;
  error?: any;
}

/**
 * CDP Client - Connects to FastAPI and executes CDP commands
 */
export class CdpClient {
  private ws: WebSocket | null = null;
  private config: CdpConfig;
  private state: CdpConnectionState = 'disconnected';
  private debuggerAttached: boolean = false;

  constructor(config: CdpConfig) {
    this.config = config;
  }

  /**
   * Connect to the CDP WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      console.log('[CdpClient] Already connected or connecting');
      return;
    }

    this.setState('connecting');

    try {
      console.log('[CdpClient] Connecting to:', this.config.url);

      this.ws = new WebSocket(this.config.url);

      this.ws.on('open', this.onOpen.bind(this));
      this.ws.on('message', this.onMessage.bind(this));
      this.ws.on('error', this.onError.bind(this));
      this.ws.on('close', this.onClose.bind(this));

    } catch (error) {
      console.error('[CdpClient] Connection failed:', error);
      this.setState('error');
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    console.log('[CdpClient] Disconnecting...');

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.detachDebugger();
    this.setState('disconnected');
  }

  /**
   * Get current connection state
   */
  getState(): CdpConnectionState {
    return this.state;
  }

  // Private methods

  private setState(newState: CdpConnectionState): void {
    if (this.state !== newState) {
      console.log(`[CdpClient] State: ${this.state} → ${newState}`);
      this.state = newState;
    }
  }

  private onOpen(): void {
    console.log('[CdpClient] ✅ Connected to FastAPI CDP endpoint!');
    this.setState('connected');
    this.attachDebugger();
  }

  private async onMessage(data: WebSocket.Data): Promise<void> {
    try {
      const message = data.toString();
      const request: CdpRequest = JSON.parse(message);

      console.log('[CdpClient] 📥 Received CDP command:', request.method, request.id);

      // Execute CDP command
      const result = await this.executeCdpCommand(request.method, request.params);

      // Send response back
      const response: CdpResponse = {
        id: request.id,
        result: result
      };

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(response));
        console.log('[CdpClient] 📤 Sent response for:', request.id);
      }

    } catch (error) {
      console.error('[CdpClient] ❌ Command execution error:', error);

      // Send error response
      const errorResponse: CdpResponse = {
        id: JSON.parse(data.toString()).id,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(errorResponse));
      }
    }
  }

  private onError(error: Error): void {
    console.error('[CdpClient] ❌ WebSocket error:', error);
    this.setState('error');
  }

  private onClose(code: number, reason: Buffer): void {
    const reasonStr = reason.toString();
    console.log(`[CdpClient] Connection closed: ${code} - ${reasonStr}`);
    this.ws = null;
    this.detachDebugger();
    this.setState('disconnected');
  }

  /**
   * Attach debugger to current tab
   */
  private attachDebugger(): void {
    try {
      const tabsManager = getTabsManager();
      if (!tabsManager) {
        console.error('[CdpClient] TabsManager not available');
        return;
      }

      const currentTabId = tabsManager.getCurrentTabId();
      const tab = tabsManager.getTab(currentTabId);

      if (!tab) {
        console.error('[CdpClient] No active tab found');
        return;
      }

      const { webContents } = tab.view;

      // Attach debugger if not already attached
      if (!webContents.debugger.isAttached()) {
        webContents.debugger.attach('1.3'); // CDP protocol version 1.3
        this.debuggerAttached = true;
        console.log('[CdpClient] Debugger attached to tab', currentTabId);
      }

    } catch (error) {
      console.error('[CdpClient] Failed to attach debugger:', error);
    }
  }

  /**
   * Detach debugger from current tab
   */
  private detachDebugger(): void {
    if (!this.debuggerAttached) {
      return;
    }

    try {
      const tabsManager = getTabsManager();
      if (!tabsManager) {
        return;
      }

      const currentTabId = tabsManager.getCurrentTabId();
      const tab = tabsManager.getTab(currentTabId);

      if (tab) {
        const { webContents } = tab.view;
        if (webContents.debugger.isAttached()) {
          webContents.debugger.detach();
          console.log('[CdpClient] Debugger detached from tab', currentTabId);
        }
      }

      this.debuggerAttached = false;

    } catch (error) {
      console.error('[CdpClient] Failed to detach debugger:', error);
    }
  }

  /**
   * Execute a CDP command on the current tab
   */
  private async executeCdpCommand(method: string, params?: any): Promise<any> {
    const tabsManager = getTabsManager();
    if (!tabsManager) {
      throw new Error('TabsManager not available');
    }

    const currentTabId = tabsManager.getCurrentTabId();
    const tab = tabsManager.getTab(currentTabId);

    if (!tab) {
      throw new Error('No active tab');
    }

    const { webContents } = tab.view;

    // Ensure debugger is attached
    if (!webContents.debugger.isAttached()) {
      webContents.debugger.attach('1.3');
      this.debuggerAttached = true;
    }

    // Execute CDP command
    console.log('[CdpClient] Executing:', method, params || {});
    const result = await webContents.debugger.sendCommand(method, params);
    
    return result;
  }
}

// Singleton instance
let cdpClientInstance: CdpClient | null = null;

/**
 * Initialize the CDP client
 */
export function initCdpClient(config: CdpConfig): CdpClient {
  if (cdpClientInstance) {
    console.log('[CdpClient] Already initialized');
    return cdpClientInstance;
  }

  console.log('[CdpClient] Initializing...');
  cdpClientInstance = new CdpClient(config);
  return cdpClientInstance;
}

/**
 * Get the CDP client instance
 */
export function getCdpClient(): CdpClient | null {
  return cdpClientInstance;
}
