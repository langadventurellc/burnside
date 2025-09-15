/**
 * Serialized Error Interface
 *
 * Interface for JSON-safe error representation used in logging and transport.
 *
 * @example
 * ```typescript
 * const serialized: SerializedError = {
 *   name: "AuthError",
 *   message: "Invalid token",
 *   code: "AUTH_ERROR",
 *   context: { provider: "openai", requestId: "req_123" },
 *   stack: "AuthError: Invalid token\n    at ..."
 * };
 * ```
 */
export interface SerializedError {
  /** Error name (class name) */
  name: string;
  /** Error message */
  message: string;
  /** Error code if available */
  code?: string;
  /** Error context if available */
  context?: Record<string, unknown>;
  /** Stack trace */
  stack?: string;
  /** Original error properties */
  [key: string]: unknown;
}
