/**
 * HTTP Error Normalizer Implementation
 *
 * Concrete implementation of ErrorNormalizer that transforms HTTP responses
 * and network errors into standardized Bridge error classes. Provides consistent
 * error handling across all provider implementations.
 *
 * @example Basic usage
 * ```typescript
 * const normalizer = new HttpErrorNormalizer();
 * const context: ErrorContext = { provider: "openai", requestId: "req_123" };
 *
 * // From HTTP response
 * const httpError = HttpErrorNormalizer.fromHttpResponse(response, context);
 *
 * // From network error
 * const networkError = HttpErrorNormalizer.fromNetworkError(error, context);
 * ```
 */
import { ErrorNormalizer } from "./errorNormalizer";
import { ErrorContext } from "./errorContext";
import { NormalizedError } from "./normalizedError";
import { ProviderHttpResponse } from "../transport/providerHttpResponse";
import { ErrorNormalizationConfig } from "./errorNormalizationConfig";

/**
 * Default status code to error type mapping
 */
const DEFAULT_STATUS_MAPPING = {
  400: "ValidationError",
  401: "AuthError",
  403: "AuthError",
  408: "TimeoutError",
  429: "RateLimitError",
  500: "ProviderError",
  502: "TransportError",
  503: "TransportError",
  504: "TransportError",
} as const;

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
 * HTTP Error Normalizer class that implements concrete error normalization
 * for HTTP responses and network errors.
 */
export class HttpErrorNormalizer implements ErrorNormalizer {
  private readonly config: ErrorNormalizationConfig;

  constructor(config?: ErrorNormalizationConfig) {
    this.config = {
      statusCodeMapping: {
        ...DEFAULT_STATUS_MAPPING,
        ...config?.statusCodeMapping,
      },
      preserveOriginalError: config?.preserveOriginalError ?? true,
      includeStackTrace: config?.includeStackTrace ?? false,
      ...config,
    };
  }

  /**
   * Normalize a provider-specific error into a standardized format.
   */
  normalize(providerError: unknown, context: ErrorContext): NormalizedError {
    // Handle HTTP response errors
    if (this.isHttpResponseLike(providerError)) {
      return this.normalizeHttpResponse(providerError, context);
    }

    // Handle JavaScript Error objects (network errors, etc.)
    if (providerError instanceof Error) {
      return this.normalizeNetworkError(providerError, context);
    }

    // Handle unknown error types
    return this.normalizeUnknownError(providerError, context);
  }

  /**
   * Static factory method for HTTP response normalization.
   */
  static fromHttpResponse(
    response: ProviderHttpResponse,
    context: ErrorContext,
  ): NormalizedError {
    const normalizer = new HttpErrorNormalizer();
    return normalizer.normalizeHttpResponse(response, context);
  }

  /**
   * Static factory method for network error normalization.
   */
  static fromNetworkError(
    error: Error,
    context: ErrorContext,
  ): NormalizedError {
    const normalizer = new HttpErrorNormalizer();
    return normalizer.normalizeNetworkError(error, context);
  }

  /**
   * Normalize HTTP response errors based on status codes.
   */
  private normalizeHttpResponse(
    response: ProviderHttpResponse,
    context: ErrorContext,
  ): NormalizedError {
    const statusCode = response.status;
    const errorType = this.getErrorTypeFromStatus(statusCode);
    const message = this.buildHttpErrorMessage(response);
    const code = this.getErrorCode(errorType);

    return this.createNormalizedError(
      errorType,
      message,
      code,
      response,
      context,
    );
  }

  /**
   * Create normalized error with HTTP context.
   */
  private createNormalizedError(
    errorType: string,
    message: string,
    code: string,
    response: ProviderHttpResponse,
    context: ErrorContext,
  ): NormalizedError {
    // Extract retry information for rate limits
    const retryContext =
      response.status === 429 ? this.extractRetryInfo(response.headers) : {};

    // Build context with HTTP details
    const errorContext = {
      ...context,
      httpStatus: response.status,
      httpStatusText: response.statusText,
      headers: this.sanitizeHeaders(response.headers),
      ...retryContext,
      ...(this.config.preserveOriginalError && { originalError: response }),
    };

    return {
      type: errorType,
      message,
      code,
      context: errorContext,
    };
  }

  /**
   * Normalize network and connection errors.
   */
  private normalizeNetworkError(
    error: Error,
    context: ErrorContext,
  ): NormalizedError {
    const errorType = this.classifyNetworkError(error);
    const message = this.sanitizeErrorMessage(error.message);
    const code = this.getErrorCode(errorType);

    const errorContext = {
      ...context,
      networkError: true,
      errorName: error.name,
      ...(this.config.preserveOriginalError && { originalError: error }),
      ...(this.config.includeStackTrace && { stack: error.stack }),
    };

    return {
      type: errorType,
      message,
      code,
      context: errorContext,
    };
  }

  /**
   * Normalize unknown error types.
   */
  private normalizeUnknownError(
    error: unknown,
    context: ErrorContext,
  ): NormalizedError {
    const message = this.extractErrorMessage(error);
    const errorContext = {
      ...context,
      unknownError: true,
      errorType: typeof error,
      ...(this.config.preserveOriginalError && { originalError: error }),
    };

    return {
      type: "ProviderError",
      message: this.sanitizeErrorMessage(message),
      code: "PROVIDER_ERROR",
      context: errorContext,
    };
  }

  /**
   * Determine error type from HTTP status code.
   */
  private getErrorTypeFromStatus(statusCode: number): string {
    const mapping: Record<number, string> = {
      ...DEFAULT_STATUS_MAPPING,
      ...this.config.statusCodeMapping,
    };

    const mappedType = mapping[statusCode];
    if (mappedType !== undefined) {
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
   * Classify network errors based on error patterns.
   */
  private classifyNetworkError(error: Error): string {
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

    // Default to transport error for network issues
    return "TransportError";
  }

  /**
   * Extract retry information from response headers.
   */
  private extractRetryInfo(
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
   * Build human-readable error message from HTTP response.
   */
  private buildHttpErrorMessage(response: ProviderHttpResponse): string {
    const statusCode = response.status;
    const statusText = response.statusText;

    switch (statusCode) {
      case 400:
        return `Bad request: ${statusText}`;
      case 401:
        return `Authentication failed: ${statusText}`;
      case 403:
        return `Access forbidden: ${statusText}`;
      case 408:
        return `Request timeout: ${statusText}`;
      case 429:
        return `Rate limit exceeded: ${statusText}`;
      case 500:
        return `Provider server error: ${statusText}`;
      case 502:
        return `Bad gateway: ${statusText}`;
      case 503:
        return `Service unavailable: ${statusText}`;
      case 504:
        return `Gateway timeout: ${statusText}`;
      default:
        return `HTTP ${statusCode}: ${statusText}`;
    }
  }

  /**
   * Get error code for a given error type.
   */
  private getErrorCode(errorType: string): string {
    const codeMapping = {
      TransportError: "TRANSPORT_ERROR",
      AuthError: "AUTH_ERROR",
      RateLimitError: "RATE_LIMIT_ERROR",
      TimeoutError: "TIMEOUT_ERROR",
      ValidationError: "VALIDATION_ERROR",
      ProviderError: "PROVIDER_ERROR",
    } as const;

    return (
      codeMapping[errorType as keyof typeof codeMapping] || "PROVIDER_ERROR"
    );
  }

  /**
   * Sanitize error messages to prevent information leakage.
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential API keys, tokens, or sensitive patterns
    return message
      .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-***")
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer ***")
      .replace(/api[_-]key[:\s=]+[a-zA-Z0-9._-]+/gi, "api_key=***")
      .replace(/token[:\s=]+[a-zA-Z0-9._-]+/gi, "token=***");
  }

  /**
   * Sanitize response headers to remove sensitive information.
   */
  private sanitizeHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const sanitized = { ...headers };

    // Redact authorization headers
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
   * Extract error message from unknown error types.
   */
  private extractErrorMessage(error: unknown): string {
    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object" && "message" in error) {
      return String((error as { message: unknown }).message);
    }

    if (error && typeof error === "object" && "error" in error) {
      return this.extractErrorMessage((error as { error: unknown }).error);
    }

    return "Unknown error occurred";
  }

  /**
   * Check if an error object looks like an HTTP response.
   */
  private isHttpResponseLike(error: unknown): error is ProviderHttpResponse {
    return (
      error !== null &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as Record<string, unknown>).status === "number"
    );
  }
}
