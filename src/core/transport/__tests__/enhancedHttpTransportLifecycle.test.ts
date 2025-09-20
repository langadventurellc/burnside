/**
 * Enhanced HTTP Transport Lifecycle Tests
 *
 * Tests focused on validating that EnhancedHttpTransport operates as a
 * fire-and-forget service without requiring manual lifecycle management.
 * These tests ensure no memory leaks, no open handles, and proper resource
 * cleanup with the timer-free design.
 */

import { EnhancedHttpTransport } from "../enhancedHttpTransport";
import type { Transport } from "../transport";
import type { ProviderHttpRequest } from "../providerHttpRequest";
import type { ProviderHttpResponse } from "../providerHttpResponse";
import type { StreamResponse } from "../streamResponse";
import type { RateLimitConfig } from "../rateLimiting/rateLimitConfig";
import type { RetryConfig } from "../retry/retryConfig";

describe("EnhancedHttpTransport Lifecycle", () => {
  let mockBaseTransport: jest.Mocked<Transport>;
  let mockRequest: ProviderHttpRequest;
  let mockResponse: ProviderHttpResponse;

  beforeEach(() => {
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

    mockBaseTransport.fetch.mockResolvedValue(mockResponse);
    mockBaseTransport.stream.mockResolvedValue(mockStreamResponse([]));

    jest.clearAllMocks();
  });

  describe("Fire-and-Forget Behavior", () => {
    test("should work without manual lifecycle management", async () => {
      // Create multiple instances without cleanup
      const transport1 = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });

      const transport2 = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig: { enabled: true, maxRps: 10, scope: "global" },
      });

      const transport3 = new EnhancedHttpTransport({
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

      // Use them without cleanup
      await transport1.fetch(mockRequest);
      await transport2.fetch(mockRequest);
      await transport3.fetch(mockRequest);

      // No cleanup needed - should not leak resources
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(3);
    });

    test("should handle multiple instances concurrently", async () => {
      const transports = Array.from(
        { length: 10 },
        () =>
          new EnhancedHttpTransport({
            baseTransport: mockBaseTransport,
            rateLimitConfig: {
              enabled: true,
              maxRps: 5,
              scope: "provider:model",
            },
          }),
      );

      // Execute requests concurrently across all instances
      const requests = transports.map((transport) =>
        transport.fetch(mockRequest),
      );

      const results = await Promise.all(requests);

      // All requests should succeed
      expect(results).toHaveLength(10);
      results.forEach((result) => expect(result).toBe(mockResponse));
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(10);
    });

    test("should handle rapid creation and usage of transport instances", async () => {
      const iterations = 50;
      const results: ProviderHttpResponse[] = [];

      for (let i = 0; i < iterations; i++) {
        // Create, use, and immediately discard transport
        const transport = new EnhancedHttpTransport({
          baseTransport: mockBaseTransport,
          rateLimitConfig: {
            enabled: true,
            maxRps: 100,
            scope: "provider:model:key",
          },
        });

        const result = await transport.fetch(mockRequest);
        results.push(result);

        // Transport goes out of scope here - no manual cleanup needed
      }

      expect(results).toHaveLength(iterations);
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(iterations);
    });
  });

  describe("No Destroy Method Required", () => {
    test("should not have destroy method", () => {
      const transport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });

      // Verify destroy method does not exist
      expect((transport as any).destroy).toBeUndefined();
      expect(typeof (transport as any).destroy).toBe("undefined");
    });

    test("should not require cleanup for rate limited instances", async () => {
      const rateLimitConfig: RateLimitConfig = {
        enabled: true,
        maxRps: 10,
        scope: "provider:model",
      };

      const transport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig,
      });

      // Use multiple times
      await transport.fetch(mockRequest);
      await transport.fetch(mockRequest);
      await transport.fetch(mockRequest);

      // No cleanup required - internal RateLimiter manages itself
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(3);
    });

    test("should not require cleanup for retry-enabled instances", async () => {
      const retryConfig: RetryConfig = {
        attempts: 3,
        backoff: "exponential",
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitter: false,
        retryableStatusCodes: [500],
      };

      const transport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        retryConfig,
      });

      await transport.fetch(mockRequest);

      // No cleanup required - RetryPolicy manages itself
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Self-Managing Resource Behavior", () => {
    test("should handle configuration updates without lifecycle concerns", () => {
      const transport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
      });

      // Update configurations multiple times
      transport.updateRateLimitConfig({ enabled: true, maxRps: 10 });
      transport.updateRateLimitConfig({ maxRps: 20 });
      transport.updateRetryConfig({ attempts: 5 });
      transport.updateRetryConfig({ baseDelayMs: 2000 });

      // No cleanup needed after configuration changes
      expect(() =>
        transport.getRateLimitStatus({
          provider: "test",
          model: "test",
          keyHash: "test",
        }),
      ).not.toThrow();
    });

    test("should handle streaming operations without lifecycle management", async () => {
      const transport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig: { enabled: true, maxRps: 10, scope: "global" },
      });

      const mockStream = mockStreamResponse([
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
      ]);
      mockBaseTransport.stream.mockResolvedValue(mockStream);

      const streamResponse = await transport.stream(mockRequest);

      // Consume stream
      const chunks = [];
      for await (const chunk of streamResponse.stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(mockBaseTransport.stream).toHaveBeenCalledTimes(1);

      // No cleanup needed after streaming
    });

    test("should maintain independence between transport instances", async () => {
      const transport1 = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig: { enabled: true, maxRps: 5, scope: "provider" },
      });

      const transport2 = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig: { enabled: true, maxRps: 10, scope: "provider:model" },
      });

      // Get status from both - they should be independent
      const status1 = transport1.getRateLimitStatus({
        provider: "test",
        model: "test",
        keyHash: "test",
      });
      const status2 = transport2.getRateLimitStatus({
        provider: "test",
        model: "test",
        keyHash: "test",
      });

      expect(status1.scopeKey).toBe("test");
      expect(status2.scopeKey).toBe("test:test");

      // Both should work independently
      await transport1.fetch(mockRequest);
      await transport2.fetch(mockRequest);

      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Memory Stability", () => {
    test("should not accumulate state across multiple instances", () => {
      const instances = Array.from(
        { length: 100 },
        () =>
          new EnhancedHttpTransport({
            baseTransport: mockBaseTransport,
            rateLimitConfig: {
              enabled: true,
              maxRps: 10,
              scope: "provider:model:key",
            },
          }),
      );

      // Get stats from all instances
      const allStats = instances.map((transport) => transport.getRetryStats());

      // All should have fresh, isolated state
      allStats.forEach((stats) => {
        expect(stats.totalAttempts).toBe(0);
        expect(stats.successfulRetries).toBe(0);
        expect(stats.failedRetries).toBe(0);
      });
    });

    test("should handle instance disposal gracefully", async () => {
      let transport: EnhancedHttpTransport | null = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig: { enabled: true, maxRps: 10, scope: "global" },
      });

      // Use the transport
      await transport.fetch(mockRequest);
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(1);

      // Simulate disposal by removing reference
      transport = null;

      // Create new instance with same scope - should work independently
      const newTransport = new EnhancedHttpTransport({
        baseTransport: mockBaseTransport,
        rateLimitConfig: { enabled: true, maxRps: 10, scope: "global" },
      });

      await newTransport.fetch(mockRequest);
      expect(mockBaseTransport.fetch).toHaveBeenCalledTimes(2);
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
