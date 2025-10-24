/**
 * Agent Bridge - WebSocket Client
 * 
 * Connects browser to cloud AI agent via WebSocket.
 * Receives tool calls, executes them, returns results.
 */

import WebSocket from 'ws';
import { ToolCall, ToolResult } from '../types/tool.types';
import { executeTool } from './tools/executor';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AgentBridgeConfig {
  url: string;
  token: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

/**
 * Agent Bridge - WebSocket connection to AI agent server
 */
export class AgentBridge {
  private ws: WebSocket | null = null;
  private config: AgentBridgeConfig;
  private state: ConnectionState = 'disconnected';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  
  constructor(config: AgentBridgeConfig) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 5000,
      ...config
    };
  }
  
  /**
   * Connect to the agent WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      console.log('[AgentBridge] Already connected or connecting');
      return;
    }
    
    this.setState('connecting');
    
    try {
      const url = this.buildUrl();
      console.log('[AgentBridge] Connecting to:', url);
      
      this.ws = new WebSocket(url);
      
      this.ws.on('open', this.onOpen.bind(this));
      this.ws.on('message', this.onMessage.bind(this));
      this.ws.on('error', this.onError.bind(this));
      this.ws.on('close', this.onClose.bind(this));
      
    } catch (error) {
      console.error('[AgentBridge] Connection failed:', error);
      this.setState('error');
      this.scheduleReconnect();
    }
  }
  
  /**
   * Disconnect from the agent server
   */
  disconnect(): void {
    console.log('[AgentBridge] Disconnecting...');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.setState('disconnected');
  }
  
  /**
   * Send data to the agent
   */
  send(data: any): void {
    if (this.state !== 'connected' || !this.ws) {
      console.error('[AgentBridge] Cannot send: not connected');
      return;
    }
    
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(payload);
  }
  
  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }
  
  // Private methods
  
  private buildUrl(): string {
    const { url, token } = this.config;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
  
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      console.log(`[AgentBridge] State: ${this.state} → ${newState}`);
      this.state = newState;
    }
  }
  
  private onOpen(): void {
    console.log('[AgentBridge] ✅ Connected to agent server!');
    this.setState('connected');
    this.reconnectAttempts = 0;
  }
  
  private async onMessage(data: WebSocket.Data): Promise<void> {
    try {
      const message = data.toString();
      console.log('[AgentBridge] 📥 Received:', message);
      
      const call: ToolCall = JSON.parse(message);
      
      console.log(`[AgentBridge] ⚙️  Executing tool: ${call.tool}`);
      
      // Execute the tool
      const result: ToolResult = await executeTool(call);
      
      console.log(`[AgentBridge] ✅ Tool result:`, result);
      
      // Send result back
      this.send(result);
      
    } catch (error) {
      console.error('[AgentBridge] ❌ Message handling error:', error);
      
      // Send error response
      this.send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private onError(error: Error): void {
    console.error('[AgentBridge] ❌ WebSocket error:', error);
    this.setState('error');
  }
  
  private onClose(code: number, reason: Buffer): void {
    const reasonStr = reason.toString();
    console.log(`[AgentBridge] Connection closed: ${code} - ${reasonStr}`);
    this.ws = null;
    this.setState('disconnected');
    
    // Don't reconnect on auth failure (4001)
    if (code === 4001) {
      console.error('[AgentBridge] Authentication failed - not reconnecting');
      return;
    }
    
    // Auto-reconnect if enabled
    this.scheduleReconnect();
  }
  
  private scheduleReconnect(): void {
    if (!this.config.autoReconnect) {
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[AgentBridge] Max reconnection attempts reached. Giving up.');
      return;
    }
    
    if (this.reconnectTimer) {
      return; // Already scheduled
    }
    
    this.reconnectAttempts++;
    
    // Exponential backoff: 5s, 10s, 20s, max 60s
    const delay = Math.min(
      (this.config.reconnectInterval || 5000) * Math.pow(2, this.reconnectAttempts - 1),
      60000
    );
    
    console.log(`[AgentBridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

// Singleton instance
let bridgeInstance: AgentBridge | null = null;

/**
 * Initialize the agent bridge
 */
export function initAgentBridge(config: AgentBridgeConfig): AgentBridge {
  if (bridgeInstance) {
    console.log('[AgentBridge] Already initialized');
    return bridgeInstance;
  }
  
  console.log('[AgentBridge] Initializing...');
  bridgeInstance = new AgentBridge(config);
  return bridgeInstance;
}

/**
 * Get the agent bridge instance
 */
export function getAgentBridge(): AgentBridge | null {
  return bridgeInstance;
}

