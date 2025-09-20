/**
 * MCP Error Factory Functions
 *
 * Helper functions for creating specific MCP errors with appropriate context.
 * Provides a convenient API for creating connection, capability, tool, and
 * protocol errors throughout the MCP implementation.
 *
 * @example Creating errors
 * ```typescript
 * const connError = createMcpError.connection('Failed to connect', { serverUrl: 'http://localhost:3000' });
 * const capError = createMcpError.capability('Invalid capabilities', { serverUrl: 'http://localhost:3000' });
 * ```
 */

import { McpError } from "./mcpError";
import { McpConnectionError } from "./mcpConnectionError";
import { McpCapabilityError } from "./mcpCapabilityError";
import { McpToolError } from "./mcpToolError";
import { MCP_ERROR_CODES } from "./mcpErrorCodes";

/**
 * Helper functions for creating specific MCP errors
 */
export const createMcpError = {
  /**
   * Create a connection error with appropriate context
   */
  connection: (message: string, context?: Record<string, unknown>) =>
    new McpConnectionError(message, context),

  /**
   * Create a capability error with appropriate context
   */
  capability: (message: string, context?: Record<string, unknown>) =>
    new McpCapabilityError(message, context),

  /**
   * Create a tool error with appropriate context
   */
  tool: (message: string, context?: Record<string, unknown>) =>
    new McpToolError(message, context),

  /**
   * Create a protocol error for JSON-RPC issues
   */
  protocol: (message: string, context?: Record<string, unknown>) =>
    new McpError(message, MCP_ERROR_CODES.PROTOCOL_ERROR, context),

  /**
   * Create a JSON-RPC specific error
   */
  jsonrpc: (message: string, code: number, data?: unknown) =>
    new McpError(message, MCP_ERROR_CODES.JSONRPC_ERROR, {
      jsonrpcCode: code,
      data,
    }),
};
