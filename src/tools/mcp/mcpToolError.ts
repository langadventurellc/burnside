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

import { ToolError } from "../../core/errors/toolError";
import { MCP_ERROR_CODES } from "./mcpErrorCodes";
import { getErrorSeverity } from "./getErrorSeverity";

/**
 * Error thrown when MCP tool operations fail.
 *
 * Used for tool discovery failures, tool execution errors, and tool
 * parameter validation issues. Includes context about the specific
 * tool and operation that failed. Extends ToolError for proper error taxonomy integration.
 */
export class McpToolError extends ToolError {
  constructor(message: string, context?: Record<string, unknown>) {
    // Use the code from context if available, otherwise default
    const errorCode =
      (context?.code as string) || MCP_ERROR_CODES.TOOL_EXECUTION_FAILED;
    super(message, { ...context, code: errorCode });
    // Override the code to be MCP-specific while maintaining ToolError taxonomy
    Object.defineProperty(this, "code", {
      value: errorCode,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  /**
   * Get execution details for debugging
   */
  getExecutionDetails(): {
    toolName?: string;
    serverUrl?: string;
    errorType?: string;
    recoverable: boolean;
  } {
    const errorCode =
      (this.context?.code as string) || MCP_ERROR_CODES.TOOL_EXECUTION_FAILED;
    const severity = getErrorSeverity(errorCode);

    return {
      toolName: this.context?.toolName as string,
      serverUrl: this.context?.serverUrl as string,
      errorType: this.context?.errorType as string,
      recoverable: severity === "recoverable" || severity === "temporary",
    };
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
