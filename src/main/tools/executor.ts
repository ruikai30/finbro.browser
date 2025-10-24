/**
 * Tool Executor
 * 
 * Executes tool calls from AI agents.
 * Routes tool names to appropriate implementations.
 */

import { ToolCall, ToolResult } from '../../types/tool.types';
import { executeAutofill } from '../autofill';

// Import TabsManager getter (will add export to ipc.ts)
let getTabsManagerFunc: (() => any) | null = null;

/**
 * Set the TabsManager getter function
 * Called by ipc.ts during initialization
 */
export function setTabsManagerGetter(getter: () => any): void {
  getTabsManagerFunc = getter;
}

/**
 * Execute a tool call and return the result
 */
export async function executeTool(call: ToolCall): Promise<ToolResult> {
  const { tool, params, callId } = call;
  
  // Get TabsManager instance
  if (!getTabsManagerFunc) {
    return {
      success: false,
      error: 'Tool system not initialized',
      callId
    };
  }
  
  const tabsManager = getTabsManagerFunc();
  
  if (!tabsManager) {
    return {
      success: false,
      error: 'TabsManager not available',
      callId
    };
  }
  
  try {
    let result: any;
    
    switch (tool) {
      case 'newTab':
        result = await tabsManager.createTab(params.url);
        return { 
          success: true, 
          data: { tabId: result }, 
          callId 
        };
      
      case 'closeTab':
        tabsManager.closeTab(params.tabId);
        return { 
          success: true, 
          data: null, 
          callId 
        };
      
      case 'switchTab':
        tabsManager.switchTo(params.tabId);
        return { 
          success: true, 
          data: null, 
          callId 
        };
      
      case 'getAllTabs':
        const tabs = tabsManager.getTabInfo();
        const currentId = tabsManager.getCurrentTabId();
        return { 
          success: true, 
          data: { tabs, currentTabId: currentId }, 
          callId 
        };
      
      case 'getCurrentUrl':
        const currentTabId = params.tabId ?? tabsManager.getCurrentTabId();
        const url = tabsManager.getTabUrl(currentTabId);
        return { 
          success: true, 
          data: { url }, 
          callId 
        };
      
      case 'getPageText':
        const textTabId = params.tabId ?? tabsManager.getCurrentTabId();
        const text = await tabsManager.executeInTab(
          textTabId,
          'document.body.innerText'
        );
        return { 
          success: true, 
          data: { text }, 
          callId 
        };
      
      case 'autofill':
        const fillTabId = params.tabId ?? tabsManager.getCurrentTabId();
        result = await executeAutofill(
          fillTabId,
          params.profile,
          (tid, code) => tabsManager.executeInTab(tid, code)
        );
        return { 
          success: result.success, 
          data: result, 
          callId 
        };
      
      default:
        return {
          success: false,
          error: `Unknown tool: ${tool}`,
          callId
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      callId
    };
  }
}

