/**
 * Tool Type Definitions
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
 * Tool call request
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