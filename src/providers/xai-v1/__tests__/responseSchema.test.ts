/**
 * xAI v1 Response Schema Tests
 *
 * Comprehensive unit tests for xAI response schema validation.
 */

import { XAIV1ResponseSchema } from "../responseSchema";

describe("XAIV1ResponseSchema", () => {
  describe("Valid Responses", () => {
    it("should validate minimal valid response", () => {
      const validResponse = {
        id: "resp_123",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Hello! How can I help you today?",
              },
            ],
          },
        ],
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_123",
          lb_address: "10.0.0.1",
          prompt: "Hello",
          request: "original_request",
          responses: [],
          sampler_tag: "default",
        },
        text: {
          format: [],
        },
        tool_choice: "auto",
        tools: [],
      };

      const result = XAIV1ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should validate complete response with all fields", () => {
      const validResponse = {
        id: "resp_456",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Here's a comprehensive response with all features.",
                annotations: [{ type: "citation", source: "web" }],
                logprobs: [{ token: "Here", logprob: -0.1 }],
              },
            ],
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
        ],
        usage: {
          input_tokens: 20,
          input_tokens_details: {
            cached_tokens: 5,
          },
          output_tokens: 50,
          output_tokens_details: {
            reasoning_tokens: 10,
          },
          total_tokens: 70,
        },
        created_at: 1726426789,
        background: "Weather inquiry",
        debug_output: {
          attempts: 1,
          cache_read_count: 1,
          cache_read_input_bytes: 100,
          cache_write_count: 1,
          cache_write_input_bytes: 200,
          engine_request: "req_456",
          lb_address: "10.0.0.2",
          prompt: "What's the weather like?",
          request: "original_weather_request",
          responses: ["previous_response"],
          sampler_tag: "weather",
        },
        incomplete_details: {
          reason: "max_tokens_reached",
        },
        max_output_tokens: 1000,
        metadata: {
          user_id: "user123",
          session_id: "session456",
        },
        parallel_tool_calls: true,
        previous_response_id: "resp_000",
        reasoning: {
          effort: "medium",
          generate_summary: true,
          summary: "Weather analysis reasoning",
        },
        store: false,
        temperature: 0.7,
        text: {
          format: [
            { type: "text" },
            {
              type: "json_schema",
              name: "weather_format",
              description: "Weather response format",
              schema: { type: "object" },
              strict: true,
            },
          ],
        },
        tool_choice: {
          type: "function",
          function: {
            name: "get_weather",
          },
        },
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get weather information",
            },
          },
        ],
        top_p: 0.9,
        user: "user123",
      };

      const result = XAIV1ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should validate reasoning output type", () => {
      const validResponse = {
        id: "resp_789",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "reasoning",
            summary: [{ step: "Think about the problem" }],
          },
        ],
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_789",
          lb_address: "10.0.0.3",
          prompt: "Complex reasoning task",
          request: "reasoning_request",
          responses: [],
          sampler_tag: "reasoning",
        },
        text: {
          format: [],
        },
        tool_choice: "none",
        tools: [],
      };

      const result = XAIV1ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should validate response with mixed output types", () => {
      const validResponse = {
        id: "resp_mix",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "reasoning",
            summary: [{ step: "Analysis step" }],
          },
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Based on my reasoning...",
              },
            ],
          },
        ],
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_mix",
          lb_address: "10.0.0.4",
          prompt: "Mixed output request",
          request: "mixed_request",
          responses: [],
          sampler_tag: "mixed",
        },
        text: {
          format: [],
        },
        tool_choice: "auto",
        tools: [],
      };

      const result = XAIV1ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Responses", () => {
    it("should reject missing required fields", () => {
      const invalidResponses = [
        {}, // Missing everything
        { id: "resp_123" }, // Missing other required fields
        {
          id: "resp_123",
          object: "response",
          status: "completed",
          model: "grok-3",
          // Missing output
        },
      ];

      invalidResponses.forEach((response) => {
        const result = XAIV1ResponseSchema.safeParse(response);
        expect(result.success).toBe(false);
      });
    });

    it("should reject invalid output types", () => {
      const invalidResponse = {
        id: "resp_123",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "invalid_type", // Should be "message" or "reasoning"
            content: "This should fail",
          },
        ],
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_123",
          lb_address: "10.0.0.1",
          prompt: "Test",
          request: "test_request",
          responses: [],
          sampler_tag: "test",
        },
        text: { format: [] },
        tool_choice: "auto",
        tools: [],
      };

      const result = XAIV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject negative token counts", () => {
      const invalidResponse = {
        id: "resp_123",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Test response",
              },
            ],
          },
        ],
        usage: {
          input_tokens: -10, // Invalid negative value
          input_tokens_details: {
            cached_tokens: 0,
          },
          output_tokens: 20,
          output_tokens_details: {
            reasoning_tokens: 5,
          },
          total_tokens: 10,
        },
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_123",
          lb_address: "10.0.0.1",
          prompt: "Test",
          request: "test_request",
          responses: [],
          sampler_tag: "test",
        },
        text: { format: [] },
        tool_choice: "auto",
        tools: [],
      };

      const result = XAIV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject malformed tool calls", () => {
      const invalidResponse = {
        id: "resp_123",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Test response",
              },
            ],
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
        ],
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_123",
          lb_address: "10.0.0.1",
          prompt: "Test",
          request: "test_request",
          responses: [],
          sampler_tag: "test",
        },
        text: { format: [] },
        tool_choice: "auto",
        tools: [],
      };

      const result = XAIV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty arrays and optional fields", () => {
      const edgeCaseResponse = {
        id: "resp_edge",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "",
              },
            ],
          },
        ],
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_edge",
          lb_address: "10.0.0.5",
          prompt: "",
          request: "",
          responses: [],
          sampler_tag: "",
        },
        text: {
          format: [],
        },
        tool_choice: "none",
        tools: [],
      };

      const result = XAIV1ResponseSchema.safeParse(edgeCaseResponse);
      expect(result.success).toBe(true);
    });

    it("should handle zero token usage", () => {
      const zeroTokenResponse = {
        id: "resp_zero",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "",
              },
            ],
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
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_zero",
          lb_address: "10.0.0.6",
          prompt: "",
          request: "",
          responses: [],
          sampler_tag: "",
        },
        text: { format: [] },
        tool_choice: "auto",
        tools: [],
      };

      const result = XAIV1ResponseSchema.safeParse(zeroTokenResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("Type Inference", () => {
    it("should infer correct TypeScript types", () => {
      const validResponse = {
        id: "resp_type_test",
        object: "response",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message" as const,
            role: "assistant" as const,
            content: [
              {
                type: "output_text" as const,
                text: "Type test response",
              },
            ],
          },
        ],
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_type",
          lb_address: "10.0.0.7",
          prompt: "Type test",
          request: "type_request",
          responses: [],
          sampler_tag: "type",
        },
        text: { format: [] },
        tool_choice: "auto" as const,
        tools: [],
      };

      const parsed = XAIV1ResponseSchema.parse(validResponse);

      // Type assertions to verify proper inference
      expect(parsed.id).toBe("resp_type_test");
      expect(parsed.object).toBe("response");
      expect(parsed.status).toBe("completed");
      expect(parsed.model).toBe("grok-3");
      expect(parsed.output[0].type).toBe("message");
    });
  });
});
