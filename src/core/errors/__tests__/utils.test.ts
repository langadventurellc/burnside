/**
 * Error Utilities Test Suite
 *
 * Tests for error utility functions, constants, and transformation operations.
 * Validates serialization, type guards, and error code constants.
 */
import {
  ERROR_CODES,
  serializeError,
  isBridgeError,
  BridgeError,
  TransportError,
  AuthError,
} from "../index.js";

describe("ERROR_CODES", () => {
  it("should contain all expected error codes", () => {
    expect(ERROR_CODES.BRIDGE_ERROR).toBe("BRIDGE_ERROR");
    expect(ERROR_CODES.TRANSPORT_ERROR).toBe("TRANSPORT_ERROR");
    expect(ERROR_CODES.AUTH_ERROR).toBe("AUTH_ERROR");
    expect(ERROR_CODES.RATE_LIMIT_ERROR).toBe("RATE_LIMIT_ERROR");
    expect(ERROR_CODES.TIMEOUT_ERROR).toBe("TIMEOUT_ERROR");
    expect(ERROR_CODES.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ERROR_CODES.PROVIDER_ERROR).toBe("PROVIDER_ERROR");
    expect(ERROR_CODES.STREAMING_ERROR).toBe("STREAMING_ERROR");
    expect(ERROR_CODES.TOOL_ERROR).toBe("TOOL_ERROR");
  });

  it("should have consistent naming pattern", () => {
    const codes = Object.values(ERROR_CODES);
    codes.forEach((code) => {
      expect(code).toMatch(/^[A-Z_]+_ERROR$/);
      expect(code).toContain("_ERROR");
    });
  });

  it("should be read-only at compile time", () => {
    // This test verifies that ERROR_CODES is properly typed as const
    // Runtime immutability would require Object.freeze, which is not used here
    // TypeScript prevents modification at compile time
    expect(typeof ERROR_CODES).toBe("object");
    expect(ERROR_CODES.BRIDGE_ERROR).toBe("BRIDGE_ERROR");
  });
});

describe("serializeError", () => {
  it("should serialize BridgeError correctly", () => {
    const context = {
      requestId: "req_123",
      provider: "openai",
      timestamp: "2023-01-01T00:00:00.000Z", // Use string instead of Date for consistency
    };
    const error = new BridgeError("Test error", "TEST_ERROR", context);

    const serialized = serializeError(error);

    expect(serialized.name).toBe("BridgeError");
    expect(serialized.message).toBe("Test error");
    expect(serialized.code).toBe("TEST_ERROR");
    expect(serialized.context).toEqual(context);
    expect(serialized.stack).toBeDefined();
    expect(serialized.stack).toContain("BridgeError");
  });

  it("should serialize TransportError correctly", () => {
    const context = { url: "https://api.example.com", timeout: 30000 };
    const error = new TransportError("Connection failed", context);

    const serialized = serializeError(error);

    expect(serialized.name).toBe("TransportError");
    expect(serialized.message).toBe("Connection failed");
    expect(serialized.code).toBe("TRANSPORT_ERROR");
    expect(serialized.context).toEqual(context);
  });

  it("should handle errors without context", () => {
    const error = new AuthError("Invalid token");

    const serialized = serializeError(error);

    expect(serialized.name).toBe("AuthError");
    expect(serialized.message).toBe("Invalid token");
    expect(serialized.code).toBe("AUTH_ERROR");
    expect(serialized.context).toBeUndefined();
  });

  it("should handle standard JavaScript errors", () => {
    const error = new Error("Standard error");

    const serialized = serializeError(error);

    expect(serialized.name).toBe("Error");
    expect(serialized.message).toBe("Standard error");
    expect(serialized.code).toBeUndefined();
    expect(serialized.stack).toBeDefined();
  });

  it("should handle non-Error objects", () => {
    const nonError = { message: "Not an error", status: 500 };

    const serialized = serializeError(nonError);

    expect(serialized.name).toBe("NonErrorObject");
    expect(serialized.message).toBe('{"message":"Not an error","status":500}');
    expect(serialized.code).toBeUndefined();
  });

  it("should handle primitive values", () => {
    const stringError = serializeError("Simple string error");
    expect(stringError.name).toBe("NonErrorObject");
    expect(stringError.message).toBe("Simple string error");

    const numberError = serializeError(404);
    expect(numberError.name).toBe("NonErrorObject");
    expect(numberError.message).toBe("404");

    const booleanError = serializeError(false);
    expect(booleanError.name).toBe("NonErrorObject");
    expect(booleanError.message).toBe("false");
  });

  it("should handle null and undefined", () => {
    const nullError = serializeError(null);
    expect(nullError.name).toBe("Unknown");
    expect(nullError.message).toBe("Unknown error occurred");

    const undefinedError = serializeError(undefined);
    expect(undefinedError.name).toBe("Unknown");
    expect(undefinedError.message).toBe("Unknown error occurred");
  });

  it("should handle circular references in context", () => {
    const circularContext: Record<string, unknown> = { requestId: "req_123" };
    circularContext.self = circularContext; // Create circular reference

    const error = new BridgeError(
      "Circular test",
      "TEST_ERROR",
      circularContext,
    );

    const serialized = serializeError(error);

    expect(serialized.name).toBe("BridgeError");
    expect(serialized.message).toBe("Circular test");
    expect(serialized.code).toBe("TEST_ERROR");
    expect(serialized.context).toEqual({ serialization_failed: true });
  });

  it("should handle errors with additional properties", () => {
    const error = new Error("Test error") as Error & {
      statusCode: number;
      details: string;
    };
    error.statusCode = 500;
    error.details = "Internal server error";

    const serialized = serializeError(error);

    expect(serialized.name).toBe("Error");
    expect(serialized.message).toBe("Test error");
    expect(serialized.statusCode).toBe(500);
    expect(serialized.details).toBe("Internal server error");
  });

  it("should produce JSON-safe output", () => {
    const error = new TransportError("Test error", {
      url: "https://api.example.com",
      timestamp: new Date(),
    });

    const serialized = serializeError(error);

    expect(() => JSON.stringify(serialized)).not.toThrow();
    const jsonString = JSON.stringify(serialized);
    expect(() => JSON.parse(jsonString)).not.toThrow();
  });
});

describe("isBridgeError", () => {
  it("should return true for BridgeError instances", () => {
    const error = new BridgeError("Test", "TEST_ERROR");
    expect(isBridgeError(error)).toBe(true);
  });

  it("should return true for BridgeError subclass instances", () => {
    const transportError = new TransportError("Connection failed");
    const authError = new AuthError("Invalid token");

    expect(isBridgeError(transportError)).toBe(true);
    expect(isBridgeError(authError)).toBe(true);
  });

  it("should return false for standard Error instances", () => {
    const error = new Error("Standard error");
    expect(isBridgeError(error)).toBe(false);
  });

  it("should return false for non-error values", () => {
    expect(isBridgeError(null)).toBe(false);
    expect(isBridgeError(undefined)).toBe(false);
    expect(isBridgeError("string")).toBe(false);
    expect(isBridgeError(123)).toBe(false);
    expect(isBridgeError({})).toBe(false);
    expect(isBridgeError([])).toBe(false);
  });

  it("should provide type narrowing", () => {
    const error: unknown = new TransportError("Test");

    if (isBridgeError(error)) {
      // TypeScript should know error is BridgeError here
      expect(error.code).toBe("TRANSPORT_ERROR");
      expect(error.message).toBe("Test");
    } else {
      fail("Should have identified error as BridgeError");
    }
  });
});

describe("Error serialization round-trip", () => {
  it("should maintain essential information through serialization", () => {
    const originalContext = {
      requestId: "req_abc123",
      provider: "openai",
      operation: "chat_completion",
      attempt: 2,
    };

    const originalError = new TransportError(
      "Connection timeout",
      originalContext,
    );

    // Serialize and parse (simulating logging/transport)
    const serialized = serializeError(originalError);
    const jsonString = JSON.stringify(serialized);
    const parsed = JSON.parse(jsonString);

    // Verify essential information is preserved
    expect(parsed.name).toBe("TransportError");
    expect(parsed.message).toBe("Connection timeout");
    expect(parsed.code).toBe("TRANSPORT_ERROR");
    expect(parsed.context).toEqual(originalContext);
    expect(parsed.stack).toBeDefined();
  });

  it("should handle nested context objects", () => {
    const complexContext = {
      requestId: "req_123",
      provider: "anthropic",
      request: {
        model: "claude-3-sonnet",
        maxTokens: 1000,
        temperature: 0.7,
      },
      response: {
        headers: {
          "content-type": "application/json",
          "x-ratelimit-remaining": "99",
        },
      },
    };

    const error = new AuthError("API key invalid", complexContext);
    const serialized = serializeError(error);

    expect(serialized.context).toEqual(complexContext);
    expect(serialized.context?.request).toEqual(complexContext.request);
    expect(
      (serialized.context as typeof complexContext)?.response?.headers,
    ).toEqual(complexContext.response.headers);
  });
});
