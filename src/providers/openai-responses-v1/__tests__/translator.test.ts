/**
 * OpenAI Responses v1 Translator Tests
 */

import { describe, test, expect } from "@jest/globals";
import type { ChatRequest } from "../../../client/chatRequest";
import type { Message } from "../../../core/messages/message";
import { ValidationError } from "../../../core/errors/validationError";
import { translateChatRequest } from "../translator";
import type { OpenAIResponsesV1Config } from "../configSchema";

const mockConfig: OpenAIResponsesV1Config = {
  apiKey: "sk-test-key-123",
  baseUrl: "https://api.openai.com/v1",
};

const mockConfigWithOptions: OpenAIResponsesV1Config = {
  apiKey: "sk-test-key-456",
  baseUrl: "https://custom.openai.com/v1",
  organization: "org-123",
  project: "proj-456",
  headers: {
    "X-Custom-Header": "custom-value",
  },
};

// Helper function to parse response body safely
function parseBody(body: string | Uint8Array): any {
  const bodyString =
    typeof body === "string" ? body : new TextDecoder().decode(body);
  return JSON.parse(bodyString);
}

describe("translateChatRequest", () => {
  describe("successful translation", () => {
    test("should translate minimal request with text message", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello, world!" }],
          },
        ],
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);

      expect(result.url).toBe("https://api.openai.com/v1/responses");
      expect(result.method).toBe("POST");
      expect(result.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer sk-test-key-123",
      });

      const body = parseBody(result.body!);
      expect(body).toEqual({
        model: "gpt-4",
        input: [
          {
            type: "message",
            role: "user",
            content: "Hello, world!",
          },
        ],
        stream: false,
      });
    });

    test("should translate request with all optional parameters", () => {
      const request: ChatRequest & { stream: boolean } = {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: "You are a helpful assistant." }],
          },
          {
            role: "user",
            content: [{ type: "text", text: "What is the weather?" }],
          },
        ],
        temperature: 0.7,
        maxTokens: 1000,
        stream: true,
        options: {
          topP: 0.9,
          frequencyPenalty: 0.1,
        },
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfigWithOptions);

      expect(result.url).toBe("https://custom.openai.com/v1/responses");
      expect(result.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer sk-test-key-456",
        "OpenAI-Organization": "org-123",
        "OpenAI-Project": "proj-456",
        "X-Custom-Header": "custom-value",
      });

      const body = parseBody(result.body!);
      expect(body).toEqual({
        model: "gpt-4o",
        input: [
          {
            type: "message",
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            type: "message",
            role: "user",
            content: "What is the weather?",
          },
        ],
        temperature: 0.7,
        max_output_tokens: 1000,
        stream: true,
        top_p: 0.9,
        frequency_penalty: 0.1,
      });
    });

    test("should handle multi-part content with text and images", () => {
      const request: ChatRequest = {
        model: "gpt-4-vision",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What do you see in this image?" },
              {
                type: "image",
                data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAY",
                mimeType: "image/png",
                alt: "Test image",
              },
            ],
          },
        ],
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);

      const body = parseBody(result.body!);
      expect(body.input[0].content).toEqual([
        {
          type: "text",
          text: "What do you see in this image?",
        },
        {
          type: "image_url",
          image_url: {
            url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAY",
            detail: "auto",
          },
        },
      ]);
    });

    test("should handle code content as text", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "code",
                text: "console.log('Hello');",
                language: "javascript",
              },
            ],
          },
        ],
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);

      const body = parseBody(result.body!);
      expect(body.input[0].content).toBe("console.log('Hello');");
    });

    test("should handle multiple messages with different roles", () => {
      const messages: Message[] = [
        {
          role: "system",
          content: [{ type: "text", text: "You are helpful." }],
        },
        {
          role: "user",
          content: [{ type: "text", text: "Hello!" }],
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "Hi there!" }],
        },
      ];

      const request: ChatRequest = {
        model: "gpt-4",
        messages,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);

      const body = parseBody(result.body!);
      expect(body.input).toEqual([
        { type: "message", role: "system", content: "You are helpful." },
        { type: "message", role: "user", content: "Hello!" },
        { type: "message", role: "assistant", content: "Hi there!" },
      ]);
    });
  });

  describe("error handling", () => {
    test("should throw ValidationError for document content type", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                data: "base64data",
                mimeType: "application/pdf",
                name: "test.pdf",
              } as any,
            ],
          },
        ],
        providerConfig: "default",
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        "Document content type is not supported by OpenAI Responses API",
      );
    });

    test("should throw ValidationError for unknown content type", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "unknown",
                data: "test",
              } as any,
            ],
          },
        ],
        providerConfig: "default",
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        /Unsupported content type: unknown/,
      );
    });

    test("should throw ValidationError for invalid request structure", () => {
      const request = {
        model: "", // Invalid: empty model
        messages: [],
        providerConfig: "default",
      } as ChatRequest;

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
    });

    test("should preserve ValidationError when thrown from content conversion", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                data: "base64data",
                mimeType: "application/pdf",
              } as any,
            ],
          },
        ],
        providerConfig: "default",
      };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );

      try {
        translateChatRequest(request, mockConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).context).toEqual({
          contentType: "document",
        });
      }
    });
  });

  describe("URL construction", () => {
    test("should use default baseUrl when not provided", () => {
      const config: OpenAIResponsesV1Config = {
        apiKey: "sk-test",
        baseUrl: "https://api.openai.com/v1",
      };

      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        providerConfig: "default",
      };

      const result = translateChatRequest(request, config);
      expect(result.url).toBe("https://api.openai.com/v1/responses");
    });

    test("should use custom baseUrl correctly", () => {
      const config: OpenAIResponsesV1Config = {
        apiKey: "sk-test",
        baseUrl: "https://custom.api.com/v2",
      };

      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        providerConfig: "default",
      };

      const result = translateChatRequest(request, config);
      expect(result.url).toBe("https://custom.api.com/v2/responses");
    });
  });

  describe("header construction", () => {
    test("should include only authorization header with minimal config", () => {
      const config: OpenAIResponsesV1Config = {
        apiKey: "sk-minimal",
        baseUrl: "https://api.openai.com/v1",
      };

      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        providerConfig: "default",
      };

      const result = translateChatRequest(request, config);
      expect(result.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer sk-minimal",
      });
    });

    test("should include all optional headers when provided", () => {
      const result = translateChatRequest(
        {
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: "Test" }],
            },
          ],
          providerConfig: "default",
        },
        mockConfigWithOptions,
      );

      expect(result.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer sk-test-key-456",
        "OpenAI-Organization": "org-123",
        "OpenAI-Project": "proj-456",
        "X-Custom-Header": "custom-value",
      });
    });
  });

  describe("parameter mapping", () => {
    test("should map camelCase options to snake_case", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        options: {
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.3,
          maxTokens: 500,
        },
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.top_p).toBe(0.9);
      expect(body.frequency_penalty).toBe(0.5);
      expect(body.presence_penalty).toBe(0.3);
      expect(body.max_output_tokens).toBe(500);
    });

    test("should handle maxTokens parameter mapping", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        maxTokens: 2000,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.max_output_tokens).toBe(2000);
    });

    test("should handle stream parameter", () => {
      const request: ChatRequest & { stream: boolean } = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Test" }],
          },
        ],
        stream: false,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.stream).toBe(false);
    });
  });
});
