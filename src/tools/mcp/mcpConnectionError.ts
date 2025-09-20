/**
 * MCP Connection Error
 *
 * Error thrown when MCP connection operations fail including connection
 * establishment failures, connection loss, timeouts, and reconnection failures.
 * Includes context about the server and connection parameters.
 *
 * @example Connection timeout
 * ```typescript
 * const error = McpConnectionError.timeout('http://localhost:3000', 5000);
 * throw error;
 * ```
 */

import { McpError } from "./mcpError";
import { MCP_ERROR_CODES } from "./mcpErrorCodes";

/**
 * Error thrown when MCP connection operations fail.
 *
 * Used for connection establishment failures, connection loss, timeouts,
 * and reconnection failures. Includes context about the server and
 * connection parameters.
 */
export class McpConnectionError extends McpError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, MCP_ERROR_CODES.CONNECTION_FAILED, context);
  }

  /**
   * Create error for connection timeout scenarios
   */
  static timeout(serverUrl: string, timeoutMs: number): McpConnectionError {
    return new McpConnectionError(
      `Connection to MCP server timed out after ${timeoutMs}ms`,
      {
        errorType: "timeout",
        serverUrl,
        timeoutMs,
        code: MCP_ERROR_CODES.CONNECTION_TIMEOUT,
      },
    );
  }

  /**
   * Create error for connection refusal scenarios
   */
  static refused(serverUrl: string, reason?: string): McpConnectionError {
    return new McpConnectionError(
      `Connection to MCP server refused${reason ? `: ${reason}` : ""}`,
      {
        errorType: "refused",
        serverUrl,
        reason,
        code: MCP_ERROR_CODES.CONNECTION_REFUSED,
      },
    );
  }

  /**
   * Create error for connection loss scenarios
   */
  static lost(serverUrl: string): McpConnectionError {
    return new McpConnectionError(`Lost connection to MCP server`, {
      errorType: "lost",
      serverUrl,
      code: MCP_ERROR_CODES.CONNECTION_LOST,
    });
  }

  /**
   * Create error for reconnection failure scenarios
   */
  static reconnectionFailed(
    serverUrl: string,
    attempts: number,
  ): McpConnectionError {
    return new McpConnectionError(
      `Failed to reconnect to MCP server after ${attempts} attempts`,
      {
        errorType: "reconnectionFailed",
        serverUrl,
        attempts,
        code: MCP_ERROR_CODES.RECONNECTION_FAILED,
      },
    );
  }
}
