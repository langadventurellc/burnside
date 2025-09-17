/**
 * Error Normalization Test Suite
 *
 * Tests for error normalization interfaces and patterns.
 * Validates that the interfaces can be implemented and used correctly.
 */
import type {
  ErrorNormalizer,
  ErrorContext,
  NormalizedError,
  ErrorCodeMapping,
  ErrorFactory,
} from "../index";

describe("ErrorNormalizer interface", () => {
  it("should be implementable", () => {
    class TestNormalizer implements ErrorNormalizer {
      normalize(
        providerError: unknown,
        context: ErrorContext,
      ): NormalizedError {
        return {
          type: "BridgeError",
          message: String(providerError),
          code: "TEST_ERROR",
          context,
        };
      }
    }

    const normalizer = new TestNormalizer();
    const context: ErrorContext = { provider: "test" };
    const result = normalizer.normalize("test error", context);

    expect(result.type).toBe("BridgeError");
    expect(result.message).toBe("test error");
    expect(result.code).toBe("TEST_ERROR");
    expect(result.context).toEqual(context);
  });

  it("should handle different error types", () => {
    class MockNormalizer implements ErrorNormalizer {
      normalize(
        providerError: unknown,
        context: ErrorContext,
      ): NormalizedError {
        if (
          typeof providerError === "object" &&
          providerError !== null &&
          "status" in providerError
        ) {
          const error = providerError as { status: number; message: string };
          if (error.status === 401) {
            return {
              type: "AuthError",
              message: "Authentication failed",
              code: "AUTH_ERROR",
              context,
            };
          }
          if (error.status === 429) {
            return {
              type: "RateLimitError",
              message: "Rate limit exceeded",
              code: "RATE_LIMIT_ERROR",
              context,
            };
          }
        }

        return {
          type: "ProviderError",
          message: String(providerError),
          code: "PROVIDER_ERROR",
          context,
        };
      }
    }

    const normalizer = new MockNormalizer();
    const context: ErrorContext = { provider: "test" };

    const authResult = normalizer.normalize(
      { status: 401, message: "Unauthorized" },
      context,
    );
    expect(authResult.type).toBe("AuthError");
    expect(authResult.code).toBe("AUTH_ERROR");

    const rateLimitResult = normalizer.normalize(
      { status: 429, message: "Too many requests" },
      context,
    );
    expect(rateLimitResult.type).toBe("RateLimitError");
    expect(rateLimitResult.code).toBe("RATE_LIMIT_ERROR");
  });
});

describe("ErrorContext interface", () => {
  it("should accept all defined properties", () => {
    const context: ErrorContext = {
      requestId: "req_abc123",
      timestamp: new Date(),
      provider: "openai",
      operation: "chat_completion",
      model: "gpt-4",
      attempt: 1,
      url: "https://api.openai.com/v1/responses",
      customProperty: "custom value",
    };

    expect(context.requestId).toBe("req_abc123");
    expect(context.provider).toBe("openai");
    expect(context.customProperty).toBe("custom value");
  });

  it("should work with minimal properties", () => {
    const context: ErrorContext = {
      provider: "test",
    };

    expect(context.provider).toBe("test");
    expect(context.requestId).toBeUndefined();
  });

  it("should support custom properties via index signature", () => {
    const context: ErrorContext = {
      provider: "test",
      customField: "value",
      anotherField: 123,
      objectField: { nested: true },
    };

    expect(context.customField).toBe("value");
    expect(context.anotherField).toBe(123);
    expect(context.objectField).toEqual({ nested: true });
  });
});

describe("NormalizedError interface", () => {
  it("should represent standardized error format", () => {
    const normalizedError: NormalizedError = {
      type: "TransportError",
      message: "Connection failed",
      code: "TRANSPORT_ERROR",
      context: {
        provider: "openai",
        url: "https://api.openai.com",
        timeout: 30000,
      },
      originalError: new Error("Original connection error"),
    };

    expect(normalizedError.type).toBe("TransportError");
    expect(normalizedError.message).toBe("Connection failed");
    expect(normalizedError.code).toBe("TRANSPORT_ERROR");
    expect(normalizedError.context?.provider).toBe("openai");
    expect(normalizedError.originalError).toBeInstanceOf(Error);
  });

  it("should work without optional properties", () => {
    const normalizedError: NormalizedError = {
      type: "ValidationError",
      message: "Invalid input",
      code: "VALIDATION_ERROR",
    };

    expect(normalizedError.type).toBe("ValidationError");
    expect(normalizedError.context).toBeUndefined();
    expect(normalizedError.originalError).toBeUndefined();
  });
});

describe("ErrorCodeMapping type", () => {
  it("should map provider codes to library codes", () => {
    const mapping: ErrorCodeMapping = {
      invalid_api_key: "AUTH_ERROR",
      model_not_found: "PROVIDER_ERROR",
      rate_limit_exceeded: "RATE_LIMIT_ERROR",
      request_timeout: "TIMEOUT_ERROR",
    };

    expect(mapping["invalid_api_key"]).toBe("AUTH_ERROR");
    expect(mapping["rate_limit_exceeded"]).toBe("RATE_LIMIT_ERROR");
  });

  it("should be usable for error code translation", () => {
    const openaiMapping: ErrorCodeMapping = {
      invalid_api_key: "AUTH_ERROR",
      insufficient_quota: "RATE_LIMIT_ERROR",
      model_not_found: "PROVIDER_ERROR",
    };

    function translateErrorCode(providerCode: string): string {
      return openaiMapping[providerCode] || "PROVIDER_ERROR";
    }

    expect(translateErrorCode("invalid_api_key")).toBe("AUTH_ERROR");
    expect(translateErrorCode("unknown_error")).toBe("PROVIDER_ERROR");
  });
});

describe("ErrorFactory type", () => {
  it("should create normalized errors functionally", () => {
    const createAuthError: ErrorFactory = (message, context) => ({
      type: "AuthError",
      message,
      code: "AUTH_ERROR",
      context,
    });

    const result = createAuthError("Invalid token", { provider: "openai" });

    expect(result.type).toBe("AuthError");
    expect(result.message).toBe("Invalid token");
    expect(result.code).toBe("AUTH_ERROR");
    expect(result.context?.provider).toBe("openai");
  });

  it("should work without context", () => {
    const createTimeoutError: ErrorFactory = (message) => ({
      type: "TimeoutError",
      message,
      code: "TIMEOUT_ERROR",
    });

    const result = createTimeoutError("Request timed out");

    expect(result.type).toBe("TimeoutError");
    expect(result.context).toBeUndefined();
  });
});

describe("Integration workflow", () => {
  it("should demonstrate complete normalization workflow", () => {
    // Mock provider error
    const providerError = {
      error: {
        type: "invalid_request_error",
        code: "invalid_api_key",
        message: "Invalid API key provided",
      },
    };

    // Error context
    const context: ErrorContext = {
      requestId: "req_123",
      provider: "openai",
      operation: "chat_completion",
    };

    // Normalizer implementation
    class OpenAINormalizer implements ErrorNormalizer {
      normalize(error: unknown, ctx: ErrorContext): NormalizedError {
        if (typeof error === "object" && error !== null && "error" in error) {
          const apiError = error as {
            error: { code: string; message: string };
          };

          if (apiError.error.code === "invalid_api_key") {
            return {
              type: "AuthError",
              message: "Invalid API key",
              code: "AUTH_ERROR",
              context: ctx,
              originalError: error,
            };
          }
        }

        return {
          type: "ProviderError",
          message: "Unknown provider error",
          code: "PROVIDER_ERROR",
          context: ctx,
          originalError: error,
        };
      }
    }

    const normalizer = new OpenAINormalizer();
    const normalized = normalizer.normalize(providerError, context);

    expect(normalized.type).toBe("AuthError");
    expect(normalized.code).toBe("AUTH_ERROR");
    expect(normalized.context?.provider).toBe("openai");
    expect(normalized.originalError).toBe(providerError);
  });
});
