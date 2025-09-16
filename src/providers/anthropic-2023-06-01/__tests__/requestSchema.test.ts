/**
 * Anthropic Messages API Request Schema Tests
 */

import {
  AnthropicMessagesRequestSchema,
  type AnthropicMessagesRequestType,
} from "../requestSchema.js";

describe("AnthropicMessagesRequestSchema", () => {
  describe("valid requests", () => {
    it("should validate minimal valid request", () => {
      const validRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user" as const,
            content: "Hello, world!",
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should validate request with all optional parameters", () => {
      const validRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [
          {
            role: "user" as const,
            content: "Hello, world!",
          },
        ],
        system: "You are a helpful assistant.",
        tools: [
          {
            name: "get_weather",
            description: "Get current weather information",
            input_schema: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "City name",
                },
              },
              required: ["location"],
            },
          },
        ],
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
        stop_sequences: ["STOP", "END"],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should validate multimodal content with text and image", () => {
      const validRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const,
                text: "What do you see in this image?",
              },
              {
                type: "image" as const,
                source: {
                  type: "base64" as const,
                  media_type: "image/jpeg" as const,
                  data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                },
              },
            ],
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should validate assistant message in conversation", () => {
      const validRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user" as const,
            content: "Hello!",
          },
          {
            role: "assistant" as const,
            content: "Hello! How can I help you today?",
          },
          {
            role: "user" as const,
            content: "Tell me a joke.",
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid requests", () => {
    it("should reject request with missing model", () => {
      const invalidRequest = {
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Hello, world!",
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject request with missing max_tokens", () => {
      const invalidRequest = {
        model: "claude-3-sonnet-20240229",
        messages: [
          {
            role: "user",
            content: "Hello, world!",
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject request with empty messages array", () => {
      const invalidRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid role", () => {
      const invalidRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "system",
            content: "Hello, world!",
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject request with negative max_tokens", () => {
      const invalidRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: -100,
        messages: [
          {
            role: "user",
            content: "Hello, world!",
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject request with temperature out of range", () => {
      const invalidRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Hello, world!",
          },
        ],
        temperature: 1.5,
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject request with top_p out of range", () => {
      const invalidRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Hello, world!",
          },
        ],
        top_p: 1.1,
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject image content with invalid media type", () => {
      const invalidRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/svg+xml",
                  data: "base64data",
                },
              },
            ],
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject tool with missing name", () => {
      const invalidRequest = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Hello, world!",
          },
        ],
        tools: [
          {
            description: "A tool without a name",
            input_schema: {},
          },
        ],
      };

      const result = AnthropicMessagesRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("boundary cases", () => {
    it("should accept temperature at boundary values", () => {
      const request1 = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [{ role: "user" as const, content: "Test" }],
        temperature: 0,
      };

      const request2 = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [{ role: "user" as const, content: "Test" }],
        temperature: 1,
      };

      expect(AnthropicMessagesRequestSchema.safeParse(request1).success).toBe(
        true,
      );
      expect(AnthropicMessagesRequestSchema.safeParse(request2).success).toBe(
        true,
      );
    });

    it("should accept top_p at boundary values", () => {
      const request1 = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [{ role: "user" as const, content: "Test" }],
        top_p: 0,
      };

      const request2 = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [{ role: "user" as const, content: "Test" }],
        top_p: 1,
      };

      expect(AnthropicMessagesRequestSchema.safeParse(request1).success).toBe(
        true,
      );
      expect(AnthropicMessagesRequestSchema.safeParse(request2).success).toBe(
        true,
      );
    });

    it("should accept max_tokens at minimum value", () => {
      const request = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 1,
        messages: [{ role: "user" as const, content: "Test" }],
      };

      expect(AnthropicMessagesRequestSchema.safeParse(request).success).toBe(
        true,
      );
    });
  });

  describe("type inference", () => {
    it("should properly infer TypeScript types", () => {
      const request: AnthropicMessagesRequestType = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Hello, world!",
          },
        ],
      };

      // This test passes if TypeScript compilation succeeds
      expect(request.model).toBe("claude-3-sonnet-20240229");
      expect(request.max_tokens).toBe(100);
      expect(request.messages).toHaveLength(1);
    });
  });
});
