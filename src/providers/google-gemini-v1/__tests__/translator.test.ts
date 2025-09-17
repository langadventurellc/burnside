/**
 * Google Gemini v1 Request Translator Tests
 *
 * Comprehensive unit test suite validating all aspects of request translation
 * from unified format to Google Gemini API v1 format.
 */

import { describe, test, expect } from "@jest/globals";
import type { ChatRequest } from "../../../client/chatRequest";
import type { GoogleGeminiV1Config } from "../configSchema";
import { translateChatRequest } from "../translator";
import { ValidationError } from "../../../core/errors/validationError";

/**
 * Helper function to safely parse request body JSON
 */
function parseBody(
  body: string | Uint8Array | undefined,
): Record<string, unknown> {
  if (!body) {
    throw new Error("Expected body to be provided");
  }
  const bodyString =
    typeof body === "string" ? body : new TextDecoder().decode(body);
  return JSON.parse(bodyString) as Record<string, unknown>;
}

/**
 * Mock configuration for testing
 */
const mockConfig: GoogleGeminiV1Config = {
  apiKey: "test-api-key-123",
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/",
  timeout: 30000,
  maxRetries: 3,
};

/**
 * Mock configuration with custom base URL
 */
const customBaseUrlConfig: GoogleGeminiV1Config = {
  apiKey: "test-api-key-456",
  baseUrl: "https://custom.googleapis.com/v1beta/",
  timeout: 60000,
  maxRetries: 5,
};

describe("translateChatRequest", () => {
  describe("successful translation", () => {
    test("translates minimal request with single text message", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello, world!" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(result.url).toBe(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      );
      expect(result.method).toBe("POST");
      expect(result.headers).toEqual({
        "x-goog-api-key": "test-api-key-123",
        "Content-Type": "application/json",
      });

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [{ text: "Hello, world!" }],
        },
      ]);
    });

    test("translates request with all optional parameters", () => {
      const request: ChatRequest & { stream: boolean } = {
        model: "gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test message" }],
          },
        ],
        temperature: 0.7,
        maxTokens: 1000,
        stream: true,
        options: {
          topK: 40,
          topP: 0.9,
          stopSequences: ["END", "STOP"],
        },
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(result.url).toBe(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent",
      );

      expect(body.generationConfig).toEqual({
        temperature: 0.7,
        maxOutputTokens: 1000,
        topK: 40,
        topP: 0.9,
        stopSequences: ["END", "STOP"],
      });
    });

    test("translates multi-part content with text and image", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What's in this image?" },
              {
                type: "image",
                mimeType: "image/jpeg",
                data: "base64ImageData123",
              },
            ],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [
            { text: "What's in this image?" },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: "base64ImageData123",
              },
            },
          ],
        },
      ]);
    });

    test("translates document content", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this document" },
              {
                type: "document",
                mimeType: "application/pdf",
                data: "base64PdfData456",
              },
            ],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [
            { text: "Analyze this document" },
            {
              inline_data: {
                mime_type: "application/pdf",
                data: "base64PdfData456",
              },
            },
          ],
        },
      ]);
    });

    test("translates conversation with user and assistant messages", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            role: "assistant",
            content: [{ type: "text", text: "Hi there!" }],
          },
          {
            role: "user",
            content: [{ type: "text", text: "How are you?" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [{ text: "Hello" }],
        },
        {
          role: "model",
          parts: [{ text: "Hi there!" }],
        },
        {
          role: "user",
          parts: [{ text: "How are you?" }],
        },
      ]);
    });

    test("handles code content as text", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Review this code:" },
              { type: "code", text: "console.log('hello');" },
            ],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [
            { text: "Review this code:" },
            { text: "console.log('hello');" },
          ],
        },
      ]);
    });
  });

  describe("system message handling", () => {
    test("extracts and merges system message into user message", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: "You are a helpful assistant." }],
          },
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [{ text: "You are a helpful assistant." }, { text: "Hello" }],
        },
      ]);
    });

    test("merges multiple system messages", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: "You are helpful." }],
          },
          {
            role: "system",
            content: [{ type: "text", text: "Be concise." }],
          },
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [
            { text: "You are helpful." },
            { text: "Be concise." },
            { text: "Hello" },
          ],
        },
      ]);
    });

    test("creates user message when only system messages exist", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: "You are a helpful assistant." }],
          },
          {
            role: "assistant",
            content: [{ type: "text", text: "I'm ready to help!" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [{ text: "You are a helpful assistant." }],
        },
        {
          role: "model",
          parts: [{ text: "I'm ready to help!" }],
        },
      ]);
    });

    test("handles system message with multimodal content", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: [
              { type: "text", text: "Analyze images carefully." },
              {
                type: "image",
                mimeType: "image/jpeg",
                data: "exampleImage",
              },
            ],
          },
          {
            role: "user",
            content: [{ type: "text", text: "What do you see?" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [
            { text: "Analyze images carefully." },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: "exampleImage",
              },
            },
            { text: "What do you see?" },
          ],
        },
      ]);
    });
  });

  describe("endpoint URL construction", () => {
    test("constructs non-streaming endpoint URL", () => {
      const request: ChatRequest = {
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);

      expect(result.url).toBe(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      );
    });

    test("constructs streaming endpoint URL", () => {
      const request: ChatRequest & { stream: boolean } = {
        model: "gemini-2.0-flash-lite",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        stream: true,
      };

      const result = translateChatRequest(request, mockConfig);

      expect(result.url).toBe(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:streamGenerateContent",
      );
    });

    test("uses custom base URL from config", () => {
      const request: ChatRequest = {
        model: "gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const result = translateChatRequest(request, customBaseUrlConfig);

      expect(result.url).toBe(
        "https://custom.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
      );
    });

    test("handles base URL with trailing slash", () => {
      const configWithSlash: GoogleGeminiV1Config = {
        ...mockConfig,
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/",
      };

      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const result = translateChatRequest(request, configWithSlash);

      expect(result.url).toBe(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      );
    });
  });

  describe("header construction", () => {
    test("includes x-goog-api-key header", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);

      expect(result.headers).toEqual({
        "x-goog-api-key": "test-api-key-123",
        "Content-Type": "application/json",
      });
    });

    test("uses API key from custom config", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const result = translateChatRequest(request, customBaseUrlConfig);

      expect(result.headers).toEqual({
        "x-goog-api-key": "test-api-key-456",
        "Content-Type": "application/json",
      });
    });
  });

  describe("request validation", () => {
    test("validates generated request against schema", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test message" }],
          },
        ],
        temperature: 0.5,
        maxTokens: 500,
      };

      // Should not throw - validates successfully
      expect(() => translateChatRequest(request, mockConfig)).not.toThrow();
    });

    test("includes generation config when parameters provided", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        temperature: 1.5,
        maxTokens: 2000,
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.generationConfig).toEqual({
        temperature: 1.5,
        maxOutputTokens: 2000,
      });
    });

    test("includes thinking config only when model supports thinking", () => {
      const request: ChatRequest = {
        model: "gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      // Test with thinking capability enabled
      const modelCapabilities = {
        streaming: true,
        toolCalls: true,
        images: true,
        documents: true,
        thinking: true,
        supportedContentTypes: ["text"],
      };

      const result = translateChatRequest(
        request,
        mockConfig,
        modelCapabilities,
      );
      const body = parseBody(result.body);

      expect(body.generationConfig).toBeDefined();
      expect((body.generationConfig as any).thinkingConfig).toEqual({
        thinkingBudget: 512,
      });
    });

    test("excludes thinking config when model does not support thinking", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      // Test with thinking capability disabled
      const modelCapabilities = {
        streaming: true,
        toolCalls: true,
        images: true,
        documents: true,
        thinking: false,
        supportedContentTypes: ["text"],
      };

      const result = translateChatRequest(
        request,
        mockConfig,
        modelCapabilities,
      );
      const body = parseBody(result.body);

      expect(body.generationConfig).toBeDefined();
      expect((body.generationConfig as any).thinkingConfig).toBeUndefined();
    });

    test("excludes thinking config when no model capabilities provided", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.generationConfig).toBeDefined();
      expect((body.generationConfig as any).thinkingConfig).toBeUndefined();
    });
  });

  describe("error handling", () => {
    test("throws ValidationError for empty messages array", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "At least one message is required",
      );
    });

    test("throws ValidationError for undefined messages", () => {
      const request = {
        model: "gemini-2.0-flash",
        messages: undefined,
      } as unknown as ChatRequest;

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
    });

    test("throws ValidationError for unsupported content type", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "audio", data: "audiodata" } as unknown as {
                type: "text";
                text: string;
              },
            ],
          },
        ],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Unsupported content type: audio",
      );
    });

    test("throws ValidationError for unsupported message role", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "function" as unknown as "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Unsupported message role: function",
      );
    });

    test("wraps unexpected errors in ValidationError", () => {
      // Create a malformed request that would cause an unexpected error
      const request = {
        model: "gemini-2.0-flash",
        messages: [null],
      } as unknown as ChatRequest;

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Failed to translate request to Gemini format",
      );
    });
  });

  describe("edge cases", () => {
    test("handles message with empty content array", () => {
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [],
          },
        ],
      };

      // Should fail schema validation due to empty parts array
      expect(() => translateChatRequest(request, mockConfig)).toThrow();
    });

    test("handles boundary temperature values", () => {
      const requestMin: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        temperature: 0,
      };

      const requestMax: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        temperature: 2,
      };

      expect(() => translateChatRequest(requestMin, mockConfig)).not.toThrow();
      expect(() => translateChatRequest(requestMax, mockConfig)).not.toThrow();
    });

    test("handles very long text content", () => {
      const longText = "a".repeat(10000);
      const request: ChatRequest = {
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: longText }],
          },
        ],
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.contents).toEqual([
        {
          role: "user",
          parts: [{ text: longText }],
        },
      ]);
    });
  });
});
