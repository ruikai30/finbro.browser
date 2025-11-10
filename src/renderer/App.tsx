/**
 * App Component
 * 
 * Main React app - orchestrates TabBar, UrlBar, and StatusBar
 */

import React, { useState, useEffect } from 'react';
import { TabBar } from './components/TabBar';
import { UrlBar } from './components/UrlBar';
import { StatusBar } from './components/StatusBar';
import type { TabData, TabState } from './types';

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [currentTabId, setCurrentTabId] = useState<number>(-1);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [tabStates, setTabStates] = useState<Record<number, TabState>>({});

  // Fetch tabs from main process
  const updateTabs = async () => {
    try {
      const result = await window.Finbro.tabs.getAll();
      setTabs(result.tabs);
      setCurrentTabId(result.currentTabId);
      
      // Update current URL based on active tab
      const activeTab = result.tabs.find(tab => tab.id === result.currentTabId);
      if (activeTab) {
        setCurrentUrl(activeTab.url);
      } else {
        setCurrentUrl('');
      }
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
  
  // Listen for animation state changes
  useEffect(() => {
    const cleanup = window.Finbro.animation.onStateChange((states) => {
      setTabStates(states as Record<number, TabState>);
    });
    
    return cleanup;
  }, []);
  
  // Calculate status counts
  const inProgressCount = Object.values(tabStates).filter(state => state === 'in_progress').length;
  const successCount = Object.values(tabStates).filter(state => state === 'success').length;
  const failedCount = Object.values(tabStates).filter(state => state === 'failed').length;

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

  return (
    <>
      <header className="toolbar">
        <TabBar
          tabs={tabs}
          currentTabId={currentTabId}
          tabStates={tabStates}
          onTabSwitch={handleTabSwitch}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />
      </header>
      <div className="urlbar-status-container">
        <UrlBar currentUrl={currentUrl} />
        <StatusBar
          inProgressCount={inProgressCount}
          successCount={successCount}
          failedCount={failedCount}
        />
      </div>
    </>
  );
};
