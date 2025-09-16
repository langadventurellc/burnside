/**
 * Anthropic Messages API Response Schema Tests
 */

import {
  AnthropicMessagesResponseSchema,
  AnthropicStreamingResponseSchema,
  AnthropicErrorResponseSchema,
  type AnthropicMessagesResponseType,
} from "../responseSchema.js";

describe("AnthropicMessagesResponseSchema", () => {
  describe("valid responses", () => {
    it("should validate basic text response", () => {
      const validResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello! How can I help you today?",
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 25,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should validate response with tool use", () => {
      const validResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "I'll get the weather for you.",
          },
          {
            type: "tool_use",
            id: "toolu_01A09q90qw90lq917835lq9",
            name: "get_weather",
            input: {
              location: "San Francisco",
              unit: "celsius",
            },
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 50,
          output_tokens: 35,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should validate response with null stop_reason", () => {
      const validResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "This is a response with null stop reason.",
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: null,
        usage: {
          input_tokens: 15,
          output_tokens: 20,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should validate response with stop_sequence", () => {
      const validResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "This response was stopped by a sequence",
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: "stop_sequence",
        stop_sequence: "STOP",
        usage: {
          input_tokens: 15,
          output_tokens: 18,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid responses", () => {
    it("should reject response with missing required fields", () => {
      const invalidResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        // missing content
        model: "claude-3-sonnet-20240229",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 10,
          output_tokens: 25,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject response with invalid role", () => {
      const invalidResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "user", // Should be "assistant"
        content: [
          {
            type: "text",
            text: "Hello!",
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 10,
          output_tokens: 25,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject response with invalid content type", () => {
      const invalidResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "image", // Invalid type for response content
            text: "Hello!",
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 10,
          output_tokens: 25,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject response with invalid stop_reason", () => {
      const invalidResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello!",
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: "invalid_reason",
        usage: {
          input_tokens: 10,
          output_tokens: 25,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject response with negative token counts", () => {
      const invalidResponse = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello!",
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: "end_turn",
        usage: {
          input_tokens: -10,
          output_tokens: 25,
        },
      };

      const result = AnthropicMessagesResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should properly infer TypeScript types", () => {
      const response: AnthropicMessagesResponseType = {
        id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello!",
          },
        ],
        model: "claude-3-sonnet-20240229",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 25,
        },
      };

      // This test passes if TypeScript compilation succeeds
      expect(response.id).toBe("msg_013Zva2CMHLNnXjNJJKqJ2EF");
      expect(response.role).toBe("assistant");
      expect(response.content).toHaveLength(1);
    });
  });
});

describe("AnthropicStreamingResponseSchema", () => {
  describe("streaming events", () => {
    it("should validate message_start event", () => {
      const messageStart = {
        type: "message_start",
        message: {
          id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
          type: "message",
          role: "assistant",
          content: [],
          model: "claude-3-sonnet-20240229",
          stop_reason: null,
          stop_sequence: null,
        },
      };

      const result = AnthropicStreamingResponseSchema.safeParse(messageStart);
      expect(result.success).toBe(true);
    });

    it("should validate content_block_start event", () => {
      const contentBlockStart = {
        type: "content_block_start",
        index: 0,
        content_block: {
          type: "text",
        },
      };

      const result =
        AnthropicStreamingResponseSchema.safeParse(contentBlockStart);
      expect(result.success).toBe(true);
    });

    it("should validate content_block_delta event", () => {
      const contentBlockDelta = {
        type: "content_block_delta",
        index: 0,
        delta: {
          text: "Hello",
        },
      };

      const result =
        AnthropicStreamingResponseSchema.safeParse(contentBlockDelta);
      expect(result.success).toBe(true);
    });

    it("should validate content_block_stop event", () => {
      const contentBlockStop = {
        type: "content_block_stop",
        index: 0,
      };

      const result =
        AnthropicStreamingResponseSchema.safeParse(contentBlockStop);
      expect(result.success).toBe(true);
    });

    it("should validate message_delta event", () => {
      const messageDelta = {
        type: "message_delta",
        delta: {
          stop_reason: "end_turn",
          stop_sequence: null,
        },
      };

      const result = AnthropicStreamingResponseSchema.safeParse(messageDelta);
      expect(result.success).toBe(true);
    });

    it("should validate message_stop event", () => {
      const messageStop = {
        type: "message_stop",
      };

      const result = AnthropicStreamingResponseSchema.safeParse(messageStop);
      expect(result.success).toBe(true);
    });

    it("should validate tool use delta", () => {
      const toolUseDelta = {
        type: "content_block_delta",
        index: 1,
        delta: {
          input: {
            location: "San Francisco",
          },
        },
      };

      const result = AnthropicStreamingResponseSchema.safeParse(toolUseDelta);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid streaming events", () => {
    it("should reject invalid event type", () => {
      const invalidEvent = {
        type: "invalid_type",
      };

      const result = AnthropicStreamingResponseSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject negative index", () => {
      const invalidEvent = {
        type: "content_block_start",
        index: -1,
      };

      const result = AnthropicStreamingResponseSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });
});

describe("AnthropicErrorResponseSchema", () => {
  describe("valid error responses", () => {
    it("should validate basic error response", () => {
      const errorResponse = {
        type: "error",
        error: {
          type: "invalid_request_error",
          message: "The request was invalid.",
        },
      };

      const result = AnthropicErrorResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });

    it("should validate authentication error", () => {
      const errorResponse = {
        type: "error",
        error: {
          type: "authentication_error",
          message: "Invalid API key provided.",
        },
      };

      const result = AnthropicErrorResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });

    it("should validate rate limit error", () => {
      const errorResponse = {
        type: "error",
        error: {
          type: "rate_limit_error",
          message: "Rate limit exceeded. Please try again later.",
        },
      };

      const result = AnthropicErrorResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid error responses", () => {
    it("should reject error response with wrong type", () => {
      const invalidResponse = {
        type: "message", // Should be "error"
        error: {
          type: "invalid_request_error",
          message: "The request was invalid.",
        },
      };

      const result = AnthropicErrorResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject error response without error field", () => {
      const invalidResponse = {
        type: "error",
        // missing error field
      };

      const result = AnthropicErrorResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject error response with incomplete error object", () => {
      const invalidResponse = {
        type: "error",
        error: {
          type: "invalid_request_error",
          // missing message field
        },
      };

      const result = AnthropicErrorResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
