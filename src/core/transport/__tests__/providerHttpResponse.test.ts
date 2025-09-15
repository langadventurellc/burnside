/**
 * Provider HTTP Response Interface Tests
 *
 * Tests for the ProviderHttpResponse interface to ensure proper
 * type compatibility and structure validation.
 */
import type { ProviderHttpResponse } from "../providerHttpResponse.js";

describe("ProviderHttpResponse", () => {
  it("should accept response with null body", () => {
    const response: ProviderHttpResponse = {
      status: 204,
      statusText: "No Content",
      headers: {},
      body: null,
    };

    expect(response.status).toBe(204);
    expect(response.statusText).toBe("No Content");
    expect(response.headers).toEqual({});
    expect(response.body).toBeNull();
  });

  it("should accept response with ReadableStream body", () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([65, 66, 67])); // "ABC"
        controller.close();
      },
    });

    const response: ProviderHttpResponse = {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: stream,
    };

    expect(response.status).toBe(200);
    expect(response.statusText).toBe("OK");
    expect(response.headers).toHaveProperty("content-type", "application/json");
    expect(response.body).toBe(stream);
    expect(response.body).toBeInstanceOf(ReadableStream);
  });

  it("should support common HTTP status codes", () => {
    const statusCodes = [
      { code: 200, text: "OK" },
      { code: 201, text: "Created" },
      { code: 400, text: "Bad Request" },
      { code: 401, text: "Unauthorized" },
      { code: 404, text: "Not Found" },
      { code: 429, text: "Too Many Requests" },
      { code: 500, text: "Internal Server Error" },
    ];

    statusCodes.forEach(({ code, text }) => {
      const response: ProviderHttpResponse = {
        status: code,
        statusText: text,
        headers: {},
        body: null,
      };

      expect(response.status).toBe(code);
      expect(response.statusText).toBe(text);
    });
  });

  it("should support various response headers", () => {
    const response: ProviderHttpResponse = {
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json",
        "content-length": "1234",
        "cache-control": "no-cache",
        "x-ratelimit-remaining": "99",
        "x-ratelimit-reset": "1640995200",
      },
      body: null,
    };

    expect(response.headers).toHaveProperty("content-type", "application/json");
    expect(response.headers).toHaveProperty("content-length", "1234");
    expect(response.headers).toHaveProperty("cache-control", "no-cache");
    expect(response.headers).toHaveProperty("x-ratelimit-remaining", "99");
    expect(response.headers).toHaveProperty("x-ratelimit-reset", "1640995200");
  });

  it("should handle empty headers object", () => {
    const response: ProviderHttpResponse = {
      status: 200,
      statusText: "OK",
      headers: {},
      body: null,
    };

    expect(response.headers).toEqual({});
    expect(Object.keys(response.headers)).toHaveLength(0);
  });

  it("should support error responses", () => {
    const errorResponse: ProviderHttpResponse = {
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        "retry-after": "60",
        "x-ratelimit-remaining": "0",
      },
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          const errorData = JSON.stringify({
            error: { message: "Rate limit exceeded" },
          });
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        },
      }),
    };

    expect(errorResponse.status).toBe(429);
    expect(errorResponse.statusText).toBe("Too Many Requests");
    expect(errorResponse.headers).toHaveProperty("retry-after", "60");
    expect(errorResponse.body).toBeInstanceOf(ReadableStream);
  });
});
