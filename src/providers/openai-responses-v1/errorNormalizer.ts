/**
 * OpenAI Error Normalizer
 *
 * Converts OpenAI-specific errors to unified BridgeError types, handling
 * HTTP status codes, OpenAI error response formats, and network errors.
 *
 * @example
 * ```typescript
 * import { normalizeOpenAIError } from "./errorNormalizer";
 *
 * try {
 *   // OpenAI API call
 * } catch (error) {
 *   const bridgeError = normalizeOpenAIError(error);
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
 * OpenAI error response structure
 */
interface OpenAIErrorResponse {
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
  CONNECTION_REFUSED: /connection refused|connect econnrefused/i,
  DNS_FAILURE: /getaddrinfo enotfound|dns resolution failed/i,
  SSL_ERROR: /certificate|ssl|tls/i,
  TIMEOUT: /timeout|etimedout/i,
  ABORT: /abort|cancelled|aborted/i,
} as const;

/**
 * OpenAI error type to BridgeError mapping
 */
const OPENAI_ERROR_TYPE_MAPPING = {
  authentication_error: "AuthError",
  rate_limit_error: "RateLimitError",
  invalid_request_error: "ValidationError",
  server_error: "ProviderError",
  insufficient_quota: "RateLimitError",
  model_not_found: "ValidationError",
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
 * Main export function that normalizes OpenAI errors to BridgeError instances
 *
 * @param error - Unknown error from OpenAI API or network operations
 * @returns Appropriate BridgeError subclass based on error analysis
 */
export function normalizeOpenAIError(error: unknown): BridgeError {
  // Handle HTTP response errors
  if (isHttpResponseLike(error)) {
    return normalizeHttpError(error);
  }

  // Handle JavaScript Error objects (network errors, etc.)
  if (error instanceof Error) {
    return normalizeNetworkError(error);
  }

  // Handle OpenAI error response objects
  if (isOpenAIErrorResponse(error)) {
    return normalizeOpenAIResponse(error);
  }

  // Handle string errors
  if (typeof error === "string") {
    return new ProviderError("OpenAI API error", {
      message: error,
      originalError: error,
    });
  }

  // Fallback for unknown error types
  return new ProviderError("Unknown OpenAI error", {
    errorType: typeof error,
    originalError: error,
  });
}

/**
 * Normalize HTTP response errors based on status codes
 */
function normalizeHttpError(response: HttpResponseLike): BridgeError {
  const statusCode = response.status;
  const errorType = getErrorTypeFromStatus(statusCode);
  const message = buildHttpErrorMessage(response);

  // Extract OpenAI error details from response data if available
  const openaiError = extractOpenAIErrorFromResponse(response);
  const context = buildHttpErrorContext(response, openaiError);

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
  };

  return createBridgeError(errorType, message, context);
}

/**
 * Normalize OpenAI error response objects
 */
function normalizeOpenAIResponse(response: OpenAIErrorResponse): BridgeError {
  const openaiError = response.error;
  if (!openaiError) {
    return new ProviderError("Invalid OpenAI error response", {
      originalError: response,
    });
  }

  const errorType = getErrorTypeFromOpenAIType(openaiError.type);
  const message = openaiError.message || "OpenAI API error";
  const context = {
    openaiErrorType: openaiError.type,
    openaiErrorCode: openaiError.code,
    openaiErrorParam: openaiError.param,
    originalError: response,
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
 * Determine error type from OpenAI error type
 */
function getErrorTypeFromOpenAIType(openaiType?: string): string {
  if (!openaiType) {
    return "ProviderError";
  }

  return (
    OPENAI_ERROR_TYPE_MAPPING[
      openaiType as keyof typeof OPENAI_ERROR_TYPE_MAPPING
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

  // Try to extract OpenAI error message
  const openaiError = extractOpenAIErrorFromResponse(response);
  const openaiMessage = openaiError?.message;

  switch (statusCode) {
    case 400:
      return openaiMessage || `Bad request: ${statusText}`;
    case 401:
      return openaiMessage || `Authentication failed: ${statusText}`;
    case 403:
      return openaiMessage || `Access forbidden: ${statusText}`;
    case 404:
      return openaiMessage || `Resource not found: ${statusText}`;
    case 408:
      return openaiMessage || `Request timeout: ${statusText}`;
    case 429:
      return openaiMessage || `Rate limit exceeded: ${statusText}`;
    case 500:
      return openaiMessage || `Provider server error: ${statusText}`;
    case 502:
      return openaiMessage || `Bad gateway: ${statusText}`;
    case 503:
      return openaiMessage || `Service unavailable: ${statusText}`;
    case 504:
      return openaiMessage || `Gateway timeout: ${statusText}`;
    default:
      return openaiMessage || `HTTP ${statusCode}: ${statusText}`;
  }
}

/**
 * Build error context for HTTP errors
 */
function buildHttpErrorContext(
  response: HttpResponseLike,
  openaiError?: OpenAIErrorResponse["error"],
): Record<string, unknown> {
  const context: Record<string, unknown> = {
    httpStatus: response.status,
    httpStatusText: response.statusText,
    originalError: response,
  };

  // Include OpenAI-specific error details
  if (openaiError) {
    context.openaiErrorType = openaiError.type;
    context.openaiErrorCode = openaiError.code;
    context.openaiErrorParam = openaiError.param;
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
 * Extract OpenAI error from HTTP response data
 */
function extractOpenAIErrorFromResponse(
  response: HttpResponseLike,
): OpenAIErrorResponse["error"] | undefined {
  if (!response.data || typeof response.data !== "object") {
    return undefined;
  }

  const data = response.data as Record<string, unknown>;
  if (data.error && typeof data.error === "object") {
    return data.error as OpenAIErrorResponse["error"];
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
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-***")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer ***")
    .replace(/api[_-]key[:\s=]+[a-zA-Z0-9._-]+/gi, "api_key=***")
    .replace(/token[:\s=]+[a-zA-Z0-9._-]+/gi, "token=***");
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
 * Type guard to check if error looks like an OpenAI error response
 */
function isOpenAIErrorResponse(error: unknown): error is OpenAIErrorResponse {
  return (
    error !== null &&
    typeof error === "object" &&
    "error" in error &&
    typeof (error as Record<string, unknown>).error === "object"
  );
}
