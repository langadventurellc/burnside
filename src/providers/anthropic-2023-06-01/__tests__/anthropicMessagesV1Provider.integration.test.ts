/**
 * Anthropic Messages v1 Provider Plugin Integration Tests
 *
 * Simplified integration tests focusing on the actual method integration
 * without complex mocking that was causing test execution issues.
 */

import { AnthropicMessagesV1Provider } from "../anthropicMessagesV1Provider";
import type { StreamDelta } from "../../../client/streamDelta";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import { BridgeError } from "../../../core/errors/bridgeError";

// Mock the imported modules with simple implementations
jest.mock("../translator", () => ({
  translateChatRequest: jest.fn().mockReturnValue({
    url: "https://api.anthropic.com/v1/messages",
    method: "POST",
    headers: { "x-api-key": "test-key" },
    body: JSON.stringify({ model: "claude-3", messages: [] }),
  }),
}));

jest.mock("../responseParser", () => ({
  parseAnthropicResponse: jest.fn().mockReturnValue({
    message: { role: "assistant", content: [{ type: "text", text: "Hello" }] },
    model: "claude-3",
    usage: { promptTokens: 10, completionTokens: 5 },
  }),
}));

jest.mock("../streamingParser", () => ({
  parseAnthropicResponseStream: jest.fn().mockReturnValue({
    async *[Symbol.asyncIterator]() {
      await Promise.resolve();
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
  }),
}));

jest.mock("../errorNormalizer", () => ({
  normalizeAnthropicError: jest.fn().mockImplementation((error: unknown) => {
    if (error instanceof BridgeError) return error;
    return new BridgeError("Normalized error", "PROVIDER_ERROR");
  }),
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

describe("AnthropicMessagesV1Provider Integration", () => {
  let provider: AnthropicMessagesV1Provider;

  beforeEach(() => {
    provider = new AnthropicMessagesV1Provider();
    jest.clearAllMocks();
  });

  describe("basic integration", () => {
    it("should have correct provider metadata", () => {
      expect(provider.id).toBe("anthropic");
      expect(provider.name).toBe("Anthropic Messages Provider");
      expect(provider.version).toBe("2023-06-01");
    });

    it("should support any model", () => {
      expect(provider.supportsModel("any-model")).toBe(true);
    });
  });

  describe("translateRequest integration", () => {
    it("should call translateChatRequest with correct parameters", async () => {
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
      expect(mockTranslateChatRequest).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          apiKey: "sk-ant-test123",
          baseUrl: "https://api.anthropic.com",
          version: "2023-06-01",
          timeout: 30000,
          maxRetries: 3,
        }),
      );
    });

    it("should throw when not initialized", () => {
      const request = {
        messages: [],
        model: "claude-3-5-sonnet-20241022",
      };

      expect(() => provider.translateRequest(request)).toThrow(BridgeError);
      expect(() => provider.translateRequest(request)).toThrow(
        "Provider not initialized",
      );
    });
  });

  describe("parseResponse integration", () => {
    it("should call parseAnthropicResponse for non-streaming", async () => {
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      const mockBody = new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode('{"message": {"role": "assistant", "content": []}}'),
          );
          controller.close();
        },
      });

      const mockResponse: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: mockBody,
      };

      const result = provider.parseResponse(mockResponse, false);
      expect(result).toBeInstanceOf(Promise);

      const resolvedResult = await result;
      expect(resolvedResult).toEqual({
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        model: "claude-3",
        usage: { promptTokens: 10, completionTokens: 5 },
      });
      expect(mockParseAnthropicResponse).toHaveBeenCalled();
    });

    it("should call parseAnthropicResponseStream for streaming", async () => {
      const config = { apiKey: "sk-ant-test123" };
      await provider.initialize(config);

      const mockResponse: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: new ReadableStream(),
      };

      const result = provider.parseResponse(mockResponse, true);
      expect(result).toEqual(
        expect.objectContaining({
          [Symbol.asyncIterator]: expect.any(Function),
        }),
      );
      expect(mockParseAnthropicResponseStream).toHaveBeenCalledWith(
        mockResponse,
      );
    });
  });

  describe("isTerminal integration", () => {
    it("should return true for complete response objects", () => {
      const response = {
        message: { role: "assistant" as const, content: [] },
        model: "claude-3",
        usage: { promptTokens: 10, completionTokens: 5 },
      };

      expect(provider.isTerminal(response)).toBe(true);
    });

    it("should return finished status for StreamDelta", () => {
      const finishedDelta: StreamDelta = {
        id: "chunk-1",
        delta: { content: [] },
        finished: true,
      };

      const ongoingDelta: StreamDelta = {
        id: "chunk-2",
        delta: { content: [{ type: "text", text: "Hello" }] },
        finished: false,
      };

      expect(provider.isTerminal(finishedDelta)).toBe(true);
      expect(provider.isTerminal(ongoingDelta)).toBe(false);
    });
  });

  describe("normalizeError integration", () => {
    it("should call normalizeAnthropicError with correct context", () => {
      const error = new Error("Test error");
      const result = provider.normalizeError(error);

      expect(result).toEqual(expect.any(BridgeError));
      expect(mockNormalizeAnthropicError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          provider: "anthropic",
          version: "2023-06-01",
          timestamp: expect.any(String),
        }),
      );
    });
  });
});
