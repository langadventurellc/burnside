/**
 * Transport Error Class
 *
 * Error class for HTTP transport and network-related failures.
 * Used when HTTP requests fail due to network issues, connection problems,
 * or other transport-level errors that are not provider-specific.
 *
 * @example
 * ```typescript
 * const error = new TransportError("Connection timeout", {
 *   url: "https://api.openai.com/v1/responses",
 *   timeout: 30000,
 *   attempt: 3
 * });
 * ```
 */
import { BridgeError } from "./bridgeError";

export class TransportError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "TRANSPORT_ERROR", context);
  }
}
