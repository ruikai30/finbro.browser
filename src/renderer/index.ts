/**
 * Renderer Process
 * Ultra-lean: Only tab rendering and bridge connection control
 */

declare global {
  interface Window {
    Finbro: {
      tabs: {
        create: (url: string) => Promise<{ tabId: number }>;
        switch: (tabId: number) => Promise<void>;
        close: (tabId: number) => Promise<void>;
        getCurrent: () => Promise<number>;
        getAll: () => Promise<{ tabs: any[]; currentTabId: number }>;
      };
      config: {
        get: () => Promise<{ config: any }>;
        set: (config: any) => Promise<void>;
      };
      tools: {
        execute: (call: any) => Promise<any>;
        getAll: () => Promise<{ tools: any[] }>;
      };
      bridge: {
        connect: () => Promise<void>;
        disconnect: () => Promise<void>;
        status: () => Promise<{ state: string }>;
      };
    };
  }
}

// DOM Elements
const btnBridge = document.getElementById('btn-bridge') as HTMLButtonElement;
const bridgeStatus = document.getElementById('bridge-status') as HTMLSpanElement;
const tabBar = document.getElementById('tab-bar') as HTMLDivElement;

// State
let currentTabId: number = -1;
let tabs: Array<{ id: number; url: string; title?: string }> = [];
let connectionState: string = 'disconnected';

/**
 * Update bridge button based on connection state
 */
function updateBridgeButton(state: string): void {
  connectionState = state;
  
  switch (state) {
    case 'connected':
      bridgeStatus.textContent = 'Connected ✅';
      btnBridge.className = 'btn btn-bridge connected';
      break;
    case 'connecting':
      bridgeStatus.textContent = 'Connecting...';
      btnBridge.className = 'btn btn-bridge connecting';
      break;
    case 'error':
      bridgeStatus.textContent = 'Error ❌';
      btnBridge.className = 'btn btn-bridge error';
      break;
    case 'disconnected':
    default:
      bridgeStatus.textContent = 'Disconnected';
      btnBridge.className = 'btn btn-bridge disconnected';
      break;
  }
}

/**
 * Handle bridge button click (toggle connect/disconnect)
 */
async function handleBridgeToggle(): Promise<void> {
  try {
    if (connectionState === 'connected') {
      // Disconnect
      await window.Finbro.bridge.disconnect();
      updateBridgeButton('disconnected');
    } else {
      // Connect
      updateBridgeButton('connecting');
      await window.Finbro.bridge.connect();
      
      // Poll for status
      setTimeout(async () => {
        const { state } = await window.Finbro.bridge.status();
        updateBridgeButton(state);
      }, 500);
    }
  } catch (error) {
    console.error('[Renderer] Bridge toggle failed:', error);
    updateBridgeButton('error');
  }
}

/**
 * Get favicon for URL
 */
function getFaviconForUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (hostname.includes('finbro')) return '🚀';
    if (hostname.includes('gmail') || hostname.includes('mail.google')) return '📧';
    if (hostname.includes('google')) return '🔍';
    if (hostname.includes('github')) return '💻';
    if (hostname.includes('greenhouse')) return '💼';
    if (hostname.includes('example')) return '📄';
    
    return '🌐';
  } catch (e) {
    return '🌐';
  }
}

/**
 * Get title for URL
 */
function getTitleForUrl(url: string, savedTitle?: string): string {
  if (savedTitle) return savedTitle;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (hostname.includes('finbro')) return 'Finbro';
    if (hostname.includes('mail.google')) return 'Gmail';
    if (hostname.includes('google')) return 'Google';
    if (hostname.includes('github')) return 'GitHub';
    if (hostname.includes('greenhouse')) return 'Job Application';
    if (hostname.includes('example')) return 'Example';
    
    return hostname.replace('www.', '');
  } catch (e) {
    return 'New Tab';
  }
}

/**
 * Render tabs in the tab bar
 */
function renderTabs(): void {
  tabBar.innerHTML = '';
  
  for (const tab of tabs) {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.dataset.tabId = String(tab.id);
    
    if (tab.id === currentTabId) {
      tabEl.classList.add('active');
    }
    
    // Favicon
    const favicon = document.createElement('span');
    favicon.className = 'tab-favicon';
    favicon.textContent = getFaviconForUrl(tab.url);
    tabEl.appendChild(favicon);
    
    // Title
    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = getTitleForUrl(tab.url, tab.title);
    tabEl.appendChild(title);
    
    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'tab-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleTabClose(tab.id);
    });
    tabEl.appendChild(closeBtn);
    
    // Click to switch
    tabEl.addEventListener('click', () => {
      handleTabSwitch(tab.id);
    });
    
    tabBar.appendChild(tabEl);
  }
  
  // New tab button
  const newTabBtn = document.createElement('button');
  newTabBtn.className = 'new-tab-btn';
  newTabBtn.textContent = '+';
  newTabBtn.title = 'New Tab';
  newTabBtn.addEventListener('click', handleNewTab);
  tabBar.appendChild(newTabBtn);
}

/**
 * Update tabs from main process
 */
async function updateTabs(): Promise<void> {
  try {
    const result = await window.Finbro.tabs.getAll();
    tabs = result.tabs;
    currentTabId = result.currentTabId;
    renderTabs();
  } catch (error) {
    console.error('[Renderer] Failed to update tabs:', error);
  }
}

/**
 * Handle tab switch
 */
async function handleTabSwitch(tabId: number): Promise<void> {
  if (tabId === currentTabId) return;
  
  try {
    await window.Finbro.tabs.switch(tabId);
    currentTabId = tabId;
    renderTabs();
  } catch (error) {
    console.error('[Renderer] Failed to switch tab:', error);
  }
}

/**
 * Handle tab close
 */
async function handleTabClose(tabId: number): Promise<void> {
  try {
    await window.Finbro.tabs.close(tabId);
    await updateTabs();
  } catch (error) {
    console.error('[Renderer] Failed to close tab:', error);
  }
}

/**
 * Handle new tab
 */
async function handleNewTab(): Promise<void> {
  const url = prompt('🌐 Enter website URL:', 'https://google.com');
  if (!url) return;
  
  let fullUrl = url.trim();
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    fullUrl = 'https://' + fullUrl;
  }
  
  try {
    const result = await window.Finbro.tabs.create(fullUrl);
    await updateTabs();
    await handleTabSwitch(result.tabId);
  } catch (error) {
    console.error('[Renderer] Failed to create tab:', error);
  }
}

/**
 * Poll bridge status
 */
async function pollBridgeStatus(): Promise<void> {
  try {
    const { state } = await window.Finbro.bridge.status();
    updateBridgeButton(state);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Initialize
 */
async function init(): Promise<void> {
  // Bridge button handler
  btnBridge.addEventListener('click', handleBridgeToggle);
  
  // Load tabs
  await updateTabs();
  
  // Poll for tab updates (1 second)
  setInterval(updateTabs, 1000);
  
  // Poll for bridge status (2 seconds)
  setInterval(pollBridgeStatus, 2000);
  
  // Initial status check
  pollBridgeStatus();
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
