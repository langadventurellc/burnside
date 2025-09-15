/**
 * Normalized Error Interface
 *
 * Standardized error information after normalization.
 * Represents the final error format that should be used throughout
 * the library after provider-specific errors have been normalized.
 *
 * @example
 * ```typescript
 * const normalizedError: NormalizedError = {
 *   type: "RateLimitError",
 *   message: "API rate limit exceeded",
 *   code: "RATE_LIMIT_ERROR",
 *   context: {
 *     provider: "openai",
 *     retryAfter: 60,
 *     requestsPerMinute: 3000
 *   }
 * };
 * ```
 */
export interface NormalizedError {
  /** The error class type that should be instantiated */
  type: string;
  /** Human-readable error message */
  message: string;
  /** Standardized error code */
  code: string;
  /** Additional context information for the error */
  context?: Record<string, unknown>;
  /** Original provider error for debugging (optional) */
  originalError?: unknown;
}
