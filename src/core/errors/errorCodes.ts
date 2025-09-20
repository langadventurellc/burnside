/**
 * Error Code Constants
 *
 * Standardized error codes used throughout the LLM Bridge library.
 * These constants ensure consistent error identification across all components.
 *
 * @example
 * ```typescript
 * import { ERROR_CODES } from "./errorCodes";
 *
 * if (error.code === ERROR_CODES.AUTH_ERROR) {
 *   // Handle authentication error
 * }
 * ```
 */
export const ERROR_CODES = {
  /** Base error code for all library errors */
  BRIDGE_ERROR: "BRIDGE_ERROR",
  /** HTTP transport and network-related failures */
  TRANSPORT_ERROR: "TRANSPORT_ERROR",
  /** Authentication and authorization failures */
  AUTH_ERROR: "AUTH_ERROR",
  /** Rate limiting and quota exceeded scenarios */
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  /** Request timeout errors */
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  /** Input validation failures */
  VALIDATION_ERROR: "VALIDATION_ERROR",
  /** Provider-specific API errors */
  PROVIDER_ERROR: "PROVIDER_ERROR",
  /** Streaming-related failures */
  STREAMING_ERROR: "STREAMING_ERROR",
  /** Tool execution failures */
  TOOL_ERROR: "TOOL_ERROR",
  /** Service overloaded scenarios */
  OVERLOADED_ERROR: "OVERLOADED_ERROR",
} as const;
