/**
 * Renderer Process
 * Minimal UI: Tab rendering and CDP autofill connection control
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
        navigate: (tabId: number, url: string) => Promise<void>;
      };
      config: {
        get: () => Promise<{ config: any }>;
        set: (config: any) => Promise<void>;
      };
    };
  }
}

// DOM Elements
const tabBar = document.getElementById('tab-bar') as HTMLDivElement;
const btnAutofill = document.getElementById('btn-autofill') as HTMLButtonElement;
const autofillStatus = document.getElementById('autofill-status') as HTMLSpanElement;
const urlInput = document.getElementById('url-input') as HTMLInputElement;

// State
let currentTabId: number = -1;
let tabs: Array<{ id: number; url: string; title?: string }> = [];

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
    if (hostname.includes('example')) return '��';
    
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
  try {
    const result = await window.Finbro.tabs.create('https://google.com');
    await updateTabs();
    await handleTabSwitch(result.tabId);
  } catch (error) {
    console.error('[Renderer] Failed to create tab:', error);
  }
}

/**
 * Handle URL navigation
 */
async function handleUrlNavigation(): Promise<void> {
  let url = urlInput.value.trim();
  if (!url) return;
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const result = await window.Finbro.tabs.getAll();
    if (result.currentTabId !== undefined && result.currentTabId >= 0) {
      await window.Finbro.tabs.navigate(result.currentTabId, url);
    }
  } catch (error) {
    console.error('[Renderer] Failed to navigate:', error);
  }
}

/**
 * Handle Autofill button click
 * NOTE: Deprecated - automation is now handled via WebSocket server
 */
async function handleAutofillClick(): Promise<void> {
  console.log('[Renderer] Autofill button (deprecated - WebSocket handles automation)');
}

/**
 * Initialize
 */
async function init(): Promise<void> {
  // Autofill button handler
  btnAutofill.addEventListener('click', handleAutofillClick);
  
  // URL input handler
  urlInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleUrlNavigation();
    }
  });
  
  // Load tabs
  await updateTabs();
  
  // Poll for tab updates (1 second)
  setInterval(updateTabs, 1000);
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
