/**
 * Configuration Type Definitions
 * 
 * Defines the schema for application configuration stored via electron-store
 */

import { ProfileData } from './api.types';

/**
 * Application configuration schema
 */
export interface AppConfig {
  // API Configuration
  apiBaseUrl: string;
  apiToken?: string;
  
  // Startup Behavior
  startupTabs: string[];
  autoSync: boolean;
  
  // Default Profile (fallback when API unavailable)
  defaultProfile: ProfileData;
  
  // Feature Flags
  autofillEnabled: boolean;
  debugMode: boolean;
  
  // UI Preferences
  toolbarHeight: number;
  showStatusBar: boolean;
  
  // Agent Bridge (AI Control)
  agentBridgeEnabled: boolean;
  agentBridgeUrl: string;
  agentToken: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.finbro.sg',
  apiToken: undefined,
  
  startupTabs: [
    'https://finbro.me',
    'https://mail.google.com',
    'https://job-boards.greenhouse.io/dvtrading/jobs/4592920005'
  ],
  autoSync: true,
  
  defaultProfile: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+65 9123 4567',
    linkedin: 'https://linkedin.com/in/johndoe'
  },
  
  autofillEnabled: true,
  debugMode: false,
  
  toolbarHeight: 100,
  showStatusBar: true,
  
  agentBridgeEnabled: true,
  agentBridgeUrl: 'ws://127.0.0.1:8000/browseragent/ws',
  agentToken: 'test-token-123'
};

