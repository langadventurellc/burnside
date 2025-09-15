/**
 * Error Normalizer Interface
 *
 * Interface for error normalizer implementations that transform provider-specific
 * error formats into standardized library error formats for consistent handling.
 *
 * @example
 * ```typescript
 * class AnthropicErrorNormalizer implements ErrorNormalizer {
 *   normalize(error: unknown, context: ErrorContext): NormalizedError {
 *     if (isAnthropicAuthError(error)) {
 *       return {
 *         type: "AuthError",
 *         message: "Authentication failed with Anthropic",
 *         code: "AUTH_ERROR",
 *         context: { provider: "anthropic", ...context }
 *       };
 *     }
 *     // Handle other error types...
 *   }
 * }
 * ```
 */
import type { ErrorContext } from "./errorContext.js";
import type { NormalizedError } from "./normalizedError.js";

export interface ErrorNormalizer {
  /**
   * Normalize a provider-specific error into a standardized format.
   *
   * @param providerError - The raw error from the provider
   * @param context - Additional context information for the error
   * @returns Normalized error information
   */
  normalize(providerError: unknown, context: ErrorContext): NormalizedError;
}
