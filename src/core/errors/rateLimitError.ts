/**
 * Rate Limit Error Class
 *
 * Error class for rate limiting and quota exceeded scenarios.
 * Used when providers return rate limit errors or when usage
 * quotas have been exceeded.
 *
 * @example
 * ```typescript
 * const error = new RateLimitError("Rate limit exceeded", {
 *   provider: "openai",
 *   retryAfter: 60,
 *   requestsPerMinute: 3000,
 *   quotaType: "tokens"
 * });
 * ```
 */
import { BridgeError } from "./bridgeError.js";

export class RateLimitError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "RATE_LIMIT_ERROR", context);
  }
}
