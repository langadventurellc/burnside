/**
 * MCP Tool Definition Interface
 *
 * Type definition for MCP tool structure used in mock server testing.
 */

/**
 * MCP tool definition structure
 */
export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}
