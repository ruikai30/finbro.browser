/**
 * IPC Type Definitions
 * 
 * Defines type-safe contracts for inter-process communication
 * between renderer and main process.
 */

import { AppConfig } from './config.types';

/**
 * IPC Channel Names
 * Centralized list of all IPC channels for type safety
 */
export enum IpcChannel {
  // Tab Management
  TABS_CREATE = 'tabs:create',
  TABS_SWITCH = 'tabs:switch',
  TABS_CLOSE = 'tabs:close',
  TABS_GET_CURRENT = 'tabs:getCurrent',
  TABS_GET_ALL = 'tabs:getAll',
  TABS_NAVIGATE = 'tabs:navigate',
  
  // Configuration
  CONFIG_GET = 'config:get',
  CONFIG_SET = 'config:set',
  
  // Authentication
  AUTH_SEND_TOKEN = 'auth:send-token',
}

/**
 * IPC Message Type Definitions
 */

// Tab Operations
export interface TabCreateRequest {
  url: string;
}

export interface TabCreateResponse {
  tabId: number;
}

export interface TabSwitchRequest {
  tabId: number;
}

export interface TabCloseRequest {
  tabId: number;
}

export interface TabInfo {
  id: number;
  url: string;
  title?: string;
}

export interface TabsGetAllResponse {
  tabs: TabInfo[];
  currentTabId: number;
}

// Configuration
export interface ConfigSetRequest {
  config: Partial<AppConfig>;
}

export interface ConfigGetResponse {
  config: AppConfig;
}

// Authentication
export interface AuthSendTokenRequest {
  token: string | null;
}
