/**
 * OpenAI Provider Plugin Tests
 *
 * Unit tests for the main OpenAI Responses v1 provider plugin implementation.
 */

import { OpenAIResponsesV1Provider } from "../index.js";
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

  describe("placeholder implementations", () => {
    it("should throw NOT_IMPLEMENTED for parseResponse", () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: null,
      };

      expect(() => provider.parseResponse(mockResponse, false)).toThrow(
        BridgeError,
      );
      expect(() => provider.parseResponse(mockResponse, false)).toThrow(
        "Response parsing not implemented",
      );

      try {
        provider.parseResponse(mockResponse, false);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("NOT_IMPLEMENTED");
        expect(bridgeError.context?.method).toBe("parseResponse");
        expect(bridgeError.context?.isStreaming).toBe(false);
      }
    });

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

    it("should throw NOT_IMPLEMENTED for normalizeError", () => {
      const originalError = new Error("Test error");

      expect(() => provider.normalizeError(originalError)).toThrow(BridgeError);
      expect(() => provider.normalizeError(originalError)).toThrow(
        "Error normalization not implemented",
      );

      try {
        provider.normalizeError(originalError);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("NOT_IMPLEMENTED");
        expect(bridgeError.context?.method).toBe("normalizeError");
        expect(bridgeError.context?.originalError).toBe(originalError);
      }
    });
  });
});
