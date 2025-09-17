/**
 * xAI v1 Streaming Response Schema Tests
 *
 * Comprehensive unit tests for xAI streaming response schema validation.
 */

import { XAIV1StreamingResponseSchema } from "../streamingResponseSchema";

describe("XAIV1StreamingResponseSchema", () => {
  describe("Valid Streaming Responses", () => {
    it("should validate minimal streaming chunk", () => {
      const validChunk = {
        id: "resp_stream_123",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {
              content: [
                {
                  type: "output_text",
                  text: "Hello",
                },
              ],
            },
          },
        ],
      };

      const result = XAIV1StreamingResponseSchema.safeParse(validChunk);
      expect(result.success).toBe(true);
    });

    it("should validate streaming chunk with role", () => {
      const validChunk = {
        id: "resp_stream_456",
        object: "response.chunk",
        status: "in_progress",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: " world!",
                },
              ],
            },
          },
        ],
        created_at: 1726426789,
      };

      const result = XAIV1StreamingResponseSchema.safeParse(validChunk);
      expect(result.success).toBe(true);
    });

    it("should validate streaming chunk with tool calls", () => {
      const validChunk = {
        id: "resp_stream_tool",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {
              tool_calls: [
                {
                  id: "call_123",
                  type: "function",
                  function: {
                    name: "get_weather",
                    arguments: '{"location": "San Francisco"}',
                  },
                },
              ],
            },
          },
        ],
      };

      const result = XAIV1StreamingResponseSchema.safeParse(validChunk);
      expect(result.success).toBe(true);
    });

    it("should validate final streaming chunk with usage", () => {
      const finalChunk = {
        id: "resp_stream_final",
        object: "response.chunk",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {},
          },
        ],
        usage: {
          input_tokens: 15,
          input_tokens_details: {
            cached_tokens: 5,
          },
          output_tokens: 25,
          output_tokens_details: {
            reasoning_tokens: 3,
          },
          total_tokens: 40,
        },
        created_at: 1726426800,
      };

      const result = XAIV1StreamingResponseSchema.safeParse(finalChunk);
      expect(result.success).toBe(true);
    });

    it("should validate empty delta chunk", () => {
      const emptyDelta = {
        id: "resp_stream_empty",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {},
          },
        ],
      };

      const result = XAIV1StreamingResponseSchema.safeParse(emptyDelta);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Streaming Responses", () => {
    it("should reject missing required fields", () => {
      const invalidChunks = [
        {}, // Missing everything
        { id: "resp_123" }, // Missing object and other fields
        {
          id: "resp_123",
          object: "response.chunk",
          // Missing model and output
        },
        {
          id: "resp_123",
          object: "response.chunk",
          model: "grok-3",
          // Missing output
        },
      ];

      invalidChunks.forEach((chunk) => {
        const result = XAIV1StreamingResponseSchema.safeParse(chunk);
        expect(result.success).toBe(false);
      });
    });

    it("should reject wrong object type", () => {
      const invalidChunk = {
        id: "resp_stream_wrong",
        object: "response", // Should be "response.chunk"
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {
              content: [
                {
                  type: "output_text",
                  text: "Test",
                },
              ],
            },
          },
        ],
      };

      const result = XAIV1StreamingResponseSchema.safeParse(invalidChunk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["object"]);
      }
    });

    it("should reject invalid delta role", () => {
      const invalidChunk = {
        id: "resp_stream_invalid_role",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {
              role: "user", // Should be "assistant" for streaming responses
              content: [
                {
                  type: "output_text",
                  text: "Test",
                },
              ],
            },
          },
        ],
      };

      const result = XAIV1StreamingResponseSchema.safeParse(invalidChunk);
      expect(result.success).toBe(false);
    });

    it("should reject malformed tool calls in delta", () => {
      const invalidChunk = {
        id: "resp_stream_bad_tool",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {
              tool_calls: [
                {
                  id: "call_123",
                  type: "invalid_type", // Should be "function"
                  function: {
                    name: "test_function",
                    arguments: "{}",
                  },
                },
              ],
            },
          },
        ],
      };

      const result = XAIV1StreamingResponseSchema.safeParse(invalidChunk);
      expect(result.success).toBe(false);
    });

    it("should reject negative usage tokens", () => {
      const invalidChunk = {
        id: "resp_stream_negative",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {},
          },
        ],
        usage: {
          input_tokens: -5, // Invalid negative value
          input_tokens_details: {
            cached_tokens: 0,
          },
          output_tokens: 10,
          output_tokens_details: {
            reasoning_tokens: 2,
          },
          total_tokens: 5,
        },
      };

      const result = XAIV1StreamingResponseSchema.safeParse(invalidChunk);
      expect(result.success).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle optional text content", () => {
      const optionalTextChunk = {
        id: "resp_stream_optional",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {
              content: [
                {
                  type: "output_text",
                  // text is optional in streaming chunks
                },
              ],
            },
          },
        ],
      };

      const result = XAIV1StreamingResponseSchema.safeParse(optionalTextChunk);
      expect(result.success).toBe(true);
    });

    it("should handle zero usage tokens", () => {
      const zeroUsageChunk = {
        id: "resp_stream_zero",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {},
          },
        ],
        usage: {
          input_tokens: 0,
          input_tokens_details: {
            cached_tokens: 0,
          },
          output_tokens: 0,
          output_tokens_details: {
            reasoning_tokens: 0,
          },
          total_tokens: 0,
        },
      };

      const result = XAIV1StreamingResponseSchema.safeParse(zeroUsageChunk);
      expect(result.success).toBe(true);
    });

    it("should handle multiple output items", () => {
      const multiOutputChunk = {
        id: "resp_stream_multi",
        object: "response.chunk",
        model: "grok-3",
        output: [
          {
            type: "message",
            delta: {
              content: [
                {
                  type: "output_text",
                  text: "First part",
                },
              ],
            },
          },
          {
            type: "message",
            delta: {
              content: [
                {
                  type: "output_text",
                  text: " second part",
                },
              ],
            },
          },
        ],
      };

      const result = XAIV1StreamingResponseSchema.safeParse(multiOutputChunk);
      expect(result.success).toBe(true);
    });
  });

  describe("Type Inference", () => {
    it("should infer correct TypeScript types", () => {
      const validChunk = {
        id: "resp_stream_type_test",
        object: "response.chunk" as const,
        model: "grok-3",
        output: [
          {
            type: "message" as const,
            delta: {
              role: "assistant" as const,
              content: [
                {
                  type: "output_text" as const,
                  text: "Type test",
                },
              ],
            },
          },
        ],
      };

      const parsed = XAIV1StreamingResponseSchema.parse(validChunk);

      // Type assertions to verify proper inference
      expect(parsed.id).toBe("resp_stream_type_test");
      expect(parsed.object).toBe("response.chunk");
      expect(parsed.model).toBe("grok-3");
      expect(parsed.output[0].type).toBe("message");
      expect(parsed.output[0].delta.role).toBe("assistant");
    });
  });
});
