/**
 * Unit tests for GoogleGeminiV1Provider
 *
 * Comprehensive test suite covering all ProviderPlugin interface methods
 * and integration scenarios for the Google Gemini v1 provider.
 */

import { GoogleGeminiV1Provider } from "../googleGeminiV1Provider";
import { BridgeError } from "../../../core/errors/bridgeError";
import { ValidationError } from "../../../core/errors/validationError";
import { ProviderError } from "../../../core/errors/providerError";
import type { ChatRequest } from "../../../client/chatRequest";
import type { StreamDelta } from "../../../client/streamDelta";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import type { ProviderHttpRequest } from "../../../core/transport/providerHttpRequest";
import type { HttpMethod } from "../../../core/transport/httpMethod";

// Mock all imported dependencies
jest.mock("../translator");
jest.mock("../responseParser");
jest.mock("../streamingParser");
jest.mock("../errorNormalizer");

// Import mocked functions with proper typing
import { translateChatRequest } from "../translator";
import { parseGeminiResponse } from "../responseParser";
import { parseGeminiResponseStream } from "../streamingParser";
import { normalizeGeminiError } from "../errorNormalizer";

const mockTranslateChatRequest = jest.mocked(translateChatRequest);
const mockParseGeminiResponse = parseGeminiResponse as jest.MockedFunction<any>;
const mockParseGeminiResponseStream =
  parseGeminiResponseStream as jest.MockedFunction<any>;
const mockNormalizeGeminiError = jest.mocked(normalizeGeminiError);

describe("GoogleGeminiV1Provider", () => {
  let provider: GoogleGeminiV1Provider;

  beforeEach(() => {
    provider = new GoogleGeminiV1Provider();
    jest.clearAllMocks();
  });

  describe("Provider Metadata", () => {
    it("should have correct provider identification", () => {
      expect(provider.id).toBe("google");
      expect(provider.name).toBe("Google Gemini Provider");
      expect(provider.version).toBe("gemini-v1");
    });
  });

  describe("initialize()", () => {
    it("should initialize with valid configuration", async () => {
      const validConfig = {
        apiKey: "test-api-key-123",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/",
      };

      await expect(provider.initialize(validConfig)).resolves.toBeUndefined();
    });

    it("should reject invalid configuration", async () => {
      const invalidConfig = {
        apiKey: "", // Empty API key should fail validation
      };

      await expect(provider.initialize(invalidConfig)).rejects.toThrow(
        BridgeError,
      );
      await expect(provider.initialize(invalidConfig)).rejects.toThrow(
        "Invalid Google Gemini configuration",
      );
    });

    it("should reject configuration with missing required fields", async () => {
      const incompleteConfig = {
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/",
        // Missing apiKey
      };

      await expect(provider.initialize(incompleteConfig)).rejects.toThrow(
        BridgeError,
      );
    });

    it("should handle configuration schema validation errors", async () => {
      const invalidConfig = {
        apiKey: "test-key",
        baseUrl: "http://insecure-url", // Should require HTTPS
      };

      await expect(provider.initialize(invalidConfig)).rejects.toThrow(
        BridgeError,
      );
    });
  });

  describe("supportsModel()", () => {
    it("should return true for all supported Gemini models", () => {
      const supportedModels = [
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
      ];

      supportedModels.forEach((modelId) => {
        expect(provider.supportsModel(modelId)).toBe(true);
      });
    });

    it("should return false for non-Gemini models", () => {
      const unsupportedModels = [
        "gpt-4",
        "gpt-3.5-turbo",
        "claude-3-opus",
        "claude-3-sonnet",
        "gemini-1.5-pro", // Different version
        "gemini-3.0-flash", // Future version
        "",
        "random-model",
      ];

      unsupportedModels.forEach((modelId) => {
        expect(provider.supportsModel(modelId)).toBe(false);
      });
    });

    it("should handle edge cases", () => {
      expect(provider.supportsModel(undefined as unknown as string)).toBe(
        false,
      );
      expect(provider.supportsModel(null as unknown as string)).toBe(false);
    });
  });

  describe("translateRequest()", () => {
    const mockRequest: ChatRequest & { stream?: boolean } = {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
      ],
      model: "gemini-2.5-flash",
      stream: false,
    };

    const mockConfig = {
      apiKey: "test-api-key",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/",
      maxRetries: 3,
      timeout: 30000,
    };

    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it("should delegate to translateChatRequest with valid inputs", () => {
      const mockHttpRequest: ProviderHttpRequest = {
        method: "POST" as HttpMethod,
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        headers: { "x-goog-api-key": "test-api-key" },
        body: JSON.stringify({ contents: [] }),
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

    it("should pass model capabilities to translator", () => {
      const mockHttpRequest: ProviderHttpRequest = {
        method: "POST" as HttpMethod,
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        headers: {},
        body: "",
      };

      mockTranslateChatRequest.mockReturnValue(mockHttpRequest);

      const modelCapabilities = { temperature: true };
      provider.translateRequest(mockRequest, modelCapabilities);

      expect(mockTranslateChatRequest).toHaveBeenCalledWith(
        mockRequest,
        mockConfig,
        modelCapabilities,
      );
    });

    it("should throw error when provider not initialized", () => {
      const uninitializedProvider = new GoogleGeminiV1Provider();

      expect(() => uninitializedProvider.translateRequest(mockRequest)).toThrow(
        BridgeError,
      );
      expect(() => uninitializedProvider.translateRequest(mockRequest)).toThrow(
        "Provider not initialized",
      );
    });

    it("should propagate validation errors from translator", () => {
      mockTranslateChatRequest.mockImplementation(() => {
        throw new ValidationError("Invalid request format");
      });

      expect(() => provider.translateRequest(mockRequest)).toThrow(
        ValidationError,
      );
    });
  });

  describe("parseResponse()", () => {
    const mockResponse: ProviderHttpResponse = {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"candidates": []}'));
          controller.close();
        },
      }),
    };

    it("should delegate to parseGeminiResponseStream for streaming responses", () => {
      const mockStreamDelta: StreamDelta = {
        id: "chunk-1",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        metadata: {},
      };

      const asyncIterable: AsyncIterable<StreamDelta> = {
        [Symbol.asyncIterator]: async function* () {
          await Promise.resolve();
          yield mockStreamDelta;
        },
      };

      mockParseGeminiResponseStream.mockReturnValue(asyncIterable);

      const result = provider.parseResponse(mockResponse, true);

      expect(mockParseGeminiResponseStream).toHaveBeenCalledWith(mockResponse);
      expect(result).toBeDefined();
    });

    it("should delegate to parseGeminiResponse for non-streaming responses", async () => {
      const mockUnifiedResponse = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "gemini-2.5-flash",
        metadata: {},
      };

      mockParseGeminiResponse.mockResolvedValue(mockUnifiedResponse);

      const result = await provider.parseResponse(mockResponse, false);

      expect(mockParseGeminiResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.any(String),
      );
      expect(result).toEqual(mockUnifiedResponse);
    });

    it("should handle null response body error", async () => {
      const responseWithNullBody: ProviderHttpResponse = {
        ...mockResponse,
        body: null,
      };

      await expect(
        provider.parseResponse(responseWithNullBody, false),
      ).rejects.toThrow(ValidationError);
      await expect(
        provider.parseResponse(responseWithNullBody, false),
      ).rejects.toThrow("Response body is null");
    });

    it("should properly read response body for non-streaming responses", async () => {
      const testContent =
        '{"candidates": [{"content": {"parts": [{"text": "Hello"}]}}]}';
      const mockResponseWithContent: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(testContent));
            controller.close();
          },
        }),
      };

      const mockUnifiedResponse = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        usage: { promptTokens: 5, completionTokens: 1 },
        model: "gemini-2.5-flash",
      };

      mockParseGeminiResponse.mockResolvedValue(mockUnifiedResponse);

      await provider.parseResponse(mockResponseWithContent, false);

      expect(mockParseGeminiResponse).toHaveBeenCalledWith(
        mockResponseWithContent,
        testContent,
      );
    });
  });

  describe("isTerminal()", () => {
    it("should return true for non-streaming responses", () => {
      const nonStreamingResponse = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        usage: { promptTokens: 10, completionTokens: 5 },
        model: "gemini-2.5-flash",
        metadata: {},
      };

      expect(provider.isTerminal(nonStreamingResponse)).toBe(true);
    });

    it("should return true for streaming deltas with finished flag", () => {
      const finishedDelta: StreamDelta = {
        id: "chunk-1",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: true,
        metadata: {},
      };

      expect(provider.isTerminal(finishedDelta)).toBe(true);
    });

    it("should return true for streaming deltas with non-STOP finishReason", () => {
      const terminatedDelta: StreamDelta = {
        id: "chunk-2",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        metadata: { finishReason: "LENGTH" },
      };

      expect(provider.isTerminal(terminatedDelta)).toBe(true);
    });

    it("should return false for ongoing streaming deltas", () => {
      const ongoingDelta: StreamDelta = {
        id: "chunk-3",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        metadata: {},
      };

      expect(provider.isTerminal(ongoingDelta)).toBe(false);
    });

    it("should return false for streaming deltas with STOP finishReason but not finished", () => {
      const stopDelta: StreamDelta = {
        id: "chunk-4",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        metadata: { finishReason: "STOP" },
      };

      expect(provider.isTerminal(stopDelta)).toBe(false);
    });
  });

  describe("normalizeError()", () => {
    it("should delegate to normalizeGeminiError", () => {
      const mockError = new Error("Test error");
      const mockNormalizedError = new ValidationError("Normalized error");

      mockNormalizeGeminiError.mockReturnValue(mockNormalizedError);

      const result = provider.normalizeError(mockError);

      expect(mockNormalizeGeminiError).toHaveBeenCalledWith(mockError);
      expect(result).toBe(mockNormalizedError);
    });

    it("should fallback to ProviderError when normalization fails", () => {
      const mockError = new Error("Test error");

      mockNormalizeGeminiError.mockImplementation(() => {
        throw new Error("Normalization failed");
      });

      const result = provider.normalizeError(mockError);

      expect(result).toBeInstanceOf(ProviderError);
      expect(result.message).toBe("Error normalization failed");
      expect(result.context).toEqual({
        originalError: mockError,
        normalizationError: expect.any(Error),
      });
    });

    it("should handle various error types", () => {
      const testErrors = [
        new Error("Standard error"),
        { message: "Plain object error" },
        "String error",
        null,
        undefined,
        123,
      ];

      testErrors.forEach((error, index) => {
        const mockNormalizedError = new BridgeError(
          `Normalized error ${index}`,
          "PROVIDER_ERROR",
        );
        mockNormalizeGeminiError.mockReturnValue(mockNormalizedError);

        const result = provider.normalizeError(error);

        expect(mockNormalizeGeminiError).toHaveBeenCalledWith(error);
        expect(result).toBe(mockNormalizedError);
      });
    });
  });

  describe("Integration Scenarios", () => {
    it("should initialize and handle complete request lifecycle", async () => {
      const config = {
        apiKey: "test-api-key",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/",
      };

      await provider.initialize(config);

      const request: ChatRequest & { stream?: boolean } = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello" }] },
        ],
        model: "gemini-2.5-flash",
        stream: false,
      };

      const mockHttpRequest: ProviderHttpRequest = {
        method: "POST" as HttpMethod,
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        headers: { "x-goog-api-key": "test-api-key" },
        body: JSON.stringify({ contents: [] }),
      };

      mockTranslateChatRequest.mockReturnValue(mockHttpRequest);

      const translatedRequest = provider.translateRequest(request);

      expect(translatedRequest).toBe(mockHttpRequest);
      expect(provider.supportsModel("gemini-2.5-flash")).toBe(true);
    });

    it("should handle streaming workflow", async () => {
      const config = { apiKey: "test-key" };
      await provider.initialize(config);

      const mockStreamingResponse: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: new ReadableStream(),
      };

      const mockStreamDeltas: StreamDelta[] = [
        {
          id: "chunk-1",
          delta: {
            role: "assistant",
            content: [{ type: "text", text: "Hello" }],
          },
          finished: false,
          metadata: {},
        },
        {
          id: "chunk-2",
          delta: {
            role: "assistant",
            content: [{ type: "text", text: " world" }],
          },
          finished: true,
          metadata: { finishReason: "STOP" },
        },
      ];

      const asyncIterable: AsyncIterable<StreamDelta> = {
        [Symbol.asyncIterator]: async function* () {
          await Promise.resolve();
          for (const delta of mockStreamDeltas) {
            yield delta;
          }
        },
      };

      mockParseGeminiResponseStream.mockReturnValue(asyncIterable);

      const streamResult = provider.parseResponse(mockStreamingResponse, true);
      const streamIterator = streamResult as AsyncIterable<StreamDelta>;

      const deltas: StreamDelta[] = [];
      for await (const delta of streamIterator) {
        deltas.push(delta);
        if (provider.isTerminal(delta)) {
          break;
        }
      }

      expect(deltas).toHaveLength(2);
      expect(provider.isTerminal(deltas[0])).toBe(false);
      expect(provider.isTerminal(deltas[1])).toBe(true);
    });
  });
});
