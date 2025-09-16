/**
 * Provider HTTP Request Interface Tests
 *
 * Tests for the ProviderHttpRequest interface to ensure proper
 * type compatibility and structure validation.
 */
import type { ProviderHttpRequest } from "../providerHttpRequest.js";
import type { HttpMethod } from "../httpMethod.js";

describe("ProviderHttpRequest", () => {
  it("should accept minimal valid request", () => {
    const request: ProviderHttpRequest = {
      url: "https://api.openai.com/v1/responses",
      method: "POST",
    };

    expect(request.url).toBe("https://api.openai.com/v1/responses");
    expect(request.method).toBe("POST");
    expect(request.headers).toBeUndefined();
    expect(request.body).toBeUndefined();
    expect(request.signal).toBeUndefined();
  });

  it("should accept request with all properties", () => {
    const controller = new AbortController();
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ model: "gpt-4" });

    const request: ProviderHttpRequest = {
      url: "https://api.openai.com/v1/responses",
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    };

    expect(request.url).toBe("https://api.openai.com/v1/responses");
    expect(request.method).toBe("POST");
    expect(request.headers).toBe(headers);
    expect(request.body).toBe(body);
    expect(request.signal).toBe(controller.signal);
  });

  it("should accept binary body", () => {
    const binaryBody = new Uint8Array([1, 2, 3, 4]);

    const request: ProviderHttpRequest = {
      url: "https://api.example.com/upload",
      method: "PUT",
      body: binaryBody,
    };

    expect(request.body).toBe(binaryBody);
    expect(request.body).toBeInstanceOf(Uint8Array);
  });

  it("should support all HTTP methods", () => {
    const methods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

    methods.forEach((method) => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/endpoint",
        method,
      };

      expect(request.method).toBe(method);
    });
  });

  it("should support various URL formats", () => {
    const urls = [
      "https://api.openai.com/v1/responses",
      "https://api.anthropic.com/v1/messages",
      "http://localhost:3000/api/test",
      "https://api.example.com:8080/v2/models",
    ];

    urls.forEach((url) => {
      const request: ProviderHttpRequest = {
        url,
        method: "GET",
      };

      expect(request.url).toBe(url);
    });
  });

  it("should support common headers", () => {
    const request: ProviderHttpRequest = {
      url: "https://api.example.com/test",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token123",
        "User-Agent": "llm-bridge/1.0.0",
        "X-Custom-Header": "custom-value",
      },
    };

    expect(request.headers).toHaveProperty("Content-Type", "application/json");
    expect(request.headers).toHaveProperty("Authorization", "Bearer token123");
    expect(request.headers).toHaveProperty("User-Agent", "llm-bridge/1.0.0");
    expect(request.headers).toHaveProperty("X-Custom-Header", "custom-value");
  });
});
