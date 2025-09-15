/**
 * Error Factory Type
 *
 * Factory function type for creating normalized errors from provider errors.
 * Provides a functional approach to error normalization that can be
 * easily composed and tested.
 *
 * @example
 * ```typescript
 * const createAuthError: ErrorFactory = (message, context) => ({
 *   type: "AuthError",
 *   message,
 *   code: "AUTH_ERROR",
 *   context
 * });
 *
 * const normalizedError = createAuthError("Invalid token", {
 *   provider: "anthropic",
 *   requestId: "req_123"
 * });
 * ```
 */
import type { NormalizedError } from "./normalizedError.js";

export type ErrorFactory = (
  message: string,
  context?: Record<string, unknown>,
) => NormalizedError;
