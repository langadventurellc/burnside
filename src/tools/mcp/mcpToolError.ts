/**
 * MCP Tool Error
 *
 * Error thrown when MCP tool operations fail including tool discovery failures,
 * tool execution errors, and tool parameter validation issues. Includes context
 * about the specific tool and operation that failed.
 *
 * @example Tool not found
 * ```typescript
 * const error = McpToolError.notFound('calculator', 'http://localhost:3000');
 * throw error;
 * ```
 */

import { McpError } from "./mcpError";
import { MCP_ERROR_CODES } from "./mcpErrorCodes";

/**
 * Error thrown when MCP tool operations fail.
 *
 * Used for tool discovery failures, tool execution errors, and tool
 * parameter validation issues. Includes context about the specific
 * tool and operation that failed.
 */
export class McpToolError extends McpError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, MCP_ERROR_CODES.TOOL_EXECUTION_FAILED, context);
  }

  /**
   * Create error for tool discovery failures
   */
  static discoveryFailed(serverUrl: string, reason: string): McpToolError {
    return new McpToolError(
      `Failed to discover tools from MCP server: ${reason}`,
      {
        errorType: "discoveryFailed",
        serverUrl,
        reason,
        code: MCP_ERROR_CODES.TOOL_DISCOVERY_FAILED,
      },
    );
  }

  /**
   * Create error for tool not found scenarios
   */
  static notFound(toolName: string, serverUrl: string): McpToolError {
    return new McpToolError(`Tool '${toolName}' not found on MCP server`, {
      errorType: "notFound",
      toolName,
      serverUrl,
      code: MCP_ERROR_CODES.TOOL_NOT_FOUND,
    });
  }

  /**
   * Create error for invalid tool parameters
   */
  static invalidParams(toolName: string, reason: string): McpToolError {
    return new McpToolError(
      `Invalid parameters for tool '${toolName}': ${reason}`,
      {
        errorType: "invalidParams",
        toolName,
        reason,
        code: MCP_ERROR_CODES.TOOL_INVALID_PARAMS,
      },
    );
  }

  /**
   * Create error for tool execution failures
   */
  static executionFailed(toolName: string, reason: string): McpToolError {
    return new McpToolError(`Tool '${toolName}' execution failed: ${reason}`, {
      errorType: "executionFailed",
      toolName,
      reason,
      code: MCP_ERROR_CODES.TOOL_EXECUTION_FAILED,
    });
  }
}
