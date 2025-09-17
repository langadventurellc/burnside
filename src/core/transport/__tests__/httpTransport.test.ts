/**
 * HTTP Transport Tests
 *
 * Comprehensive test suite for the HttpTransport class covering all methods,
 * error scenarios, streaming functionality, and integration points.
 */
import { HttpTransport } from "../httpTransport";
import { InterceptorChain } from "../interceptorChain";
import { HttpErrorNormalizer } from "../../errors/httpErrorNormalizer";
import { TransportError } from "../../errors/transportError";
import type { HttpClientConfig } from "../httpClientConfig";
import type { ProviderHttpRequest } from "../providerHttpRequest";
import type { FetchFunction } from "../fetchFunction";

describe("HttpTransport", () => {
  let mockFetch: jest.MockedFunction<FetchFunction>;
  let mockInterceptorChain: jest.Mocked<InterceptorChain>;
  let mockErrorNormalizer: jest.Mocked<HttpErrorNormalizer>;
  let httpTransport: HttpTransport;
  let config: HttpClientConfig;

  beforeEach(() => {
    // Create mock fetch function
    mockFetch = jest.fn();

    // Create mock interceptor chain
    mockInterceptorChain = {
      executeRequest: jest.fn(),
      executeResponse: jest.fn(),
      addRequestInterceptor: jest.fn(),
      addResponseInterceptor: jest.fn(),
    } as unknown as jest.Mocked<InterceptorChain>;

    // Create mock error normalizer
    mockErrorNormalizer = {
      normalize: jest.fn(),
    } as unknown as jest.Mocked<HttpErrorNormalizer>;

    // Create configuration
    config = {
      fetch: mockFetch,
      requestInterceptors: [],
      responseInterceptors: [],
    };

    // Create HttpTransport instance
    httpTransport = new HttpTransport(
      config,
      mockInterceptorChain,
      mockErrorNormalizer,
    );
  });

  describe("constructor", () => {
    it("should create HttpTransport instance with required dependencies", () => {
      expect(httpTransport).toBeInstanceOf(HttpTransport);
    });
  });

  describe("fetch", () => {
    const mockRequest: ProviderHttpRequest = {
      url: "https://api.example.com/v1/chat",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" }),
    };

    it("should successfully execute HTTP request with interceptors", async () => {
      // Mock successful response
      const mockResponse = new Response(JSON.stringify({ result: "success" }), {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
      });

      mockFetch.mockResolvedValue(mockResponse);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });
      mockInterceptorChain.executeResponse.mockResolvedValue({
        request: mockRequest,
        response: {
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
          body: mockResponse.body,
        },
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      const result = await httpTransport.fetch(mockRequest);

      expect(result.status).toBe(200);
      expect(result.statusText).toBe("OK");
      expect(mockInterceptorChain.executeRequest).toHaveBeenCalled();
      expect(mockInterceptorChain.executeResponse).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        mockRequest.url,
        expect.objectContaining({
          method: mockRequest.method,
          headers: mockRequest.headers,
          body: mockRequest.body,
        }),
      );
    });

    it("should handle AbortSignal cancellation", async () => {
      const controller = new AbortController();
      controller.abort();

      mockInterceptorChain.executeRequest.mockRejectedValue(
        new Error("Request aborted"),
      );

      await expect(
        httpTransport.fetch(mockRequest, controller.signal),
      ).rejects.toThrow(TransportError);
    });

    it("should handle Response errors", async () => {
      const errorResponse = new Response("Not Found", {
        status: 404,
        statusText: "Not Found",
      });

      mockFetch.mockRejectedValue(errorResponse);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      await expect(httpTransport.fetch(mockRequest)).rejects.toThrow(
        TransportError,
      );
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Connection failed");

      mockFetch.mockRejectedValue(networkError);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      await expect(httpTransport.fetch(mockRequest)).rejects.toThrow(
        TransportError,
      );
    });

    it("should handle unknown errors", async () => {
      const unknownError = "Unknown error";

      mockFetch.mockRejectedValue(unknownError);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      await expect(httpTransport.fetch(mockRequest)).rejects.toThrow(
        TransportError,
      );
    });
  });

  describe("stream", () => {
    const mockStreamRequest: ProviderHttpRequest = {
      url: "https://api.example.com/v1/stream",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ stream: true }),
    };

    it("should handle SSE streaming", async () => {
      // Mock SSE response
      const sseData = 'data: {"content": "Hello"}\n\ndata: [DONE]\n\n';
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });

      const mockResponse = new Response(mockStream, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      });

      mockFetch.mockResolvedValue(mockResponse);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockStreamRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      const stream = await httpTransport.stream(mockStreamRequest);
      expect(stream).toBeDefined();

      // Consume stream
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it("should handle JSON streaming", async () => {
      // Mock JSON stream response
      const jsonData =
        '{"type": "start"}\n{"type": "data", "content": "Hello"}\n';
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(jsonData));
          controller.close();
        },
      });

      const mockResponse = new Response(mockStream, {
        status: 200,
        headers: { "content-type": "application/x-ndjson" },
      });

      mockFetch.mockResolvedValue(mockResponse);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockStreamRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      const stream = await httpTransport.stream(mockStreamRequest);
      expect(stream).toBeDefined();
    });

    it("should handle raw streaming for unknown content types", async () => {
      const rawData = "Raw streaming data";
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(rawData));
          controller.close();
        },
      });

      const mockResponse = new Response(mockStream, {
        status: 200,
        headers: { "content-type": "text/plain" },
      });

      mockFetch.mockResolvedValue(mockResponse);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockStreamRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      const stream = await httpTransport.stream(mockStreamRequest);
      expect(stream).toBeDefined();
    });

    it("should handle HTTP errors in streaming", async () => {
      const mockResponse = new Response("Server Error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      mockFetch.mockResolvedValue(mockResponse);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockStreamRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      await expect(httpTransport.stream(mockStreamRequest)).rejects.toThrow(
        TransportError,
      );
    });

    it("should handle empty response body", async () => {
      const mockResponse = new Response(null, {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/event-stream" },
      });

      mockFetch.mockResolvedValue(mockResponse);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockStreamRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      await expect(httpTransport.stream(mockStreamRequest)).rejects.toThrow(
        TransportError,
      );
    });

    it("should handle stream cancellation", async () => {
      const controller = new AbortController();

      mockInterceptorChain.executeRequest.mockRejectedValue(
        new Error("Stream was aborted"),
      );

      controller.abort();

      await expect(
        httpTransport.stream(mockStreamRequest, controller.signal),
      ).rejects.toThrow(TransportError);
    });
  });

  describe("interceptor context creation", () => {
    it("should create proper interceptor context", async () => {
      const mockRequest: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
      };

      const mockResponse = new Response("OK", { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      mockInterceptorChain.executeRequest.mockImplementation((context) => {
        expect(context.request).toBe(mockRequest);
        expect(context.metadata).toBeDefined();
        expect(context.metadata.timestamp).toBeInstanceOf(Date);
        expect(context.metadata.requestId).toBeDefined();
        return Promise.resolve(context);
      });

      mockInterceptorChain.executeResponse.mockResolvedValue({
        request: mockRequest,
        response: {
          status: 200,
          statusText: "OK",
          headers: {},
          body: mockResponse.body,
        },
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      await httpTransport.fetch(mockRequest);

      expect(mockInterceptorChain.executeRequest).toHaveBeenCalled();
    });

    it("should include AbortSignal in context when provided", async () => {
      const mockRequest: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
      };

      const controller = new AbortController();
      const mockResponse = new Response("OK", { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      mockInterceptorChain.executeRequest.mockImplementation((context) => {
        expect(context.abortSignal).toBe(controller.signal);
        return Promise.resolve(context);
      });

      mockInterceptorChain.executeResponse.mockResolvedValue({
        request: mockRequest,
        response: {
          status: 200,
          statusText: "OK",
          headers: {},
          body: mockResponse.body,
        },
        metadata: { timestamp: new Date(), requestId: "req_123" },
        abortSignal: controller.signal,
      });

      await httpTransport.fetch(mockRequest, controller.signal);
    });
  });

  describe("fetch response conversion", () => {
    it("should correctly convert fetch Response to ProviderHttpResponse", async () => {
      const mockRequest: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        headers: { Authorization: "Bearer token" },
      };

      const responseHeaders = new Headers({
        "content-type": "application/json",
        "x-custom-header": "custom-value",
      });

      const mockResponse = new Response(JSON.stringify({ data: "test" }), {
        status: 201,
        statusText: "Created",
        headers: responseHeaders,
      });

      mockFetch.mockResolvedValue(mockResponse);
      mockInterceptorChain.executeRequest.mockResolvedValue({
        request: mockRequest,
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      mockInterceptorChain.executeResponse.mockResolvedValue({
        request: mockRequest,
        response: {
          status: 201,
          statusText: "Created",
          headers: {
            "content-type": "application/json",
            "x-custom-header": "custom-value",
          },
          body: mockResponse.body,
        },
        metadata: { timestamp: new Date(), requestId: "req_123" },
      });

      const result = await httpTransport.fetch(mockRequest);

      expect(result.status).toBe(201);
      expect(result.statusText).toBe("Created");
      expect(result.headers["content-type"]).toBe("application/json");
      expect(result.headers["x-custom-header"]).toBe("custom-value");
      expect(result.body).toBeDefined();
    });
  });
});
