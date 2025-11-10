/**
 * Shared Type Definitions for Renderer
 */

export type TabState = 'in_progress' | 'success' | 'failed';

export interface TabData {
  id: number;
  url: string;
  title?: string;
}

declare global {
  interface Window {
    Finbro: {
      tabs: {
        create: (url: string) => Promise<{ tabId: number }>;
        switch: (tabId: number) => Promise<void>;
        close: (tabId: number) => Promise<void>;
        getCurrent: () => Promise<number>;
        getAll: () => Promise<{ tabs: TabData[]; currentTabId: number }>;
        navigate: (tabId: number, url: string) => Promise<void>;
      };
      config: {
        get: () => Promise<{ config: any }>;
        set: (config: any) => Promise<void>;
      };
      animation: {
        getStates: () => Promise<{ states: Record<number, string> }>;
        onStateChange: (callback: (states: Record<number, string>) => void) => () => void;
      };
    };
  }
}

export {};
