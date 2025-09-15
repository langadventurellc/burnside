/**
 * OpenAI Provider Plugin Tests
 *
 * Unit tests for the main OpenAI Responses v1 provider plugin implementation.
 */

import { OpenAIResponsesV1Provider } from "../index.js";
import type { StreamDelta } from "../../../client/streamDelta.js";
import { BridgeError } from "../../../core/errors/bridgeError.js";

describe("OpenAIResponsesV1Provider", () => {
  let provider: OpenAIResponsesV1Provider;

  beforeEach(() => {
    provider = new OpenAIResponsesV1Provider();
  });

  describe("metadata", () => {
    it("should have correct provider metadata", () => {
      expect(provider.id).toBe("openai");
      expect(provider.name).toBe("OpenAI Responses Provider");
      expect(provider.version).toBe("responses-v1");
    });
  });

  describe("initialize", () => {
    it("should initialize with valid configuration", async () => {
      const config = {
        apiKey: "sk-test123",
      };

      await expect(provider.initialize(config)).resolves.toBeUndefined();
    });

    it("should initialize with complete configuration", async () => {
      const config = {
        apiKey: "sk-test123",
        baseUrl: "https://custom-api.example.com/v1",
        organization: "org-123",
        project: "proj-456",
        timeout: 30000,
        headers: {
          "X-Custom-Header": "custom-value",
        },
      };

      await expect(provider.initialize(config)).resolves.toBeUndefined();
    });

    it("should throw BridgeError for missing apiKey", async () => {
      const config = {};

      try {
        await provider.initialize(config);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
      }
    });

    it("should throw BridgeError for empty apiKey", async () => {
      const config = {
        apiKey: "",
      };

      try {
        await provider.initialize(config);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
      }
    });

    it("should throw BridgeError for invalid baseUrl", async () => {
      const config = {
        apiKey: "sk-test123",
        baseUrl: "not-a-url",
      };

      try {
        await provider.initialize(config);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
      }
    });

    it("should throw BridgeError with correct error code", async () => {
      const config = {};

      try {
        await provider.initialize(config);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("INVALID_CONFIG");
        expect(bridgeError.context?.originalError).toBeDefined();
      }
    });
  });

  describe("supportsModel", () => {
    it("should support gpt-4o-2024-08-06", () => {
      expect(provider.supportsModel("gpt-4o-2024-08-06")).toBe(true);
    });

    it("should support gpt-5-2025-08-07", () => {
      expect(provider.supportsModel("gpt-5-2025-08-07")).toBe(true);
    });

    it("should not support unsupported models", () => {
      expect(provider.supportsModel("gpt-3.5-turbo")).toBe(false);
      expect(provider.supportsModel("claude-3")).toBe(false);
      expect(provider.supportsModel("non-existent-model")).toBe(false);
    });

    it("should handle empty string", () => {
      expect(provider.supportsModel("")).toBe(false);
    });

    it("should be case sensitive", () => {
      expect(provider.supportsModel("GPT-4O-2024-08-06")).toBe(false);
    });
  });

  describe("translateRequest", () => {
    it("should throw NOT_INITIALIZED when provider is not initialized", () => {
      const uninitializedProvider = new OpenAIResponsesV1Provider();
      const request = {
        messages: [
          {
            role: "user" as const,
            content: [{ type: "text" as const, text: "Hello" }],
          },
        ],
        model: "gpt-4o-2024-08-06",
      };

      expect(() => uninitializedProvider.translateRequest(request)).toThrow(
        BridgeError,
      );
      expect(() => uninitializedProvider.translateRequest(request)).toThrow(
        "Provider not initialized",
      );

      try {
        uninitializedProvider.translateRequest(request);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("NOT_INITIALIZED");
        expect(bridgeError.context?.method).toBe("translateRequest");
      }
    });

    it("should successfully translate request when initialized", async () => {
      await provider.initialize({
        apiKey: "sk-test-key",
        baseUrl: "https://api.openai.com/v1",
      });

      const request = {
        messages: [
          {
            role: "user" as const,
            content: [{ type: "text" as const, text: "Hello" }],
          },
        ],
        model: "gpt-4o-2024-08-06",
      };

      const result = provider.translateRequest(request);

      expect(result.url).toBe("https://api.openai.com/v1/responses");
      expect(result.method).toBe("POST");
      expect(result.headers?.Authorization).toBe("Bearer sk-test-key");
      expect(result.body).toBeDefined();
    });
  });

  describe("parseResponse implementation", () => {
    it("should throw ValidationError for null response body", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: null,
      };

      const parsePromise = provider.parseResponse(mockResponse, false);
      await expect(parsePromise).rejects.toThrow("Response body is null");
    });

    it("should return AsyncIterable for streaming responses", () => {
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: {"type":"response.output_text.delta","delta":{"text":"Hello"}}\n\n',
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: mockStream,
      };

      const result = provider.parseResponse(mockResponse, true);
      expect(result).toBeDefined();

      // Type assertion to confirm it's an AsyncIterable
      const asyncIterable = result as AsyncIterable<StreamDelta>;
      expect(typeof asyncIterable[Symbol.asyncIterator]).toBe("function");
    });
  });

  describe("placeholder implementations", () => {
    it("should throw NOT_IMPLEMENTED for isTerminal", () => {
      const mockDelta = {
        id: "chunk-123",
        delta: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        finished: false,
        usage: undefined,
        metadata: {},
      };

      expect(() => provider.isTerminal(mockDelta)).toThrow(BridgeError);
      expect(() => provider.isTerminal(mockDelta)).toThrow(
        "Termination detection not implemented",
      );

      try {
        provider.isTerminal(mockDelta);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("NOT_IMPLEMENTED");
        expect(bridgeError.context?.method).toBe("isTerminal");
      }
    });

    it("should normalize OpenAI HTTP errors correctly", () => {
      const httpError = {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
      };

      const result = provider.normalizeError(httpError);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toContain("Authentication failed");
    });

    it("should normalize OpenAI API errors correctly", () => {
      const openaiError = {
        error: {
          message: "Invalid API key",
          type: "authentication_error",
          code: "invalid_api_key",
        },
      };

      const result = provider.normalizeError(openaiError);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe("Invalid API key");
    });

    it("should handle error normalization failures gracefully", () => {
      // Create an error that might cause the normalizer to throw
      const problematicError = {
        get status() {
          throw new Error("Property access failed");
        },
      };

      const result = provider.normalizeError(problematicError);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Error normalization failed");
      expect(result.context?.originalError).toBe(problematicError);
    });
  });
});
