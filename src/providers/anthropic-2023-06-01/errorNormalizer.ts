/**
 * Anthropic Error Normalizer
 *
 * Converts Anthropic-specific errors to unified BridgeError types, handling
 * HTTP status codes, Anthropic error response formats, and network errors.
 *
 * @example
 * ```typescript
 * import { normalizeAnthropicError } from "./errorNormalizer";
 *
 * try {
 *   // Anthropic API call
 * } catch (error) {
 *   const bridgeError = normalizeAnthropicError(error);
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
  OverloadedError,
} from "../../core/errors/index";

/**
 * Anthropic error response structure
 */
interface AnthropicErrorResponse {
  type: "error";
  error: {
    type: string;
    message: string;
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
 * Anthropic error type to BridgeError mapping
 */
const ANTHROPIC_ERROR_TYPE_MAPPING = {
  invalid_request_error: "ValidationError",
  authentication_error: "AuthError",
  permission_error: "AuthError",
  not_found_error: "ProviderError",
  rate_limit_error: "RateLimitError",
  api_error: "ProviderError",
  overloaded_error: "ProviderError",
} as const;

/**
 * HTTP status code to error type mapping
 */
const STATUS_CODE_MAPPING = {
  400: "ValidationError",
  401: "AuthError",
  403: "AuthError",
  404: "ProviderError",
  408: "TimeoutError",
  422: "ValidationError",
  429: "RateLimitError",
  500: "ProviderError",
  502: "ProviderError",
  503: "ProviderError",
  504: "ProviderError",
  529: "OverloadedError",
} as const;

/**
 * Main export function that normalizes Anthropic errors to BridgeError instances
 *
 * @param error - Unknown error from Anthropic API or network operations
 * @param context - Optional additional context for error debugging
 * @returns Appropriate BridgeError subclass based on error analysis
 */
export function normalizeAnthropicError(
  error: unknown,
  context: Record<string, unknown> = {},
): BridgeError {
  // Handle existing Bridge errors first (just enhance context)
  if (
    error instanceof ValidationError ||
    error instanceof AuthError ||
    error instanceof RateLimitError ||
    error instanceof ProviderError ||
    error instanceof TransportError ||
    error instanceof TimeoutError ||
    error instanceof OverloadedError
  ) {
    const ErrorClass = error.constructor as new (
      message: string,
      context?: Record<string, unknown>,
    ) => BridgeError;
    return new ErrorClass(error.message, {
      ...error.context,
      ...enhanceErrorContext(context, error),
    });
  }

  // Handle AbortError (timeout scenarios)
  if (error instanceof Error && error.name === "AbortError") {
    return new TimeoutError("Request timeout", {
      originalError: error,
      ...enhanceErrorContext(context, error),
    });
  }

  // Handle network/transport errors
  if (error instanceof Error) {
    const networkErrorType = classifyNetworkError(error);
    if (networkErrorType === "TimeoutError") {
      return new TimeoutError(sanitizeErrorMessage(error.message), {
        originalError: error,
        ...enhanceErrorContext(context, error),
      });
    }
    if (networkErrorType === "TransportError") {
      return new TransportError(sanitizeErrorMessage(error.message), {
        originalError: error,
        ...enhanceErrorContext(context, error),
      });
    }
  }

  // Handle HTTP response errors
  if (isHttpResponseLike(error)) {
    return normalizeHttpError(error, context);
  }

  // Handle Anthropic error response objects
  if (isAnthropicErrorResponse(error)) {
    return normalizeAnthropicResponse(error, context);
  }

  // Handle string errors
  if (typeof error === "string") {
    return new ProviderError("Anthropic API error", {
      originalError: error,
      ...enhanceErrorContext(context, error),
    });
  }

  // Fallback for unknown error types
  return new ProviderError("Unknown Anthropic provider error", {
    originalError: error instanceof Error ? error : new Error(String(error)),
    ...enhanceErrorContext(context, error),
  });
}

/**
 * Normalize HTTP response errors based on status codes
 */
function normalizeHttpError(
  response: HttpResponseLike,
  context: Record<string, unknown>,
): BridgeError {
  const statusCode = response.status;
  const errorType = getErrorTypeFromStatus(statusCode);
  const message = buildHttpErrorMessage(response);

  // Extract Anthropic error details from response data if available
  const anthropicError = extractAnthropicErrorFromResponse(response);
  const errorContext = buildHttpErrorContext(response, anthropicError, context);

  return createBridgeError(errorType, message, errorContext);
}

/**
 * Normalize Anthropic error response objects
 */
function normalizeAnthropicResponse(
  response: AnthropicErrorResponse,
  context: Record<string, unknown>,
): BridgeError {
  const anthropicError = response.error;
  const errorType = getErrorTypeFromAnthropicType(anthropicError.type);
  const message = anthropicError.message || "Anthropic API error";
  const errorContext = {
    ...enhanceErrorContext(context, response),
    anthropicErrorType: anthropicError.type,
  };

  // Special handling for rate limit errors to extract retry info
  if (errorType === "RateLimitError" && context.headers) {
    const retryInfo = extractRetryInfo(
      context.headers as Record<string, string>,
    );
    Object.assign(errorContext, retryInfo);
  }

  return createBridgeError(errorType, message, errorContext);
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
 * Determine error type from Anthropic error type
 */
function getErrorTypeFromAnthropicType(anthropicType: string): string {
  return (
    ANTHROPIC_ERROR_TYPE_MAPPING[
      anthropicType as keyof typeof ANTHROPIC_ERROR_TYPE_MAPPING
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

  // Try to extract Anthropic error message
  const anthropicError = extractAnthropicErrorFromResponse(response);
  const anthropicMessage = anthropicError?.message;

  switch (statusCode) {
    case 400:
      return anthropicMessage || `Invalid request format: ${statusText}`;
    case 401:
      return anthropicMessage || `Invalid API key: ${statusText}`;
    case 403:
      return anthropicMessage || `Insufficient permissions: ${statusText}`;
    case 404:
      return anthropicMessage || `Endpoint not found: ${statusText}`;
    case 408:
      return anthropicMessage || `Request timeout: ${statusText}`;
    case 422:
      return anthropicMessage || `Request validation failed: ${statusText}`;
    case 429:
      return anthropicMessage || `Rate limit exceeded: ${statusText}`;
    case 500:
      return anthropicMessage || `Anthropic server error: ${statusText}`;
    case 502:
      return anthropicMessage || `Bad gateway: ${statusText}`;
    case 503:
      return anthropicMessage || `Service unavailable: ${statusText}`;
    case 504:
      return anthropicMessage || `Gateway timeout: ${statusText}`;
    case 529:
      return (
        anthropicMessage ||
        "Anthropic service is overloaded, please retry later"
      );
    default:
      return anthropicMessage || `HTTP ${statusCode}: ${statusText}`;
  }
}

/**
 * Build error context for HTTP errors
 */
function buildHttpErrorContext(
  response: HttpResponseLike,
  anthropicError: AnthropicErrorResponse["error"] | undefined,
  baseContext: Record<string, unknown>,
): Record<string, unknown> {
  const context: Record<string, unknown> = {
    ...enhanceErrorContext(baseContext, response),
    httpStatus: response.status,
    httpStatusText: response.statusText,
  };

  // Include Anthropic-specific error details
  if (anthropicError) {
    context.anthropicErrorType = anthropicError.type;
  }

  // Extract retry information for rate limits and overload errors
  if (
    (response.status === 429 || response.status === 529) &&
    response.headers
  ) {
    const retryInfo = extractRetryInfo(response.headers);
    Object.assign(context, retryInfo);
  }

  // Add retry recommendation for overload errors
  if (response.status === 529) {
    context.shouldRetry = true;
  }

  // Sanitize headers if present
  if (response.headers) {
    context.headers = sanitizeHeaders(response.headers);
  }

  return context;
}

/**
 * Extract Anthropic error from HTTP response data
 */
function extractAnthropicErrorFromResponse(
  response: HttpResponseLike,
): AnthropicErrorResponse["error"] | undefined {
  if (!response.data || typeof response.data !== "object") {
    return undefined;
  }

  const data = response.data as Record<string, unknown>;
  if (
    data.error &&
    typeof data.error === "object" &&
    data.error !== null &&
    "type" in data.error &&
    "message" in data.error &&
    typeof (data.error as Record<string, unknown>).type === "string" &&
    typeof (data.error as Record<string, unknown>).message === "string"
  ) {
    return data.error as AnthropicErrorResponse["error"];
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
      retryAfterDate: retryAfter, // Use original string to preserve exact format
    };
  }

  return {
    retryAfter: retryAfter,
    retryAfterType: "unknown",
  };
}

/**
 * Enhance error context with provider-specific information
 */
function enhanceErrorContext(
  baseContext: Record<string, unknown>,
  error: unknown,
): Record<string, unknown> {
  return {
    ...baseContext,
    provider: "anthropic",
    version: "2023-06-01",
    timestamp: new Date().toISOString(),
    errorType: error?.constructor?.name || typeof error,
  };
}

/**
 * Sanitize error messages to prevent information leakage
 */
function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, "sk-ant-***")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer ***")
    .replace(/x-api-key[:\s=]+[a-zA-Z0-9._-]+/gi, "x-api-key=***")
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
    "anthropic-version",
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
    case "OverloadedError":
      return new OverloadedError(sanitizedMessage, context);
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
 * Type guard to check if error looks like an Anthropic error response
 */
function isAnthropicErrorResponse(
  error: unknown,
): error is AnthropicErrorResponse {
  return (
    error !== null &&
    typeof error === "object" &&
    "type" in error &&
    (error as Record<string, unknown>).type === "error" &&
    "error" in error &&
    typeof (error as Record<string, unknown>).error === "object" &&
    (error as Record<string, unknown>).error !== null
  );
}
