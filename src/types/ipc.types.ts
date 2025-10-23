/**
 * IPC Type Definitions
 * 
 * Defines type-safe contracts for inter-process communication
 * between renderer and main process.
 */

import { ProfileData, AutofillResult, TargetUrl } from './api.types';
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
  
  // Autofill Operations
  AUTOFILL_EXECUTE = 'autofill:execute',
  AUTOFILL_EXECUTE_ALL = 'autofill:executeAll',
  
  // API Sync
  API_SYNC_PROFILE = 'api:syncProfile',
  API_SYNC_TARGETS = 'api:syncTargets',
  
  // Configuration
  CONFIG_GET = 'config:get',
  CONFIG_SET = 'config:set',
  CONFIG_RESET = 'config:reset',
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

// Autofill Operations
export interface AutofillExecuteRequest {
  profile: ProfileData;
  tabId?: number; // If not provided, uses current tab
}

export interface AutofillExecuteResponse extends AutofillResult {}

// API Sync
export interface SyncProfileResponse {
  profile: ProfileData;
}

export interface SyncTargetsResponse {
  targets: TargetUrl[];
}

// Configuration
export interface ConfigSetRequest {
  config: Partial<AppConfig>;
}

export interface ConfigGetResponse {
  config: AppConfig;
}

/**
 * Type-safe IPC handler map
 * Maps channel names to their request/response types
 */
export interface IpcHandlerMap {
  [IpcChannel.TABS_CREATE]: {
    request: TabCreateRequest;
    response: TabCreateResponse;
  };
  [IpcChannel.TABS_SWITCH]: {
    request: TabSwitchRequest;
    response: void;
  };
  [IpcChannel.TABS_CLOSE]: {
    request: TabCloseRequest;
    response: void;
  };
  [IpcChannel.TABS_GET_CURRENT]: {
    request: void;
    response: number;
  };
  [IpcChannel.AUTOFILL_EXECUTE]: {
    request: AutofillExecuteRequest;
    response: AutofillExecuteResponse;
  };
  [IpcChannel.API_SYNC_PROFILE]: {
    request: void;
    response: SyncProfileResponse;
  };
  [IpcChannel.API_SYNC_TARGETS]: {
    request: void;
    response: SyncTargetsResponse;
  };
  [IpcChannel.CONFIG_GET]: {
    request: void;
    response: ConfigGetResponse;
  };
  [IpcChannel.CONFIG_SET]: {
    request: ConfigSetRequest;
    response: void;
  };
}

