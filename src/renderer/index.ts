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
        navigate: (tabId: number, url: string) => Promise<void>;
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
        sendPrompt: (prompt: string) => Promise<void>;
      };
      cdp: {
        connect: () => Promise<void>;
        disconnect: () => Promise<void>;
        status: () => Promise<{ state: string }>;
      };
    };
  }
}

// DOM Elements
const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement;
const btnSend = document.getElementById('btn-send') as HTMLButtonElement;
const connectionStatus = document.getElementById('connection-status') as HTMLSpanElement;
const tabBar = document.getElementById('tab-bar') as HTMLDivElement;

// CDP DOM Elements
const btnCdpConnect = document.getElementById('btn-cdp-connect') as HTMLButtonElement;
const cdpStatus = document.getElementById('cdp-status') as HTMLSpanElement;

// State
let currentTabId: number = -1;
let tabs: Array<{ id: number; url: string; title?: string }> = [];
let connectionState: string = 'disconnected';
let cdpConnectionState: string = 'disconnected';
let isProcessing: boolean = false;

/**
 * Update connection status display
 */
function updateConnectionStatus(state: string): void {
  connectionState = state;
  
  // Remove all state classes
  connectionStatus.classList.remove('connected', 'connecting', 'error');
  
  switch (state) {
    case 'connected':
      connectionStatus.textContent = 'Connected ✅';
      connectionStatus.classList.add('connected');
      break;
    case 'connecting':
      connectionStatus.textContent = 'Connecting...';
      connectionStatus.classList.add('connecting');
      break;
    case 'error':
      connectionStatus.textContent = 'Error ❌';
      connectionStatus.classList.add('error');
      break;
    case 'disconnected':
    default:
      connectionStatus.textContent = 'Disconnected';
      break;
  }
}

/**
 * Update CDP connection status display
 */
function updateCdpStatus(state: string): void {
  cdpConnectionState = state;
  
  // Remove all state classes
  cdpStatus.classList.remove('connected', 'connecting', 'error');
  
  switch (state) {
    case 'connected':
      cdpStatus.textContent = 'Connected ✅';
      cdpStatus.classList.add('connected');
      btnCdpConnect.textContent = 'Disconnect';
      btnCdpConnect.classList.add('connected');
      break;
    case 'connecting':
      cdpStatus.textContent = 'Connecting...';
      cdpStatus.classList.add('connecting');
      btnCdpConnect.disabled = true;
      break;
    case 'error':
      cdpStatus.textContent = 'Error ❌';
      cdpStatus.classList.add('error');
      btnCdpConnect.textContent = 'Retry';
      btnCdpConnect.disabled = false;
      btnCdpConnect.classList.remove('connected');
      break;
    case 'disconnected':
    default:
      cdpStatus.textContent = 'Disconnected';
      btnCdpConnect.textContent = 'Connect to API';
      btnCdpConnect.disabled = false;
      btnCdpConnect.classList.remove('connected');
      break;
  }
}

/**
 * Update UI based on processing state
 */
function updateProcessingState(processing: boolean): void {
  isProcessing = processing;
  btnSend.disabled = processing || !promptInput.value.trim();
  promptInput.disabled = processing;
  
  // Add/remove processing class for animation
  if (processing) {
    btnSend.classList.add('processing');
  } else {
    btnSend.classList.remove('processing');
  }
}

/**
 * Send prompt to AI agent
 */
async function sendPrompt(): Promise<void> {
  const prompt = promptInput.value.trim();
  
  if (!prompt || isProcessing) {
    return;
  }
  
  try {
    updateProcessingState(true);
    
    // Auto-connect if not connected
    if (connectionState !== 'connected') {
      console.log('[Renderer] Auto-connecting to agent...');
      updateConnectionStatus('connecting');
      await window.Finbro.bridge.connect();
      
      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { state } = await window.Finbro.bridge.status();
      updateConnectionStatus(state);
      
      if (state !== 'connected') {
        throw new Error('Failed to connect to agent');
      }
    }
    
    // Send prompt
    console.log('[Renderer] Sending prompt:', prompt);
    await window.Finbro.bridge.sendPrompt(prompt);
    
    // Clear input
    promptInput.value = '';
    
    // Reset processing state after a delay (agent will handle the work)
    // The agent processes autonomously - we just send the prompt and done
    setTimeout(() => {
      updateProcessingState(false);
    }, 2000);
    
  } catch (error) {
    console.error('[Renderer] Failed to send prompt:', error);
    updateConnectionStatus('error');
    updateProcessingState(false);
    
    // Show error in a non-blocking way
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Renderer] Error details:', errorMessage);
  }
}

/**
 * Handle send button click
 */
async function handleSendClick(): Promise<void> {
  await sendPrompt();
}

/**
 * Handle Enter key in prompt input
 */
function handlePromptKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendPrompt();
  }
}

/**
 * Handle input changes (enable/disable send button)
 */
function handlePromptInput(): void {
  btnSend.disabled = !promptInput.value.trim() || isProcessing;
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
 * Handle new tab - just opens google
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
 * Poll bridge status
 */
async function pollBridgeStatus(): Promise<void> {
  try {
    const { state } = await window.Finbro.bridge.status();
    updateConnectionStatus(state);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Poll CDP status
 */
async function pollCdpStatus(): Promise<void> {
  try {
    const { state } = await window.Finbro.cdp.status();
    updateCdpStatus(state);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Handle CDP connect/disconnect button click
 */
async function handleCdpConnectClick(): Promise<void> {
  try {
    if (cdpConnectionState === 'connected') {
      // Disconnect
      await window.Finbro.cdp.disconnect();
      updateCdpStatus('disconnected');
    } else {
      // Connect
      updateCdpStatus('connecting');
      await window.Finbro.cdp.connect();
      
      // Wait a bit and check status
      await new Promise(resolve => setTimeout(resolve, 500));
      const { state } = await window.Finbro.cdp.status();
      updateCdpStatus(state);
    }
  } catch (error) {
    console.error('[Renderer] CDP connection error:', error);
    updateCdpStatus('error');
  }
}

/**
 * Initialize
 */
async function init(): Promise<void> {
  // Send button handler
  btnSend.addEventListener('click', handleSendClick);
  
  // Prompt input handlers
  promptInput.addEventListener('keydown', handlePromptKeydown);
  promptInput.addEventListener('input', handlePromptInput);
  
  // CDP connect button handler
  btnCdpConnect.addEventListener('click', handleCdpConnectClick);
  
  // URL input handler
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  if (urlInput) {
    urlInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        let url = urlInput.value.trim();
        if (!url) return;
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        
        try {
          const result = await window.Finbro.tabs.getAll();
          if (result.currentTabId) {
            await window.Finbro.tabs.navigate(result.currentTabId, url);
          }
        } catch (error) {
          console.error('[Renderer] Failed to navigate:', error);
        }
      }
    });
  }
  
  // Initial button state
  btnSend.disabled = true;
  
  // Load tabs
  await updateTabs();
  
  // Poll for tab updates (1 second)
  setInterval(updateTabs, 1000);
  
  // Poll for bridge status (2 seconds)
  setInterval(pollBridgeStatus, 2000);
  
  // Poll for CDP status (2 seconds)
  setInterval(pollCdpStatus, 2000);
  
  // Initial status checks
  pollBridgeStatus();
  pollCdpStatus();
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
