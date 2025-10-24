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
  
  // Agent Bridge (AI Control)
  agentBridgeEnabled: boolean;
  agentBridgeUrl: string;
  agentToken: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  startupTabs: ['https://finbro.me'],
  debugMode: false,
  toolbarHeight: 100,
  agentBridgeEnabled: false,
  agentBridgeUrl: 'ws://127.0.0.1:8000/browseragent/ws',
  agentToken: 'test-token-123'
};

