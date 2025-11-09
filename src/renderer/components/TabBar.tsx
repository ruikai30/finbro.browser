/**
 * TabBar Component (React)
 * 
 * Displays tabs and handles user interactions.
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

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === currentTabId ? 'active' : ''} ${animatingTabIds.has(tab.id) ? 'animating' : ''}`}
          onClick={() => onTabSwitch(tab.id)}
        >
          <span className="tab-favicon">{animatingTabIds.has(tab.id) ? '🤖' : '🌐'}</span>
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
          {animatingTabIds.has(tab.id) && <div className="tab-gleam"></div>}
        </div>
      ))}
      <button className="new-tab-btn" onClick={onNewTab} title="New Tab">
        +
      </button>
    </div>
  );
};
