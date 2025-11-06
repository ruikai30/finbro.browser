/**
 * IPC Handlers
 * 
 * Registers handlers for inter-process communication between renderer and main.
 * Type-safe routing using IpcChannel enum.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IpcChannel, BridgeSendPromptRequest } from '../types/ipc.types';
import { TabsManager } from './tabs';
import { getConfig, setConfig } from './config';
import { ToolCall } from '../types/tool.types';
import { executeTool, setTabsManagerGetter } from './tools/executor';
import { getAllToolDefinitions } from './tools/registry';
import { getAgentBridge } from './agent-bridge';
import { getCdpClient } from './cdp-client';

// TabsManager instance (set by windows.ts)
let tabsManager: TabsManager | null = null;

/**
 * Set the tabs manager instance
 * Called by windows.ts after creating the window
 */
export function setTabsManager(manager: TabsManager): void {
  tabsManager = manager;
  
  // Also set up the getter for tools
  setTabsManagerGetter(() => tabsManager);
}

/**
 * Get the tabs manager instance (for other modules)
 */
export function getTabsManager(): TabsManager | null {
  return tabsManager;
}

/**
 * Register all IPC handlers
 * Called once at app startup
 */
export function registerIpcHandlers(): void {
  console.log('[IPC] Registering handlers...');
  
  // Tab Management
  ipcMain.handle(IpcChannel.TABS_CREATE, handleTabCreate);
  ipcMain.handle(IpcChannel.TABS_SWITCH, handleTabSwitch);
  ipcMain.handle(IpcChannel.TABS_CLOSE, handleTabClose);
  ipcMain.handle(IpcChannel.TABS_GET_CURRENT, handleTabGetCurrent);
  ipcMain.handle(IpcChannel.TABS_GET_ALL, handleTabGetAll);
  ipcMain.handle(IpcChannel.TABS_NAVIGATE, handleTabNavigate);
  
  // Configuration
  ipcMain.handle(IpcChannel.CONFIG_GET, handleConfigGet);
  ipcMain.handle(IpcChannel.CONFIG_SET, handleConfigSet);
  
  // Tool Operations
  ipcMain.handle(IpcChannel.TOOLS_EXECUTE, handleToolExecute);
  ipcMain.handle(IpcChannel.TOOLS_GET_ALL, handleToolsGetAll);
  
  // Agent Bridge Controls
  ipcMain.handle(IpcChannel.BRIDGE_CONNECT, handleBridgeConnect);
  ipcMain.handle(IpcChannel.BRIDGE_DISCONNECT, handleBridgeDisconnect);
  ipcMain.handle(IpcChannel.BRIDGE_STATUS, handleBridgeStatus);
  ipcMain.handle(IpcChannel.BRIDGE_SEND_PROMPT, handleBridgeSendPrompt);
  
  // CDP WebSocket Client Controls
  ipcMain.handle(IpcChannel.CDP_CONNECT, handleCdpConnect);
  ipcMain.handle(IpcChannel.CDP_DISCONNECT, handleCdpDisconnect);
  ipcMain.handle(IpcChannel.CDP_STATUS, handleCdpStatus);
  
  console.log('[IPC] All handlers registered');
}

/**
 * Tab Handlers
 */

async function handleTabCreate(
  event: IpcMainInvokeEvent,
  args: { url: string }
): Promise<{ tabId: number }> {
  if (!tabsManager) {
    throw new Error('TabsManager not initialized');
  }
  
  console.log('[IPC] tabs:create -', args.url);
  
  const tabId = await tabsManager.createTab(args.url);
  return { tabId };
}

async function handleTabSwitch(
  event: IpcMainInvokeEvent,
  args: { tabId: number }
): Promise<void> {
  if (!tabsManager) {
    throw new Error('TabsManager not initialized');
  }
  
  console.log('[IPC] tabs:switch -', args.tabId);
  
  tabsManager.switchTo(args.tabId);
}

async function handleTabClose(
  event: IpcMainInvokeEvent,
  args: { tabId: number }
): Promise<void> {
  if (!tabsManager) {
    throw new Error('TabsManager not initialized');
  }
  
  console.log('[IPC] tabs:close -', args.tabId);
  
  tabsManager.closeTab(args.tabId);
}

async function handleTabGetCurrent(
  event: IpcMainInvokeEvent
): Promise<number> {
  if (!tabsManager) {
    throw new Error('TabsManager not initialized');
  }
  
  return tabsManager.getCurrentTabId();
}

async function handleTabNavigate(
  event: IpcMainInvokeEvent,
  args: { tabId: number; url: string }
): Promise<void> {
  if (!tabsManager) {
    throw new Error('TabsManager not initialized');
  }
  
  console.log('[IPC] tabs:navigate -', args.tabId, args.url);
  
  await tabsManager.navigateTab(args.tabId, args.url);
}

async function handleTabGetAll(
  event: IpcMainInvokeEvent
): Promise<{ tabs: any[]; currentTabId: number }> {
  if (!tabsManager) {
    throw new Error('TabsManager not initialized');
  }
  
  return {
    tabs: tabsManager.getTabInfo(),
    currentTabId: tabsManager.getCurrentTabId()
  };
}

/**
 * Config Handlers
 */

async function handleConfigGet(
  event: IpcMainInvokeEvent
): Promise<{ config: any }> {
  const config = getConfig();
  return { config };
}

async function handleConfigSet(
  event: IpcMainInvokeEvent,
  args: { config: any }
): Promise<void> {
  console.log('[IPC] config:set');
  setConfig(args.config);
}

// Removed unused: getCachedProfile, setCachedProfile

/**
 * Tool Operation Handlers
 */

async function handleToolExecute(
  event: IpcMainInvokeEvent,
  call: ToolCall
): Promise<any> {
  return await executeTool(call);
}

async function handleToolsGetAll(
  event: IpcMainInvokeEvent
): Promise<{ tools: any[] }> {
  const tools = getAllToolDefinitions();
  return { tools };
}

/**
 * Agent Bridge Control Handlers
 */

async function handleBridgeConnect(
  event: IpcMainInvokeEvent
): Promise<void> {
  const bridge = getAgentBridge();
  if (bridge) {
    await bridge.connect();
  }
}

async function handleBridgeDisconnect(
  event: IpcMainInvokeEvent
): Promise<void> {
  const bridge = getAgentBridge();
  if (bridge) {
    bridge.disconnect();
  }
}

async function handleBridgeStatus(
  event: IpcMainInvokeEvent
): Promise<{ state: string }> {
  const bridge = getAgentBridge();
  const state = bridge ? bridge.getState() : 'disconnected';
  return { state };
}

async function handleBridgeSendPrompt(
  event: IpcMainInvokeEvent,
  args: BridgeSendPromptRequest
): Promise<void> {
  const bridge = getAgentBridge();
  if (!bridge) {
    throw new Error('Agent bridge not initialized');
  }
  
  const promptPreview = args.prompt.length > 50 
    ? args.prompt.substring(0, 50) + '...' 
    : args.prompt;
  console.log('[IPC] bridge:sendPrompt -', promptPreview);
  
  bridge.sendPrompt(args.prompt);
}

/**
 * CDP WebSocket Client Control Handlers
 */

async function handleCdpConnect(
  event: IpcMainInvokeEvent
): Promise<void> {
  const cdpClient = getCdpClient();
  if (cdpClient) {
    await cdpClient.connect();
  }
}

async function handleCdpDisconnect(
  event: IpcMainInvokeEvent
): Promise<void> {
  const cdpClient = getCdpClient();
  if (cdpClient) {
    cdpClient.disconnect();
  }
}

async function handleCdpStatus(
  event: IpcMainInvokeEvent
): Promise<{ state: string }> {
  const cdpClient = getCdpClient();
  const state = cdpClient ? cdpClient.getState() : 'disconnected';
  return { state };
}


