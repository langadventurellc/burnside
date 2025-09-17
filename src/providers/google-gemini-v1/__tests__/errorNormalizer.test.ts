/**
 * Unit Tests for Google Gemini Error Normalizer
 *
 * Comprehensive test coverage for Gemini error normalization including
 * HTTP status codes, Gemini error types, network errors, and edge cases.
 */
import { normalizeGeminiError } from "../errorNormalizer";
import {
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
  TransportError,
  TimeoutError,
} from "../../../core/errors/index";

describe("Google Gemini Error Normalizer", () => {
  describe("HTTP Status Code Mapping", () => {
    test("should map 400 to ValidationError", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toContain("Bad request");
      expect(result.context?.httpStatus).toBe(400);
      expect(result.context?.provider).toBe("google-gemini");
      expect(result.context?.version).toBe("v1");
    });

    test("should map 401 to AuthError", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

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

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toContain("Access forbidden");
    });

    test("should map 404 to ValidationError", () => {
      const httpError = {
        status: 404,
        statusText: "Not Found",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

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

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.message).toContain("Request timeout");
    });

    test("should map 429 to RateLimitError", () => {
      const httpError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toContain("Rate limit exceeded");
    });

    test("should map 500 to ProviderError", () => {
      const httpError = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Provider server error");
    });

    test("should map 502 to ProviderError", () => {
      const httpError = {
        status: 502,
        statusText: "Bad Gateway",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Bad gateway");
    });

    test("should map 503 to ProviderError", () => {
      const httpError = {
        status: 503,
        statusText: "Service Unavailable",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Service unavailable");
    });

    test("should map 504 to ProviderError", () => {
      const httpError = {
        status: 504,
        statusText: "Gateway Timeout",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toContain("Gateway timeout");
    });
  });

  describe("Gemini Error Status Mapping", () => {
    test("should map INVALID_ARGUMENT to ValidationError", () => {
      const geminiError = {
        error: {
          code: 400,
          message: "Invalid request parameter",
          status: "INVALID_ARGUMENT",
          details: [{ field: "temperature", value: "2.5" }],
        },
      };

      const result = normalizeGeminiError(geminiError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toBe("Invalid request parameter");
      expect(result.context?.geminiErrorStatus).toBe("INVALID_ARGUMENT");
      expect(result.context?.geminiErrorCode).toBe(400);
      expect(result.context?.geminiErrorDetails).toEqual([
        { field: "temperature", value: "2.5" },
      ]);
    });

    test("should map UNAUTHENTICATED to AuthError", () => {
      const geminiError = {
        error: {
          code: 401,
          message: "API key not provided",
          status: "UNAUTHENTICATED",
        },
      };

      const result = normalizeGeminiError(geminiError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe("API key not provided");
      expect(result.context?.geminiErrorStatus).toBe("UNAUTHENTICATED");
    });

    test("should map PERMISSION_DENIED to AuthError", () => {
      const geminiError = {
        error: {
          code: 403,
          message: "Insufficient permissions for this model",
          status: "PERMISSION_DENIED",
        },
      };

      const result = normalizeGeminiError(geminiError);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe("Insufficient permissions for this model");
      expect(result.context?.geminiErrorStatus).toBe("PERMISSION_DENIED");
    });

    test("should map RESOURCE_EXHAUSTED to RateLimitError", () => {
      const geminiError = {
        error: {
          code: 429,
          message: "Quota exceeded for this model",
          status: "RESOURCE_EXHAUSTED",
        },
      };

      const result = normalizeGeminiError(geminiError);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toBe("Quota exceeded for this model");
      expect(result.context?.geminiErrorStatus).toBe("RESOURCE_EXHAUSTED");
    });

    test("should map INTERNAL to ProviderError", () => {
      const geminiError = {
        error: {
          code: 500,
          message: "Internal server error",
          status: "INTERNAL",
        },
      };

      const result = normalizeGeminiError(geminiError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Internal server error");
      expect(result.context?.geminiErrorStatus).toBe("INTERNAL");
    });

    test("should map DEADLINE_EXCEEDED to TimeoutError", () => {
      const geminiError = {
        error: {
          code: 504,
          message: "Request deadline exceeded",
          status: "DEADLINE_EXCEEDED",
        },
      };

      const result = normalizeGeminiError(geminiError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.message).toBe("Request deadline exceeded");
      expect(result.context?.geminiErrorStatus).toBe("DEADLINE_EXCEEDED");
    });

    test("should map unknown status to ProviderError", () => {
      const geminiError = {
        error: {
          code: 500,
          message: "Unknown error occurred",
          status: "UNKNOWN_STATUS",
        },
      };

      const result = normalizeGeminiError(geminiError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown error occurred");
      expect(result.context?.geminiErrorStatus).toBe("UNKNOWN_STATUS");
    });
  });

  describe("Network Error Handling", () => {
    test("should map timeout errors to TimeoutError", () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";

      const result = normalizeGeminiError(timeoutError);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.code).toBe("TIMEOUT_ERROR");
      expect(result.message).toContain("Request timeout");
      expect(result.context?.networkError).toBe(true);
      expect(result.context?.errorName).toBe("TimeoutError");
    });

    test("should map connection refused to TransportError", () => {
      const connectionError = new Error("connect ECONNREFUSED 127.0.0.1:443");
      connectionError.name = "Error";

      const result = normalizeGeminiError(connectionError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toContain("connect ECONNREFUSED");
      expect(result.context?.networkError).toBe(true);
    });

    test("should map DNS failure to TransportError", () => {
      const dnsError = new Error("getaddrinfo ENOTFOUND api.gemini.com");
      dnsError.name = "Error";

      const result = normalizeGeminiError(dnsError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toContain("getaddrinfo ENOTFOUND");
      expect(result.context?.networkError).toBe(true);
    });

    test("should map SSL errors to TransportError", () => {
      const sslError = new Error("certificate has expired");
      sslError.name = "Error";

      const result = normalizeGeminiError(sslError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toContain("certificate has expired");
      expect(result.context?.networkError).toBe(true);
    });

    test("should map abort errors to TransportError", () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";

      const result = normalizeGeminiError(abortError);

      expect(result).toBeInstanceOf(TransportError);
      expect(result.code).toBe("TRANSPORT_ERROR");
      expect(result.message).toContain("The operation was aborted");
      expect(result.context?.networkError).toBe(true);
    });
  });

  describe("Error Message Extraction", () => {
    test("should extract Gemini error message from HTTP response", () => {
      const httpError = {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        data: {
          error: {
            code: 400,
            message: "Invalid model parameter",
            status: "INVALID_ARGUMENT",
          },
        },
      };

      const result = normalizeGeminiError(httpError);

      expect(result.message).toBe("Invalid model parameter");
      expect(result.context?.geminiErrorCode).toBe(400);
    });

    test("should fallback to HTTP status text when no Gemini error", () => {
      const httpError = {
        status: 404,
        statusText: "Not Found",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result.message).toContain("Resource not found: Not Found");
    });

    test("should sanitize Google API keys in error messages", () => {
      const error = new Error(
        "Authentication failed with API key AIzaSyCHUCmpR7cT_yDFHC98CZJy2LTms8jw0g",
      );

      const result = normalizeGeminiError(error);

      expect(result.message).toContain("AIza***");
      expect(result.message).not.toContain(
        "AIzaSyCHUCmpR7cT_yDFHC98CZJy2LTms8jw0g",
      );
    });

    test("should sanitize OAuth tokens in error messages", () => {
      const error = new Error(
        "Request failed with token ya29.c.b0AX35XYZexample_token_data",
      );

      const result = normalizeGeminiError(error);

      expect(result.message).toContain("ya29.***");
      expect(result.message).not.toContain(
        "ya29.c.b0AX35XYZexample_token_data",
      );
    });
  });

  describe("Context Preservation", () => {
    test("should include provider context in all errors", () => {
      const httpError = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result.context?.provider).toBe("google-gemini");
      expect(result.context?.version).toBe("v1");
      expect(result.context?.timestamp).toBeDefined();
      expect(typeof result.context?.timestamp).toBe("string");
    });

    test("should preserve original error for debugging", () => {
      const originalError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "30" },
        data: { error: { message: "Rate limit exceeded" } },
      };

      const result = normalizeGeminiError(originalError);

      expect(result.context?.originalError).toBe(originalError);
    });

    test("should parse retry-after header for rate limits", () => {
      const rateLimitError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": "60" },
      };

      const result = normalizeGeminiError(rateLimitError);

      expect(result.context?.retryAfter).toBe(60);
      expect(result.context?.retryAfterType).toBe("seconds");
    });

    test("should parse HTTP-date retry-after header", () => {
      const futureDate = new Date(Date.now() + 30000); // 30 seconds from now
      const rateLimitError = {
        status: 429,
        statusText: "Too Many Requests",
        headers: { "retry-after": futureDate.toUTCString() },
      };

      const result = normalizeGeminiError(rateLimitError);

      expect(result.context?.retryAfterType).toBe("http-date");
      expect(result.context?.retryAfterDate).toBeDefined();
      expect(typeof result.context?.retryAfter).toBe("number");
    });

    test("should sanitize sensitive headers", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {
          "x-goog-api-key": "AIzaSyCHUCmpR7cT_yDFHC98CZJy2LTms8jw0g",
          authorization: "Bearer token123",
          "content-type": "application/json",
        },
      };

      const result = normalizeGeminiError(httpError);

      const headers = result.context?.headers as Record<string, string>;
      expect(headers["x-goog-api-key"]).toBe("***");
      expect(headers["authorization"]).toBe("***");
      expect(headers["content-type"]).toBe("application/json");
    });
  });

  describe("Fallback Handling", () => {
    test("should handle string errors", () => {
      const stringError = "Something went wrong";

      const result = normalizeGeminiError(stringError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Google Gemini API error");
      expect(result.context?.message).toBe("Something went wrong");
      expect(result.context?.provider).toBe("google-gemini");
    });

    test("should handle null/undefined errors", () => {
      const result = normalizeGeminiError(null);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown Google Gemini error");
      expect(result.context?.errorType).toBe("object");
    });

    test("should handle malformed Gemini responses", () => {
      const malformedResponse = {
        error: "not an object",
      };

      const result = normalizeGeminiError(malformedResponse);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Invalid Google Gemini error response");
    });

    test("should handle Gemini responses without error field", () => {
      const responseWithoutError = {
        error: {},
      };

      const result = normalizeGeminiError(responseWithoutError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Invalid Google Gemini error response");
    });

    test("should handle unknown error types", () => {
      const unknownError = { weird: "object" };

      const result = normalizeGeminiError(unknownError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown Google Gemini error");
      expect(result.context?.errorType).toBe("object");
    });
  });

  describe("Range-based Status Code Mapping", () => {
    test("should map unknown 4xx codes to ValidationError", () => {
      const httpError = {
        status: 418, // I'm a teapot
        statusText: "I'm a teapot",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe("VALIDATION_ERROR");
    });

    test("should map unknown 5xx codes to ProviderError", () => {
      const httpError = {
        status: 598, // Unknown server error
        statusText: "Network read timeout error",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
    });

    test("should map completely unknown codes to ProviderError", () => {
      const httpError = {
        status: 999,
        statusText: "Unknown",
        headers: {},
      };

      const result = normalizeGeminiError(httpError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.code).toBe("PROVIDER_ERROR");
    });
  });
});
