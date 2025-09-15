/**
 * Timeout Error Class
 *
 * Error class for request timeout scenarios.
 * Used when HTTP requests or streaming operations exceed
 * configured timeout limits.
 *
 * @example
 * ```typescript
 * const error = new TimeoutError("Request timed out after 30s", {
 *   timeoutMs: 30000,
 *   operation: "chat_completion",
 *   provider: "anthropic"
 * });
 * ```
 */
import { BridgeError } from "./bridgeError.js";

export class TimeoutError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "TIMEOUT_ERROR", context);
  }
}
