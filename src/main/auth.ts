/**
 * Authentication Manager
 * 
 * Manages JWT tokens and WebSocket authentication state.
 * Stores tokens in memory and coordinates with WebSocket client.
 */

import { connectWebSocket, disconnectWebSocket } from './websocket-client.js';

let currentToken: string | null = null;

export function handleAuthToken(token: string | null): void {
  if (token) {
    console.log('[Auth] ✅ Received JWT token');
    console.log('[Auth] Token (first 50 chars):', token.substring(0, 50) + '...');
    
    currentToken = token;
    console.log('[Auth] JWT stored in memory, ready for WebSocket');
    
    connectWebSocket(token);
    
  } else {
    console.log('');
    console.log('🚪 LOGOUT DETECTED 🚪');
    console.log('[Auth] Clearing token and disconnecting WebSocket');
    console.log('');
    
    currentToken = null;
    disconnectWebSocket();
    console.log('[Auth] ✅ JWT cleared successfully');
  }
}

export function getCurrentToken(): string | null {
  return currentToken;
}

export function isAuthenticated(): boolean {
  return currentToken !== null;
}

