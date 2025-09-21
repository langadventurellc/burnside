/**
 * MCP Tool Result Expectation Interface
 *
 * Schema for validating MCP tool execution results.
 */

/**
 * MCP tool result validation schema
 */
export interface McpToolResultExpectation {
  /** Expected tool name */
  toolName: string;
  /** Expected content type */
  contentType?: string;
  /** Expected text pattern or exact match */
  textPattern?: string | RegExp;
  /** Expected data structure */
  expectedData?: Record<string, unknown>;
  /** Whether result should indicate success */
  shouldSucceed?: boolean;
}
