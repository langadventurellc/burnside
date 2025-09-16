/**
 * Tests for OpenAI Responses v1 Response Schema
 */

import { describe, test, expect } from "@jest/globals";
import {
  OpenAIResponsesV1ResponseSchema,
  type OpenAIResponsesV1Response,
} from "../responseSchema.js";

describe("OpenAI Responses v1 Response Schema", () => {
  describe("Valid responses", () => {
    test("should validate complete valid response with string content", () => {
      const validResponse: OpenAIResponsesV1Response = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello! How can I help you today?",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 9,
          total_tokens: 19,
        },
        system_fingerprint: "fp_44709d6fcb",
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validResponse);
      }
    });

    test("should validate response with array content parts", () => {
      const validResponse = {
        id: "chatcmpl-456",
        object: "chat.completion",
        created: 1677652300,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: [
                {
                  type: "text",
                  text: "Here is the information you requested:",
                },
                {
                  type: "text",
                  text: "Additional details follow.",
                },
              ],
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 12,
          total_tokens: 27,
        },
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    test("should validate response without optional fields", () => {
      const minimalResponse = {
        id: "chatcmpl-789",
        object: "chat.completion",
        created: 1677652310,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Brief response",
            },
            finish_reason: null,
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(minimalResponse);
      expect(result.success).toBe(true);
    });

    test("should validate response with different finish reasons", () => {
      const finishReasons = [
        "stop",
        "length",
        "content_filter",
        "tool_calls",
        null,
      ];

      for (const finishReason of finishReasons) {
        const response = {
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1677652320,
          model: "gpt-4o-2024-08-06",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Test content",
              },
              finish_reason: finishReason,
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
      const invalidResponse = {
        id: "chatcmpl-invalid",
        // missing object field
        created: 1677652330,
        model: "gpt-4o-2024-08-06",
        choices: [],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    test("should reject response with wrong object type", () => {
      const invalidResponse = {
        id: "chatcmpl-invalid",
        object: "text.completion", // wrong type
        created: 1677652340,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Test",
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    test("should accept response with empty choices array (validated in parser)", () => {
      const responseWithEmptyChoices = {
        id: "chatcmpl-invalid",
        object: "chat.completion",
        created: 1677652350,
        model: "gpt-4o-2024-08-06",
        choices: [], // empty array is valid in schema, rejected in parser
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        responseWithEmptyChoices,
      );
      expect(result.success).toBe(true);
    });

    test("should reject choice with invalid message role", () => {
      const invalidResponse = {
        id: "chatcmpl-invalid",
        object: "chat.completion",
        created: 1677652360,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "user", // should be assistant
              content: "Test",
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    test("should reject choice with invalid content part", () => {
      const invalidResponse = {
        id: "chatcmpl-invalid",
        object: "chat.completion",
        created: 1677652370,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: [
                {
                  type: "image", // not supported in response content
                  text: "Invalid content part",
                },
              ],
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    test("should reject usage with invalid token counts", () => {
      const invalidResponse = {
        id: "chatcmpl-invalid",
        object: "chat.completion",
        created: 1677652380,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Test",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: -1, // negative not allowed
          completion_tokens: 10,
          total_tokens: 9,
        },
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    test("should reject invalid finish reason", () => {
      const invalidResponse = {
        id: "chatcmpl-invalid",
        object: "chat.completion",
        created: 1677652390,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Test",
            },
            finish_reason: "invalid_reason",
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe("Edge cases", () => {
    test("should handle empty string content", () => {
      const response = {
        id: "chatcmpl-empty",
        object: "chat.completion",
        created: 1677652400,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "",
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    test("should handle empty array content", () => {
      const response = {
        id: "chatcmpl-empty-array",
        object: "chat.completion",
        created: 1677652410,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: [],
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    test("should provide descriptive error messages", () => {
      const invalidResponse = {
        id: 123, // should be string
        object: "chat.completion",
        created: 1677652420,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Test",
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = OpenAIResponsesV1ResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: ["id"],
            message: expect.stringContaining("string"),
          }),
        );
      }
    });
  });
});
