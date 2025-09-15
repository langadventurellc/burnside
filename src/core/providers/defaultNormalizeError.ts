import type { BridgeError } from "../errors/bridgeError.js";
import { AuthError } from "../errors/authError.js";
import { RateLimitError } from "../errors/rateLimitError.js";
import { ProviderError } from "../errors/providerError.js";

/**
 * Default error normalization for HTTP status codes and common error patterns.
 *
 * Converts HTTP status codes and common error patterns into appropriate
 * BridgeError instances with standardized error codes.
 *
 * @param status - HTTP status code
 * @param body - Response body (string or object)
 * @param providerId - Provider identifier for context
 * @param headers - Optional response headers for additional context (e.g., Retry-After)
 * @returns Standardized BridgeError
 *
 * @example
 * ```typescript
 * const error = defaultNormalizeError(429, { error: "Rate limit exceeded" }, "openai");
 * console.log(error.code); // "RATE_LIMIT_ERROR"
 * ```
 */
export function defaultNormalizeError(
  status: number,
  body: unknown,
  providerId: string,
  headers?: Record<string, string>,
): BridgeError {
  const message = extractErrorMessage(body);
  const context = { status, providerId, body, headers };

  switch (status) {
    case 401:
      return new AuthError(`Authentication failed: ${message}`, context);
    case 403:
      return new ProviderError(`Access forbidden: ${message}`, context);
    case 429: {
      const retryAfter = headers?.["retry-after"] || headers?.["Retry-After"];
      const rateLimitContext = retryAfter
        ? { ...context, retryAfter }
        : context;
      return new RateLimitError(
        `Rate limit exceeded: ${message}`,
        rateLimitContext,
      );
    }
    case 500:
    case 502:
    case 503:
    case 504:
      return new ProviderError(`Provider server error: ${message}`, context);
    default:
      return new ProviderError(`Provider error: ${message}`, context);
  }
}

/**
 * Extract error message from various response body formats.
 *
 * @param body - Response body to extract message from
 * @returns Extracted error message or fallback
 */
function extractErrorMessage(body: unknown): string {
  if (typeof body === "string") {
    return body;
  }

  if (typeof body === "object" && body !== null) {
    const obj = body as Record<string, unknown>;

    // Common error message patterns
    if (typeof obj.error === "string") {
      return obj.error;
    }
    if (typeof obj.message === "string") {
      return obj.message;
    }
    if (typeof obj.error === "object" && obj.error !== null) {
      const errorObj = obj.error as Record<string, unknown>;
      if (typeof errorObj.message === "string") {
        return errorObj.message;
      }
    }
  }

  return "Unknown error";
}
