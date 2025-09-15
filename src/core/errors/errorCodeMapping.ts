/**
 * Error Code Mapping Type
 *
 * Type mapping for error code translations between providers and library.
 * Maps provider-specific error codes to standardized library error codes
 * for consistent error handling across different providers.
 *
 * @example
 * ```typescript
 * const openaiMapping: ErrorCodeMapping = {
 *   "invalid_api_key": "AUTH_ERROR",
 *   "model_not_found": "PROVIDER_ERROR",
 *   "rate_limit_exceeded": "RATE_LIMIT_ERROR",
 *   "request_timeout": "TIMEOUT_ERROR"
 * };
 * ```
 */
export type ErrorCodeMapping = Record<string, string>;
