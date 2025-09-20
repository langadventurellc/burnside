/**
 * @file retryPolicy.test.ts
 * @description Comprehensive unit tests for RetryPolicy class covering all retry logic scenarios
 */

import { RetryPolicy } from "../retryPolicy";
import type { RetryConfig, RetryContext } from "../index";
import type { ProviderHttpResponse } from "../../providerHttpResponse";

describe("RetryPolicy", () => {
  // Default configuration for tests
  const defaultConfig: RetryConfig = {
    attempts: 3,
    backoff: "exponential",
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitter: false, // Disable jitter for predictable tests
    retryableStatusCodes: [429, 500, 502, 503, 504],
  };

  // Helper function to create mock HTTP responses
  const createMockResponse = (
    status: number,
    headers: Record<string, string> = {},
  ): ProviderHttpResponse => ({
    status,
    statusText: `Status ${status}`,
    headers,
    body: null,
  });

  // Helper function to create retry context
  const createContext = (
    attempt: number,
    response?: ProviderHttpResponse,
    abortSignal?: AbortSignal,
  ): RetryContext => ({
    attempt,
    lastError: new Error(`HTTP ${response?.status || "Unknown"}`),
    lastResponse: response,
    abortSignal,
  });

  describe("Constructor and Configuration Validation", () => {
    test("should create RetryPolicy with valid configuration", () => {
      expect(() => new RetryPolicy(defaultConfig)).not.toThrow();
    });

    test("should reject attempts outside 0-10 range", () => {
      const invalidConfig1: RetryConfig = { ...defaultConfig, attempts: -1 };
      expect(() => new RetryPolicy(invalidConfig1)).toThrow(
        "Retry attempts must be between 0 and 10",
      );

      const invalidConfig2: RetryConfig = { ...defaultConfig, attempts: 11 };
      expect(() => new RetryPolicy(invalidConfig2)).toThrow(
        "Retry attempts must be between 0 and 10",
      );
    });

    test("should reject negative base delay", () => {
      const invalidConfig: RetryConfig = {
        ...defaultConfig,
        baseDelayMs: -100,
      };
      expect(() => new RetryPolicy(invalidConfig)).toThrow(
        "Base delay must be non-negative",
      );
    });

    test("should reject max delay less than base delay", () => {
      const invalidConfig: RetryConfig = {
        ...defaultConfig,
        baseDelayMs: 5000,
        maxDelayMs: 2000,
      };
      expect(() => new RetryPolicy(invalidConfig)).toThrow(
        "Max delay must be greater than or equal to base delay",
      );
    });

    test("should reject invalid retryable status codes", () => {
      const invalidConfig = {
        ...defaultConfig,
        retryableStatusCodes: "invalid" as unknown as number[],
      };
      expect(() => new RetryPolicy(invalidConfig)).toThrow(
        "Retryable status codes must be an array",
      );
    });
  });

  describe("Retry Decision Logic", () => {
    let policy: RetryPolicy;

    beforeEach(() => {
      policy = new RetryPolicy(defaultConfig);
    });

    describe("Retryable Status Codes", () => {
      test.each([429, 500, 502, 503, 504])(
        "should retry on status code %d",
        (statusCode) => {
          const context = createContext(0, createMockResponse(statusCode));
          const decision = policy.shouldRetry(context);

          expect(decision.shouldRetry).toBe(true);
          expect(decision.delayMs).toBeGreaterThan(0);
          expect(decision.reason).toContain("backoff delay");
        },
      );

      test("should use custom retryable status codes", () => {
        const customConfig: RetryConfig = {
          ...defaultConfig,
          retryableStatusCodes: [429, 503],
        };
        const customPolicy = new RetryPolicy(customConfig);

        // Should retry on included status
        const retryableContext = createContext(0, createMockResponse(503));
        expect(customPolicy.shouldRetry(retryableContext).shouldRetry).toBe(
          true,
        );

        // Should not retry on excluded status
        const nonRetryableContext = createContext(0, createMockResponse(500));
        expect(customPolicy.shouldRetry(nonRetryableContext).shouldRetry).toBe(
          false,
        );
      });
    });

    describe("Non-Retryable Status Codes", () => {
      test.each([400, 401, 403, 404, 422])(
        "should not retry on status code %d",
        (statusCode) => {
          const context = createContext(0, createMockResponse(statusCode));
          const decision = policy.shouldRetry(context);

          expect(decision.shouldRetry).toBe(false);
          expect(decision.delayMs).toBe(0);
          expect(decision.reason).toContain(
            `Non-retryable status code: ${statusCode}`,
          );
        },
      );
    });

    describe("Attempt Limit Enforcement", () => {
      test("should retry within attempt limit", () => {
        const context = createContext(2, createMockResponse(500)); // Attempt 2 of 3
        const decision = policy.shouldRetry(context);

        expect(decision.shouldRetry).toBe(true);
      });

      test("should not retry when attempt limit exceeded", () => {
        const context = createContext(3, createMockResponse(500)); // Attempt 3, limit is 3
        const decision = policy.shouldRetry(context);

        expect(decision.shouldRetry).toBe(false);
        expect(decision.delayMs).toBe(0);
        expect(decision.reason).toContain("Attempt limit exceeded (3/3)");
      });

      test("should handle zero attempts configuration", () => {
        const noRetryConfig: RetryConfig = { ...defaultConfig, attempts: 0 };
        const noRetryPolicy = new RetryPolicy(noRetryConfig);
        const context = createContext(0, createMockResponse(500));
        const decision = noRetryPolicy.shouldRetry(context);

        expect(decision.shouldRetry).toBe(false);
        expect(decision.reason).toContain("Attempt limit exceeded");
      });
    });

    describe("AbortSignal Cancellation", () => {
      test("should not retry when AbortSignal is aborted", () => {
        const controller = new AbortController();
        controller.abort();

        const context = createContext(
          0,
          createMockResponse(500),
          controller.signal,
        );
        const decision = policy.shouldRetry(context);

        expect(decision.shouldRetry).toBe(false);
        expect(decision.delayMs).toBe(0);
        expect(decision.reason).toBe("Request cancelled via AbortSignal");
      });

      test("should retry when AbortSignal is not aborted", () => {
        const controller = new AbortController();
        const context = createContext(
          0,
          createMockResponse(500),
          controller.signal,
        );
        const decision = policy.shouldRetry(context);

        expect(decision.shouldRetry).toBe(true);
      });
    });

    describe("Error Without Response", () => {
      test("should retry on network error without response", () => {
        const context: RetryContext = {
          attempt: 0,
          lastError: new Error("Network timeout"),
          // No lastResponse
        };

        const decision = policy.shouldRetry(context);

        expect(decision.shouldRetry).toBe(true);
        expect(decision.delayMs).toBeGreaterThan(0);
        expect(decision.reason).toContain("backoff delay");
      });
    });
  });

  describe("Retry-After Header Parsing", () => {
    let policy: RetryPolicy;

    beforeEach(() => {
      policy = new RetryPolicy(defaultConfig);
    });

    describe("Numeric Seconds Format", () => {
      test("should parse numeric seconds correctly", () => {
        const headers = { "retry-after": "120" };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBe(120000); // 120 seconds in milliseconds
      });

      test("should handle zero seconds", () => {
        const headers = { "retry-after": "0" };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBe(0);
      });

      test("should handle large numeric values", () => {
        const headers = { "retry-after": "3600" }; // 1 hour
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBe(3600000);
      });
    });

    describe("HTTP Date Format", () => {
      test("should parse HTTP date correctly", () => {
        const futureDate = new Date(Date.now() + 60000); // 1 minute from now
        const headers = { "retry-after": futureDate.toUTCString() };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBeGreaterThan(55000); // Allow some tolerance
        expect(delayMs).toBeLessThan(65000);
      });

      test("should handle past dates gracefully", () => {
        const pastDate = new Date(Date.now() - 60000); // 1 minute ago
        const headers = { "retry-after": pastDate.toUTCString() };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBe(0); // Past dates should return 0
      });
    });

    describe("Invalid/Missing Headers", () => {
      test("should return null for missing header", () => {
        const headers = {};
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBeNull();
      });

      test("should return null for invalid numeric value", () => {
        const headers = { "retry-after": "invalid" };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBeNull();
      });

      test("should return null for invalid date", () => {
        const headers = { "retry-after": "Not a date" };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBeNull();
      });

      test("should handle negative numeric values", () => {
        const headers = { "retry-after": "-60" };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBeNull();
      });
    });

    describe("Case Sensitivity", () => {
      test("should handle lowercase header name", () => {
        const headers = { "retry-after": "60" };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBe(60000);
      });

      test("should handle capitalized header name", () => {
        const headers = { "Retry-After": "60" };
        const delayMs = policy.parseRetryAfter(headers);

        expect(delayMs).toBe(60000);
      });
    });
  });

  describe("Delay Calculation and Capping", () => {
    test("should use Retry-After header when present", () => {
      const policy = new RetryPolicy(defaultConfig);
      const headers = { "retry-after": "20" }; // Use 20 seconds, under the 30 second max
      const context = createContext(0, createMockResponse(503, headers));
      const decision = policy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(true);
      expect(decision.delayMs).toBe(20000);
      expect(decision.reason).toContain("Retry-After header specified");
    });

    test("should cap Retry-After delay at maxDelayMs", () => {
      const cappedConfig: RetryConfig = { ...defaultConfig, maxDelayMs: 10000 };
      const policy = new RetryPolicy(cappedConfig);
      const headers = { "retry-after": "60" }; // 60 seconds > 10 second max
      const context = createContext(0, createMockResponse(503, headers));
      const decision = policy.shouldRetry(context);

      expect(decision.delayMs).toBe(10000); // Capped at maxDelayMs
      expect(decision.reason).toContain("capped at 10000ms");
    });

    test("should use backoff strategy when no Retry-After header", () => {
      const policy = new RetryPolicy(defaultConfig);
      const context = createContext(1, createMockResponse(500)); // Second attempt
      const decision = policy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(true);
      expect(decision.delayMs).toBe(2000); // Exponential: 1000 * 2^1 = 2000ms
      expect(decision.reason).toContain("exponential backoff delay");
    });

    test("should cap backoff delay at maxDelayMs", () => {
      const cappedConfig: RetryConfig = {
        ...defaultConfig,
        maxDelayMs: 5000,
        attempts: 10,
      };
      const policy = new RetryPolicy(cappedConfig);
      const context = createContext(5, createMockResponse(500)); // High attempt number, but within attempts limit
      const decision = policy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(true);
      expect(decision.delayMs).toBe(5000); // Capped at maxDelayMs
    });
  });

  describe("Configuration Management", () => {
    let policy: RetryPolicy;

    beforeEach(() => {
      policy = new RetryPolicy(defaultConfig);
    });

    test("should update attempts configuration", () => {
      policy.updateConfig({ attempts: 5 });

      const context = createContext(4, createMockResponse(500)); // Attempt 4 of new limit 5
      const decision = policy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(true);
    });

    test("should update retryable status codes", () => {
      policy.updateConfig({ retryableStatusCodes: [429] }); // Only retry on 429

      const context429 = createContext(0, createMockResponse(429));
      const context500 = createContext(0, createMockResponse(500));

      expect(policy.shouldRetry(context429).shouldRetry).toBe(true);
      expect(policy.shouldRetry(context500).shouldRetry).toBe(false);
    });

    test("should update timing configuration", () => {
      policy.updateConfig({ baseDelayMs: 2000 });

      const context = createContext(0, createMockResponse(500));
      const decision = policy.shouldRetry(context);

      expect(decision.delayMs).toBe(2000); // New base delay
    });

    test("should validate updated configuration", () => {
      expect(() => policy.updateConfig({ attempts: 15 })).toThrow(
        "Retry attempts must be between 0 and 10",
      );

      expect(() => policy.updateConfig({ baseDelayMs: -100 })).toThrow(
        "Base delay must be non-negative",
      );
    });
  });

  describe("Edge Cases", () => {
    test("should handle maximum attempts (10)", () => {
      const maxConfig: RetryConfig = { ...defaultConfig, attempts: 10 };
      const policy = new RetryPolicy(maxConfig);
      const context = createContext(9, createMockResponse(500)); // Attempt 9 of 10
      const decision = policy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(true);
    });

    test("should handle very large Retry-After values", () => {
      const cappedConfig: RetryConfig = { ...defaultConfig, maxDelayMs: 60000 };
      const policy = new RetryPolicy(cappedConfig);
      const headers = { "retry-after": "999999" }; // Very large value
      const context = createContext(0, createMockResponse(503, headers));
      const decision = policy.shouldRetry(context);

      expect(decision.delayMs).toBe(60000); // Capped at maxDelayMs
    });

    test("should handle concurrent retry decisions safely", () => {
      const policy = new RetryPolicy(defaultConfig);
      const contexts = Array.from({ length: 10 }, (_, i) =>
        createContext(i % 3, createMockResponse(500)),
      );

      const decisions = contexts.map((context) => policy.shouldRetry(context));

      // All decisions should be consistent and not interfere with each other
      decisions.forEach((decision, index) => {
        const expectedShouldRetry = index % 3 < defaultConfig.attempts;
        expect(decision.shouldRetry).toBe(expectedShouldRetry);
      });
    });

    test("should handle missing error gracefully", () => {
      const context: RetryContext = {
        attempt: 0,
        lastError: new Error("Test error"),
        lastResponse: createMockResponse(500),
      };

      const policy = new RetryPolicy(defaultConfig);
      const decision = policy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(true);
      expect(typeof decision.reason).toBe("string");
    });
  });

  describe("Integration with Different Backoff Strategies", () => {
    test("should work with linear backoff", () => {
      const linearConfig: RetryConfig = {
        ...defaultConfig,
        backoff: "linear",
      };
      const policy = new RetryPolicy(linearConfig);

      const context = createContext(2, createMockResponse(500)); // Third attempt
      const decision = policy.shouldRetry(context);

      expect(decision.shouldRetry).toBe(true);
      expect(decision.delayMs).toBe(3000); // Linear: 1000 * (2 + 1) = 3000ms
      expect(decision.reason).toContain("linear backoff delay");
    });

    test("should recreate backoff strategy when configuration updated", () => {
      const exponentialConfig: RetryConfig = {
        ...defaultConfig,
        backoff: "exponential",
      };
      const policy = new RetryPolicy(exponentialConfig);

      // Update to linear backoff
      policy.updateConfig({ backoff: "linear" });

      const context = createContext(1, createMockResponse(500));
      const decision = policy.shouldRetry(context);

      expect(decision.delayMs).toBe(2000); // Linear: 1000 * (1 + 1) = 2000ms
      expect(decision.reason).toContain("linear backoff delay");
    });
  });
});
