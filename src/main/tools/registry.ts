/**
 * Tool Registry
 * 
 * Central registry of all available tools with their schemas.
 * Schemas follow OpenAI/Anthropic function calling format.
 */

import { ToolDefinition } from '../../types/tool.types';

/**
 * All available tools for AI agent consumption
 */
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  newTab: {
    name: 'newTab',
    description: 'Opens a new browser tab and navigates to the specified URL',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Full URL to navigate to (must include https:// or http://)'
        }
      },
      required: ['url']
    }
  },
  
  closeTab: {
    name: 'closeTab',
    description: 'Closes a browser tab by ID',
    parameters: {
      type: 'object',
      properties: {
        tabId: {
          type: 'number',
          description: 'ID of the tab to close'
        }
      },
      required: ['tabId']
    }
  },
  
  switchTab: {
    name: 'switchTab',
    description: 'Switches to a specific tab by ID, bringing it to the foreground',
    parameters: {
      type: 'object',
      properties: {
        tabId: {
          type: 'number',
          description: 'ID of the tab to switch to'
        }
      },
      required: ['tabId']
    }
  },
  
  getAllTabs: {
    name: 'getAllTabs',
    description: 'Gets information about all open tabs including IDs, URLs, and titles',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  
  executeJS: {
    name: 'executeJS',
    description: 'Executes arbitrary JavaScript code in the specified tab context. Returns the result. Use this for: getting URL (window.location.href), getting page text (document.body.innerText), scrolling (window.scrollBy), clicking (element.click()), filling forms (element.value=), etc.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'JavaScript code to execute. Examples: "window.location.href", "document.body.innerText", "window.scrollBy(0,500)", "document.querySelector(\'#btn\').click()"'
        },
        tabId: {
          type: 'number',
          description: 'Optional: Tab ID. If not provided, uses currently active tab'
        }
      },
      required: ['code']
    }
  }
};

/**
 * Get all tool definitions (for agent consumption)
 */
export function getAllToolDefinitions(): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY);
}

// Removed unused: getToolDefinition, toolExists

