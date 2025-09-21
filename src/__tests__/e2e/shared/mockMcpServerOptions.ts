/**
 * Mock MCP Server Configuration Options
 *
 * Configuration interface for customizing Mock MCP Server behavior
 * during E2E testing scenarios.
 */

import type { McpToolDefinition } from "./mcpToolDefinition";

/**
 * Mock MCP Server configuration options
 */
export interface MockMcpServerOptions {
  /** Optional port number - defaults to dynamic allocation */
  port?: number;
  /** Custom tools to register - defaults to mcp_echo_tool */
  tools?: McpToolDefinition[];
  /** Enable request/response logging for debugging */
  enableLogging?: boolean;
}
