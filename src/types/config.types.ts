/**
 * Configuration Type Definitions
 * 
 * Defines the schema for application configuration stored via electron-store
 */

/**
 * Application configuration schema
 */
export interface AppConfig {
  // Startup Behavior
  startupTabs: string[];
  
  // Feature Flags
  debugMode: boolean;
  
  // UI Preferences
  toolbarHeight: number;
  
  // Automation Server WebSocket
  automationServerUrl: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  startupTabs: ['https://finbro.me'],
  debugMode: false,
  toolbarHeight: 100,
  automationServerUrl: 'ws://127.0.0.1:8000/browser/ws'
};
