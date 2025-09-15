/**
 * Tests for OpenAI Responses v1 Response Parser
 */

import { describe, test, expect } from "@jest/globals";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse.js";
import { ValidationError } from "../../../core/errors/validationError.js";
import { parseOpenAIResponse } from "../responseParser.js";

// Helper function to create mock ProviderHttpResponse
function createMockResponse(
  status: number,
  statusText: string,
): ProviderHttpResponse {
  return {
    status,
    statusText,
    headers: { "content-type": "application/json" },
    body: null, // Not used in current implementation since we pass responseText directly
  };
}

describe("parseOpenAIResponse", () => {
  describe("Successful parsing", () => {
    test("should parse valid response with string content", () => {
      const responseText = JSON.stringify({
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
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result).toEqual({
        message: {
          id: "chatcmpl-123",
          role: "assistant",
          content: [{ type: "text", text: "Hello! How can I help you today?" }],
        },
        usage: {
          promptTokens: 10,
          completionTokens: 9,
          totalTokens: 19,
        },
        model: "gpt-4o-2024-08-06",
        metadata: {
          id: "chatcmpl-123",
          created: 1677652288,
          finishReason: "stop",
          systemFingerprint: "fp_44709d6fcb",
        },
      });
    });

    test("should parse response with array content parts", () => {
      const responseText = JSON.stringify({
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
                  text: "Here is the information:",
                },
                {
                  type: "text",
                  text: "Additional details.",
                },
              ],
            },
            finish_reason: "length",
          },
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 12,
          total_tokens: 27,
        },
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.message.content).toEqual([
        { type: "text", text: "Here is the information:" },
        { type: "text", text: "Additional details." },
      ]);
      expect(result.metadata?.finishReason).toBe("length");
    });

    test("should parse response without usage information", () => {
      const responseText = JSON.stringify({
        id: "chatcmpl-789",
        object: "chat.completion",
        created: 1677652310,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Response without usage",
            },
            finish_reason: null,
          },
        ],
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.usage).toBeUndefined();
      expect(result.metadata?.finishReason).toBeNull();
    });

    test("should parse response without system fingerprint", () => {
      const responseText = JSON.stringify({
        id: "chatcmpl-abc",
        object: "chat.completion",
        created: 1677652320,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "No fingerprint",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 3,
          total_tokens: 8,
        },
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.metadata?.systemFingerprint).toBeUndefined();
    });

    test("should handle empty string content", () => {
      const responseText = JSON.stringify({
        id: "chatcmpl-empty",
        object: "chat.completion",
        created: 1677652330,
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
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.message.content).toEqual([{ type: "text", text: "" }]);
    });

    test("should handle empty array content", () => {
      const responseText = JSON.stringify({
        id: "chatcmpl-empty-array",
        object: "chat.completion",
        created: 1677652340,
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
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.message.content).toEqual([]);
    });
  });

  describe("Error handling", () => {
    test("should throw ValidationError for empty response text", () => {
      const response = createMockResponse(200, "OK");

      expect(() => parseOpenAIResponse(response, "")).toThrow(ValidationError);
      expect(() => parseOpenAIResponse(response, "   ")).toThrow(
        ValidationError,
      );

      try {
        parseOpenAIResponse(response, "");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          "Response body is empty",
        );
        expect((error as ValidationError).context).toEqual({
          status: 200,
          statusText: "OK",
        });
      }
    });

    test("should throw ValidationError for invalid JSON", () => {
      const response = createMockResponse(200, "OK");
      const invalidJson = "{ invalid json }";

      expect(() => parseOpenAIResponse(response, invalidJson)).toThrow(
        ValidationError,
      );

      try {
        parseOpenAIResponse(response, invalidJson);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          "Failed to parse response as JSON",
        );
        expect((error as ValidationError).context).toMatchObject({
          status: 200,
          statusText: "OK",
          responseText: invalidJson,
          parseError: expect.any(String),
        });
      }
    });

    test("should throw ValidationError for invalid OpenAI response structure", () => {
      const response = createMockResponse(200, "OK");
      const invalidResponse = JSON.stringify({
        id: "chatcmpl-invalid",
        object: "wrong_type", // Invalid object type
        created: 1677652350,
        model: "gpt-4o-2024-08-06",
        choices: [],
      });

      expect(() => parseOpenAIResponse(response, invalidResponse)).toThrow(
        ValidationError,
      );

      try {
        parseOpenAIResponse(response, invalidResponse);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          "Invalid OpenAI response structure",
        );
        expect((error as ValidationError).context).toMatchObject({
          status: 200,
          statusText: "OK",
          validationErrors: expect.any(Array),
          responseData: expect.any(Object),
        });
      }
    });

    test("should throw ValidationError for empty choices array", () => {
      const response = createMockResponse(200, "OK");
      const responseWithEmptyChoices = JSON.stringify({
        id: "chatcmpl-no-choices",
        object: "chat.completion",
        created: 1677652360,
        model: "gpt-4o-2024-08-06",
        choices: [],
      });

      expect(() =>
        parseOpenAIResponse(response, responseWithEmptyChoices),
      ).toThrow(ValidationError);

      try {
        parseOpenAIResponse(response, responseWithEmptyChoices);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          "OpenAI response contains no choices",
        );
        expect((error as ValidationError).context).toMatchObject({
          status: 200,
          statusText: "OK",
          responseId: "chatcmpl-no-choices",
        });
      }
    });

    test("should include response context in validation errors", () => {
      const response = createMockResponse(400, "Bad Request");
      const invalidResponse = JSON.stringify({
        id: 123, // Should be string
        object: "chat.completion",
        created: 1677652370,
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
      });

      try {
        parseOpenAIResponse(response, invalidResponse);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).context).toMatchObject({
          status: 400,
          statusText: "Bad Request",
          validationErrors: expect.arrayContaining([
            expect.objectContaining({
              path: ["id"],
            }),
          ]),
        });
      }
    });

    test("should handle large response text in error context", () => {
      const response = createMockResponse(200, "OK");
      const largeInvalidJson = "{ invalid: " + "x".repeat(1000) + " }";

      try {
        parseOpenAIResponse(response, largeInvalidJson);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).context?.responseText).toHaveLength(
          500,
        );
      }
    });
  });

  describe("Content conversion", () => {
    test("should convert string content to text content part", () => {
      const responseText = JSON.stringify({
        id: "chatcmpl-string",
        object: "chat.completion",
        created: 1677652380,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Simple string content",
            },
            finish_reason: "stop",
          },
        ],
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.message.content).toEqual([
        { type: "text", text: "Simple string content" },
      ]);
    });

    test("should preserve array content parts structure", () => {
      const responseText = JSON.stringify({
        id: "chatcmpl-array",
        object: "chat.completion",
        created: 1677652390,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: [
                { type: "text", text: "First part" },
                { type: "text", text: "Second part" },
                { type: "text", text: "Third part" },
              ],
            },
            finish_reason: "stop",
          },
        ],
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.message.content).toEqual([
        { type: "text", text: "First part" },
        { type: "text", text: "Second part" },
        { type: "text", text: "Third part" },
      ]);
    });
  });

  describe("Usage information extraction", () => {
    test("should correctly map usage field names", () => {
      const responseText = JSON.stringify({
        id: "chatcmpl-usage",
        object: "chat.completion",
        created: 1677652400,
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
          prompt_tokens: 25,
          completion_tokens: 50,
          total_tokens: 75,
        },
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.usage).toEqual({
        promptTokens: 25,
        completionTokens: 50,
        totalTokens: 75,
      });
    });
  });

  describe("Metadata extraction", () => {
    test("should extract all metadata fields", () => {
      const responseText = JSON.stringify({
        id: "chatcmpl-metadata",
        object: "chat.completion",
        created: 1677652410,
        model: "gpt-4o-2024-08-06",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Test",
            },
            finish_reason: "content_filter",
          },
        ],
        system_fingerprint: "fp_test123",
      });

      const response = createMockResponse(200, "OK");
      const result = parseOpenAIResponse(response, responseText);

      expect(result.metadata).toEqual({
        id: "chatcmpl-metadata",
        created: 1677652410,
        finishReason: "content_filter",
        systemFingerprint: "fp_test123",
      });
    });
  });
});
