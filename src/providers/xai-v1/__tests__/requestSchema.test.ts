/**
 * xAI v1 Request Schema Tests
 *
 * Comprehensive unit tests for xAI request schema validation.
 */

import { XAIV1RequestSchema } from "../requestSchema";

describe("XAIV1RequestSchema", () => {
  describe("Valid Requests", () => {
    it("should validate minimal valid request", () => {
      const validRequest = {
        model: "grok-3",
        input: [
          {
            type: "message",
            role: "user",
            content: "Hello, world!",
          },
        ],
      };

      const result = XAIV1RequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should validate complete request with all supported models", () => {
      const models = [
        "grok-2",
        "grok-2-mini",
        "grok-2-vision-1212",
        "grok-3",
        "grok-3-mini",
        "grok-4-0709",
      ];

      models.forEach((model) => {
        const validRequest = {
          model,
          input: [
            {
              type: "message",
              role: "user",
              content: "Test message",
            },
          ],
          stream: true,
          temperature: 0.7,
          max_output_tokens: 1000,
          top_p: 0.9,
        };

        const result = XAIV1RequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });
    });

    it("should validate multimodal content with text and images", () => {
      const validRequest = {
        model: "grok-2-vision-1212",
        input: [
          {
            type: "message",
            role: "user",
            content: [
              {
                type: "text",
                text: "What do you see in this image?",
              },
              {
                type: "image_url",
                image_url: {
                  url: "https://example.com/image.jpg",
                  detail: "high",
                },
              },
            ],
          },
        ],
      };

      const result = XAIV1RequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should validate function calling with tools", () => {
      const validRequest = {
        model: "grok-3",
        input: [
          {
            type: "message",
            role: "user",
            content: "What's the weather like?",
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get current weather information",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
                required: ["location"],
              },
            },
          },
        ],
        tool_choice: "auto",
      };

      const result = XAIV1RequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should validate all optional parameters", () => {
      const validRequest = {
        model: "grok-3",
        input: [
          {
            type: "message",
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            type: "message",
            role: "user",
            content: "Hello!",
            name: "user123",
          },
        ],
        stream: false,
        temperature: 1.5,
        max_output_tokens: 2048,
        top_p: 0.95,
        parallel_tool_calls: true,
        background: "Research context",
        include: "citations",
        instructions: "Be concise",
        logprobs: true,
        top_logprobs: 5,
        metadata: { user_id: "123", session: "abc" },
        previous_response_id: "resp_123",
        reasoning: {
          effort: "high",
          generate_summary: true,
          summary: "Previous reasoning",
        },
        search_parameters: {
          mode: "web",
          max_search_results: 10,
          return_citations: true,
          sources: ["wikipedia", "arxiv"],
        },
        service_tier: "premium",
        store: true,
        text: {
          format: [
            { type: "text" },
            {
              type: "json_schema",
              name: "response_format",
              description: "Structured response",
              schema: { type: "object" },
              strict: true,
            },
          ],
        },
        user: "user123",
      };

      const result = XAIV1RequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Requests", () => {
    it("should reject missing required fields", () => {
      const invalidRequests = [
        {}, // Missing everything
        { model: "grok-3" }, // Missing input
        { input: [] }, // Missing model
      ];

      invalidRequests.forEach((request) => {
        const result = XAIV1RequestSchema.safeParse(request);
        expect(result.success).toBe(false);
      });
    });

    it("should reject invalid model names", () => {
      const invalidRequest = {
        model: "invalid-model",
        input: [
          {
            type: "message",
            role: "user",
            content: "Test",
          },
        ],
      };

      const result = XAIV1RequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["model"]);
      }
    });

    it("should reject empty input array", () => {
      const invalidRequest = {
        model: "grok-3",
        input: [],
      };

      const result = XAIV1RequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one input message is required",
        );
      }
    });

    it("should reject invalid parameter ranges", () => {
      const invalidRequests = [
        {
          model: "grok-3",
          input: [{ type: "message", role: "user", content: "Test" }],
          temperature: -1, // Below minimum
        },
        {
          model: "grok-3",
          input: [{ type: "message", role: "user", content: "Test" }],
          temperature: 3, // Above maximum
        },
        {
          model: "grok-3",
          input: [{ type: "message", role: "user", content: "Test" }],
          max_output_tokens: 0, // Below minimum
        },
        {
          model: "grok-3",
          input: [{ type: "message", role: "user", content: "Test" }],
          max_output_tokens: 10000, // Above maximum
        },
        {
          model: "grok-3",
          input: [{ type: "message", role: "user", content: "Test" }],
          top_p: 1.5, // Above maximum
        },
        {
          model: "grok-3",
          input: [{ type: "message", role: "user", content: "Test" }],
          top_logprobs: 25, // Above maximum
        },
      ];

      invalidRequests.forEach((request) => {
        const result = XAIV1RequestSchema.safeParse(request);
        expect(result.success).toBe(false);
      });
    });

    it("should reject invalid message roles", () => {
      const invalidRequest = {
        model: "grok-3",
        input: [
          {
            type: "message",
            role: "invalid_role",
            content: "Test",
          },
        ],
      };

      const result = XAIV1RequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject malformed multimodal content", () => {
      const invalidRequest = {
        model: "grok-2-vision-1212",
        input: [
          {
            type: "message",
            role: "user",
            content: [
              {
                type: "invalid_type",
                text: "This should fail",
              },
            ],
          },
        ],
      };

      const result = XAIV1RequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should reject invalid tool configurations", () => {
      const invalidRequest = {
        model: "grok-3",
        input: [
          {
            type: "message",
            role: "user",
            content: "Test",
          },
        ],
        tools: [
          {
            type: "invalid_type", // Should be "function"
            function: {
              name: "test_function",
            },
          },
        ],
      };

      const result = XAIV1RequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle boundary values for numeric parameters", () => {
      const boundaryRequest = {
        model: "grok-3",
        input: [
          {
            type: "message",
            role: "user",
            content: "Test",
          },
        ],
        temperature: 0, // Minimum
        max_output_tokens: 1, // Minimum
        top_p: 0, // Minimum
        top_logprobs: 0, // Minimum
      };

      const result = XAIV1RequestSchema.safeParse(boundaryRequest);
      expect(result.success).toBe(true);
    });

    it("should handle maximum boundary values", () => {
      const boundaryRequest = {
        model: "grok-3",
        input: [
          {
            type: "message",
            role: "user",
            content: "Test",
          },
        ],
        temperature: 2, // Maximum
        max_output_tokens: 8192, // Maximum
        top_p: 1, // Maximum
        top_logprobs: 20, // Maximum
      };

      const result = XAIV1RequestSchema.safeParse(boundaryRequest);
      expect(result.success).toBe(true);
    });

    it("should handle complex tool choice configurations", () => {
      const complexRequest = {
        model: "grok-3",
        input: [
          {
            type: "message",
            role: "user",
            content: "Test",
          },
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "specific_function",
          },
        },
      };

      const result = XAIV1RequestSchema.safeParse(complexRequest);
      expect(result.success).toBe(true);
    });
  });

  describe("Type Inference", () => {
    it("should infer correct TypeScript types", () => {
      const validRequest = {
        model: "grok-3" as const,
        input: [
          {
            type: "message" as const,
            role: "user" as const,
            content: "Hello!",
          },
        ],
      };

      const parsed = XAIV1RequestSchema.parse(validRequest);

      // Type assertions to verify proper inference
      expect(parsed.model).toBe("grok-3");
      expect(parsed.input[0].type).toBe("message");
      expect(parsed.input[0].role).toBe("user");
      expect(typeof parsed.input[0].content).toBe("string");
    });
  });
});
