/**
 * Anthropic Messages v1 Provider Plugin Tests
 *
 * Unit tests for the main Anthropic Messages v1 provider plugin implementation.
 * Tests all ProviderPlugin interface methods and error handling scenarios.
 */

import { AnthropicMessagesV1Provider } from "../anthropicMessagesV1Provider";
import type { StreamDelta } from "../../../client/streamDelta";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import { BridgeError } from "../../../core/errors/bridgeError";
import { ValidationError } from "../../../core/errors/validationError";

// Mock the imported modules
jest.mock("../translator", () => ({
  translateChatRequest: jest.fn(),
}));
jest.mock("../responseParser", () => ({
  parseAnthropicResponse: jest.fn(),
}));
jest.mock("../streamingParser", () => ({
  parseAnthropicResponseStream: jest.fn(),
}));
jest.mock("../errorNormalizer", () => ({
  normalizeAnthropicError: jest.fn(),
}));

import { translateChatRequest } from "../translator";
import { parseAnthropicResponse } from "../responseParser";
import { parseAnthropicResponseStream } from "../streamingParser";
import { normalizeAnthropicError } from "../errorNormalizer";

const mockTranslateChatRequest = translateChatRequest as jest.MockedFunction<
  typeof translateChatRequest
>;
const mockParseAnthropicResponse =
  parseAnthropicResponse as jest.MockedFunction<typeof parseAnthropicResponse>;
const mockParseAnthropicResponseStream =
  parseAnthropicResponseStream as jest.MockedFunction<
    typeof parseAnthropicResponseStream
  >;
const mockNormalizeAnthropicError =
  normalizeAnthropicError as jest.MockedFunction<
    typeof normalizeAnthropicError
  >;

describe("AnthropicMessagesV1Provider", () => {
  let provider: AnthropicMessagesV1Provider;

  beforeEach(() => {
    provider = new AnthropicMessagesV1Provider();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockTranslateChatRequest.mockReturnValue({
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      headers: { "x-api-key": "test-key" },
      body: JSON.stringify({ model: "claude-3", messages: [] }),
    });

    (mockParseAnthropicResponse as jest.Mock).mockResolvedValue({
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
        toolCalls: [],
      },
      model: "claude-3",
      usage: { promptTokens: 10, completionTokens: 5 },
      metadata: {},
    });

    mockParseAnthropicResponseStream.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        await Promise.resolve(); // Satisfy async requirement
        yield {
          id: "chunk-1",
          delta: { content: [{ type: "text", text: "Hello" }] },
          finished: false,
        } as StreamDelta;
        yield {
          id: "chunk-2",
          delta: {},
          finished: true,
        } as StreamDelta;
      },
    });

    mockNormalizeAnthropicError.mockImplementation(
      (error: unknown, context?: Record<string, unknown>) => {
        if (error instanceof BridgeError) return error;
        return new BridgeError(
          error instanceof Error ? error.message : "Unknown provider error",
          "PROVIDER_ERROR",
          {
            cause: error instanceof Error ? error : new Error(String(error)),
            provider: "anthropic",
            version: "2023-06-01",
            ...(context || {}),
          },
        );
      },
    );
  });

  describe("metadata", () => {
    it("should have correct provider metadata", () => {
      expect(provider.id).toBe("anthropic");
      expect(provider.name).toBe("Anthropic Messages Provider");
      expect(provider.version).toBe("2023-06-01");
    });
  });

  describe("initialize", () => {
    it("should initialize with valid configuration", async () => {
      const config = {
        apiKey: "sk-ant-test123",
      };

      await expect(provider.initialize(config)).resolves.toBeUndefined();
    });

    it("should initialize with complete configuration", async () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "https://api.anthropic.com",
        version: "2023-06-01",
        timeout: 30000,
        maxRetries: 3,
      };

      await expect(provider.initialize(config)).resolves.toBeUndefined();
    });

    it("should throw ValidationError for missing apiKey", async () => {
      const config = {};

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toBeInstanceOf(BridgeError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw ValidationError for empty apiKey", async () => {
      const config = {
        apiKey: "",
      };

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw ValidationError for invalid apiKey format", async () => {
      const config = {
        apiKey: "invalid-key-format",
      };

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw ValidationError for invalid baseUrl", async () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "not-a-url",
      };

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw ValidationError for non-HTTPS baseUrl", async () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "http://api.anthropic.com",
      };

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw ValidationError for invalid version format", async () => {
      const config = {
        apiKey: "sk-ant-test123",
        version: "invalid-version",
      };

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw ValidationError for timeout exceeding maximum", async () => {
      const config = {
        apiKey: "sk-ant-test123",
        timeout: 400000, // Exceeds max of 300000
      };

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw ValidationError for maxRetries exceeding limit", async () => {
      const config = {
        apiKey: "sk-ant-test123",
        maxRetries: 10, // Exceeds max of 5
      };

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should include context information in validation errors", async () => {
      const config = {};

      try {
        await provider.initialize(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context?.context).toEqual({
          provider: "anthropic",
          version: "2023-06-01",
        });
      }
    });
  });

  describe("supportsModel", () => {
    it("should support Claude models", () => {
      expect(provider.supportsModel("claude-3-5-sonnet-20241022")).toBe(true);
      expect(provider.supportsModel("claude-3-haiku-20240307")).toBe(true);
      expect(provider.supportsModel("claude-3-opus-20240229")).toBe(true);
    });

    it("should support any model ID (model-agnostic)", () => {
      expect(provider.supportsModel("any-model-id")).toBe(true);
      expect(provider.supportsModel("gpt-4")).toBe(true);
      expect(provider.supportsModel("custom-model")).toBe(true);
      expect(provider.supportsModel("")).toBe(true);
    });
  });

  describe("translateRequest", () => {
    it("should throw BridgeError when not initialized", () => {
      const request = {
        messages: [
          {
            role: "user" as const,
            content: [{ type: "text" as const, text: "Hello" }],
          },
        ],
        model: "claude-3-5-sonnet-20241022",
      };

      expect(() => provider.translateRequest(request)).toThrow(BridgeError);
      expect(() => provider.translateRequest(request)).toThrow(
        "Provider not initialized",
      );
    });

    it("should successfully translate request when initialized", async () => {
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      const request = {
        messages: [
          {
            role: "user" as const,
            content: [{ type: "text" as const, text: "Hello" }],
          },
        ],
        model: "claude-3-5-sonnet-20241022",
      };

      const result = provider.translateRequest(request);

      expect(result).toEqual({
        url: "https://api.anthropic.com/v1/messages",
        method: "POST",
        headers: { "x-api-key": "test-key" },
        body: JSON.stringify({ model: "claude-3", messages: [] }),
      });
      expect(mockTranslateChatRequest).toHaveBeenCalledWith(request, {
        apiKey: "sk-ant-test123",
        baseUrl: "https://api.anthropic.com",
        version: "2023-06-01",
        timeout: 30000,
        maxRetries: 3,
      });
    });

    it("should accept stream parameter", async () => {
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      const request = {
        messages: [
          {
            role: "user" as const,
            content: [{ type: "text" as const, text: "Hello" }],
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stream: true,
      };

      const result = provider.translateRequest(request);
      expect(result).toBeDefined();
      expect(mockTranslateChatRequest).toHaveBeenCalledWith(request, {
        apiKey: "sk-ant-test123",
        baseUrl: "https://api.anthropic.com",
        version: "2023-06-01",
        timeout: 30000,
        maxRetries: 3,
      });
    });

    it("should accept modelCapabilities parameter", async () => {
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      const request = {
        messages: [
          {
            role: "user" as const,
            content: [{ type: "text" as const, text: "Hello" }],
          },
        ],
        model: "claude-3-5-sonnet-20241022",
      };

      const capabilities = { temperature: true };

      const result = provider.translateRequest(request, capabilities);
      expect(result).toBeDefined();
      expect(mockTranslateChatRequest).toHaveBeenCalledWith(request, {
        apiKey: "sk-ant-test123",
        baseUrl: "https://api.anthropic.com",
        version: "2023-06-01",
        timeout: 30000,
        maxRetries: 3,
      });
    });
  });

  describe("parseResponse", () => {
    let mockResponse: ProviderHttpResponse;

    beforeEach(() => {
      // Create a mock ReadableStream
      const mockBody = new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("mock response body"));
          controller.close();
        },
      });

      mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: mockBody,
      };
    });

    it("should throw BridgeError when not initialized", () => {
      expect(() => provider.parseResponse(mockResponse, false)).toThrow(
        BridgeError,
      );
      expect(() => provider.parseResponse(mockResponse, false)).toThrow(
        "Provider not initialized",
      );
    });

    it("should reject Promise for missing response body", async () => {
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      const responseWithoutBody = { ...mockResponse, body: null };

      const result = provider.parseResponse(responseWithoutBody, false);
      expect(result).toBeInstanceOf(Promise);
      await expect(result).rejects.toThrow("Response body is required");
    });

    it("should return Promise for non-streaming response", async () => {
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      // Mock the parser to reject with a specific error for this test
      (mockParseAnthropicResponse as jest.Mock).mockRejectedValueOnce(
        new ValidationError("Invalid JSON in Anthropic response"),
      );

      const result = provider.parseResponse(mockResponse, false);

      expect(result).toBeInstanceOf(Promise);
      await expect(result).rejects.toThrow(
        "Invalid JSON in Anthropic response",
      );
    });

    it("should return AsyncIterable for streaming response", async () => {
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      const result = provider.parseResponse(mockResponse, true);

      expect(result).toBeDefined();

      // Type guard to ensure we have an AsyncIterable
      if ("then" in result) {
        fail("Expected AsyncIterable but got Promise");
      }

      expect(typeof result[Symbol.asyncIterator]).toBe("function");

      // Test that the async iterable works correctly
      const iterator = result[Symbol.asyncIterator]();
      const first = await iterator.next();
      expect(first.done).toBe(false);
      expect(first.value).toHaveProperty("delta");
      expect(first.value).toHaveProperty("finished");
    });
  });

  describe("isTerminal", () => {
    it("should return false for StreamDelta (placeholder)", () => {
      const delta: StreamDelta = {
        id: "delta-123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });

    it("should return true for non-streaming response", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        model: "claude-3-5-sonnet-20241022",
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      };

      expect(provider.isTerminal(response)).toBe(true);
    });

    it("should handle response without usage", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        model: "claude-3-5-sonnet-20241022",
      };

      expect(provider.isTerminal(response)).toBe(true);
    });

    it("should handle response with metadata", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        model: "claude-3-5-sonnet-20241022",
        metadata: { custom: "data" },
      };

      expect(provider.isTerminal(response)).toBe(true);
    });
  });

  describe("normalizeError", () => {
    it("should return BridgeError as-is", () => {
      const bridgeError = new BridgeError("Test error", "TEST_ERROR");

      const result = provider.normalizeError(bridgeError);

      expect(result).toBe(bridgeError);
    });

    it("should wrap Error instances", () => {
      const error = new Error("Test error");

      const result = provider.normalizeError(error);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Test error");
      expect(result.context?.cause).toBe(error);
    });

    it("should wrap string errors", () => {
      const error = "String error message";

      const result = provider.normalizeError(error);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown provider error");
      expect(result.context?.cause).toBeInstanceOf(Error);
      expect((result.context?.cause as Error).message).toBe(error);
    });

    it("should wrap unknown error types", () => {
      const error = { unknown: "object" };

      const result = provider.normalizeError(error);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.message).toBe("Unknown provider error");
      expect(result.context?.cause).toBeInstanceOf(Error);
    });

    it("should include provider context", () => {
      const error = new Error("Test error");

      const result = provider.normalizeError(error);

      expect(result.context?.provider).toBe("anthropic");
      expect(result.context?.version).toBe("2023-06-01");
    });
  });

  describe("error handling edge cases", () => {
    it("should handle null errors", () => {
      const result = provider.normalizeError(null);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.context?.cause).toBeInstanceOf(Error);
    });

    it("should handle undefined errors", () => {
      const result = provider.normalizeError(undefined);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.context?.cause).toBeInstanceOf(Error);
    });

    it("should handle numeric errors", () => {
      const result = provider.normalizeError(404);

      expect(result).toBeInstanceOf(BridgeError);
      expect(result.code).toBe("PROVIDER_ERROR");
      expect(result.context?.cause).toBeInstanceOf(Error);
      expect((result.context?.cause as Error).message).toBe("404");
    });
  });

  describe("initialization state management", () => {
    it("should track initialization state correctly", async () => {
      // Initially not initialized
      expect(() =>
        provider.translateRequest({
          messages: [],
          model: "claude-3-5-sonnet-20241022",
        }),
      ).toThrow("Provider not initialized");

      // After initialization
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      // Should work properly after initialization
      const result = provider.translateRequest({
        messages: [],
        model: "claude-3-5-sonnet-20241022",
      });
      expect(result).toBeDefined();
      expect(mockTranslateChatRequest).toHaveBeenCalled();
    });

    it("should allow multiple initializations", async () => {
      const config1 = { apiKey: "sk-ant-test123" };
      const config2 = { apiKey: "sk-ant-test456" };

      await expect(provider.initialize(config1)).resolves.toBeUndefined();
      await expect(provider.initialize(config2)).resolves.toBeUndefined();
    });
  });
});
