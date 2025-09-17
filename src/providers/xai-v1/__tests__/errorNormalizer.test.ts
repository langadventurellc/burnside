/**
 * xAI Error Normalizer Tests
 *
 * Comprehensive unit test suite covering all error scenarios and edge cases
 * for the xAI error normalizer implementation.
 */
import {
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
  TransportError,
  TimeoutError,
} from "../../../core/errors/index";
import { normalizeXAIError } from "../errorNormalizer";

describe("xAI Error Normalizer", () => {
  describe("HTTP Status Code Mapping", () => {
    it("should map 400 status to ValidationError", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
        data: { error: { message: "Invalid request format" } },
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Invalid request format");
      expect(result.context?.httpStatus).toBe(400);
      expect(result.context?.provider).toBe("xai");
    });

    it("should map 401 status to AuthError", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        data: { error: { message: "Invalid API key" } },
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.message).toBe("Invalid API key");
      expect(result.context?.httpStatus).toBe(401);
    });

    it("should map 403 status to AuthError", () => {
      const httpError = {
        status: 403,
        statusText: "Forbidden",
        data: { error: { message: "Insufficient permissions" } },
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.message).toBe("Insufficient permissions");
      expect(result.context?.httpStatus).toBe(403);
    });

    it("should map 404 status to ValidationError", () => {
      const httpError = {
        status: 404,
        statusText: "Not Found",
        data: { error: { message: "Model not found" } },
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Model not found");
      expect(result.context?.httpStatus).toBe(404);
    });

    it("should map 408 status to TimeoutError", () => {
      const httpError = {
        status: 408,
        statusText: "Request Timeout",
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.message).toBe("Request timeout: Request Timeout");
      expect(result.context?.httpStatus).toBe(408);
    });

    it("should map 429 status to RateLimitError", () => {
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "60" },
        data: { error: { message: "Rate limit exceeded" } },
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.message).toBe("Rate limit exceeded");
      expect(result.context?.httpStatus).toBe(429);
      expect(result.context?.retryAfterSeconds).toBe(60);
    });

    it("should map 500 status to ProviderError", () => {
      const httpError = {
        status: 500,
        statusText: "Internal Server Error",
        data: { error: { message: "Server error occurred" } },
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Server error occurred");
      expect(result.context?.httpStatus).toBe(500);
    });

    it("should map 502 status to ProviderError", () => {
      const httpError = {
        status: 502,
        statusText: "Bad Gateway",
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Bad gateway: Bad Gateway");
      expect(result.context?.httpStatus).toBe(502);
    });

    it("should map 503 status to ProviderError", () => {
      const httpError = {
        status: 503,
        statusText: "Service Unavailable",
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Service unavailable: Service Unavailable");
      expect(result.context?.httpStatus).toBe(503);
    });

    it("should map 504 status to TimeoutError", () => {
      const httpError = {
        status: 504,
        statusText: "Gateway Timeout",
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.message).toBe("Gateway timeout: Gateway Timeout");
      expect(result.context?.httpStatus).toBe(504);
    });
  });

  describe("xAI API Error Mapping", () => {
    it("should map authentication_error to AuthError", () => {
      const xaiError = {
        error: {
          type: "authentication_error",
          message: "Invalid API key provided",
          code: "invalid_api_key",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.message).toBe("Invalid API key provided");
      expect(result.context?.xaiErrorType).toBe("authentication_error");
      expect(result.context?.xaiErrorCode).toBe("invalid_api_key");
    });

    it("should map rate_limit_error to RateLimitError", () => {
      const xaiError = {
        error: {
          type: "rate_limit_error",
          message: "Rate limit exceeded",
          code: "rate_limit_exceeded",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.message).toBe("Rate limit exceeded");
      expect(result.context?.xaiErrorType).toBe("rate_limit_error");
    });

    it("should map invalid_request_error to ValidationError", () => {
      const xaiError = {
        error: {
          type: "invalid_request_error",
          message: "Missing required parameter",
          code: "missing_parameter",
          param: "model",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Missing required parameter");
      expect(result.context?.xaiErrorParam).toBe("model");
    });

    it("should map server_error to ProviderError", () => {
      const xaiError = {
        error: {
          type: "server_error",
          message: "Internal server error",
          code: "internal_error",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Internal server error");
      expect(result.context?.xaiErrorType).toBe("server_error");
    });

    it("should map insufficient_quota to RateLimitError", () => {
      const xaiError = {
        error: {
          type: "insufficient_quota",
          message: "Quota exceeded",
          code: "quota_exceeded",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.message).toBe("Quota exceeded");
      expect(result.context?.xaiErrorType).toBe("insufficient_quota");
    });

    it("should map model_not_found to ValidationError", () => {
      const xaiError = {
        error: {
          type: "model_not_found",
          message: "The model 'invalid-model' does not exist",
          code: "model_not_found",
          param: "model",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("The model 'invalid-model' does not exist");
      expect(result.context?.xaiErrorParam).toBe("model");
    });

    it("should map permission_denied to AuthError", () => {
      const xaiError = {
        error: {
          type: "permission_denied",
          message: "Access denied to requested resource",
          code: "access_denied",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.message).toBe("Access denied to requested resource");
      expect(result.context?.xaiErrorType).toBe("permission_denied");
    });

    it("should map unsupported_media_type to ValidationError", () => {
      const xaiError = {
        error: {
          type: "unsupported_media_type",
          message: "Unsupported file format",
          code: "unsupported_format",
          param: "file",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Unsupported file format");
      expect(result.context?.xaiErrorParam).toBe("file");
    });

    it("should map invalid_field_format_error to ValidationError", () => {
      const xaiError = {
        error: {
          type: "invalid_field_format_error",
          message: "Invalid field format",
          code: "invalid_format",
          param: "messages",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Invalid field format");
      expect(result.context?.xaiErrorParam).toBe("messages");
    });

    it("should map method_not_allowed_error to ValidationError", () => {
      const xaiError = {
        error: {
          type: "method_not_allowed_error",
          message: "Method not allowed",
          code: "method_not_allowed",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Method not allowed");
      expect(result.context?.xaiErrorType).toBe("method_not_allowed_error");
    });

    it("should map unknown error type to ProviderError", () => {
      const xaiError = {
        error: {
          type: "unknown_error_type",
          message: "Unknown error occurred",
          code: "unknown",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Unknown error occurred");
      expect(result.context?.xaiErrorType).toBe("unknown_error_type");
    });

    it("should handle missing error type", () => {
      const xaiError = {
        error: {
          message: "Error without type",
          code: "no_type",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Error without type");
      expect(result.context?.xaiErrorType).toBeUndefined();
    });
  });

  describe("Network Error Mapping", () => {
    it("should map timeout errors to TimeoutError", () => {
      const timeoutError = new Error("Request timed out after 30000ms");
      timeoutError.name = "TimeoutError";

      const result = normalizeXAIError(timeoutError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.message).toBe("Request timed out after 30000ms");
      expect(result.context?.errorName).toBe("TimeoutError");
    });

    it("should map connection refused errors to TransportError", () => {
      const connectionError = new Error("connect ECONNREFUSED 127.0.0.1:443");
      connectionError.name = "Error";

      const result = normalizeXAIError(connectionError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.message).toBe("connect ECONNREFUSED 127.0.0.1:443");
      expect(result.context?.provider).toBe("xai");
    });

    it("should map DNS failure errors to TransportError", () => {
      const dnsError = new Error("getaddrinfo ENOTFOUND api.x.ai");
      dnsError.name = "Error";

      const result = normalizeXAIError(dnsError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.message).toBe("getaddrinfo ENOTFOUND api.x.ai");
      expect(result.context?.errorName).toBe("Error");
    });

    it("should map SSL errors to TransportError", () => {
      const sslError = new Error("SSL certificate error");
      sslError.name = "Error";

      const result = normalizeXAIError(sslError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.message).toBe("SSL certificate error");
    });

    it("should map abort errors to TransportError", () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";

      const result = normalizeXAIError(abortError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.message).toBe("The operation was aborted");
      expect(result.context?.errorName).toBe("AbortError");
    });

    it("should map generic network errors to TransportError", () => {
      const networkError = new Error("Network error occurred");
      networkError.name = "NetworkError";

      const result = normalizeXAIError(networkError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.message).toBe("Network error occurred");
      expect(result.context?.errorName).toBe("NetworkError");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty error objects", () => {
      const emptyError = {};

      const result = normalizeXAIError(emptyError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Unknown xAI error occurred");
      expect(result.context?.provider).toBe("xai");
    });

    it("should handle null errors", () => {
      const result = normalizeXAIError(null);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Unknown xAI error occurred");
      expect(result.context?.originalError).toBeNull();
    });

    it("should handle undefined errors", () => {
      const result = normalizeXAIError(undefined);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Unknown xAI error occurred");
      expect(result.context?.originalError).toBeUndefined();
    });

    it("should handle string errors", () => {
      const stringError = "Something went wrong";

      const result = normalizeXAIError(stringError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("xAI error: Something went wrong");
      expect(result.context?.originalError).toBe(stringError);
    });

    it("should handle malformed xAI error objects", () => {
      const malformedError = {
        error: "not an object",
      };

      const result = normalizeXAIError(malformedError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Unknown xAI error occurred");
    });

    it("should handle xAI error without error property", () => {
      const errorWithoutError = {
        error: undefined,
      };

      const result = normalizeXAIError(errorWithoutError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Unknown xAI error occurred");
      expect(result.context?.originalError).toBe(errorWithoutError);
    });

    it("should handle HTTP error without data", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
      };

      const result = normalizeXAIError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe("Bad request: Bad Request");
      expect(result.context?.httpStatus).toBe(400);
    });

    it("should handle unknown error formats", () => {
      const unknownError = {
        someProperty: "someValue",
        anotherProperty: 123,
      };

      const result = normalizeXAIError(unknownError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Unknown xAI error occurred");
      expect(result.context?.originalError).toBe(unknownError);
    });
  });

  describe("Retry Information Extraction", () => {
    it("should extract numeric retry-after header", () => {
      const httpError = {
        status: 429,
        headers: { "retry-after": "120" },
      };

      const result = normalizeXAIError(httpError);

      expect(result.context?.retryAfterSeconds).toBe(120);
    });

    it("should extract HTTP-date retry-after header", () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const httpError = {
        status: 429,
        headers: { "retry-after": futureDate.toUTCString() },
      };

      const result = normalizeXAIError(httpError);

      expect(result.context?.retryAfterSeconds).toBeGreaterThan(50);
      expect(result.context?.retryAfterSeconds).toBeLessThan(70);
    });

    it("should handle malformed retry-after header", () => {
      const httpError = {
        status: 429,
        headers: { "retry-after": "invalid-date" },
      };

      const result = normalizeXAIError(httpError);

      expect(result.context?.retryAfterSeconds).toBeUndefined();
    });

    it("should extract rate limit headers", () => {
      const httpError = {
        status: 429,
        headers: {
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": "1640995200",
        },
      };

      const result = normalizeXAIError(httpError);

      expect(result.context?.rateLimitRemaining).toBe(0);
      expect(result.context?.rateLimitReset).toBe(1640995200);
    });
  });

  describe("Context Preservation", () => {
    it("should preserve original error in context", () => {
      const originalError = new Error("Original error");
      const result = normalizeXAIError(originalError);

      expect(result.context?.originalError).toBe(originalError);
    });

    it("should include provider information", () => {
      const error = new Error("Test error");
      const result = normalizeXAIError(error);

      expect(result.context?.provider).toBe("xai");
      expect(result.context?.version).toBe("v1");
    });

    it("should include timestamp", () => {
      const error = new Error("Test error");
      const result = normalizeXAIError(error);

      expect(result.context?.timestamp).toBeDefined();
      expect(typeof result.context?.timestamp).toBe("string");
    });

    it("should preserve HTTP status information", () => {
      const httpError = {
        status: 404,
        statusText: "Not Found",
        headers: { "content-type": "application/json" },
      };

      const result = normalizeXAIError(httpError);

      expect(result.context?.httpStatus).toBe(404);
      expect(result.context?.httpStatusText).toBe("Not Found");
      expect(result.context?.headers).toBeDefined();
    });

    it("should preserve xAI error details", () => {
      const xaiError = {
        error: {
          type: "authentication_error",
          message: "Invalid API key",
          code: "invalid_api_key",
          param: "api_key",
        },
      };

      const result = normalizeXAIError(xaiError);

      expect(result.context?.xaiErrorType).toBe("authentication_error");
      expect(result.context?.xaiErrorCode).toBe("invalid_api_key");
      expect(result.context?.xaiErrorParam).toBe("api_key");
    });
  });

  describe("Message Sanitization", () => {
    it("should sanitize xAI API keys in error messages", () => {
      const errorWithApiKey = new Error("Failed with API key xai-abc123def456");

      const result = normalizeXAIError(errorWithApiKey);

      expect(result.message).toBe("Failed with API key xai-***");
      expect(result.message).not.toContain("xai-abc123def456");
    });

    it("should sanitize Bearer tokens in headers", () => {
      const httpError = {
        status: 401,
        headers: {
          authorization: "Bearer xai-secret123",
          "x-api-key": "xai-another-secret",
        },
      };

      const result = normalizeXAIError(httpError);

      expect(result.context?.headers).toEqual({
        authorization: "Bearer xai-***",
        "x-api-key": "***",
      });
    });

    it("should sanitize authorization headers", () => {
      const httpError = {
        status: 401,
        headers: {
          Authorization: "Bearer some-token",
          "X-API-Key": "some-key",
        },
      };

      const result = normalizeXAIError(httpError);

      expect(result.context?.headers).toEqual({
        Authorization: "***",
        "X-API-Key": "***",
      });
    });
  });
});
