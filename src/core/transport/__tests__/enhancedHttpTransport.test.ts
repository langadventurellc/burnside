/**
 * Enhanced HTTP Transport Tests
 *
 * Comprehensive test suite for the EnhancedHttpTransport class covering
 * rate limiting, retry logic, streaming, configuration management, and
 * integration scenarios.
 */

import { EnhancedHttpTransport } from "../enhancedHttpTransport";
import { TransportError } from "../../errors/transportError";
import { delayPromise } from "../retry/delayPromise";
import type { Transport } from "../transport";
import type { ProviderHttpRequest } from "../providerHttpRequest";
import type { ProviderHttpResponse } from "../providerHttpResponse";
import type { StreamResponse } from "../streamResponse";
import type { RateLimitConfig } from "../rateLimiting/rateLimitConfig";
import type { RetryConfig } from "../retry/retryConfig";
import type { RuntimeAdapter } from "../../runtime/runtimeAdapter";

// Mock the delayPromise function
jest.mock("../retry/delayPromise");
const mockDelayPromise = delayPromise as jest.MockedFunction<
  typeof delayPromise
>;

describe("EnhancedHttpTransport", () => {
  let mockBaseTransport: jest.Mocked<Transport>;
  let enhancedTransport: EnhancedHttpTransport;
  let mockRequest: ProviderHttpRequest;
  let mockResponse: ProviderHttpResponse;
  let mockAbortSignal: AbortSignal;
  let mockRuntimeAdapter: RuntimeAdapter;

  beforeEach(() => {
    // Create mock runtime adapter
    mockRuntimeAdapter = {
      setTimeout: jest.fn((callback: () => void, timeout: number) => {
        return setTimeout(callback, timeout);
      }),
      clearTimeout: jest.fn((handle: unknown) => {
        if (handle) {
          clearTimeout(handle as NodeJS.Timeout);
        }
      }),
      fetch: jest.fn(),
      stream: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      fileExists: jest.fn(),
    } as unknown as RuntimeAdapter;

    // Create mock base transport
    mockBaseTransport = {
      fetch: jest.fn(),
      stream: jest.fn(),
    };

    // Create mock request
    mockRequest = {
      url: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: { Authorization: "Bearer sk-test123" },
      body: JSON.stringify({ model: "gpt-4", messages: [] }),
    };

    // Create mock response
    mockResponse = {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: null,
    };

    // Create mock abort signal
    mockAbortSignal = {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onabort: null,
      reason: undefined,
      throwIfAborted: jest.fn(),
    };

    // Reset mocks
    mockDelayPromise.mockResolvedValue();
    mockBaseTransport.fetch.mockResolvedValue(mockResponse);
    mockBaseTransport.stream.mockResolvedValue(mockStreamResponse([]));

    jest.clearAllMocks();
  });

  describe("Constructor and Basic Configuration", () => {
    test("should create instance with base transport only", () => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });

      expect(enhancedTransport).toBeInstanceOf(EnhancedHttpTransport);
    });

    test("should create instance with rate limiting config", () => {
      const rateLimitConfig: RateLimitConfig = {
        enabled: true,
        maxRps: 10,
        scope: "provider:model",
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      expect(enhancedTransport).toBeInstanceOf(EnhancedHttpTransport);
    });

    test("should create instance with retry config", () => {
      const retryConfig: RetryConfig = {
        attempts: 3,
        backoff: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: true,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      expect(enhancedTransport).toBeInstanceOf(EnhancedHttpTransport);
    });

    test("should create instance with both rate limiting and retry configs", () => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig: { enabled: true, maxRps: 5, scope: "global" },
        retryConfig: {
          attempts: 2,
          backoff: "linear",
          baseDelayMs: 500,
          maxDelayMs: 5000,
          jitter: false,
          retryableStatusCodes: [429, 500],
        },
        runtimeAdapter: mockRuntimeAdapter,
      });

      expect(enhancedTransport).toBeInstanceOf(EnhancedHttpTransport);
    });
  });

  describe("Fetch Method", () => {
    beforeEach(() => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });
    });

    test("should delegate to base transport when no policies configured", async () => {
      const result = await enhancedTransport.fetch(mockRequest);

      expect(mockBaseTransport.fetch).toHaveBeenCalledWith(
        mockRequest,
        undefined,
      );
      expect(result).toBe(mockResponse);
    });

    test("should pass abort signal to base transport", async () => {
      await enhancedTransport.fetch(mockRequest, mockAbortSignal);

      expect(mockBaseTransport.fetch).toHaveBeenCalledWith(
        mockRequest,
        mockAbortSignal,
      );
    });

    test("should handle successful request with no retries needed", async () => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig: {
          attempts: 2,
          backoff: "exponential",
          baseDelayMs: 1000,
          maxDelayMs: 5000,
          jitter: false,
          retryableStatusCodes: [429, 500],
        },
      });

      const result = await enhancedTransport.fetch(mockRequest);

      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResponse);
    });
  });

  describe("Stream Method", () => {
    beforeEach(() => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });
    });

    test("should delegate to base transport for streaming", async () => {
      const mockStream = mockStreamResponse([new Uint8Array([1, 2, 3])]);
      mockBaseTransport.stream.mockResolvedValue(mockStream);

      const result = await enhancedTransport.stream(mockRequest);

      expect(mockBaseTransport.stream).toHaveBeenCalledWith(
        mockRequest,
        undefined,
      );
      expect(result).toBe(mockStream);
    });

    test("should pass abort signal to base transport for streaming", async () => {
      await enhancedTransport.stream(mockRequest, mockAbortSignal);

      expect(mockBaseTransport.stream).toHaveBeenCalledWith(
        mockRequest,
        mockAbortSignal,
      );
    });
  });

  describe("Rate Limiting", () => {
    test("should proceed when rate limit allows request", async () => {
      const rateLimitConfig: RateLimitConfig = {
        enabled: true,
        maxRps: 10,
        scope: "provider:model",
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      const result = await enhancedTransport.fetch(mockRequest);

      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResponse);
      expect(mockDelayPromise).not.toHaveBeenCalled();
    });

    test("should wait when rate limit is exceeded", async () => {
      const rateLimitConfig: RateLimitConfig = {
        enabled: true,
        maxRps: 1, // Very low rate limit
        scope: "provider:model",
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Mock the rate limiter to return false (rate limited)
      const mockRateLimiter = {
        checkLimit: jest.fn().mockReturnValue(false),
        getStatus: jest.fn().mockReturnValue({
          scopeKey: "test-scope",
          availableTokens: 0,
          isEnabled: true,
        }),
        updateConfig: jest.fn(),
      };

      // Replace the internal rate limiter (using type assertion for testing)
      (enhancedTransport as any).rateLimiter = mockRateLimiter;

      await enhancedTransport.fetch(mockRequest);

      expect(mockDelayPromise).toHaveBeenCalledWith(1000, mockRuntimeAdapter);
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Retry Logic", () => {
    test("should retry on retryable status codes", async () => {
      const retryConfig: RetryConfig = {
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
        retryableStatusCodes: [429, 500],
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      // First call fails with 500, second succeeds
      mockBaseTransport.fetch
        .mockRejectedValueOnce(
          new TransportError("Server Error", { status: 500 }),
        )
        .mockResolvedValueOnce(mockResponse);

      const result = await enhancedTransport.fetch(mockRequest);

      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(2);
      expect(mockDelayPromise).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResponse);
    });

    test("should not retry on non-retryable status codes", async () => {
      const retryConfig: RetryConfig = {
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
        retryableStatusCodes: [429, 500],
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Mock the retry policy to return shouldRetry: false for non-retryable status
      const mockRetryPolicy = {
        shouldRetry: jest.fn().mockReturnValue({
          shouldRetry: false,
          delayMs: 0,
          reason: "Non-retryable status code",
        }),
        updateConfig: jest.fn(),
      };
      (enhancedTransport as any).retryPolicy = mockRetryPolicy;

      const error = new TransportError("Bad Request", { status: 400 });
      mockBaseTransport.fetch.mockRejectedValue(error);

      await expect(enhancedTransport.fetch(mockRequest)).rejects.toThrow(error);
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(1);
      expect(mockDelayPromise).not.toHaveBeenCalled();
    });

    test("should respect maximum retry attempts", async () => {
      const retryConfig: RetryConfig = {
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
        retryableStatusCodes: [500],
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      const error = new TransportError("Server Error", { status: 500 });
      mockBaseTransport.fetch.mockRejectedValue(error);

      await expect(enhancedTransport.fetch(mockRequest)).rejects.toThrow(error);
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(mockDelayPromise).toHaveBeenCalledTimes(2);
    });

    test("should handle abort signal during retry delay", async () => {
      const retryConfig: RetryConfig = {
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
        retryableStatusCodes: [500],
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      mockBaseTransport.fetch.mockRejectedValue(
        new TransportError("Server Error", { status: 500 }),
      );
      mockDelayPromise.mockRejectedValue(new Error("Delay was aborted"));

      await expect(
        enhancedTransport.fetch(mockRequest, mockAbortSignal),
      ).rejects.toThrow("Delay was aborted");
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Configuration Management", () => {
    beforeEach(() => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });
    });

    test("should update rate limit configuration", () => {
      const newConfig = { enabled: true, maxRps: 20 };

      expect(() =>
        enhancedTransport.updateRateLimitConfig(newConfig),
      ).not.toThrow();
    });

    test("should create rate limiter when enabling for first time", () => {
      enhancedTransport.updateRateLimitConfig({ enabled: true, maxRps: 10 });

      // Should not throw when getting status after enabling
      const context = { provider: "openai", model: "gpt-4", keyHash: "test" };
      expect(() => enhancedTransport.getRateLimitStatus(context)).not.toThrow();
    });

    test("should update retry configuration", () => {
      const newConfig = { attempts: 5, baseDelayMs: 2000 };

      expect(() =>
        enhancedTransport.updateRetryConfig(newConfig),
      ).not.toThrow();
    });
  });

  describe("Monitoring and Status", () => {
    test("should return disabled status when no rate limiter configured", () => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });

      const context = { provider: "openai", model: "gpt-4", keyHash: "test" };
      const status = enhancedTransport.getRateLimitStatus(context);

      expect(status).toEqual({
        scopeKey: "disabled",
        availableTokens: Infinity,
        isEnabled: false,
      });
    });

    test("should return initial retry statistics", () => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });

      const stats = enhancedTransport.getRetryStats();

      expect(stats).toEqual({
        totalAttempts: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageDelayMs: 0,
        maxDelayMs: 0,
      });
    });

    test("should update retry statistics after successful retry", async () => {
      const retryConfig: RetryConfig = {
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
        retryableStatusCodes: [500],
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      // First call fails, second succeeds
      mockBaseTransport.fetch
        .mockRejectedValueOnce(
          new TransportError("Server Error", { status: 500 }),
        )
        .mockResolvedValueOnce(mockResponse);

      await enhancedTransport.fetch(mockRequest);

      const stats = enhancedTransport.getRetryStats();
      expect(stats.totalAttempts).toBe(1);
      expect(stats.successfulRetries).toBe(1);
      expect(stats.failedRetries).toBe(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle non-Error objects in catch blocks", async () => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig: {
          attempts: 1,
          backoff: "exponential",
          baseDelayMs: 100,
          maxDelayMs: 1000,
          jitter: false,
          retryableStatusCodes: [500],
        },
        runtimeAdapter: mockRuntimeAdapter,
      });

      mockBaseTransport.fetch.mockRejectedValue("string error");

      await expect(enhancedTransport.fetch(mockRequest)).rejects.toThrow(
        "string error",
      );
    });

    test("should handle unknown error objects", async () => {
      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig: {
          attempts: 1,
          backoff: "exponential",
          baseDelayMs: 100,
          maxDelayMs: 1000,
          jitter: false,
          retryableStatusCodes: [500],
        },
        runtimeAdapter: mockRuntimeAdapter,
      });

      mockBaseTransport.fetch.mockRejectedValue({ unknown: "error" });

      await expect(enhancedTransport.fetch(mockRequest)).rejects.toThrow(
        "Unknown error occurred",
      );
    });

    test("should handle aborted requests", async () => {
      const abortedSignal = { ...mockAbortSignal, aborted: true };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig: {
          attempts: 2,
          backoff: "exponential",
          baseDelayMs: 100,
          maxDelayMs: 1000,
          jitter: false,
          retryableStatusCodes: [500],
        },
      });

      await expect(
        enhancedTransport.fetch(mockRequest, abortedSignal),
      ).rejects.toThrow("Request was aborted");
      expect(mockBaseTransport.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Integration Scenarios", () => {
    test("should handle rate limiting and retries together", async () => {
      const rateLimitConfig: RateLimitConfig = {
        enabled: true,
        maxRps: 10,
        scope: "provider:model",
      };

      const retryConfig: RetryConfig = {
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
        retryableStatusCodes: [429, 500],
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig,
        retryConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      // First call fails with 500, second succeeds
      mockBaseTransport.fetch
        .mockRejectedValueOnce(
          new TransportError("Server Error", { status: 500 }),
        )
        .mockResolvedValueOnce(mockResponse);

      const result = await enhancedTransport.fetch(mockRequest);

      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockResponse);
    });

    test("should handle streaming with rate limiting and retries", async () => {
      const rateLimitConfig: RateLimitConfig = {
        enabled: true,
        maxRps: 10,
        scope: "provider:model",
      };

      const retryConfig: RetryConfig = {
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
        retryableStatusCodes: [500],
      };

      enhancedTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig,
        retryConfig,
        runtimeAdapter: mockRuntimeAdapter,
      });

      const mockStream = mockStreamResponse([new Uint8Array([1, 2, 3])]);
      mockBaseTransport.stream
        .mockRejectedValueOnce(
          new TransportError("Server Error", { status: 500 }),
        )
        .mockResolvedValueOnce(mockStream);

      const result = await enhancedTransport.stream(mockRequest);

      expect(mockBaseTransport.stream).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockStream);
    });
  });
});

/**
 * Helper function to create mock async iterable
 */
function mockAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        yield Promise.resolve(item);
      }
    },
  };
}

function mockStreamResponse<T>(items: T[]): StreamResponse {
  return {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "text/event-stream" },
    stream: mockAsyncIterable(items) as AsyncIterable<Uint8Array>,
  };
}
