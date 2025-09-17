/**
 * xAI Provider Plugin Tests
 *
 * Unit tests for the main xAI v1 provider plugin implementation.
 */

import { XAIV1Provider } from "../xaiV1Provider";
import type { StreamDelta } from "../../../client/streamDelta";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import { BridgeError } from "../../../core/errors/bridgeError";

// Mock the component modules
jest.mock("../translator", () => ({
  translateChatRequest: jest.fn(),
}));

jest.mock("../responseParser", () => ({
  parseXAIResponse: jest.fn(),
}));

jest.mock("../streamingParser", () => ({
  parseXAIV1ResponseStream: jest.fn(),
}));

jest.mock("../errorNormalizer", () => ({
  normalizeXAIError: jest.fn(),
}));

import { translateChatRequest } from "../translator";
import { parseXAIResponse } from "../responseParser";
import { parseXAIV1ResponseStream } from "../streamingParser";
import { normalizeXAIError } from "../errorNormalizer";

const mockTranslateChatRequest = translateChatRequest as jest.MockedFunction<
  typeof translateChatRequest
>;
const mockParseXAIResponse = parseXAIResponse as jest.MockedFunction<
  typeof parseXAIResponse
>;
const mockParseXAIV1ResponseStream =
  parseXAIV1ResponseStream as jest.MockedFunction<
    typeof parseXAIV1ResponseStream
  >;
const mockNormalizeXAIError = normalizeXAIError as jest.MockedFunction<
  typeof normalizeXAIError
>;

describe("XAIV1Provider", () => {
  let provider: XAIV1Provider;

  beforeEach(() => {
    provider = new XAIV1Provider();
    jest.clearAllMocks();
  });

  describe("metadata", () => {
    it("should have correct provider metadata", () => {
      expect(provider.id).toBe("xai");
      expect(provider.name).toBe("xAI Grok Provider");
      expect(provider.version).toBe("v1");
    });

    it("should have correct capabilities", () => {
      expect(provider.capabilities).toEqual({
        streaming: true,
        toolCalls: true,
        images: true,
        documents: true,
        maxTokens: 8192,
        supportedContentTypes: ["text", "image", "document"],
        temperature: true,
      });
    });
  });

  describe("initialize", () => {
    it("should initialize with valid configuration", async () => {
      const config = {
        apiKey: "xai-test123",
      };

      await expect(provider.initialize(config)).resolves.toBeUndefined();
    });

    it("should initialize with complete configuration", async () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "https://api.x.ai/v1",
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
        expect((error as BridgeError).message).toBe(
          "Invalid xAI configuration",
        );
        expect((error as BridgeError).code).toBe("INVALID_CONFIG");
      }
    });

    it("should throw BridgeError for invalid apiKey format", async () => {
      const config = {
        apiKey: "sk-invalid", // Should start with "xai-"
      };

      try {
        await provider.initialize(config);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        expect((error as BridgeError).message).toBe(
          "Invalid xAI configuration",
        );
        expect((error as BridgeError).code).toBe("INVALID_CONFIG");
      }
    });

    it("should throw BridgeError for non-HTTPS baseUrl", async () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "http://insecure.example.com", // Should be HTTPS
      };

      try {
        await provider.initialize(config);
        fail("Expected BridgeError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        expect((error as BridgeError).message).toBe(
          "Invalid xAI configuration",
        );
        expect((error as BridgeError).code).toBe("INVALID_CONFIG");
      }
    });

    it("should include error code and provider context", async () => {
      const config = {};

      try {
        await provider.initialize(config);
        fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("INVALID_CONFIG");
        expect(bridgeError.context?.provider).toBe("xai");
      }
    });
  });

  describe("supportsModel", () => {
    it("should return true for any model ID", () => {
      expect(provider.supportsModel("grok-3-mini")).toBe(true);
      expect(provider.supportsModel("grok-3")).toBe(true);
      expect(provider.supportsModel("grok-4-0709")).toBe(true);
      expect(provider.supportsModel("some-other-model")).toBe(true);
      expect(provider.supportsModel("")).toBe(true);
    });
  });

  describe("translateRequest", () => {
    const mockRequest = {
      messages: [
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
      ],
      model: "grok-3-mini",
    };

    const mockConfig = {
      apiKey: "xai-test123",
      baseUrl: "https://api.x.ai/v1",
      maxRetries: 3,
    };

    it("should throw error when not initialized", () => {
      expect(() => provider.translateRequest(mockRequest)).toThrow(BridgeError);
      expect(() => provider.translateRequest(mockRequest)).toThrow(
        "Provider not initialized",
      );
    });

    it("should delegate to translateChatRequest when initialized", async () => {
      await provider.initialize(mockConfig);

      const mockHttpRequest = {
        url: "https://api.x.ai/v1/chat/completions",
        method: "POST" as const,
        headers: { Authorization: "Bearer xai-test123" },
        body: JSON.stringify({ model: "grok-3-mini" }),
      };

      mockTranslateChatRequest.mockReturnValue(mockHttpRequest);

      const result = provider.translateRequest(mockRequest);

      expect(mockTranslateChatRequest).toHaveBeenCalledWith(
        mockRequest,
        mockConfig,
        undefined,
      );
      expect(result).toBe(mockHttpRequest);
    });

    it("should pass model capabilities to translator", async () => {
      await provider.initialize(mockConfig);

      const modelCapabilities = { temperature: true };
      const mockHttpRequest = {
        url: "https://api.x.ai/v1/chat/completions",
        method: "POST" as const,
        headers: { Authorization: "Bearer xai-test123" },
        body: JSON.stringify({ model: "grok-3-mini" }),
      };
      mockTranslateChatRequest.mockReturnValue(mockHttpRequest);

      provider.translateRequest(mockRequest, modelCapabilities);

      expect(mockTranslateChatRequest).toHaveBeenCalledWith(
        mockRequest,
        mockConfig,
        modelCapabilities,
      );
    });

    it("should normalize errors from translator", async () => {
      await provider.initialize(mockConfig);

      const originalError = new Error("Translation failed");
      const normalizedError = new BridgeError(
        "Normalized error",
        "TRANSLATION_ERROR",
      );

      mockTranslateChatRequest.mockImplementation(() => {
        throw originalError;
      });
      mockNormalizeXAIError.mockReturnValue(normalizedError);

      expect(() => provider.translateRequest(mockRequest)).toThrow(
        normalizedError,
      );
      expect(mockNormalizeXAIError).toHaveBeenCalledWith(originalError);
    });
  });

  describe("parseResponse implementation", () => {
    const mockResponse: ProviderHttpResponse = {
      status: 200,
      statusText: "OK",
      headers: {},
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"response":"data"}'));
          controller.close();
        },
      }),
    };

    describe("streaming responses", () => {
      it("should delegate to parseXAIV1ResponseStream for streaming", () => {
        const mockStream = {
          [Symbol.asyncIterator]: async function* () {
            await Promise.resolve(); // Add await to satisfy linter
            yield {
              id: "test-id",
              delta: { content: [{ type: "text" as const, text: "test" }] },
              finished: false,
            } as StreamDelta;
          },
        } as AsyncIterable<StreamDelta>;

        mockParseXAIV1ResponseStream.mockReturnValue(mockStream);

        const result = provider.parseResponse(mockResponse, true);

        expect(mockParseXAIV1ResponseStream).toHaveBeenCalledWith(mockResponse);
        expect(result).toBe(mockStream);
      });
    });

    describe("non-streaming responses", () => {
      it("should read response body and delegate to parseXAIResponse", async () => {
        const mockParsedResponse = {
          message: {
            id: "test-id",
            role: "assistant" as const,
            content: [{ type: "text" as const, text: "Hello" }],
          },
          usage: { promptTokens: 10, completionTokens: 20 },
          model: "grok-3-mini",
        };

        mockParseXAIResponse.mockReturnValue(mockParsedResponse);

        const result = (await provider.parseResponse(
          mockResponse,
          false,
        )) as any;

        expect(mockParseXAIResponse).toHaveBeenCalledWith(
          mockResponse,
          '{"response":"data"}',
        );
        expect(result).toBe(mockParsedResponse);
      });

      it("should throw BridgeError for null response body", async () => {
        const nullBodyResponse = {
          ...mockResponse,
          body: null,
        };

        await expect(
          provider.parseResponse(nullBodyResponse, false),
        ).rejects.toThrow(BridgeError);
        await expect(
          provider.parseResponse(nullBodyResponse, false),
        ).rejects.toThrow("Response body is null");
      });

      it("should handle ReadableStream reading errors", async () => {
        const errorResponse: ProviderHttpResponse = {
          status: 200,
          statusText: "OK",
          headers: {},
          body: new ReadableStream({
            start(controller) {
              controller.error(new Error("Stream error"));
            },
          }),
        };

        const normalizedError = new BridgeError("Stream error", "STREAM_ERROR");
        mockNormalizeXAIError.mockReturnValue(normalizedError);

        await expect(
          provider.parseResponse(errorResponse, false),
        ).rejects.toThrow(normalizedError);
        expect(mockNormalizeXAIError).toHaveBeenCalled();
      });
    });
  });

  describe("isTerminal", () => {
    it("should return true for non-streaming responses", () => {
      const response = {
        message: {
          id: "test-id",
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        model: "grok-3-mini",
      };

      expect(provider.isTerminal(response)).toBe(true);
    });

    it("should return true for streaming deltas with finished=true", () => {
      const delta: StreamDelta = {
        id: "test-id-1",
        delta: { content: [{ type: "text", text: "Hello" }] },
        finished: true,
      };

      expect(provider.isTerminal(delta)).toBe(true);
    });

    it("should return true for streaming deltas with usage information", () => {
      const delta: StreamDelta = {
        id: "test-id-2",
        delta: { content: [{ type: "text", text: "Hello" }] },
        finished: false,
        usage: { promptTokens: 10, completionTokens: 20 },
      };

      expect(provider.isTerminal(delta)).toBe(true);
    });

    it("should return false for streaming deltas without termination indicators", () => {
      const delta: StreamDelta = {
        id: "test-id-3",
        delta: { content: [{ type: "text", text: "Hello" }] },
        finished: false,
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });
  });

  describe("normalizeError", () => {
    it("should delegate to normalizeXAIError", () => {
      const originalError = new Error("Original error");
      const normalizedError = new BridgeError("Normalized error", "TEST_ERROR");

      mockNormalizeXAIError.mockReturnValue(normalizedError);

      const result = provider.normalizeError(originalError);

      expect(mockNormalizeXAIError).toHaveBeenCalledWith(originalError);
      expect(result).toBe(normalizedError);
    });

    it("should handle different error types", () => {
      const testCases = [
        new Error("Regular error"),
        { message: "Object error" },
        "String error",
        null,
        undefined,
      ];

      testCases.forEach((error, index) => {
        const normalizedError = new BridgeError(`Error ${index}`, "TEST_ERROR");
        mockNormalizeXAIError.mockReturnValue(normalizedError);

        const result = provider.normalizeError(error);

        expect(mockNormalizeXAIError).toHaveBeenCalledWith(error);
        expect(result).toBe(normalizedError);
      });
    });
  });
});
