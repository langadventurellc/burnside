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

import { TransportError } from "../../core/errors/transportError";
import { MCP_ERROR_CODES } from "./mcpErrorCodes";
import { getErrorSeverity } from "./getErrorSeverity";

/**
 * Error thrown when MCP connection operations fail.
 *
 * Used for connection establishment failures, connection loss, timeouts,
 * and reconnection failures. Includes context about the server and
 * connection parameters. Extends TransportError for proper error taxonomy integration.
 */
export class McpConnectionError extends TransportError {
  constructor(message: string, context?: Record<string, unknown>) {
    // Use the code from context if available, otherwise default
    const errorCode =
      (context?.code as string) || MCP_ERROR_CODES.CONNECTION_FAILED;
    super(message, { ...context, code: errorCode });
    // Override the code to be MCP-specific while maintaining TransportError taxonomy
    Object.defineProperty(this, "code", {
      value: errorCode,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  /**
   * Check if this error is recoverable for retry logic
   */
  isRecoverable(): boolean {
    const errorCode =
      (this.context?.code as string) || MCP_ERROR_CODES.CONNECTION_FAILED;
    const severity = getErrorSeverity(errorCode);
    return severity === "recoverable" || severity === "temporary";
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
