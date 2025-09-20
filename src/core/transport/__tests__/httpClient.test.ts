/**
 * HTTP Client Interface Tests
 *
 * Tests for the HttpClient interface and related configuration types
 * to ensure proper structure and fetch injection capabilities.
 */
import type { HttpClient } from "../httpClient";
import type { HttpClientConfig } from "../httpClientConfig";
import type { FetchFunction } from "../fetchFunction";
import type { RequestInterceptor } from "../requestInterceptor";
import type { ResponseInterceptor } from "../responseInterceptor";
import type { ProviderHttpRequest } from "../providerHttpRequest";
import type { ProviderHttpResponse } from "../providerHttpResponse";
import type { StreamResponse } from "../streamResponse";

describe("HttpClient", () => {
  const mockFetch: FetchFunction = () => {
    return Promise.resolve(new Response("test", { status: 200 }));
  };

  const mockRequestInterceptor: RequestInterceptor = (request) => {
    return Promise.resolve({
      ...request,
      headers: { ...request.headers, "x-intercepted": "true" },
    });
  };

  const mockResponseInterceptor: ResponseInterceptor = (response) => {
    return Promise.resolve({
      ...response,
      headers: { ...response.headers, "x-processed": "true" },
    });
  };

  // Mock implementation for testing interface compliance
  class MockHttpClient implements HttpClient {
    constructor(public readonly config: HttpClientConfig) {}

    fetch(
      _request: ProviderHttpRequest,
      _signal?: AbortSignal,
    ): Promise<ProviderHttpResponse> {
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        headers: {},
        body: null,
      });
    }

    stream(
      _request: ProviderHttpRequest,
      _signal?: AbortSignal,
    ): Promise<StreamResponse> {
      const asyncIterable: AsyncIterable<Uint8Array> = {
        [Symbol.asyncIterator]() {
          return {
            next() {
              return Promise.resolve({ value: undefined, done: true });
            },
          };
        },
      };

      const streamResponse: StreamResponse = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/event-stream" },
        stream: asyncIterable,
      };

      return Promise.resolve(streamResponse);
    }
  }

  describe("HttpClientConfig", () => {
    it("should accept minimal configuration with just fetch", () => {
      const config: HttpClientConfig = {
        fetch: mockFetch,
      };

      expect(config.fetch).toBe(mockFetch);
      expect(config.requestInterceptors).toBeUndefined();
      expect(config.responseInterceptors).toBeUndefined();
    });

    it("should accept full configuration with interceptors", () => {
      const config: HttpClientConfig = {
        fetch: mockFetch,
        requestInterceptors: [mockRequestInterceptor],
        responseInterceptors: [mockResponseInterceptor],
      };

      expect(config.fetch).toBe(mockFetch);
      expect(config.requestInterceptors).toHaveLength(1);
      expect(config.responseInterceptors).toHaveLength(1);
      expect(config.requestInterceptors?.[0]).toBe(mockRequestInterceptor);
      expect(config.responseInterceptors?.[0]).toBe(mockResponseInterceptor);
    });

    it("should accept multiple interceptors", () => {
      const secondRequestInterceptor: RequestInterceptor = (request) =>
        Promise.resolve(request);
      const secondResponseInterceptor: ResponseInterceptor = (response) =>
        Promise.resolve(response);

      const config: HttpClientConfig = {
        fetch: mockFetch,
        requestInterceptors: [mockRequestInterceptor, secondRequestInterceptor],
        responseInterceptors: [
          mockResponseInterceptor,
          secondResponseInterceptor,
        ],
      };

      expect(config.requestInterceptors).toHaveLength(2);
      expect(config.responseInterceptors).toHaveLength(2);
    });
  });

  describe("HttpClient interface", () => {
    let client: HttpClient;
    let config: HttpClientConfig;

    beforeEach(() => {
      config = { fetch: mockFetch };
      client = new MockHttpClient(config);
    });

    it("should implement Transport interface", () => {
      expect(typeof client.fetch).toBe("function");
      expect(typeof client.stream).toBe("function");
    });

    it("should expose readonly config property", () => {
      expect(client.config).toBe(config);
      expect(client.config.fetch).toBe(mockFetch);
    });

    it("should support fetch method from Transport", async () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
      };

      const response = await client.fetch(request);
      expect(response.status).toBe(200);
    });

    it("should support stream method from Transport", async () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/stream",
        method: "POST",
      };

      const streamResponse = await client.stream(request);
      expect(streamResponse).toBeDefined();
      expect(streamResponse.status).toBeDefined();
      expect(streamResponse.stream).toBeDefined();
      expect(typeof streamResponse.stream[Symbol.asyncIterator]).toBe(
        "function",
      );
    });
  });

  describe("FetchFunction type", () => {
    it("should be compatible with standard fetch signature", () => {
      const standardFetch: FetchFunction = globalThis.fetch;
      expect(typeof standardFetch).toBe("function");
    });

    it("should accept URL string input", async () => {
      const fetchFn: FetchFunction = () => Promise.resolve(new Response());
      const result = await fetchFn("https://example.com");
      expect(result).toBeInstanceOf(Response);
    });

    it("should accept URL object input", async () => {
      const fetchFn: FetchFunction = () => Promise.resolve(new Response());
      const url = new URL("https://example.com");
      const result = await fetchFn(url);
      expect(result).toBeInstanceOf(Response);
    });

    it("should accept RequestInit options", async () => {
      const fetchFn: FetchFunction = () => Promise.resolve(new Response());
      const init: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      };
      const result = await fetchFn("https://example.com", init);
      expect(result).toBeInstanceOf(Response);
    });
  });

  describe("Interceptor types", () => {
    it("should accept and return ProviderHttpRequest in RequestInterceptor", async () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
      };

      const result = await mockRequestInterceptor(request);
      expect(result.url).toBe(request.url);
      expect(result.method).toBe(request.method);
      expect(result.headers).toHaveProperty("x-intercepted", "true");
    });

    it("should accept and return ProviderHttpResponse in ResponseInterceptor", async () => {
      const response: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: null,
      };

      const result = await mockResponseInterceptor(response);
      expect(result.status).toBe(response.status);
      expect(result.statusText).toBe(response.statusText);
      expect(result.headers).toHaveProperty("x-processed", "true");
    });
  });
});
