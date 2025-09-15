/**
 * HTTP Error Normalizer Tests
 *
 * Comprehensive test suite for HttpErrorNormalizer class covering
 * HTTP status code mapping, network error handling, context preservation,
 * rate limit parsing, and provider-specific error formats.
 */
import { HttpErrorNormalizer } from "../httpErrorNormalizer.js";
import { ErrorNormalizationConfig } from "../errorNormalizationConfig.js";
import { ErrorContext } from "../errorContext.js";
import { ProviderHttpResponse } from "../../transport/providerHttpResponse.js";

describe("HttpErrorNormalizer", () => {
  let normalizer: HttpErrorNormalizer;
  let context: ErrorContext;

  beforeEach(() => {
    normalizer = new HttpErrorNormalizer();
    context = {
      requestId: "req_123",
      provider: "openai",
      operation: "chat_completion",
      url: "https://api.openai.com/v1/chat/completions",
    };
  });

  describe("constructor", () => {
    it("should create normalizer with default config", () => {
      const defaultNormalizer = new HttpErrorNormalizer();
      expect(defaultNormalizer).toBeInstanceOf(HttpErrorNormalizer);
    });

    it("should create normalizer with custom config", () => {
      const config: ErrorNormalizationConfig = {
        statusCodeMapping: { 418: "ValidationError" },
        preserveOriginalError: false,
        includeStackTrace: true,
      };
      const customNormalizer = new HttpErrorNormalizer(config);
      expect(customNormalizer).toBeInstanceOf(HttpErrorNormalizer);
    });
  });

  describe("HTTP Status Code Mapping", () => {
    it("should map 400 Bad Request to ValidationError", () => {
      const response: ProviderHttpResponse = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("ValidationError");
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toBe("Bad request: Bad Request");
      expect(result.context?.httpStatus).toBe(400);
    });

    it("should map 401 Unauthorized to AuthError", () => {
      const response: ProviderHttpResponse = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("AuthError");
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe("Authentication failed: Unauthorized");
    });

    it("should map 403 Forbidden to AuthError", () => {
      const response: ProviderHttpResponse = {
        status: 403,
        statusText: "Forbidden",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("AuthError");
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe("Access forbidden: Forbidden");
    });

    it("should map 408 Request Timeout to TimeoutError", () => {
      const response: ProviderHttpResponse = {
        status: 408,
        statusText: "Request Timeout",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("TimeoutError");
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.message).toBe("Request timeout: Request Timeout");
    });

    it("should map 429 Too Many Requests to RateLimitError", () => {
      const response: ProviderHttpResponse = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "60" },
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("RateLimitError");
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toBe("Rate limit exceeded: Too Many Requests");
      expect(result.context?.retryAfter).toBe(60);
    });

    it("should map 500 Internal Server Error to ProviderError", () => {
      const response: ProviderHttpResponse = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("ProviderError");
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe(
        "Provider server error: Internal Server Error",
      );
    });

    it("should map 502 Bad Gateway to TransportError", () => {
      const response: ProviderHttpResponse = {
        status: 502,
        statusText: "Bad Gateway",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toBe("Bad gateway: Bad Gateway");
    });

    it("should map 503 Service Unavailable to TransportError", () => {
      const response: ProviderHttpResponse = {
        status: 503,
        statusText: "Service Unavailable",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toBe("Service unavailable: Service Unavailable");
    });

    it("should map 504 Gateway Timeout to TransportError", () => {
      const response: ProviderHttpResponse = {
        status: 504,
        statusText: "Gateway Timeout",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toBe("Gateway timeout: Gateway Timeout");
    });

    it("should handle unknown 4xx status codes as ValidationError", () => {
      const response: ProviderHttpResponse = {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("ValidationError");
      expect(result.code).toBe("VALIDATION_ERROR");
    });

    it("should handle unknown 5xx status codes as ProviderError", () => {
      const response: ProviderHttpResponse = {
        status: 599,
        statusText: "Custom Server Error",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.type).toBe("ProviderError");
      expect(result.code).toBe("PROVIDER_ERROR");
    });

    it("should use custom status code mapping", () => {
      const config: ErrorNormalizationConfig = {
        statusCodeMapping: { 418: "ValidationError" },
      };
      const customNormalizer = new HttpErrorNormalizer(config);
      const response: ProviderHttpResponse = {
        status: 418,
        statusText: "I'm a teapot",
        headers: {},
        body: null,
      };

      const result = customNormalizer.normalize(response, context);

      expect(result.type).toBe("ValidationError");
      expect(result.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Network Error Mapping", () => {
    it("should map connection timeout to TimeoutError", () => {
      const error = new Error("Request timeout after 30000ms");
      error.name = "TimeoutError";

      const result = normalizer.normalize(error, context);

      expect(result.type).toBe("TimeoutError");
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.context?.networkError).toBe(true);
      expect(result.context?.errorName).toBe("TimeoutError");
    });

    it("should map connection refused to TransportError", () => {
      const error = new Error("connect ECONNREFUSED 127.0.0.1:3000");

      const result = normalizer.normalize(error, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.context?.networkError).toBe(true);
    });

    it("should map DNS resolution failure to TransportError", () => {
      const error = new Error("getaddrinfo ENOTFOUND api.nonexistent.com");

      const result = normalizer.normalize(error, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
    });

    it("should map SSL/TLS errors to TransportError", () => {
      const error = new Error("certificate verify failed");

      const result = normalizer.normalize(error, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
    });

    it("should map abort signal to TransportError", () => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";

      const result = normalizer.normalize(error, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
    });

    it("should default to TransportError for unknown network errors", () => {
      const error = new Error("Unknown network error");

      const result = normalizer.normalize(error, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
    });
  });

  describe("Context Preservation", () => {
    it("should preserve original HTTP response context", () => {
      const response: ProviderHttpResponse = {
        status: 400,
        statusText: "Bad Request",
        headers: { "content-type": "application/json" },
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.context?.httpStatus).toBe(400);
      expect(result.context?.httpStatusText).toBe("Bad Request");
      expect(result.context?.headers).toEqual({
        "content-type": "application/json",
      });
      expect(result.context?.provider).toBe("openai");
      expect(result.context?.requestId).toBe("req_123");
      expect(result.context?.originalError).toBe(response);
    });

    it("should sanitize sensitive headers", () => {
      const response: ProviderHttpResponse = {
        status: 401,
        statusText: "Unauthorized",
        headers: {
          authorization: "Bearer sk-secret123",
          "x-api-key": "secret-key",
          "content-type": "application/json",
        },
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.context?.headers).toEqual({
        authorization: "***",
        "x-api-key": "***",
        "content-type": "application/json",
      });
    });

    it("should not preserve original error when configured", () => {
      const config: ErrorNormalizationConfig = {
        preserveOriginalError: false,
      };
      const customNormalizer = new HttpErrorNormalizer(config);
      const response: ProviderHttpResponse = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        body: null,
      };

      const result = customNormalizer.normalize(response, context);

      expect(result.context?.originalError).toBeUndefined();
    });

    it("should include stack trace when configured", () => {
      const config: ErrorNormalizationConfig = {
        includeStackTrace: true,
      };
      const customNormalizer = new HttpErrorNormalizer(config);
      const error = new Error("Network error");

      const result = customNormalizer.normalize(error, context);

      expect(result.context?.stack).toBeDefined();
      expect(typeof result.context?.stack).toBe("string");
    });
  });

  describe("Rate Limit Handling", () => {
    it("should parse numeric retry-after header", () => {
      const response: ProviderHttpResponse = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "60" },
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.context?.retryAfter).toBe(60);
      expect(result.context?.retryAfterType).toBe("seconds");
    });

    it("should parse HTTP-date retry-after header", () => {
      const futureDate = new Date(Date.now() + 60000);
      const response: ProviderHttpResponse = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": futureDate.toUTCString() },
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.context?.retryAfterType).toBe("http-date");
      expect(result.context?.retryAfterDate).toBeDefined();
      expect(typeof result.context?.retryAfter).toBe("number");
    });

    it("should handle missing retry-after header", () => {
      const response: ProviderHttpResponse = {
        status: 429,
        statusText: "Too Many Requests",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.context?.retryAfter).toBeUndefined();
      expect(result.context?.retryAfterType).toBeUndefined();
    });

    it("should handle malformed retry-after header", () => {
      const response: ProviderHttpResponse = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "invalid" },
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.context?.retryAfter).toBe("invalid");
      expect(result.context?.retryAfterType).toBe("unknown");
    });

    it("should handle case-insensitive retry-after header", () => {
      const response: ProviderHttpResponse = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "Retry-After": "30" },
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.context?.retryAfter).toBe(30);
      expect(result.context?.retryAfterType).toBe("seconds");
    });
  });

  describe("Static Factory Methods", () => {
    it("should create normalized error from HTTP response", () => {
      const response: ProviderHttpResponse = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        body: null,
      };

      const result = HttpErrorNormalizer.fromHttpResponse(response, context);

      expect(result.type).toBe("ValidationError");
      expect(result.code).toBe("VALIDATION_ERROR");
    });

    it("should create normalized error from network error", () => {
      const error = new Error("Connection refused");

      const result = HttpErrorNormalizer.fromNetworkError(error, context);

      expect(result.type).toBe("TransportError");
      expect(result.code).toBe("TRANSPORT_ERROR");
    });
  });

  describe("Error Message Sanitization", () => {
    it("should sanitize API keys in error messages", () => {
      const error = new Error(
        "Invalid API key: sk-1234567890123456789012345678901234567890123456",
      );

      const result = normalizer.normalize(error, context);

      expect(result.message).toBe("Invalid API key: sk-***");
    });

    it("should sanitize Bearer tokens in error messages", () => {
      const error = new Error("Authorization failed with Bearer abc123def456");

      const result = normalizer.normalize(error, context);

      expect(result.message).toBe("Authorization failed with Bearer ***");
    });

    it("should sanitize API key patterns in error messages", () => {
      const error = new Error("Request failed: api_key=secret123");

      const result = normalizer.normalize(error, context);

      expect(result.message).toBe("Request failed: api_key=***");
    });

    it("should sanitize token patterns in error messages", () => {
      const error = new Error("Authentication error: token=xyz789");

      const result = normalizer.normalize(error, context);

      expect(result.message).toBe("Authentication error: token=***");
    });
  });

  describe("Unknown Error Handling", () => {
    it("should handle string errors", () => {
      const error = "Something went wrong";

      const result = normalizer.normalize(error, context);

      expect(result.type).toBe("ProviderError");
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Something went wrong");
      expect(result.context?.unknownError).toBe(true);
      expect(result.context?.errorType).toBe("string");
    });

    it("should handle object errors with message property", () => {
      const error = { message: "Custom error message" };

      const result = normalizer.normalize(error, context);

      expect(result.message).toBe("Custom error message");
      expect(result.context?.unknownError).toBe(true);
    });

    it("should handle nested error objects", () => {
      const error = { error: { message: "Nested error" } };

      const result = normalizer.normalize(error, context);

      expect(result.message).toBe("Nested error");
    });

    it("should handle null and undefined errors", () => {
      const nullResult = normalizer.normalize(null, context);
      const undefinedResult = normalizer.normalize(undefined, context);

      expect(nullResult.message).toBe("Unknown error occurred");
      expect(undefinedResult.message).toBe("Unknown error occurred");
    });
  });

  describe("Edge Cases", () => {
    it("should handle response without statusText", () => {
      const response: ProviderHttpResponse = {
        status: 400,
        statusText: "",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, context);

      expect(result.message).toBe("Bad request: ");
    });

    it("should handle empty context", () => {
      const response: ProviderHttpResponse = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        body: null,
      };

      const result = normalizer.normalize(response, {});

      expect(result.type).toBe("ValidationError");
      expect(result.context?.httpStatus).toBe(400);
    });

    it("should handle response-like objects", () => {
      const responselike = {
        status: 500,
        statusText: "Server Error",
        headers: {},
        body: null,
        extraField: "should be ignored",
      };

      const result = normalizer.normalize(responselike, context);

      expect(result.type).toBe("ProviderError");
      expect(result.code).toBe("PROVIDER_ERROR");
    });
  });
});
