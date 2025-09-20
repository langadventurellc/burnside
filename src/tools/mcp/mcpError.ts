/**
 * Base MCP Error Class
 *
 * Provides the foundational error class for all MCP (Model Context Protocol) errors.
 * All MCP-specific errors inherit from McpError which extends BridgeError with
 * MCP-specific error codes and context information.
 *
 * @example
 * ```typescript
 * const error = new McpError(
 *   "MCP operation failed",
 *   "MCP_UNKNOWN_ERROR",
 *   { serverUrl: "http://localhost:3000" }
 * );
 * ```
 */

import { BridgeError } from "../../core/errors/bridgeError";

/**
 * Base class for all MCP-related errors.
 *
 * Extends BridgeError with MCP-specific error codes and context information.
 * All other MCP error classes inherit from this base class.
 */
export class McpError extends BridgeError {
  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
  ) {
    super(message, code, context);
  }
}
