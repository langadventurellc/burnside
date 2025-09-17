import { describe, test, expect } from "@jest/globals";
import { parseOpenAIResponse } from "../responseParser";
import { ValidationError } from "../../../core/errors/validationError";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";

// Mock ProviderHttpResponse for testing
function createMockResponse(
  body: string,
  status: number = 200,
  statusText: string = "OK",
): ProviderHttpResponse {
  return {
    status,
    statusText,
    headers: { "content-type": "application/json" },
    body: null, // Not used since we pass responseText directly
  };
}

describe("parseOpenAIResponse", () => {
  describe("Successful parsing", () => {
    test("should parse valid response with string content", () => {
      const responseBody = JSON.stringify({
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
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.id).toBe("resp_123");
      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toHaveLength(1);
      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "Hello! How can I help you today?",
      });
      expect(result.usage?.promptTokens).toBe(10);
      expect(result.usage?.completionTokens).toBe(9);
      expect(result.usage?.totalTokens).toBe(19);
      expect(result.model).toBe("gpt-4o-2024-08-06");
    });

    test("should parse response with array content parts", () => {
      const responseBody = JSON.stringify({
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
                text: "Here is the first part.",
              },
              {
                type: "output_text",
                text: "And here is the second part.",
              },
            ],
          },
        ],
        usage: {
          input_tokens: 15,
          output_tokens: 12,
          total_tokens: 27,
        },
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.content).toHaveLength(2);
      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "Here is the first part.",
      });
      expect(result.message.content[1]).toEqual({
        type: "text",
        text: "And here is the second part.",
      });
    });

    test("should parse response without usage information", () => {
      const responseBody = JSON.stringify({
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
                text: "Response without usage",
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.usage).toBeUndefined();
    });

    test("should parse response without optional fields", () => {
      const responseBody = JSON.stringify({
        id: "resp_minimal",
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
                text: "Minimal response",
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.id).toBe("resp_minimal");
      expect(result.message.role).toBe("assistant");
      expect(result.model).toBe("gpt-4o-2024-08-06");
    });

    test("should handle empty string content", () => {
      const responseBody = JSON.stringify({
        id: "resp_empty",
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
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.content).toHaveLength(1);
      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "",
      });
    });

    test("should handle empty array content", () => {
      const responseBody = JSON.stringify({
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
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.content).toHaveLength(0);
    });
  });

  describe("Error handling", () => {
    test("should throw ValidationError for empty response text", () => {
      const response = createMockResponse("");

      expect(() => parseOpenAIResponse(response, "")).toThrow(ValidationError);
      expect(() => parseOpenAIResponse(response, "")).toThrow(
        "Response body is empty",
      );
    });

    test("should throw ValidationError for invalid JSON", () => {
      const response = createMockResponse("invalid json");

      expect(() => parseOpenAIResponse(response, "invalid json")).toThrow(
        ValidationError,
      );
      expect(() => parseOpenAIResponse(response, "invalid json")).toThrow(
        "Failed to parse response as JSON",
      );
    });

    test("should throw ValidationError for invalid OpenAI response structure", () => {
      const invalidResponse = JSON.stringify({
        id: "resp_invalid",
        object: "chat.completion", // Wrong object type
        model: "gpt-4o-2024-08-06",
      });

      const response = createMockResponse(invalidResponse);

      expect(() => parseOpenAIResponse(response, invalidResponse)).toThrow(
        ValidationError,
      );
      expect(() => parseOpenAIResponse(response, invalidResponse)).toThrow(
        "Invalid OpenAI response structure",
      );
    });

    test("should throw ValidationError for empty output array", () => {
      const responseBody = JSON.stringify({
        id: "resp_empty_output",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [],
      });

      const response = createMockResponse(responseBody);

      try {
        parseOpenAIResponse(response, responseBody);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          "OpenAI response contains no output",
        );
        expect((error as ValidationError).context).toMatchObject({
          status: 200,
          statusText: "OK",
          responseId: "resp_empty_output",
        });
      }
    });

    test("should include response context in validation errors", () => {
      const invalidResponse = JSON.stringify({ invalid: "structure" });
      const response = createMockResponse(invalidResponse, 400, "Bad Request");

      try {
        parseOpenAIResponse(response, invalidResponse);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).context).toMatchObject({
          status: 400,
          statusText: "Bad Request",
        });
      }
    });

    test("should handle large response text in error context", () => {
      const largeInvalidResponse = "invalid json " + "x".repeat(10000);
      const response = createMockResponse(largeInvalidResponse);

      expect(() => parseOpenAIResponse(response, largeInvalidResponse)).toThrow(
        ValidationError,
      );
    });
  });

  describe("Content conversion", () => {
    test("should convert output_text content to text content part", () => {
      const responseBody = JSON.stringify({
        id: "resp_content",
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
                text: "Converted content",
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "Converted content",
      });
    });

    test("should preserve array content parts structure", () => {
      const responseBody = JSON.stringify({
        id: "resp_array",
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
                text: "First part",
              },
              {
                type: "output_text",
                text: "Second part",
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.content).toHaveLength(2);
      expect(result.message.content[0].type).toBe("text");
      expect(result.message.content[1].type).toBe("text");
    });
  });

  describe("Usage information extraction", () => {
    test("should correctly map usage field names", () => {
      const responseBody = JSON.stringify({
        id: "resp_usage",
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
                text: "Usage test",
              },
            ],
          },
        ],
        usage: {
          input_tokens: 25,
          output_tokens: 15,
          total_tokens: 40,
        },
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.usage).toEqual({
        promptTokens: 25,
        completionTokens: 15,
        totalTokens: 40,
      });
    });
  });

  describe("Metadata extraction", () => {
    test("should extract all metadata fields", () => {
      const responseBody = JSON.stringify({
        id: "resp_metadata",
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
                text: "Metadata test",
              },
            ],
          },
        ],
        created_at: 1677652288,
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.metadata).toMatchObject({
        provider: "openai",
        id: "resp_metadata",
        created_at: 1677652288,
        status: "completed",
        finishReason: null, // Not available in Responses API
      });
    });
  });

  describe("Tool call parsing", () => {
    test("should parse response with text content and tool calls", () => {
      const responseBody = JSON.stringify({
        id: "resp_tools",
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
                text: "I'll help you with that calculation.",
              },
            ],
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: {
                  name: "calculate",
                  arguments: '{"operation": "add", "a": 2, "b": 3}',
                },
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "I'll help you with that calculation.",
      });
      expect(result.message.toolCalls).toHaveLength(1);
      expect(result.message.toolCalls?.[0]).toMatchObject({
        id: "call_123",
        name: "calculate",
        parameters: { operation: "add", a: 2, b: 3 },
      });
    });

    test("should parse response with multiple tool calls", () => {
      const responseBody = JSON.stringify({
        id: "resp_multi_tools",
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
                text: "I'll perform both calculations for you.",
              },
            ],
            tool_calls: [
              {
                id: "call_456",
                type: "function",
                function: {
                  name: "add",
                  arguments: '{"a": 5, "b": 7}',
                },
              },
              {
                id: "call_789",
                type: "function",
                function: {
                  name: "multiply",
                  arguments: '{"a": 3, "b": 4}',
                },
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.toolCalls).toHaveLength(2);
      expect(result.message.toolCalls?.[0].id).toBe("call_456");
      expect(result.message.toolCalls?.[1].id).toBe("call_789");
    });

    test("should parse tool calls without text content", () => {
      const responseBody = JSON.stringify({
        id: "resp_tools_only",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [],
            tool_calls: [
              {
                id: "call_only",
                type: "function",
                function: {
                  name: "search",
                  arguments: '{"query": "weather"}',
                },
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.content).toHaveLength(0);
      expect(result.message.toolCalls).toHaveLength(1);
      expect(result.message.toolCalls?.[0].name).toBe("search");
    });

    test("should handle responses without tool calls", () => {
      const responseBody = JSON.stringify({
        id: "resp_no_tools",
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
                text: "Just a regular response.",
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);
      const result = parseOpenAIResponse(response, responseBody);

      expect(result.message.toolCalls).toBeUndefined();
    });

    test("should throw ValidationError for malformed tool call JSON", () => {
      const responseBody = JSON.stringify({
        id: "resp_bad_tools",
        object: "response",
        status: "completed",
        model: "gpt-4o-2024-08-06",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [],
            tool_calls: [
              {
                id: "call_bad",
                type: "function",
                function: {
                  name: "test",
                  arguments: "invalid json {",
                },
              },
            ],
          },
        ],
      });

      const response = createMockResponse(responseBody);

      expect(() => parseOpenAIResponse(response, responseBody)).toThrow(
        /Failed to parse tool calls in response/,
      );
    });
  });
});
