/**
 * Renderer Process
 * 
 * Toolbar UI logic, tab management, and IPC communication.
 * Runs in the browser context (sandboxed).
 */

// Extend Window interface for TypeScript
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
      autofill: {
        execute: (profile: any, tabId?: number) => Promise<{
          success: boolean;
          fieldsFilled: number;
          errors?: string[];
        }>;
      };
      api: {
        syncProfile: () => Promise<{ profile: any }>;
        syncTargets: () => Promise<{ targets: any[] }>;
      };
      config: {
        get: () => Promise<{ config: any }>;
        set: (config: any) => Promise<void>;
      };
    };
  }
}

// DOM Elements
const btnAutofill = document.getElementById('btn-autofill') as HTMLButtonElement;
const btnSync = document.getElementById('btn-sync') as HTMLButtonElement;
const btnDemoGoogle = document.getElementById('btn-demo-google') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLSpanElement;
const tabBar = document.getElementById('tab-bar') as HTMLDivElement;

// State
let cachedProfile: any = null;
let currentTabId: number = -1;
let tabs: Array<{ id: number; url: string; title?: string }> = [];

/**
 * Update status display
 */
function setStatus(message: string, type: 'idle' | 'loading' | 'success' | 'error' = 'idle'): void {
  statusEl.textContent = message;
  statusEl.className = 'status';
  
  if (type !== 'idle') {
    statusEl.classList.add(type);
  }
}

/**
 * Set button loading state
 */
function setButtonLoading(button: HTMLButtonElement, loading: boolean): void {
  button.disabled = loading;
  
  if (loading) {
    button.classList.add('loading');
  } else {
    button.classList.remove('loading');
  }
}

/**
 * Get favicon for URL
 */
function getFaviconForUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Custom favicons for known sites
    if (hostname.includes('finbro')) return '🚀';
    if (hostname.includes('gmail') || hostname.includes('mail.google')) return '📧';
    if (hostname.includes('google')) return '🔍';
    if (hostname.includes('github')) return '💻';
    if (hostname.includes('greenhouse')) return '💼';
    
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
    
    // Custom titles for known sites
    if (hostname.includes('finbro')) return 'Finbro';
    if (hostname.includes('mail.google')) return 'Gmail';
    if (hostname.includes('google')) return 'Google';
    if (hostname.includes('github')) return 'GitHub';
    if (hostname.includes('greenhouse')) return 'Job Application';
    
    return hostname.replace('www.', '');
  } catch (e) {
    return 'New Tab';
  }
}

/**
 * Render tabs in the tab bar
 */
function renderTabs(): void {
  // Clear tab bar
  tabBar.innerHTML = '';
  
  // Render each tab
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
    
    // Click handler to switch tab
    tabEl.addEventListener('click', () => {
      handleTabSwitch(tab.id);
    });
    
    tabBar.appendChild(tabEl);
  }
  
  // Add "New Tab" button
  const newTabBtn = document.createElement('button');
  newTabBtn.className = 'new-tab-btn';
  newTabBtn.textContent = '+';
  newTabBtn.title = 'New Tab';
  newTabBtn.addEventListener('click', handleNewTab);
  tabBar.appendChild(newTabBtn);
}

/**
 * Fetch and update tabs
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
  const url = prompt('🌐 Enter website URL to visit:', 'https://google.com');
  
  if (!url) return;
  
  // Add https:// if no protocol specified
  let fullUrl = url.trim();
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    fullUrl = 'https://' + fullUrl;
  }
  
  setStatus('Opening new tab...', 'loading');
  
  try {
    const result = await window.Finbro.tabs.create(fullUrl);
    await updateTabs();
    await handleTabSwitch(result.tabId);
    
    setStatus('Tab opened!', 'success');
    setTimeout(() => setStatus('Ready', 'idle'), 2000);
  } catch (error) {
    console.error('[Renderer] Failed to create tab:', error);
    setStatus('Failed to open tab!', 'error');
    setTimeout(() => setStatus('Ready', 'idle'), 2000);
  }
}

/**
 * Sync Profile Handler
 */
async function handleSyncProfile(): Promise<void> {
  setButtonLoading(btnSync, true);
  setStatus('Syncing profile...', 'loading');
  
  try {
    const result = await window.Finbro.api.syncProfile();
    cachedProfile = result.profile;
    
    setStatus(`Profile loaded: ${cachedProfile.email}`, 'success');
    setTimeout(() => setStatus('Ready', 'idle'), 3000);
  } catch (error) {
    console.error('[Renderer] Sync profile failed:', error);
    setStatus('Sync failed!', 'error');
    setTimeout(() => setStatus('Ready', 'idle'), 3000);
  } finally {
    setButtonLoading(btnSync, false);
  }
}

/**
 * Autofill Handler
 */
async function handleAutofill(): Promise<void> {
  // Ensure we have profile data
  if (!cachedProfile) {
    await handleSyncProfile();
    if (!cachedProfile) {
      setStatus('No profile data!', 'error');
      return;
    }
  }
  
  setButtonLoading(btnAutofill, true);
  setStatus('Running autofill...', 'loading');
  
  try {
    const result = await window.Finbro.autofill.execute(cachedProfile, currentTabId);
    
    if (result.success) {
      setStatus(`Filled ${result.fieldsFilled} fields!`, 'success');
    } else {
      setStatus('Autofill failed!', 'error');
    }
    
    setTimeout(() => setStatus('Ready', 'idle'), 3000);
  } catch (error) {
    console.error('[Renderer] Autofill failed:', error);
    setStatus('Autofill error!', 'error');
    setTimeout(() => setStatus('Ready', 'idle'), 3000);
  } finally {
    setButtonLoading(btnAutofill, false);
  }
}

/**
 * Demo Google Search Handler
 */
async function handleDemoGoogleSearch(): Promise<void> {
  setButtonLoading(btnDemoGoogle, true);
  setStatus('Running demo...', 'loading');
  
  try {
    // Find Google/Gmail tab
    const googleTab = tabs.find(t => 
      t.url.includes('google.com') || t.url.includes('mail.google.com')
    );
    
    if (!googleTab) {
      setStatus('No Google tab found!', 'error');
      setTimeout(() => setStatus('Ready', 'idle'), 3000);
      return;
    }
    
    // Switch to Google tab
    await window.Finbro.tabs.switch(googleTab.id);
    currentTabId = googleTab.id;
    renderTabs();
    
    await delay(500);
    
    const demoProfile = { search: 'hello' };
    await window.Finbro.autofill.execute(demoProfile, googleTab.id);
    
    setStatus('Demo complete!', 'success');
    setTimeout(() => setStatus('Ready', 'idle'), 3000);
  } catch (error) {
    console.error('[Renderer] Demo failed:', error);
    setStatus('Demo error!', 'error');
    setTimeout(() => setStatus('Ready', 'idle'), 3000);
  } finally {
    setButtonLoading(btnDemoGoogle, false);
  }
}

/**
 * Helper: Delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialize
 */
async function init(): Promise<void> {
  // Button click handlers
  btnSync.addEventListener('click', handleSyncProfile);
  btnAutofill.addEventListener('click', handleAutofill);
  btnDemoGoogle.addEventListener('click', handleDemoGoogleSearch);
  
  // Small delay to let tabs initialize
  await delay(100);
  
  // Load tabs immediately
  await updateTabs();
  
  // Poll for tab updates every 1 second (to catch title changes)
  setInterval(updateTabs, 1000);
  
  // Load config
  try {
    const { config } = await window.Finbro.config.get();
    
    // Auto-sync profile if enabled
    if (config.autoSync) {
      setTimeout(() => handleSyncProfile(), 500);
    }
  } catch (error) {
    console.error('[Renderer] Failed to load config:', error);
  }
  
  setStatus('Ready', 'idle');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Empty export to make this a module for TypeScript
export {};
