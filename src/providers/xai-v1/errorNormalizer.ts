/**
 * xAI Error Normalizer
 *
 * Converts xAI-specific errors to unified BridgeError types, handling
 * HTTP status codes, xAI error response formats, and network errors.
 * Based on OpenAI error patterns since xAI API is OpenAI-compatible.
 *
 * @example
 * ```typescript
 * import { normalizeXAIError } from "./errorNormalizer";
 *
 * try {
 *   // xAI API call
 * } catch (error) {
 *   const bridgeError = normalizeXAIError(error);
 *   console.log(bridgeError.code); // "AUTH_ERROR", "RATE_LIMIT_ERROR", etc.
 * }
 * ```
 */
import {
  BridgeError,
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
  TransportError,
  TimeoutError,
} from "../../core/errors/index";

/**
 * xAI error response structure (OpenAI-compatible)
 */
interface XAIErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string;
    param?: string;
  };
}

/**
 * HTTP response-like object with status and headers
 */
interface HttpResponseLike {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: unknown;
}

/**
 * Network error patterns for classification
 */
const NETWORK_ERROR_PATTERNS = {
  TIMEOUT: /timeout|timed.*out|aborted/i,
  CONNECTION_REFUSED: /connect.*refused|connection.*refused/i,
  DNS_FAILURE: /getaddrinfo.*notfound|dns.*error|enotfound/i,
  SSL_ERROR: /ssl.*error|certificate.*error|cert.*error/i,
  ABORT: /abort|cancelled|canceled/i,
} as const;

/**
 * xAI error type to BridgeError class mapping
 */
const XAI_ERROR_TYPE_MAPPING = {
  authentication_error: "AuthError",
  rate_limit_error: "RateLimitError",
  invalid_request_error: "ValidationError",
  server_error: "ProviderError",
  insufficient_quota: "RateLimitError",
  model_not_found: "ValidationError",
  permission_denied: "AuthError",
  unsupported_media_type: "ValidationError",
  invalid_field_format_error: "ValidationError",
  method_not_allowed_error: "ValidationError",
} as const;

/**
 * HTTP status code to error type mapping
 */
const STATUS_CODE_MAPPING = {
  400: "ValidationError",
  401: "AuthError",
  403: "AuthError",
  404: "ValidationError",
  408: "TimeoutError",
  429: "RateLimitError",
  500: "ProviderError",
  502: "ProviderError",
  503: "ProviderError",
  504: "TimeoutError",
} as const;

/**
 * Main error normalizer function
 *
 * @param error - Unknown error to normalize
 * @returns Standardized BridgeError instance
 */
export function normalizeXAIError(error: unknown): BridgeError {
  // Handle HTTP response errors
  if (isHttpResponseLike(error)) {
    return normalizeHttpError(error);
  }

  // Handle JavaScript Error objects
  if (error instanceof Error) {
    return normalizeNetworkError(error);
  }

  // Handle xAI error response objects
  if (isXAIErrorResponse(error)) {
    return normalizeXAIResponse(error);
  }

  // Handle string errors
  if (typeof error === "string") {
    return new ProviderError(`xAI error: ${error}`, {
      provider: "xai",
      version: "v1",
      originalError: error,
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback for unknown errors
  return new ProviderError("Unknown xAI error occurred", {
    provider: "xai",
    version: "v1",
    originalError: error,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Normalize HTTP response errors
 */
function normalizeHttpError(response: HttpResponseLike): BridgeError {
  const errorType = getErrorTypeFromStatus(response.status);
  const xaiError = extractXAIErrorFromResponse(response);
  const message = buildHttpErrorMessage(response);
  const context = buildHttpErrorContext(response, xaiError);

  return createBridgeError(errorType, message, context);
}

/**
 * Normalize network and transport errors
 */
function normalizeNetworkError(error: Error): BridgeError {
  const errorType = classifyNetworkError(error);
  const message = sanitizeErrorMessage(error.message);

  const context = {
    provider: "xai",
    version: "v1",
    originalError: error,
    timestamp: new Date().toISOString(),
    errorName: error.name,
  };

  return createBridgeError(errorType, message, context);
}

/**
 * Normalize xAI API error responses
 */
function normalizeXAIResponse(errorResponse: XAIErrorResponse): BridgeError {
  const xaiError = errorResponse.error;
  if (!xaiError) {
    return new ProviderError("Unknown xAI API error", {
      provider: "xai",
      version: "v1",
      originalError: errorResponse,
      timestamp: new Date().toISOString(),
    });
  }

  const errorType = getErrorTypeFromXAIType(xaiError.type);
  const message = sanitizeErrorMessage(
    xaiError.message || "Unknown xAI API error",
  );

  const context = {
    provider: "xai",
    version: "v1",
    originalError: errorResponse,
    timestamp: new Date().toISOString(),
    xaiErrorType: xaiError.type,
    xaiErrorCode: xaiError.code,
    xaiErrorParam: xaiError.param,
  };

  return createBridgeError(errorType, message, context);
}

/**
 * Get error type from HTTP status code
 */
function getErrorTypeFromStatus(status: number): string {
  return (
    STATUS_CODE_MAPPING[status as keyof typeof STATUS_CODE_MAPPING] ||
    "ProviderError"
  );
}

/**
 * Get error type from xAI error type
 */
function getErrorTypeFromXAIType(xaiType?: string): string {
  if (!xaiType) return "ProviderError";

  return (
    XAI_ERROR_TYPE_MAPPING[xaiType as keyof typeof XAI_ERROR_TYPE_MAPPING] ||
    "ProviderError"
  );
}

/**
 * Classify network errors based on error patterns
 */
function classifyNetworkError(error: Error): string {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (NETWORK_ERROR_PATTERNS.ABORT.test(message) || name.includes("abort")) {
    return "TransportError";
  }

  if (
    NETWORK_ERROR_PATTERNS.TIMEOUT.test(message) ||
    name.includes("timeout")
  ) {
    return "TimeoutError";
  }

  if (NETWORK_ERROR_PATTERNS.CONNECTION_REFUSED.test(message)) {
    return "TransportError";
  }

  if (NETWORK_ERROR_PATTERNS.DNS_FAILURE.test(message)) {
    return "TransportError";
  }

  if (NETWORK_ERROR_PATTERNS.SSL_ERROR.test(message)) {
    return "TransportError";
  }

  return "TransportError";
}

/**
 * Build human-readable error message from HTTP response
 */
function buildHttpErrorMessage(response: HttpResponseLike): string {
  const statusCode = response.status;
  const statusText = response.statusText || "Unknown";

  // Try to extract xAI error message
  const xaiError = extractXAIErrorFromResponse(response);
  const xaiMessage = xaiError?.message;

  switch (statusCode) {
    case 400:
      return xaiMessage || `Bad request: ${statusText}`;
    case 401:
      return xaiMessage || `Authentication failed: ${statusText}`;
    case 403:
      return xaiMessage || `Access forbidden: ${statusText}`;
    case 404:
      return xaiMessage || `Resource not found: ${statusText}`;
    case 408:
      return xaiMessage || `Request timeout: ${statusText}`;
    case 429:
      return xaiMessage || `Rate limit exceeded: ${statusText}`;
    case 500:
      return xaiMessage || `Provider server error: ${statusText}`;
    case 502:
      return xaiMessage || `Bad gateway: ${statusText}`;
    case 503:
      return xaiMessage || `Service unavailable: ${statusText}`;
    case 504:
      return xaiMessage || `Gateway timeout: ${statusText}`;
    default:
      return xaiMessage || `HTTP ${statusCode}: ${statusText}`;
  }
}

/**
 * Build error context for HTTP errors
 */
function buildHttpErrorContext(
  response: HttpResponseLike,
  xaiError?: XAIErrorResponse["error"],
): Record<string, unknown> {
  const context: Record<string, unknown> = {
    provider: "xai",
    version: "v1",
    httpStatus: response.status,
    httpStatusText: response.statusText,
    originalError: response,
    timestamp: new Date().toISOString(),
  };

  // Include xAI-specific error details
  if (xaiError) {
    context.xaiErrorType = xaiError.type;
    context.xaiErrorCode = xaiError.code;
    context.xaiErrorParam = xaiError.param;
  }

  // Extract retry information for rate limits
  if (response.status === 429 && response.headers) {
    const retryInfo = extractRetryInfo(response.headers);
    Object.assign(context, retryInfo);
  }

  // Sanitize headers if present
  if (response.headers) {
    context.headers = sanitizeHeaders(response.headers);
  }

  return context;
}

/**
 * Extract xAI error from HTTP response data
 */
function extractXAIErrorFromResponse(
  response: HttpResponseLike,
): XAIErrorResponse["error"] | undefined {
  if (!response.data || typeof response.data !== "object") {
    return undefined;
  }

  const data = response.data as Record<string, unknown>;
  if (data.error && typeof data.error === "object") {
    return data.error as XAIErrorResponse["error"];
  }

  return undefined;
}

/**
 * Extract retry information from response headers
 */
function extractRetryInfo(
  headers: Record<string, string>,
): Record<string, unknown> {
  const retryInfo: Record<string, unknown> = {};

  // Check for Retry-After header (seconds or HTTP-date)
  const retryAfter = headers["retry-after"] || headers["Retry-After"];
  if (retryAfter) {
    const retrySeconds = parseInt(retryAfter, 10);
    if (!isNaN(retrySeconds)) {
      retryInfo.retryAfterSeconds = retrySeconds;
    } else {
      // Try parsing as HTTP-date
      const date = new Date(retryAfter);
      if (!isNaN(date.getTime())) {
        const secondsUntil = Math.max(0, (date.getTime() - Date.now()) / 1000);
        retryInfo.retryAfterSeconds = Math.ceil(secondsUntil);
      }
    }
  }

  // Check for rate limit headers
  const remaining = headers["x-ratelimit-remaining"];
  if (remaining) {
    retryInfo.rateLimitRemaining = parseInt(remaining, 10);
  }

  const resetTime = headers["x-ratelimit-reset"];
  if (resetTime) {
    retryInfo.rateLimitReset = parseInt(resetTime, 10);
  }

  return retryInfo;
}

/**
 * Sanitize error messages to remove sensitive information
 */
function sanitizeErrorMessage(message: string): string {
  // Remove xAI API keys (xai-*)
  return message.replace(/xai-[a-zA-Z0-9_-]+/g, "xai-***");
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(
  headers: Record<string, string>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    if (lowerKey === "authorization" || lowerKey === "x-api-key") {
      // Sanitize auth headers
      if (typeof value === "string" && value.startsWith("Bearer xai-")) {
        sanitized[key] = "Bearer xai-***";
      } else {
        sanitized[key] = "***";
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create BridgeError instance based on error type
 */
function createBridgeError(
  errorType: string,
  message: string,
  context: Record<string, unknown>,
): BridgeError {
  switch (errorType) {
    case "AuthError":
      return new AuthError(message, context);
    case "RateLimitError":
      return new RateLimitError(message, context);
    case "ValidationError":
      return new ValidationError(message, context);
    case "TimeoutError":
      return new TimeoutError(message, context);
    case "TransportError":
      return new TransportError(message, context);
    case "ProviderError":
      return new ProviderError(message, context);
    default:
      return new ProviderError(message, context);
  }
}

/**
 * Type guard for HTTP response-like objects
 */
function isHttpResponseLike(error: unknown): error is HttpResponseLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  );
}

/**
 * Type guard for xAI error response objects
 */
function isXAIErrorResponse(error: unknown): error is XAIErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as Record<string, unknown>).error === "object"
  );
}
