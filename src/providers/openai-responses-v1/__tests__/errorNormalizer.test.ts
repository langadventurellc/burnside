/**
 * Unit Tests for OpenAI Error Normalizer
 *
 * Comprehensive test coverage for OpenAI error normalization including
 * HTTP status codes, OpenAI error types, network errors, and edge cases.
 */
import { normalizeOpenAIError } from "../errorNormalizer.js";
import {
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
  TransportError,
  TimeoutError,
} from "../../../core/errors/index.js";

describe("OpenAI Error Normalizer", () => {
  describe("HTTP Status Code Mapping", () => {
    test("should map 401 to AuthError", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toContain("Authentication failed");
      expect(result.context?.httpStatus).toBe(401);
    });

    test("should map 403 to AuthError", () => {
      const httpError = {
        status: 403,
        statusText: "Forbidden",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toContain("Access forbidden");
    });

    test("should map 429 to RateLimitError", () => {
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "60" },
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toContain("Rate limit exceeded");
      expect(result.context?.retryAfter).toBe(60);
      expect(result.context?.retryAfterType).toBe("seconds");
    });

    test("should map 400 to ValidationError", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toContain("Bad request");
    });

    test("should map 404 to ValidationError", () => {
      const httpError = {
        status: 404,
        statusText: "Not Found",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toContain("Resource not found");
    });

    test("should map 408 to TimeoutError", () => {
      const httpError = {
        status: 408,
        statusText: "Request Timeout",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.message).toContain("Request timeout");
    });

    test("should map 500 to ProviderError", () => {
      const httpError = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Provider server error");
    });

    test("should map 502, 503, 504 to ProviderError", () => {
      const statusCodes = [502, 503, 504];
      const statusTexts = [
        "Bad Gateway",
        "Service Unavailable",
        "Gateway Timeout",
      ];

      statusCodes.forEach((status, index) => {
        const httpError = {
          status,
          statusText: statusTexts[index],
          headers: {},
        };

        const result = normalizeOpenAIError(httpError);

        expect(result).toBeInstanceOf(ProviderError);
        expect(result.code).toBe("PROVIDER_ERROR");
        expect(result.context?.httpStatus).toBe(status);
      });
    });
  });

  describe("OpenAI Error Type Mapping", () => {
    test("should map authentication_error to AuthError", () => {
      const openaiError = {
        error: {
          message: "Invalid API key",
          type: "authentication_error",
          code: "invalid_api_key",
        },
      };

      const result = normalizeOpenAIError(openaiError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe("Invalid API key");
      expect(result.context?.openaiErrorType).toBe("authentication_error");
      expect(result.context?.openaiErrorCode).toBe("invalid_api_key");
    });

    test("should map rate_limit_error to RateLimitError", () => {
      const openaiError = {
        error: {
          message: "Rate limit exceeded",
          type: "rate_limit_error",
          code: "rate_limit_exceeded",
        },
      };

      const result = normalizeOpenAIError(openaiError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toBe("Rate limit exceeded");
      expect(result.context?.openaiErrorType).toBe("rate_limit_error");
    });

    test("should map insufficient_quota to RateLimitError", () => {
      const openaiError = {
        error: {
          message: "Insufficient quota",
          type: "insufficient_quota",
          code: "quota_exceeded",
        },
      };

      const result = normalizeOpenAIError(openaiError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toBe("Insufficient quota");
    });

    test("should map invalid_request_error to ValidationError", () => {
      const openaiError = {
        error: {
          message: "Missing required parameter",
          type: "invalid_request_error",
          code: "missing_parameter",
          param: "model",
        },
      };

      const result = normalizeOpenAIError(openaiError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toBe("Missing required parameter");
      expect(result.context?.openaiErrorParam).toBe("model");
    });

    test("should map model_not_found to ValidationError", () => {
      const openaiError = {
        error: {
          message: "Model not found",
          type: "model_not_found",
          code: "model_not_found",
        },
      };

      const result = normalizeOpenAIError(openaiError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toBe("Model not found");
    });

    test("should map server_error to ProviderError", () => {
      const openaiError = {
        error: {
          message: "Internal server error",
          type: "server_error",
          code: "internal_error",
        },
      };

      const result = normalizeOpenAIError(openaiError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Internal server error");
    });
  });

  describe("Network Error Handling", () => {
    test("should map connection timeout to TimeoutError", () => {
      const networkError = new Error("Connection timeout");
      networkError.name = "TimeoutError";

      const result = normalizeOpenAIError(networkError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.context?.networkError).toBe(true);
      expect(result.context?.errorName).toBe("TimeoutError");
    });

    test("should map ETIMEDOUT to TimeoutError", () => {
      const networkError = new Error("connect ETIMEDOUT");
      networkError.name = "Error";

      const result = normalizeOpenAIError(networkError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
    });

    test("should map connection refused to TransportError", () => {
      const networkError = new Error("connect ECONNREFUSED");
      networkError.name = "Error";

      const result = normalizeOpenAIError(networkError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
    });

    test("should map DNS failure to TransportError", () => {
      const networkError = new Error("getaddrinfo ENOTFOUND api.openai.com");
      networkError.name = "Error";

      const result = normalizeOpenAIError(networkError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
    });

    test("should map SSL errors to TransportError", () => {
      const sslError = new Error("certificate verify failed");
      sslError.name = "Error";

      const result = normalizeOpenAIError(sslError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
    });

    test("should map abort errors to TransportError", () => {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";

      const result = normalizeOpenAIError(abortError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
    });
  });

  describe("Error Message Extraction", () => {
    test("should extract OpenAI error message from HTTP response", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        data: {
          error: {
            message: "The model 'gpt-invalid' does not exist",
            type: "invalid_request_error",
            code: "model_not_found",
          },
        },
      };

      const result = normalizeOpenAIError(httpError);

      expect(result.message).toBe("The model 'gpt-invalid' does not exist");
      expect(result.context?.openaiErrorType).toBe("invalid_request_error");
    });

    test("should fallback to HTTP status text when no OpenAI error", () => {
      const httpError = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        data: { message: "Something went wrong" },
      };

      const result = normalizeOpenAIError(httpError);

      expect(result.message).toContain(
        "Provider server error: Internal Server Error",
      );
    });

    test("should sanitize API keys from error messages", () => {
      const errorMessage =
        "Invalid API key: sk-1234567890abcdef1234567890abcdef";
      const networkError = new Error(errorMessage);

      const result = normalizeOpenAIError(networkError);

      expect(result.message).not.toContain(
        "sk-1234567890abcdef1234567890abcdef",
      );
      expect(result.message).toContain("sk-***");
    });

    test("should sanitize Bearer tokens from error messages", () => {
      const errorMessage = "Authorization failed: Bearer abc123def456";
      const networkError = new Error(errorMessage);

      const result = normalizeOpenAIError(networkError);

      expect(result.message).not.toContain("abc123def456");
      expect(result.message).toContain("Bearer ***");
    });
  });

  describe("Context Preservation", () => {
    test("should preserve original error details", () => {
      const originalError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "x-ratelimit-remaining": "0" },
        data: { error: { message: "Rate limit exceeded" } },
      };

      const result = normalizeOpenAIError(originalError);

      expect(result.context?.originalError).toEqual(originalError);
      expect(result.context?.httpStatus).toBe(429);
      expect(result.context?.httpStatusText).toBe("Too Many Requests");
    });

    test("should preserve retry-after header information", () => {
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "120" },
      };

      const result = normalizeOpenAIError(httpError);

      expect(result.context?.retryAfter).toBe(120);
      expect(result.context?.retryAfterType).toBe("seconds");
    });

    test("should parse HTTP-date retry-after header", () => {
      const futureDate = new Date(Date.now() + 60000).toUTCString();
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": futureDate },
      };

      const result = normalizeOpenAIError(httpError);

      expect(result.context?.retryAfterType).toBe("http-date");
      expect(result.context?.retryAfterDate).toEqual(
        new Date(futureDate).toISOString(),
      );
      expect(typeof result.context?.retryAfter).toBe("number");
    });

    test("should sanitize sensitive headers", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {
          authorization: "Bearer secret-token",
          "x-api-key": "sk-sensitive-key",
          "content-type": "application/json",
        },
      };

      const result = normalizeOpenAIError(httpError);

      const headers = result.context?.headers as Record<string, string>;
      expect(headers.authorization).toBe("***");
      expect(headers["x-api-key"]).toBe("***");
      expect(headers["content-type"]).toBe("application/json");
    });
  });

  describe("Fallback Handling", () => {
    test("should handle string errors", () => {
      const stringError = "Connection failed";

      const result = normalizeOpenAIError(stringError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("OpenAI API error");
      expect(result.context?.message).toBe("Connection failed");
    });

    test("should handle null/undefined errors", () => {
      const result1 = normalizeOpenAIError(null);
      const result2 = normalizeOpenAIError(undefined);

      expect(result1).toBeInstanceOf(ProviderError);
      expect(result2).toBeInstanceOf(ProviderError);
      expect(result1.message).toBe("Unknown OpenAI error");
      expect(result2.message).toBe("Unknown OpenAI error");
    });

    test("should handle malformed OpenAI error responses", () => {
      const malformedError = {
        error: null,
      };

      const result = normalizeOpenAIError(malformedError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Invalid OpenAI error response");
    });

    test("should handle unknown error types", () => {
      const unknownError = { someProperty: "value" };

      const result = normalizeOpenAIError(unknownError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.context?.errorType).toBe("object");
      expect(result.context?.originalError).toEqual(unknownError);
    });

    test("should handle unknown OpenAI error types", () => {
      const unknownOpenAIError = {
        error: {
          message: "New error type",
          type: "unknown_error_type",
          code: "unknown_code",
        },
      };

      const result = normalizeOpenAIError(unknownOpenAIError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("New error type");
      expect(result.context?.openaiErrorType).toBe("unknown_error_type");
    });

    test("should handle missing OpenAI error message", () => {
      const errorWithoutMessage = {
        error: {
          type: "server_error",
          code: "internal_error",
        },
      };

      const result = normalizeOpenAIError(errorWithoutMessage);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("OpenAI API error");
    });
  });

  describe("Range-based Status Code Mapping", () => {
    test("should map unknown 4xx codes to ValidationError", () => {
      const httpError = {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
    });

    test("should map unknown 5xx codes to ProviderError", () => {
      const httpError = {
        status: 507,
        statusText: "Insufficient Storage",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
    });

    test("should map unknown status codes to ProviderError", () => {
      const httpError = {
        status: 999,
        statusText: "Unknown Status",
        headers: {},
      };

      const result = normalizeOpenAIError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
    });
  });
});
