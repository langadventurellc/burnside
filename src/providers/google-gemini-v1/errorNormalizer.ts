/**
 * Google Gemini Error Normalizer
 *
 * Converts Google Gemini-specific errors to unified BridgeError types, handling
 * HTTP status codes, Gemini error response formats, and network errors.
 *
 * @example
 * ```typescript
 * import { normalizeGeminiError } from "./errorNormalizer";
 *
 * try {
 *   // Gemini API call
 * } catch (error) {
 *   const bridgeError = normalizeGeminiError(error);
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
 * Google Gemini error response structure following Google API error format
 */
interface GeminiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<Record<string, unknown>>;
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
  CONNECTION_REFUSED: /connection refused|connect econnrefused/i,
  DNS_FAILURE: /getaddrinfo enotfound|dns resolution failed/i,
  SSL_ERROR: /certificate|ssl|tls/i,
  TIMEOUT: /timeout|etimedout/i,
  ABORT: /abort|cancelled|aborted/i,
} as const;

/**
 * Google Gemini error status to BridgeError mapping
 */
const GEMINI_ERROR_STATUS_MAPPING = {
  INVALID_ARGUMENT: "ValidationError",
  UNAUTHENTICATED: "AuthError",
  PERMISSION_DENIED: "AuthError",
  NOT_FOUND: "ValidationError",
  RESOURCE_EXHAUSTED: "RateLimitError",
  FAILED_PRECONDITION: "ValidationError",
  OUT_OF_RANGE: "ValidationError",
  UNIMPLEMENTED: "ProviderError",
  INTERNAL: "ProviderError",
  UNAVAILABLE: "ProviderError",
  DATA_LOSS: "ProviderError",
  DEADLINE_EXCEEDED: "TimeoutError",
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
  504: "ProviderError",
} as const;

/**
 * Main export function that normalizes Gemini errors to BridgeError instances
 *
 * @param error - Unknown error from Gemini API or network operations
 * @returns Appropriate BridgeError subclass based on error analysis
 */
export function normalizeGeminiError(error: unknown): BridgeError {
  // Handle HTTP response errors
  if (isHttpResponseLike(error)) {
    return normalizeHttpError(error);
  }

  // Handle JavaScript Error objects (network errors, etc.)
  if (error instanceof Error) {
    return normalizeNetworkError(error);
  }

  // Handle Gemini error response objects
  if (isGeminiErrorResponse(error)) {
    return normalizeGeminiResponse(error);
  }

  // Handle string errors
  if (typeof error === "string") {
    return new ProviderError("Google Gemini API error", {
      message: error,
      originalError: error,
      provider: "google-gemini",
      version: "v1",
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback for unknown error types
  return new ProviderError("Unknown Google Gemini error", {
    errorType: typeof error,
    originalError: error,
    provider: "google-gemini",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Normalize HTTP response errors based on status codes
 */
function normalizeHttpError(response: HttpResponseLike): BridgeError {
  const statusCode = response.status;
  const errorType = getErrorTypeFromStatus(statusCode);
  const message = buildHttpErrorMessage(response);

  // Extract Gemini error details from response data if available
  const geminiError = extractGeminiErrorFromResponse(response);
  const context = buildHttpErrorContext(response, geminiError);

  return createBridgeError(errorType, message, context);
}

/**
 * Normalize network and connection errors
 */
function normalizeNetworkError(error: Error): BridgeError {
  const errorType = classifyNetworkError(error);
  const message = sanitizeErrorMessage(error.message);
  const context = {
    networkError: true,
    errorName: error.name,
    originalError: error,
    provider: "google-gemini",
    version: "v1",
    timestamp: new Date().toISOString(),
  };

  return createBridgeError(errorType, message, context);
}

/**
 * Normalize Gemini error response objects
 */
function normalizeGeminiResponse(response: GeminiErrorResponse): BridgeError {
  const geminiError = response.error;
  if (
    !geminiError ||
    typeof geminiError !== "object" ||
    (!geminiError.message && !geminiError.status && !geminiError.code)
  ) {
    return new ProviderError("Invalid Google Gemini error response", {
      originalError: response,
      provider: "google-gemini",
      version: "v1",
      timestamp: new Date().toISOString(),
    });
  }

  const errorType = getErrorTypeFromGeminiStatus(geminiError.status);
  const message = geminiError.message || "Google Gemini API error";
  const context = {
    geminiErrorCode: geminiError.code,
    geminiErrorStatus: geminiError.status,
    geminiErrorDetails: geminiError.details,
    originalError: response,
    provider: "google-gemini",
    version: "v1",
    timestamp: new Date().toISOString(),
  };

  return createBridgeError(errorType, message, context);
}

/**
 * Determine error type from HTTP status code
 */
function getErrorTypeFromStatus(statusCode: number): string {
  const mappedType =
    STATUS_CODE_MAPPING[statusCode as keyof typeof STATUS_CODE_MAPPING];
  if (mappedType) {
    return mappedType;
  }

  // Default mappings for ranges
  if (statusCode >= 400 && statusCode < 500) {
    return "ValidationError";
  }

  if (statusCode >= 500) {
    return "ProviderError";
  }

  return "ProviderError";
}

/**
 * Determine error type from Gemini error status
 */
function getErrorTypeFromGeminiStatus(geminiStatus?: string): string {
  if (!geminiStatus) {
    return "ProviderError";
  }

  return (
    GEMINI_ERROR_STATUS_MAPPING[
      geminiStatus as keyof typeof GEMINI_ERROR_STATUS_MAPPING
    ] || "ProviderError"
  );
}

/**
 * Classify network errors based on error patterns
 */
function classifyNetworkError(error: Error): string {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (
    NETWORK_ERROR_PATTERNS.TIMEOUT.test(message) ||
    name.includes("timeout")
  ) {
    return "TimeoutError";
  }

  if (NETWORK_ERROR_PATTERNS.ABORT.test(message) || name.includes("abort")) {
    return "TransportError";
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

  // Try to extract Gemini error message
  const geminiError = extractGeminiErrorFromResponse(response);
  const geminiMessage = geminiError?.message;

  switch (statusCode) {
    case 400:
      return geminiMessage || `Bad request: ${statusText}`;
    case 401:
      return geminiMessage || `Authentication failed: ${statusText}`;
    case 403:
      return geminiMessage || `Access forbidden: ${statusText}`;
    case 404:
      return geminiMessage || `Resource not found: ${statusText}`;
    case 408:
      return geminiMessage || `Request timeout: ${statusText}`;
    case 429:
      return geminiMessage || `Rate limit exceeded: ${statusText}`;
    case 500:
      return geminiMessage || `Provider server error: ${statusText}`;
    case 502:
      return geminiMessage || `Bad gateway: ${statusText}`;
    case 503:
      return geminiMessage || `Service unavailable: ${statusText}`;
    case 504:
      return geminiMessage || `Gateway timeout: ${statusText}`;
    default:
      return geminiMessage || `HTTP ${statusCode}: ${statusText}`;
  }
}

/**
 * Build error context for HTTP errors
 */
function buildHttpErrorContext(
  response: HttpResponseLike,
  geminiError?: GeminiErrorResponse["error"],
): Record<string, unknown> {
  const context: Record<string, unknown> = {
    httpStatus: response.status,
    httpStatusText: response.statusText,
    originalError: response,
    provider: "google-gemini",
    version: "v1",
    timestamp: new Date().toISOString(),
  };

  // Include Gemini-specific error details
  if (geminiError) {
    context.geminiErrorCode = geminiError.code;
    context.geminiErrorStatus = geminiError.status;
    context.geminiErrorDetails = geminiError.details;
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
 * Extract Gemini error from HTTP response data
 */
function extractGeminiErrorFromResponse(
  response: HttpResponseLike,
): GeminiErrorResponse["error"] | undefined {
  if (!response.data || typeof response.data !== "object") {
    return undefined;
  }

  const data = response.data as Record<string, unknown>;
  if (data.error && typeof data.error === "object") {
    return data.error as GeminiErrorResponse["error"];
  }

  return undefined;
}

/**
 * Extract retry information from response headers
 */
function extractRetryInfo(
  headers: Record<string, string>,
): Record<string, unknown> {
  const retryAfter = headers["retry-after"] || headers["Retry-After"];

  if (!retryAfter) {
    return {};
  }

  // Handle numeric seconds
  const numericMatch = /^(\d+)$/.exec(retryAfter);
  if (numericMatch) {
    return {
      retryAfter: parseInt(numericMatch[1], 10),
      retryAfterType: "seconds",
    };
  }

  // Handle HTTP-date format
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    const secondsUntil = Math.max(
      0,
      Math.floor((date.getTime() - Date.now()) / 1000),
    );
    return {
      retryAfter: secondsUntil,
      retryAfterType: "http-date",
      retryAfterDate: date.toISOString(),
    };
  }

  return {
    retryAfter: retryAfter,
    retryAfterType: "unknown",
  };
}

/**
 * Sanitize error messages to prevent information leakage
 */
function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/AIza[a-zA-Z0-9_-]{30,}/g, "AIza***")
    .replace(/ya29\.[a-zA-Z0-9._-]+/g, "ya29.***")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer ***")
    .replace(/x-goog-api-key[:\s=]+[a-zA-Z0-9._-]+/gi, "x-goog-api-key=***")
    .replace(/api[_-]key[:\s=]+[a-zA-Z0-9._-]+/gi, "api_key=***")
    .replace(/token[:\s=]+(?!ya29\.)[a-zA-Z0-9._-]+/gi, "token=***");
}

/**
 * Sanitize response headers to remove sensitive information
 */
function sanitizeHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const sanitized = { ...headers };

  const sensitiveHeaders = [
    "authorization",
    "x-goog-api-key",
    "x-api-key",
    "api-key",
    "x-auth-token",
    "auth-token",
  ];

  sensitiveHeaders.forEach((header) => {
    const lowerHeader = header.toLowerCase();
    Object.keys(sanitized).forEach((key) => {
      if (key.toLowerCase() === lowerHeader) {
        sanitized[key] = "***";
      }
    });
  });

  return sanitized;
}

/**
 * Create appropriate BridgeError subclass based on error type
 */
function createBridgeError(
  errorType: string,
  message: string,
  context: Record<string, unknown>,
): BridgeError {
  const sanitizedMessage = sanitizeErrorMessage(message);

  switch (errorType) {
    case "AuthError":
      return new AuthError(sanitizedMessage, context);
    case "RateLimitError":
      return new RateLimitError(sanitizedMessage, context);
    case "ValidationError":
      return new ValidationError(sanitizedMessage, context);
    case "TimeoutError":
      return new TimeoutError(sanitizedMessage, context);
    case "TransportError":
      return new TransportError(sanitizedMessage, context);
    case "ProviderError":
    default:
      return new ProviderError(sanitizedMessage, context);
  }
}

/**
 * Type guard to check if error looks like an HTTP response
 */
function isHttpResponseLike(error: unknown): error is HttpResponseLike {
  return (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  );
}

/**
 * Type guard to check if error looks like a Gemini error response
 */
function isGeminiErrorResponse(error: unknown): error is GeminiErrorResponse {
  return error !== null && typeof error === "object" && "error" in error;
}
