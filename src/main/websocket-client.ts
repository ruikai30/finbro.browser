/**
 * WebSocket Client - Automation Server Connection
 * 
 * Connects to FastAPI backend with JWT authentication.
 * Handles job messages and sends results back.
 */

import WebSocket from 'ws';
import { getConfigValue } from './config';

let ws: WebSocket | null = null;
let currentToken: string | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

const RECONNECT_DELAY = 5000;
const NORMAL_CLOSURE = 1000;

export function connectWebSocket(token: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('[WebSocket] Already connected, disconnecting old connection...');
    disconnectWebSocket();
  }

  currentToken = token;
  const wsUrl = getConfigValue('cdpWebSocketUrl');
  
  console.log('[WebSocket] 🔌 Connecting to automation server...');
  console.log('[WebSocket] URL:', wsUrl);
  
  try {
    ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('[WebSocket] ✅ Connection established');
      
      const registrationMsg = {
        type: 'register',
        token: currentToken
      };
      
      ws!.send(JSON.stringify(registrationMsg));
      console.log('[WebSocket] 📤 Sent registration message');
    });
    
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        handleServerMessage(message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    });
    
    ws.on('close', (code: number, reason: string) => {
      console.log('[WebSocket] 🔌 Connection closed');
      console.log('[WebSocket] Code:', code, 'Reason:', reason.toString());
      
      if (currentToken && code !== NORMAL_CLOSURE) {
        console.log(`[WebSocket] Will attempt reconnect in ${RECONNECT_DELAY / 1000} seconds...`);
        reconnectTimeout = setTimeout(() => {
          if (currentToken) {
            connectWebSocket(currentToken);
          }
        }, RECONNECT_DELAY);
      }
    });
    
    ws.on('error', (error: Error) => {
      console.error('[WebSocket] ❌ Error:', error.message);
    });
    
  } catch (error) {
    console.error('[WebSocket] Failed to connect:', error);
  }
}

function handleServerMessage(message: any): void {
  console.log('[WebSocket] 📥 Received message:', message.type);
  
  switch (message.type) {
    case 'registered':
      console.log('[WebSocket] ✅ Registration confirmed');
      console.log('[WebSocket] User ID:', message.user_id);
      break;
    
    case 'job':
      console.log('[WebSocket] 🎯 Job received:', message.job_id);
      console.log('[WebSocket] Action:', message.action);
      // TODO: Phase 5 - Route to job executor
      break;
    
    case 'pong':
      break;
    
    case 'error':
      console.error('[WebSocket] Server error:', message.error);
      break;
    
    default:
      console.warn('[WebSocket] Unknown message type:', message.type);
  }
}

export function disconnectWebSocket(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  if (!ws) {
    console.log('[WebSocket] No active connection');
    return;
  }
  
  console.log('[WebSocket] 🔌 Disconnecting from automation server...');
  
  currentToken = null;
  ws.close(NORMAL_CLOSURE, 'User logged out');
  ws = null;
  
  console.log('[WebSocket] ✅ Disconnected');
  console.log('');
}

export function isWebSocketConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

export function sendJobResult(jobId: string, status: 'success' | 'error', data: any): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('[WebSocket] Cannot send result - not connected');
    return;
  }
  
  const message = {
    type: 'job_result',
    job_id: jobId,
    status,
    data
  };
  
  ws.send(JSON.stringify(message));
  console.log('[WebSocket] 📤 Sent job result:', jobId, status);
}

