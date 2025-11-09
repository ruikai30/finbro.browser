/**
 * App Component
 * 
 * Main React app - orchestrates TabBar and UrlBar
 */

import React, { useState, useEffect } from 'react';
import { TabBar } from './components/TabBar';
import { UrlBar } from './components/UrlBar';
import type { TabData } from './types';

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [currentTabId, setCurrentTabId] = useState<number>(-1);

  // Fetch tabs from main process
  const updateTabs = async () => {
    try {
      const result = await window.Finbro.tabs.getAll();
      setTabs(result.tabs);
      setCurrentTabId(result.currentTabId);
    } catch (error) {
      console.error('[App] Failed to update tabs:', error);
    }
  };

  // Initial load and polling
  useEffect(() => {
    updateTabs();
    const interval = setInterval(updateTabs, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleTabSwitch = async (tabId: number) => {
    try {
      await window.Finbro.tabs.switch(tabId);
      await updateTabs();
    } catch (error) {
      console.error('[App] Failed to switch tab:', error);
    }
  };

  const handleTabClose = async (tabId: number) => {
    try {
      await window.Finbro.tabs.close(tabId);
      await updateTabs();
    } catch (error) {
      console.error('[App] Failed to close tab:', error);
    }
  };

  const handleNewTab = async () => {
    try {
      const result = await window.Finbro.tabs.create('https://google.com');
      await handleTabSwitch(result.tabId);
    } catch (error) {
      console.error('[App] Failed to create tab:', error);
    }
  };

  const handleNavigate = async (url: string) => {
    try {
      if (currentTabId >= 0) {
        await window.Finbro.tabs.navigate(currentTabId, url);
      }
    } catch (error) {
      console.error('[App] Failed to navigate:', error);
    }
  };

  return (
    <>
      <header className="toolbar">
        <TabBar
          tabs={tabs}
          currentTabId={currentTabId}
          onTabSwitch={handleTabSwitch}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />
      </header>
      <UrlBar onNavigate={handleNavigate} />
    </>
  );
};
