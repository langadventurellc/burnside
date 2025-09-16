import { OpenAIResponsesV1ResponseSchema } from "../responseSchema.js";

describe("OpenAI Responses v1 Response Schema", () => {
  describe("Valid responses", () => {
    test("should validate complete valid response with string content", () => {
      const validResponse = {
        id: "resp_123",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
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
        usage: {
          input_tokens: 10,
          output_tokens: 9,
          total_tokens: 19,
        },
        created_at: 1677652288,
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validResponse);
      }
    });

    test("should validate response with array content parts", () => {
      const validResponse = {
        id: "resp_456",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Here is the information you requested:",
              },
              {
                type: "output_text",
                text: "Additional details follow.",
              },
            ],
          },
        ],
        usage: {
          input_tokens: 15,
          output_tokens: 12,
          total_tokens: 27,
        },
        created_at: 1677652300,
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    test("should validate response without optional fields", () => {
      const minimalResponse = {
        id: "resp_789",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Brief response",
              },
            ],
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(minimalResponse);
      expect(result.success).toBe(true);
    });

    test("should validate response with different statuses", () => {
      const statuses = ["completed", "in_progress", "failed"];

      for (const status of statuses) {
        const response = {
          id: "resp_test",
          object: "response",
          status,
          model: "gpt-4o-2024-08-06",
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
        };

        const result = OpenAIResponsesV1ResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Invalid responses", () => {
    test("should reject response with missing required fields", () => {
      const incompleteResponse = {
        id: "resp_incomplete",
        model: "gpt-4o-2024-08-06",
        // Missing object, status, and output
      };

      const result =
        OpenAIResponsesV1ResponseSchema.safeParse(incompleteResponse);
      expect(result.success).toBe(false);
    });

    test("should reject response with invalid object type", () => {
      const invalidResponse = {
        id: "resp_invalid",
        object: "chat.completion", // Wrong object type
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Test",
              },
            ],
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    test("should accept response with empty output array (validated in parser)", () => {
      const responseWithEmptyOutput = {
        id: "resp_empty",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        responseWithEmptyOutput,
      );
      expect(result.success).toBe(true);
    });

    test("should reject output with invalid message role", () => {
      const responseWithInvalidRole = {
        id: "resp_invalid_role",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "user", // Invalid role for assistant response
            content: [
              {
                type: "output_text",
                text: "Invalid role",
              },
            ],
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        responseWithInvalidRole,
      );
      expect(result.success).toBe(false);
    });

    test("should reject content with invalid content type", () => {
      const responseWithInvalidContentType = {
        id: "resp_invalid_content",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "text", // Should be "output_text"
                text: "Wrong content type",
              },
            ],
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        responseWithInvalidContentType,
      );
      expect(result.success).toBe(false);
    });

    test("should reject usage with negative token counts", () => {
      const responseWithNegativeUsage = {
        id: "resp_negative_usage",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Test",
              },
            ],
          },
        ],
        usage: {
          input_tokens: -5, // Invalid negative value
          output_tokens: 10,
          total_tokens: 5,
        },
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        responseWithNegativeUsage,
      );
      expect(result.success).toBe(false);
    });
  });

  describe("Edge cases", () => {
    test("should handle empty string content", () => {
      const response = {
        id: "resp_empty_content",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
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
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    test("should handle empty array content", () => {
      const response = {
        id: "resp_empty_array",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [],
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    test("should provide descriptive error messages", () => {
      const invalidResponse = {
        id: 123, // Should be string
        object: "wrong_type",
        model: "",
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(4); // Multiple validation errors
      }
    });

    test("should handle content with annotations and logprobs", () => {
      const response = {
        id: "resp_with_annotations",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Response with extra data",
                annotations: [{ type: "citation", source: "doc1" }],
                logprobs: [{ token: "Response", logprob: -0.1 }],
              },
            ],
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });
});
