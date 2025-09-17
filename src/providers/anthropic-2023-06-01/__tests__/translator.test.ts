/**
 * Anthropic Messages API Request Translator Tests
 *
 * Comprehensive test suite for the request translator with >90% coverage target.
 */

import { describe, test, expect } from "@jest/globals";
import type { ChatRequest } from "../../../client/chatRequest";
import { ValidationError } from "../../../core/errors/validationError";
import { translateChatRequest } from "../translator";
import type { AnthropicMessagesConfigType } from "../configSchema";

/**
 * Helper function to parse request body from ProviderHttpRequest
 */
function parseBody(body: string | Uint8Array | undefined): any {
  if (!body) return {};
  const bodyString =
    typeof body === "string" ? body : new TextDecoder().decode(body);
  return JSON.parse(bodyString);
}

/**
 * Mock configuration for testing
 */
const mockConfig: AnthropicMessagesConfigType = {
  apiKey: "sk-ant-test123456789",
  baseUrl: "https://api.anthropic.com",
  version: "2023-06-01",
  timeout: 30000,
  maxRetries: 3,
};

describe("translateChatRequest", () => {
  describe("Successful Translation", () => {
    test("should translate minimal request with single text message", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello, world!" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);

      expect(result.method).toBe("POST");
      expect(result.url).toBe("https://api.anthropic.com/v1/messages");
      expect(result.headers).toEqual({
        "Content-Type": "application/json",
        "x-api-key": "sk-ant-test123456789",
        "anthropic-version": "2023-06-01",
      });

      const body = parseBody(result.body);
      expect(body).toEqual({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: "Hello, world!",
          },
        ],
      });
    });

    test("should translate request with all optional parameters", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-opus-20240229",
        maxTokens: 2000,
        temperature: 0.7,
        stream: true,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Generate a story" }],
          },
        ],
        options: {
          topP: 0.9,
          stopSequences: ["STOP", "END"],
        },
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body).toEqual({
        model: "claude-3-opus-20240229",
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        stop_sequences: ["STOP", "END"],
        stream: true,
        messages: [
          {
            role: "user",
            content: "Generate a story",
          },
        ],
      });
    });

    test("should handle multi-modal content (text + image)", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What's in this image?" },
              {
                type: "image",
                data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                mimeType: "image/png",
              },
            ],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.messages[0].content).toEqual([
        { type: "text", text: "What's in this image?" },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          },
        },
      ]);
    });

    test("should extract system message and place in system field", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: "You are a helpful assistant." }],
          },
          {
            role: "user",
            content: [{ type: "text", text: "Hello!" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.system).toBe("You are a helpful assistant.");
      expect(body.messages).toEqual([
        {
          role: "user",
          content: "Hello!",
        },
      ]);
    });

    test("should handle code content as text", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Review this code:" },
              { type: "code", text: "function hello() { return 'world'; }" },
            ],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.messages[0].content).toEqual([
        { type: "text", text: "Review this code:" },
        { type: "text", text: "function hello() { return 'world'; }" },
      ]);
    });

    test("should include tools placeholder when tools provided", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Use a tool" }],
          },
        ],
        tools: [
          {
            name: "test_tool",
            description: "A test tool",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.tools).toEqual([]);
    });
  });

  describe("Content Type Mapping", () => {
    test("should convert text content correctly", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello, world!" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.messages[0].content).toBe("Hello, world!");
    });

    test("should convert image content to base64 format", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                data: "base64data",
                mimeType: "image/jpeg",
              },
            ],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.messages[0].content).toEqual([
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: "base64data",
          },
        },
      ]);
    });

    test("should reject document content type", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                data: "document content",
                mimeType: "application/pdf",
              } as any,
            ],
          },
        ],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Document content type is not supported by Anthropic Messages API",
      );
    });

    test("should reject unknown content types", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "unknown",
                text: "some content",
              } as any,
            ],
          },
        ],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Unsupported content type: unknown",
      );
    });
  });

  describe("Parameter Mapping and Validation", () => {
    test("should validate temperature range", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        temperature: 1.5, // Invalid - above 1.0
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Temperature must be between 0 and 1 for Anthropic API",
      );
    });

    test("should handle stream parameter correctly", () => {
      const streamingRequest: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        stream: true,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result = translateChatRequest(streamingRequest, mockConfig);
      const body = parseBody(result.body);
      expect(body.stream).toBe(true);

      const nonStreamingRequest: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        stream: false,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result2 = translateChatRequest(nonStreamingRequest, mockConfig);
      const body2 = parseBody(result2.body);
      expect(body2.stream).toBeUndefined();
    });

    test("should handle optional parameters from options", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        options: {
          topP: 0.95,
          stopSequences: ["STOP"],
        },
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.top_p).toBe(0.95);
      expect(body.stop_sequences).toEqual(["STOP"]);
    });

    test("should ignore empty stopSequences array", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        options: {
          stopSequences: [],
        },
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.stop_sequences).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    test("should throw error for empty messages array", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Messages array cannot be empty",
      );
    });

    test("should throw error for missing maxTokens", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "maxTokens is required for Anthropic API",
      );
    });

    test("should throw error when no messages remain after filtering system", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: "You are helpful" }],
          },
        ],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Messages array cannot be empty after filtering",
      );
    });

    test("should handle invalid temperature bounds", () => {
      const lowTempRequest: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        temperature: -0.1,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      expect(() => translateChatRequest(lowTempRequest, mockConfig)).toThrow(
        ValidationError,
      );
    });
  });

  describe("HTTP Request Structure", () => {
    test("should construct correct URL with baseUrl", () => {
      const customConfig: AnthropicMessagesConfigType = {
        ...mockConfig,
        baseUrl: "https://custom.anthropic.com",
      };

      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result = translateChatRequest(request, customConfig);
      expect(result.url).toBe("https://custom.anthropic.com/v1/messages");
    });

    test("should include correct headers", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);

      expect(result.headers).toEqual({
        "Content-Type": "application/json",
        "x-api-key": "sk-ant-test123456789",
        "anthropic-version": "2023-06-01",
      });
    });

    test("should use POST method", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      expect(result.method).toBe("POST");
    });

    test("should properly serialize request body", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      expect(typeof result.body).toBe("string");

      const parsed = parseBody(result.body);
      expect(parsed).toBeDefined();
      expect(parsed.model).toBe("claude-3-sonnet-20240229");
    });
  });

  describe("Edge Cases", () => {
    test("should handle system message without text content", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "system",
            content: [
              {
                type: "image",
                data: "base64data",
                mimeType: "image/png",
              } as any,
            ],
          },
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.system).toBeUndefined();
      expect(body.messages).toHaveLength(1);
    });

    test("should handle non-array stopSequences gracefully", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        options: {
          stopSequences: "not an array" as any,
        },
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.stop_sequences).toBeUndefined();
    });

    test("should handle missing options object", () => {
      const request: ChatRequest & { stream?: boolean } = {
        model: "claude-3-sonnet-20240229",
        maxTokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };
      // options is undefined

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.top_p).toBeUndefined();
      expect(body.stop_sequences).toBeUndefined();
    });
  });
});
