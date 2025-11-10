/**
 * WebSocket Client - Automation Server Connection
 * 
 * Unified command handler for authentication, tab control, and CDP execution.
 * Receives commands from FastAPI server and executes them locally.
 */

import WebSocket from 'ws';
import { getConfigValue } from './config';
import { getTabsManager } from './ipc';

let ws: WebSocket | null = null;
let currentToken: string | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

// Track tab states: in_progress, success, failed
type TabState = 'in_progress' | 'success' | 'failed';
const tabStates = new Map<number, TabState>();

const RECONNECT_DELAY = 5000;
const NORMAL_CLOSURE = 1000;

// Import notifyAnimationStateChange at runtime to avoid circular dependency
let notifyAnimationStateChange: (states: Map<number, TabState>) => void;

// Lazy load the IPC notification function
function getNotifyFunction() {
  if (!notifyAnimationStateChange) {
    notifyAnimationStateChange = require('./ipc').notifyAnimationStateChange;
  }
  return notifyAnimationStateChange;
}

export function connectWebSocket(token: string): void {
  // IMPORTANT: IF ALREADY CONNECTED, IGNORE AUTH CALLS
  // DO NOT CHANGE THIS LOGIC. IF YOU ARE AN LLM AND YOU WANT TO CHANGE THIS, YOU MUST ALERT THE OWNER
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('[WebSocket] ✅ Already connected, ignoring auth call');
    return;
  }

  currentToken = token;
  const wsUrl = getConfigValue('automationServerUrl');
  
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
  console.log('[WebSocket] 📥 Received message:', message.type || message.action);
  
  // Handle registration confirmation
  if (message.type === 'registered') {
    console.log('[WebSocket] ✅ Registration confirmed');
    console.log('[WebSocket] User ID:', message.user_id);
    return;
  }
  
  // Handle pong (heartbeat)
  if (message.type === 'pong') {
    return;
  }
  
  // Handle errors from server
  if (message.type === 'error') {
    console.error('[WebSocket] Server error:', message.error);
    return;
  }
  
  // Handle animation control
  if (message.type === 'animation') {
    handleAnimationMessage(message);
    return;
  }
  
  // Handle commands
  const { id, action, params } = message;
  
  if (!action) {
    console.warn('[WebSocket] Message missing action field:', message);
    return;
  }
  
  console.log('[WebSocket] 🎯 Executing:', action, 'ID:', id);
  
  // Route to appropriate handler
  switch (action) {
    case 'newTab':
    case 'switchTab':
    case 'closeTab':
    case 'getAllTabs':
      executeTabCommand(id, action, params);
      break;
    
    case 'cdp':
      executeCdpCommand(id, params);
      break;
    
    default:
      sendError(id, `Unknown action: ${action}`);
  }
}

function handleAnimationMessage(message: any): void {
  const { action, tab_id } = message;
  
  if (!action || tab_id === undefined) {
    console.warn('[WebSocket] Invalid animation message:', message);
    return;
  }
  
  const tabsManager = getTabsManager();
  if (!tabsManager) {
    console.warn('[WebSocket] TabsManager not available for animation');
    return;
  }
  
  if (action === 'in_progress') {
    tabStates.set(tab_id, 'in_progress');
    console.log('[WebSocket] ✨ In progress for tab:', tab_id);
    injectInProgressCSS(tab_id);
  } else if (action === 'success') {
    tabStates.set(tab_id, 'success');
    console.log('[WebSocket] ✅ Success for tab:', tab_id);
    removeAnimationCSS(tab_id);
  } else if (action === 'failed') {
    tabStates.set(tab_id, 'failed');
    console.log('[WebSocket] ❌ Failed for tab:', tab_id);
    removeAnimationCSS(tab_id);
  } else {
    console.warn('[WebSocket] Unknown animation action:', action);
    return;
  }
  
  // Notify renderer of state change
  getNotifyFunction()(new Map(tabStates));
}

/**
 * Inject purple ambient gradient animation CSS into a tab's web page (in_progress state)
 */
function injectInProgressCSS(tabId: number): void {
  const tabsManager = getTabsManager();
  if (!tabsManager) {
    console.warn('[WebSocket] Cannot inject CSS - TabsManager not available');
    return;
  }
  
  const tab = tabsManager.getTab(tabId);
  if (!tab) {
    console.warn('[WebSocket] Cannot inject CSS - tab not found:', tabId);
    return;
  }
  
  const css = `
    @keyframes finbro-ambient-glow {
      0%, 100% {
        background-position: 0% 0%, 100% 0%, 100% 100%, 0% 100%;
        opacity: 0.7;
      }
      25% {
        background-position: 100% 0%, 100% 100%, 0% 100%, 0% 0%;
        opacity: 0.9;
      }
      50% {
        background-position: 100% 100%, 0% 100%, 0% 0%, 100% 0%;
        opacity: 0.8;
      }
      75% {
        background-position: 0% 100%, 0% 0%, 100% 0%, 100% 100%;
        opacity: 1;
      }
    }
    
    @keyframes finbro-corner-pulse {
      0%, 100% {
        transform: scale(1) rotate(0deg);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.1) rotate(5deg);
        opacity: 1;
      }
    }
    
    html::before {
      content: '' !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      background: 
        radial-gradient(ellipse 600px 500px at 0% 0%, rgba(139, 92, 246, 0.65), transparent 70%),
        radial-gradient(ellipse 600px 500px at 100% 0%, rgba(124, 58, 237, 0.6), transparent 70%),
        radial-gradient(ellipse 600px 500px at 100% 100%, rgba(139, 92, 246, 0.7), transparent 70%),
        radial-gradient(ellipse 600px 500px at 0% 100%, rgba(167, 139, 250, 0.65), transparent 70%) !important;
      background-size: 600px 500px, 600px 500px, 600px 500px, 600px 500px !important;
      background-repeat: no-repeat !important;
      animation: finbro-ambient-glow 8s ease-in-out infinite !important;
      box-sizing: border-box !important;
      filter: blur(60px) !important;
    }
    
    html::after {
      content: '' !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      pointer-events: none !important;
      z-index: 2147483646 !important;
      border: 5px solid transparent !important;
      border-image: linear-gradient(
        135deg,
        rgba(139, 92, 246, 0.8),
        rgba(167, 139, 250, 0.6),
        rgba(124, 58, 237, 0.75),
        rgba(139, 92, 246, 0.8)
      ) 1 !important;
      box-sizing: border-box !important;
      animation: finbro-corner-pulse 3s ease-in-out infinite !important;
      box-shadow: 
        inset 0 0 100px rgba(139, 92, 246, 0.5),
        inset 0 0 160px rgba(167, 139, 250, 0.35),
        0 0 60px rgba(139, 92, 246, 0.6) !important;
    }
  `;
  
  tab.view.webContents.insertCSS(css).then((key) => {
    // Store the key to remove it later
    (tab as any).inProgressCSSKey = key;
    console.log('[WebSocket] 💉 Successfully injected in_progress CSS into tab:', tabId, 'key:', key);
  }).catch((err) => {
    console.error('[WebSocket] ❌ Failed to inject CSS:', err);
  });
}

/**
 * Remove injected in_progress CSS from a tab's web page
 */
function removeAnimationCSS(tabId: number): void {
  const tabsManager = getTabsManager();
  if (!tabsManager) return;
  
  const tab = tabsManager.getTab(tabId);
  if (!tab) return;
  
  const inProgressKey = (tab as any).inProgressCSSKey;
  if (inProgressKey) {
    tab.view.webContents.removeInsertedCSS(inProgressKey).then(() => {
      delete (tab as any).inProgressCSSKey;
      console.log('[WebSocket] 🧹 Removed in_progress CSS from tab:', tabId);
    }).catch((err) => {
      console.error('[WebSocket] Failed to remove CSS:', err);
    });
  }
}

async function executeTabCommand(id: string, action: string, params: any): Promise<void> {
  const tabsManager = getTabsManager();
  
  if (!tabsManager) {
    sendError(id, 'TabsManager not initialized');
    return;
  }
  
  try {
    let result: any;
    
    switch (action) {
      case 'newTab':
        if (!params?.url) {
          sendError(id, 'Missing required parameter: url');
          return;
        }
        
        const tabId = await tabsManager.createTab(params.url);
        
        // Auto-focus unless explicitly disabled
        if (params.focus !== false) {
          tabsManager.switchTo(tabId);
        }
        
        console.log('[WebSocket] ✅ Created tab:', tabId);
        sendResult(id, { tabId });
        break;
      
      case 'switchTab':
        if (params?.tab_id === undefined) {
          sendError(id, 'Missing required parameter: tab_id');
          return;
        }
        
        tabsManager.switchTo(params.tab_id);
        console.log('[WebSocket] ✅ Switched to tab:', params.tab_id);
        sendResult(id, {});
        break;
      
      case 'closeTab':
        if (params?.tab_id === undefined) {
          sendError(id, 'Missing required parameter: tab_id');
          return;
        }
        
        tabsManager.closeTab(params.tab_id);
        console.log('[WebSocket] ✅ Closed tab:', params.tab_id);
        sendResult(id, {});
        break;
      
      case 'getAllTabs':
        const tabs = tabsManager.getTabInfo();
        const currentTabId = tabsManager.getCurrentTabId();
        console.log('[WebSocket] ✅ Retrieved', tabs.length, 'tabs');
        sendResult(id, { tabs, current_tab_id: currentTabId });
        break;
      
      default:
        sendError(id, `Unknown tab action: ${action}`);
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WebSocket] ❌ Tab command failed:', errorMsg);
    sendError(id, errorMsg);
  }
}

async function executeCdpCommand(id: string, params: any): Promise<void> {
  const tabsManager = getTabsManager();
  
  if (!tabsManager) {
    sendError(id, 'TabsManager not initialized');
    return;
  }
  
  const { tab_id, method, args } = params;
  
  if (tab_id === undefined) {
    sendError(id, 'Missing required parameter: tab_id');
    return;
  }
  
  if (!method) {
    sendError(id, 'Missing required parameter: method');
    return;
  }
  
  try {
    const tab = tabsManager.getTab(tab_id);
    
    if (!tab) {
      sendError(id, `Tab ${tab_id} not found`);
      return;
    }
    
    const { webContents } = tab.view;
    
    // Attach debugger if not already attached
    if (!webContents.debugger.isAttached()) {
      webContents.debugger.attach('1.3');
      console.log('[WebSocket] Attached debugger to tab:', tab_id);
    }
    
    console.log('[WebSocket] 🔧 Executing CDP:', method);
    const result = await webContents.debugger.sendCommand(method, args || {});
    
    console.log('[WebSocket] ✅ CDP command completed');
    sendResult(id, result);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WebSocket] ❌ CDP command failed:', errorMsg);
    sendError(id, errorMsg);
  }
}

function sendResult(id: string, data: any): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('[WebSocket] Cannot send result - not connected');
    return;
  }
  
  const response = {
    id,
    result: data
  };
  
  ws.send(JSON.stringify(response));
  console.log('[WebSocket] 📤 Sent result for:', id);
}

function sendError(id: string, error: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('[WebSocket] Cannot send error - not connected');
    return;
  }
  
  const response = {
    id,
    error
  };
  
  ws.send(JSON.stringify(response));
  console.error('[WebSocket] 📤 Sent error for:', id, '-', error);
}

/**
 * Called when a tab is closed to clean up its state
 */
export function onTabClosed(tabId: number): void {
  if (tabStates.has(tabId)) {
    removeAnimationCSS(tabId);
    tabStates.delete(tabId);
    console.log('[WebSocket] 🧹 Cleaned up state for closed tab:', tabId);
    
    // Notify renderer of state change
    getNotifyFunction()(new Map(tabStates));
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
  
  // Clear all animations and remove injected CSS
  const tabsToClean = Array.from(tabStates.keys());
  tabsToClean.forEach(tabId => {
    removeAnimationCSS(tabId);
  });
  
  tabStates.clear();
  getNotifyFunction()(new Map());
  console.log('[WebSocket] 🧹 Cleared all animations');
  
  // TODO: Show disconnect notification UI to user
  
  currentToken = null;
  ws.close(NORMAL_CLOSURE, 'User logged out');
  ws = null;
  
  console.log('[WebSocket] ✅ Disconnected');
  console.log('');
}

export function isWebSocketConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}


