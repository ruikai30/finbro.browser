/**
 * TabBar Component (React)
 * 
 * Professional tab bar with glassmorphism design and first-letter favicons.
 */

import React from 'react';
import type { TabData } from '../types';

interface TabBarProps {
  tabs: TabData[];
  currentTabId: number;
  animatingTabIds: Set<number>;
  onTabSwitch: (tabId: number) => void;
  onTabClose: (tabId: number) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  currentTabId,
  animatingTabIds,
  onTabSwitch,
  onTabClose,
  onNewTab,
}) => {
  const getTabTitle = (tab: TabData): string => {
    if (tab.title) {
      return tab.title;
    }
    try {
      return new URL(tab.url).hostname.replace('www.', '');
    } catch (e) {
      return 'New Tab';
    }
  };

  const getFaviconLetter = (tab: TabData): string => {
    try {
      const hostname = new URL(tab.url).hostname.replace('www.', '');
      return hostname.charAt(0).toUpperCase();
    } catch (e) {
      return 'N';
    }
  };

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === currentTabId ? 'active' : ''} ${animatingTabIds.has(tab.id) ? 'animating' : ''}`}
          onClick={() => onTabSwitch(tab.id)}
        >
          <div className="tab-favicon">
            {getFaviconLetter(tab)}
          </div>
          <span className="tab-title">{getTabTitle(tab)}</span>
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            ✕
          </span>
          {animatingTabIds.has(tab.id) && (
            <>
              <div className="tab-gleam"></div>
              <div className="tab-ai-indicator"></div>
            </>
          )}
        </div>
      ))}
      <button className="new-tab-btn" onClick={onNewTab} title="New Tab">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};
