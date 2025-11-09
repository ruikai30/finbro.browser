/**
 * IPC Handlers
 * 
 * Registers handlers for inter-process communication between renderer and main.
 * Type-safe routing using IpcChannel enum.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IpcChannel } from '../types/ipc.types';
import { TabsManager } from './tabs';
import { getConfig, setConfig } from './config';
import { handleAuthToken } from './auth';

// TabsManager instance (set by windows.ts)
let tabsManager: TabsManager | null = null;

/**
 * Set the tabs manager instance
 * Called by windows.ts after creating the window
 */
export function setTabsManager(manager: TabsManager): void {
  tabsManager = manager;
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
  
  // Authentication
  ipcMain.handle(IpcChannel.AUTH_SEND_TOKEN, handleAuthSendToken);
  
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
 * Authentication Handlers
 */

async function handleAuthSendToken(
  event: IpcMainInvokeEvent,
  args: { token: string | null }
): Promise<void> {
  console.log('='.repeat(60));
  console.log('[IPC] ⚡ AUTH TOKEN RECEIVED FROM RENDERER');
  console.log('[IPC] Token:', args.token ? 'Present' : 'NULL (logout)');
  console.log('='.repeat(60));
  handleAuthToken(args.token);
}

