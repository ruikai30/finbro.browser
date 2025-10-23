/**
 * IPC Handlers
 * 
 * Registers handlers for inter-process communication between renderer and main.
 * Type-safe routing using IpcChannel enum.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IpcChannel } from '../types/ipc.types';
import { TabsManager } from './tabs';
import { executeAutofill } from './autofill';
import { fetchProfile, fetchTargets } from './api';
import { getConfig, setConfig } from './config';
import { ProfileData } from '../types/api.types';

// Cached profile data (in-memory)
let cachedProfile: ProfileData | null = null;

// TabsManager instance (set by windows.ts)
let tabsManager: TabsManager | null = null;

/**
 * Set the tabs manager instance
 * Called by windows.ts after creating the window
 */
export function setTabsManager(manager: TabsManager): void {
  tabsManager = manager;
  console.log('[IPC] TabsManager registered');
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
  
  // Autofill Operations
  ipcMain.handle(IpcChannel.AUTOFILL_EXECUTE, handleAutofillExecute);
  
  // API Sync
  ipcMain.handle(IpcChannel.API_SYNC_PROFILE, handleApiSyncProfile);
  ipcMain.handle(IpcChannel.API_SYNC_TARGETS, handleApiSyncTargets);
  
  // Configuration
  ipcMain.handle(IpcChannel.CONFIG_GET, handleConfigGet);
  ipcMain.handle(IpcChannel.CONFIG_SET, handleConfigSet);
  
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
 * Autofill Handlers
 */

async function handleAutofillExecute(
  event: IpcMainInvokeEvent,
  args: { profile: ProfileData; tabId?: number }
): Promise<{ success: boolean; fieldsFilled: number; errors?: string[] }> {
  if (!tabsManager) {
    throw new Error('TabsManager not initialized');
  }
  
  const targetTabId = args.tabId ?? tabsManager.getCurrentTabId();
  
  console.log('[IPC] autofill:execute - tab:', targetTabId);
  
  // Use provided profile or cached profile
  const profile = args.profile || cachedProfile;
  
  if (!profile) {
    throw new Error('No profile data available');
  }
  
  // Execute autofill
  const result = await executeAutofill(
    targetTabId,
    profile,
    (tabId, code) => tabsManager!.executeInTab(tabId, code)
  );
  
  return result;
}

/**
 * API Sync Handlers
 */

async function handleApiSyncProfile(
  event: IpcMainInvokeEvent
): Promise<{ profile: ProfileData }> {
  console.log('[IPC] api:syncProfile');
  
  try {
    const profile = await fetchProfile();
    
    // Cache the profile
    cachedProfile = profile;
    
    console.log('[IPC] Profile synced:', profile.email);
    
    return { profile };
  } catch (error) {
    console.error('[IPC] Failed to sync profile:', error);
    throw error;
  }
}

async function handleApiSyncTargets(
  event: IpcMainInvokeEvent
): Promise<{ targets: any[] }> {
  console.log('[IPC] api:syncTargets');
  
  try {
    const targets = await fetchTargets();
    
    console.log('[IPC] Targets synced:', targets.length);
    
    return { targets };
  } catch (error) {
    console.error('[IPC] Failed to sync targets:', error);
    throw error;
  }
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

/**
 * Get cached profile (for use by other modules)
 */
export function getCachedProfile(): ProfileData | null {
  return cachedProfile;
}

/**
 * Set cached profile (for use by other modules)
 */
export function setCachedProfile(profile: ProfileData): void {
  cachedProfile = profile;
}

