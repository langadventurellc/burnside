/**
 * Unit Tests for Anthropic Error Normalizer
 *
 * Comprehensive test coverage for Anthropic error normalization including
 * HTTP status codes, Anthropic error types, network errors, and edge cases.
 */
import { normalizeAnthropicError } from "../errorNormalizer";
import {
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
  TransportError,
  TimeoutError,
  OverloadedError,
} from "../../../core/errors/index";

describe("Anthropic Error Normalizer", () => {
  describe("HTTP Status Code Mapping", () => {
    test("should map 401 to AuthError", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toContain("Invalid API key");
      expect(result.context?.httpStatus).toBe(401);
      expect(result.context?.provider).toBe("anthropic");
      expect(result.context?.version).toBe("2023-06-01");
    });

    test("should map 403 to AuthError", () => {
      const httpError = {
        status: 403,
        statusText: "Forbidden",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toContain("Insufficient permissions");
      expect(result.context?.httpStatus).toBe(403);
    });

    test("should map 429 to RateLimitError with retry info", () => {
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "60" },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toContain("Rate limit exceeded");
      expect(result.context?.httpStatus).toBe(429);
      expect(result.context?.retryAfter).toBe(60);
      expect(result.context?.retryAfterType).toBe("seconds");
    });

    test("should map 400 to ValidationError", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toContain("Invalid request format");
      expect(result.context?.httpStatus).toBe(400);
    });

    test("should map 422 to ValidationError", () => {
      const httpError = {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toContain("Request validation failed");
      expect(result.context?.httpStatus).toBe(422);
    });

    test("should map 404 to ProviderError", () => {
      const httpError = {
        status: 404,
        statusText: "Not Found",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Endpoint not found");
      expect(result.context?.httpStatus).toBe(404);
    });

    test("should map 408 to TimeoutError", () => {
      const httpError = {
        status: 408,
        statusText: "Request Timeout",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.message).toContain("Request timeout");
      expect(result.context?.httpStatus).toBe(408);
    });

    test("should map 500 to ProviderError", () => {
      const httpError = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Anthropic server error");
      expect(result.context?.httpStatus).toBe(500);
    });

    test("should map 502 to ProviderError", () => {
      const httpError = {
        status: 502,
        statusText: "Bad Gateway",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Bad gateway");
      expect(result.context?.httpStatus).toBe(502);
    });

    test("should map 503 to ProviderError", () => {
      const httpError = {
        status: 503,
        statusText: "Service Unavailable",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Service unavailable");
      expect(result.context?.httpStatus).toBe(503);
    });

    test("should map 504 to ProviderError", () => {
      const httpError = {
        status: 504,
        statusText: "Gateway Timeout",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Gateway timeout");
      expect(result.context?.httpStatus).toBe(504);
    });

    test("should map 529 to OverloadedError", () => {
      const httpError = {
        status: 529,
        statusText: "Overloaded",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(OverloadedError);
      expect(result.code).toBe("OVERLOADED_ERROR");
      expect(result.message).toBe(
        "Anthropic service is overloaded, please retry later",
      );
      expect(result.context?.httpStatus).toBe(529);
      expect(result.context?.provider).toBe("anthropic");
      expect(result.context?.version).toBe("2023-06-01");
      expect(result.context?.shouldRetry).toBe(true);
    });

    test("should map 529 to OverloadedError with retry info", () => {
      const httpError = {
        status: 529,
        statusText: "Overloaded",
        headers: { "retry-after": "30" },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(OverloadedError);
      expect(result.code).toBe("OVERLOADED_ERROR");
      expect(result.message).toBe(
        "Anthropic service is overloaded, please retry later",
      );
      expect(result.context?.httpStatus).toBe(529);
      expect(result.context?.retryAfter).toBe(30);
      expect(result.context?.retryAfterType).toBe("seconds");
      expect(result.context?.shouldRetry).toBe(true);
    });

    test("should map 529 with Anthropic error message", () => {
      const httpError = {
        status: 529,
        statusText: "Overloaded",
        headers: {},
        data: {
          type: "error",
          error: {
            type: "overloaded_error",
            message: "Service temporarily overloaded, please wait and retry",
          },
        },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(OverloadedError);
      expect(result.code).toBe("OVERLOADED_ERROR");
      expect(result.message).toBe(
        "Service temporarily overloaded, please wait and retry",
      );
      expect(result.context?.httpStatus).toBe(529);
      expect(result.context?.anthropicErrorType).toBe("overloaded_error");
      expect(result.context?.shouldRetry).toBe(true);
    });

    test("should default 4xx to ValidationError", () => {
      const httpError = {
        status: 418,
        statusText: "I'm a teapot",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.context?.httpStatus).toBe(418);
    });

    test("should default 5xx to ProviderError", () => {
      const httpError = {
        status: 599,
        statusText: "Unknown Error",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.context?.httpStatus).toBe(599);
    });
  });

  describe("Anthropic API Error Type Mapping", () => {
    test("should map invalid_request_error to ValidationError", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "invalid_request_error",
          message: "Invalid request parameters",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toBe("Invalid request parameters");
      expect(result.context?.anthropicErrorType).toBe("invalid_request_error");
    });

    test("should map authentication_error to AuthError", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "authentication_error",
          message: "Invalid API key provided",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe("Invalid API key provided");
      expect(result.context?.anthropicErrorType).toBe("authentication_error");
    });

    test("should map permission_error to AuthError", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "permission_error",
          message: "You don't have permission to access this model",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe(
        "You don't have permission to access this model",
      );
      expect(result.context?.anthropicErrorType).toBe("permission_error");
    });

    test("should map rate_limit_error to RateLimitError", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "rate_limit_error",
          message: "Rate limit exceeded",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toBe("Rate limit exceeded");
      expect(result.context?.anthropicErrorType).toBe("rate_limit_error");
    });

    test("should map api_error to ProviderError", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "api_error",
          message: "Internal server error",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Internal server error");
      expect(result.context?.anthropicErrorType).toBe("api_error");
    });

    test("should map overloaded_error to ProviderError", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "overloaded_error",
          message: "Service is currently overloaded",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Service is currently overloaded");
      expect(result.context?.anthropicErrorType).toBe("overloaded_error");
    });

    test("should map not_found_error to ProviderError", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "not_found_error",
          message: "Model not found",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Model not found");
      expect(result.context?.anthropicErrorType).toBe("not_found_error");
    });

    test("should default unknown error type to ProviderError", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "unknown_error_type",
          message: "Unknown error occurred",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown error occurred");
      expect(result.context?.anthropicErrorType).toBe("unknown_error_type");
    });
  });

  describe("Network Error Handling", () => {
    test("should handle AbortError as TimeoutError", () => {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";

      const result = normalizeAnthropicError(abortError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.message).toBe("Request timeout");
      expect(result.context?.originalError).toBe(abortError);
    });

    test("should handle timeout errors", () => {
      const timeoutError = new Error("Request timeout after 30000ms");

      const result = normalizeAnthropicError(timeoutError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.message).toContain("timeout");
      expect(result.context?.originalError).toBe(timeoutError);
    });

    test("should handle connection refused errors", () => {
      const connectionError = new Error("connect ECONNREFUSED 127.0.0.1:443");

      const result = normalizeAnthropicError(connectionError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toContain("ECONNREFUSED");
      expect(result.context?.originalError).toBe(connectionError);
    });

    test("should handle DNS failure errors", () => {
      const dnsError = new Error("getaddrinfo ENOTFOUND api.anthropic.com");

      const result = normalizeAnthropicError(dnsError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toContain("ENOTFOUND");
      expect(result.context?.originalError).toBe(dnsError);
    });

    test("should handle SSL/TLS errors", () => {
      const sslError = new Error("certificate verify failed");

      const result = normalizeAnthropicError(sslError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toContain("certificate");
      expect(result.context?.originalError).toBe(sslError);
    });

    test("should handle generic network errors", () => {
      const networkError = new Error("socket hang up");

      const result = normalizeAnthropicError(networkError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toContain("socket hang up");
      expect(result.context?.originalError).toBe(networkError);
    });
  });

  describe("Error Message Extraction and Context", () => {
    test("should extract Anthropic error message from HTTP response", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        data: {
          type: "error",
          error: {
            type: "invalid_request_error",
            message: "Missing required parameter: model",
          },
        },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Missing required parameter: model");
      expect(result.context?.anthropicErrorType).toBe("invalid_request_error");
    });

    test("should fallback to HTTP status text when no Anthropic error", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        data: { some: "other data" },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toContain("Invalid request format");
      expect(result.message).toContain("Bad Request");
    });

    test("should preserve original error in context", () => {
      const originalError = new Error("Original error");
      const result = normalizeAnthropicError(originalError);

      expect(result.context?.errorType).toBe("Error");
      expect(result.context?.provider).toBe("anthropic");
      expect(result.context?.version).toBe("2023-06-01");
      expect(result.context?.timestamp).toBeDefined();
    });

    test("should include additional context when provided", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
      };

      const additionalContext = {
        requestId: "req_123",
        userId: "user_456",
      };

      const result = normalizeAnthropicError(httpError, additionalContext);

      expect(result.context?.requestId).toBe("req_123");
      expect(result.context?.userId).toBe("user_456");
      expect(result.context?.provider).toBe("anthropic");
    });
  });

  describe("Sanitization", () => {
    test("should sanitize API keys in error messages", () => {
      const error = new Error("Invalid API key: sk-ant-1234567890abcdef");

      const result = normalizeAnthropicError(error);

      expect(result.message).toBe("Invalid API key: sk-ant-***");
      expect(result.message).not.toContain("1234567890abcdef");
    });

    test("should sanitize Bearer tokens in error messages", () => {
      const error = new Error(
        "Bearer token invalid: Bearer sk-ant-abcdef123456",
      );

      const result = normalizeAnthropicError(error);

      expect(result.message).toContain("Bearer ***");
      expect(result.message).not.toContain("sk-ant-abcdef123456");
    });

    test("should sanitize sensitive headers", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {
          "x-api-key": "sk-ant-secret123",
          "content-type": "application/json",
          authorization: "Bearer secret-token",
        },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result.context?.headers).toEqual({
        "x-api-key": "***",
        "content-type": "application/json",
        authorization: "***",
      });
    });

    test("should sanitize anthropic-version header", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result.context?.headers).toEqual({
        "anthropic-version": "***",
        "content-type": "application/json",
      });
    });
  });

  describe("Retry Information", () => {
    test("should parse numeric retry-after header", () => {
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "30" },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result.context?.retryAfter).toBe(30);
      expect(result.context?.retryAfterType).toBe("seconds");
    });

    test("should parse HTTP-date retry-after header", () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": futureDate.toUTCString() },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result.context?.retryAfter).toBeGreaterThan(50);
      expect(result.context?.retryAfter).toBeLessThan(70);
      expect(result.context?.retryAfterType).toBe("http-date");
      expect(result.context?.retryAfterDate).toBe(futureDate.toUTCString());
    });

    test("should handle unknown retry-after format", () => {
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "unknown-format" },
      };

      const result = normalizeAnthropicError(httpError);

      expect(result.context?.retryAfter).toBe("unknown-format");
      expect(result.context?.retryAfterType).toBe("unknown");
    });

    test("should handle missing retry-after header", () => {
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: {},
      };

      const result = normalizeAnthropicError(httpError);

      expect(result.context?.retryAfter).toBeUndefined();
      expect(result.context?.retryAfterType).toBeUndefined();
    });

    test("should extract retry info for rate limit API errors", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "rate_limit_error",
          message: "Rate limit exceeded",
        },
      };

      const context = {
        headers: { "retry-after": "45" },
      };

      const result = normalizeAnthropicError(anthropicError, context);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.context?.retryAfter).toBe(45);
      expect(result.context?.retryAfterType).toBe("seconds");
    });
  });

  describe("Edge Cases and Fallbacks", () => {
    test("should handle string errors", () => {
      const result = normalizeAnthropicError("Simple error string");

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Anthropic API error");
      expect(result.context?.originalError).toBe("Simple error string");
    });

    test("should handle null errors", () => {
      const result = normalizeAnthropicError(null);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown Anthropic provider error");
    });

    test("should handle undefined errors", () => {
      const result = normalizeAnthropicError(undefined);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown Anthropic provider error");
    });

    test("should handle objects without error structure", () => {
      const malformedError = { random: "object", with: "no structure" };

      const result = normalizeAnthropicError(malformedError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown Anthropic provider error");
    });

    test("should handle existing BridgeError instances", () => {
      const existingError = new ValidationError("Existing validation error", {
        original: "context",
      });

      const additionalContext = { additional: "info" };
      const result = normalizeAnthropicError(existingError, additionalContext);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Existing validation error");
      expect(result.context?.original).toBe("context");
      expect(result.context?.additional).toBe("info");
      expect(result.context?.provider).toBe("anthropic");
    });

    test("should handle malformed HTTP response", () => {
      const malformedResponse = {
        status: "not a number",
        headers: "not an object",
      };

      const result = normalizeAnthropicError(malformedResponse);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown Anthropic provider error");
    });

    test("should handle malformed Anthropic error response", () => {
      const malformedError = {
        type: "error",
        error: "not an object",
      };

      const result = normalizeAnthropicError(malformedError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown Anthropic provider error");
    });

    test("should handle response with missing error message", () => {
      const anthropicError = {
        type: "error" as const,
        error: {
          type: "api_error",
          message: "",
        },
      };

      const result = normalizeAnthropicError(anthropicError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Anthropic API error");
    });
  });
});
