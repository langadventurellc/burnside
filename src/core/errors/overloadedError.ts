/**
 * Overloaded Error Class
 *
 * Error class for service overloaded scenarios when providers return
 * HTTP 529 status codes or similar overload indicators. Used when
 * the service is temporarily unable to handle requests due to high load.
 *
 * @example
 * ```typescript
 * const error = new OverloadedError("Anthropic service is overloaded, please retry later", {
 *   provider: "anthropic",
 *   retryAfterSeconds: 30,
 *   shouldRetry: true,
 *   httpStatus: 529
 * });
 * ```
 */
import { BridgeError } from "./bridgeError";

export class OverloadedError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "OVERLOADED_ERROR", context);
  }
}
