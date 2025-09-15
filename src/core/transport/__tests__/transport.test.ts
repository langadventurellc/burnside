/**
 * Transport Interface Tests
 *
 * Tests for the Transport interface to ensure proper contract
 * compliance and method signature validation.
 */
import type { Transport } from "../transport.js";
import type { ProviderHttpRequest } from "../providerHttpRequest.js";
import type { ProviderHttpResponse } from "../providerHttpResponse.js";

describe("Transport", () => {
  // Mock implementation for testing interface compliance
  class MockTransport implements Transport {
    fetch(
      _request: ProviderHttpRequest,
      _signal?: AbortSignal,
    ): Promise<ProviderHttpResponse> {
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"success": true}'));
            controller.close();
          },
        }),
      });
    }

    stream(
      _request: ProviderHttpRequest,
      _signal?: AbortSignal,
    ): Promise<AsyncIterable<Uint8Array>> {
      // Return a simple async iterable
      const asyncIterable: AsyncIterable<Uint8Array> = {
        [Symbol.asyncIterator]() {
          let index = 0;
          const chunks = [
            new Uint8Array([65, 66, 67]), // "ABC"
            new Uint8Array([68, 69, 70]), // "DEF"
          ];

          return {
            next() {
              if (index < chunks.length) {
                return Promise.resolve({ value: chunks[index++], done: false });
              }
              return Promise.resolve({ value: undefined, done: true });
            },
          };
        },
      };

      return Promise.resolve(asyncIterable);
    }
  }

  let transport: Transport;

  beforeEach(() => {
    transport = new MockTransport();
  });

  describe("fetch method", () => {
    it("should accept ProviderHttpRequest and return ProviderHttpResponse", async () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
      };

      const response = await transport.fetch(request);

      expect(response.status).toBe(200);
      expect(response.statusText).toBe("OK");
      expect(response.headers).toHaveProperty(
        "content-type",
        "application/json",
      );
      expect(response.body).toBeInstanceOf(ReadableStream);
    });

    it("should accept optional AbortSignal", async () => {
      const controller = new AbortController();
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
      };

      // Should not throw when AbortSignal is provided
      const response = await transport.fetch(request, controller.signal);
      expect(response).toBeDefined();
    });

    it("should work without AbortSignal", async () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "PUT",
      };

      // Should not throw when AbortSignal is omitted
      const response = await transport.fetch(request);
      expect(response).toBeDefined();
    });
  });

  describe("stream method", () => {
    it("should accept ProviderHttpRequest and return AsyncIterable", async () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/stream",
        method: "POST",
        headers: { accept: "text/event-stream" },
      };

      const stream = await transport.stream(request);
      expect(stream).toBeDefined();

      // Verify it's actually iterable
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(new Uint8Array([65, 66, 67]));
      expect(chunks[1]).toEqual(new Uint8Array([68, 69, 70]));
    });

    it("should accept optional AbortSignal", async () => {
      const controller = new AbortController();
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/stream",
        method: "POST",
      };

      // Should not throw when AbortSignal is provided
      const stream = await transport.stream(request, controller.signal);
      expect(stream).toBeDefined();
    });

    it("should work without AbortSignal", async () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/stream",
        method: "POST",
      };

      // Should not throw when AbortSignal is omitted
      const stream = await transport.stream(request);
      expect(stream).toBeDefined();
    });
  });

  describe("interface compliance", () => {
    it("should implement both fetch and stream methods", () => {
      expect(typeof transport.fetch).toBe("function");
      expect(typeof transport.stream).toBe("function");
    });

    it("should return promises from both methods", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
      };

      const fetchResult = transport.fetch(request);
      const streamResult = transport.stream(request);

      expect(fetchResult).toBeInstanceOf(Promise);
      expect(streamResult).toBeInstanceOf(Promise);
    });
  });
});
