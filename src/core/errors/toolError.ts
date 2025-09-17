/**
 * Tool Error Class
 *
 * Error class for tool execution failures.
 * Used when tool calls fail during execution, either due to
 * invalid parameters or execution errors.
 *
 * @example
 * ```typescript
 * const error = new ToolError("Tool execution failed", {
 *   toolName: "calculator",
 *   parameters: { operation: "add", a: 1, b: "invalid" },
 *   executionTime: 150,
 *   failureReason: "Invalid parameter type"
 * });
 * ```
 */
import { BridgeError } from "./bridgeError";

export class ToolError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "TOOL_ERROR", context);
  }
}
