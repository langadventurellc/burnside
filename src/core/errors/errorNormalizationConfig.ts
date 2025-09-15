/**
 * Error Normalization Configuration Interface
 *
 * Configuration options for HTTP error normalization.
 * Allows customization of error mapping, context preservation,
 * and debugging features.
 *
 * @example
 * ```typescript
 * const config: ErrorNormalizationConfig = {
 *   statusCodeMapping: { 418: "ValidationError" },
 *   preserveOriginalError: true,
 *   includeStackTrace: false
 * };
 * ```
 */
export interface ErrorNormalizationConfig {
  /** Custom status code to error type mapping */
  statusCodeMapping?: Record<number, string>;
  /** Whether to preserve original error in context */
  preserveOriginalError?: boolean;
  /** Whether to include stack traces in normalized errors */
  includeStackTrace?: boolean;
}
