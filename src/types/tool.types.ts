/**
 * Tool Type Definitions
 * 
 * Defines the contract for AI agent tool calling.
 * Compatible with OpenAI/Anthropic function calling formats.
 */

/**
 * Tool definition schema (OpenAI/Anthropic compatible)
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Tool call request from AI agent
 */
export interface ToolCall {
  tool: string;
  params: any;
  callId?: string;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  callId?: string;
}

// Removed unused: ToolHandler type

