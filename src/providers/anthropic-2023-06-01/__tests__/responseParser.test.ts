/**
 * Anthropic Messages API Response Parser Tests
 *
 * Comprehensive unit test suite for the response parser with >90% coverage
 * validating all parsing scenarios including successful responses, tool calls,
 * error handling, and edge cases.
 */

import { parseAnthropicResponse } from "../responseParser";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import { ProviderError } from "../../../core/errors/providerError";
import { ValidationError } from "../../../core/errors/validationError";

/**
 * Create a mock ProviderHttpResponse for testing
 */
function createMockResponse(
  status = 200,
  statusText = "OK",
): ProviderHttpResponse {
  return {
    status,
    statusText,
    headers: {},
    body: null,
  };
}

describe("parseAnthropicResponse", () => {
  describe("successful response parsing", () => {
    it("should parse text-only response correctly", () => {
      const responseText = JSON.stringify({
        id: "msg_01A2B3C4D5E6F7G8H9I0J1K2",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello! How can I help you today?",
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: 15,
          output_tokens: 8,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.id).toBe("msg_01A2B3C4D5E6F7G8H9I0J1K2");
      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toEqual([
        { type: "text", text: "Hello! How can I help you today?" },
      ]);
      expect(result.message.toolCalls).toEqual([]);
      expect(result.message.timestamp).toMatch(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
      );
      expect(result.message.metadata).toEqual({
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        stopReason: "end_turn",
      });

      expect(result.usage).toEqual({
        promptTokens: 15,
        completionTokens: 8,
        totalTokens: 23,
      });

      expect(result.model).toBe("claude-3-5-sonnet-20241022");
      expect(result.metadata).toEqual({
        provider: "anthropic",
        id: "msg_01A2B3C4D5E6F7G8H9I0J1K2",
        stopReason: "end_turn",
        stopSequence: null,
        model: "claude-3-5-sonnet-20241022",
      });
    });

    it("should parse response with tool calls correctly", () => {
      const responseText = JSON.stringify({
        id: "msg_01TOOL123456789",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "I'll calculate that for you.",
          },
          {
            type: "tool_use",
            id: "toolu_01CALC123456789",
            name: "calculator",
            input: {
              operation: "multiply",
              a: 42,
              b: 24,
            },
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 25,
          output_tokens: 15,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.content).toEqual([
        { type: "text", text: "I'll calculate that for you." },
      ]);

      expect(result.message.toolCalls).toEqual([
        {
          id: "toolu_01CALC123456789",
          name: "calculator",
          parameters: {
            operation: "multiply",
            a: 42,
            b: 24,
          },
        },
      ]);

      expect(result.message.metadata?.stopReason).toBe("tool_use");
    });

    it("should parse response with multiple tool calls", () => {
      const responseText = JSON.stringify({
        id: "msg_01MULTI123456789",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu_01FIRST123456789",
            name: "first_tool",
            input: { param1: "value1" },
          },
          {
            type: "tool_use",
            id: "toolu_01SECOND123456789",
            name: "second_tool",
            input: { param2: "value2" },
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 30,
          output_tokens: 20,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.toolCalls).toHaveLength(2);
      expect(result.message.toolCalls![0]).toEqual({
        id: "toolu_01FIRST123456789",
        name: "first_tool",
        parameters: { param1: "value1" },
      });
      expect(result.message.toolCalls![1]).toEqual({
        id: "toolu_01SECOND123456789",
        name: "second_tool",
        parameters: { param2: "value2" },
      });
    });

    it("should parse response with mixed content (text and tools)", () => {
      const responseText = JSON.stringify({
        id: "msg_01MIXED123456789",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Let me help you with that.",
          },
          {
            type: "tool_use",
            id: "toolu_01HELP123456789",
            name: "helper_tool",
            input: { action: "assist" },
          },
          {
            type: "text",
            text: "Here are the results:",
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 40,
          output_tokens: 25,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.content).toEqual([
        { type: "text", text: "Let me help you with that." },
        { type: "text", text: "Here are the results:" },
      ]);

      expect(result.message.toolCalls).toEqual([
        {
          id: "toolu_01HELP123456789",
          name: "helper_tool",
          parameters: { action: "assist" },
        },
      ]);
    });

    it("should handle empty content array", () => {
      const responseText = JSON.stringify({
        id: "msg_01EMPTY123456789",
        type: "message",
        role: "assistant",
        content: [],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 0,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.content).toEqual([]);
      expect(result.message.toolCalls).toEqual([]);
      expect(result.usage?.completionTokens).toBe(0);
    });

    it("should handle response with stop sequence", () => {
      const responseText = JSON.stringify({
        id: "msg_01STOP123456789",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "This response was stopped by a sequence.",
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "stop_sequence",
        stop_sequence: "STOP",
        usage: {
          input_tokens: 20,
          output_tokens: 10,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.metadata?.stopReason).toBe("stop_sequence");
      expect(result.metadata?.stopSequence).toBe("STOP");
    });
  });

  describe("structured return format validation", () => {
    it("should return structured object with all required fields", () => {
      const responseText = JSON.stringify({
        id: "msg_01STRUCT123456789",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "Test message" }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: 5,
          output_tokens: 3,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      // Verify top-level structure
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("usage");
      expect(result).toHaveProperty("model");
      expect(result).toHaveProperty("metadata");

      // Verify message structure
      expect(result.message).toHaveProperty("id");
      expect(result.message).toHaveProperty("role");
      expect(result.message).toHaveProperty("content");
      expect(result.message).toHaveProperty("toolCalls");
      expect(result.message).toHaveProperty("timestamp");
      expect(result.message).toHaveProperty("metadata");

      // Verify usage structure
      expect(result.usage).toHaveProperty("promptTokens");
      expect(result.usage).toHaveProperty("completionTokens");
      expect(result.usage).toHaveProperty("totalTokens");

      // Verify metadata structure
      expect(result.metadata).toHaveProperty("provider");
      expect(result.metadata?.provider).toBe("anthropic");
    });

    it("should map usage statistics correctly", () => {
      const responseText = JSON.stringify({
        id: "msg_01USAGE123456789",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "Usage test" }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });
    });
  });

  describe("error response handling", () => {
    it("should handle Anthropic API error responses", () => {
      const errorResponseText = JSON.stringify({
        type: "error",
        error: {
          type: "invalid_request_error",
          message: "The request is invalid.",
        },
      });

      const response = createMockResponse(400, "Bad Request");

      expect(() => {
        parseAnthropicResponse(response, errorResponseText);
      }).toThrow(ProviderError);

      try {
        parseAnthropicResponse(response, errorResponseText);
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError);
        expect((error as ProviderError).message).toBe(
          "The request is invalid.",
        );
        expect((error as ProviderError).context?.context).toMatchObject({
          provider: "anthropic",
          errorType: "invalid_request_error",
          status: 400,
          statusText: "Bad Request",
        });
      }
    });

    it("should handle malformed error responses", () => {
      const malformedErrorResponseText = JSON.stringify({
        type: "error",
        invalid: "structure",
      });

      const response = createMockResponse(500, "Internal Server Error");

      expect(() => {
        parseAnthropicResponse(response, malformedErrorResponseText);
      }).toThrow(ProviderError);

      try {
        parseAnthropicResponse(response, malformedErrorResponseText);
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError);
        expect((error as ProviderError).message).toBe(
          "Anthropic API returned an error",
        );
      }
    });

    it("should handle invalid JSON responses", () => {
      const invalidJsonText = "{ invalid json }";
      const response = createMockResponse();

      expect(() => {
        parseAnthropicResponse(response, invalidJsonText);
      }).toThrow(ProviderError);

      try {
        parseAnthropicResponse(response, invalidJsonText);
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError);
        expect((error as ProviderError).message).toBe(
          "Invalid JSON in Anthropic response",
        );
        expect((error as ProviderError).context?.context).toMatchObject({
          provider: "anthropic",
          status: 200,
          statusText: "OK",
        });
        expect((error as ProviderError).context?.context).toHaveProperty(
          "responseText",
        );
      }
    });

    it("should handle empty response body", () => {
      const response = createMockResponse();

      expect(() => {
        parseAnthropicResponse(response, "");
      }).toThrow(ValidationError);

      try {
        parseAnthropicResponse(response, "");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          "Response body is empty",
        );
      }
    });

    it("should handle whitespace-only response body", () => {
      const response = createMockResponse();

      expect(() => {
        parseAnthropicResponse(response, "   \n\t  ");
      }).toThrow(ValidationError);
    });

    it("should handle schema validation failures", () => {
      const invalidResponseText = JSON.stringify({
        id: "msg_invalid",
        type: "not_message", // Invalid type
        role: "assistant",
        content: [{ type: "text", text: "Test" }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
      });

      const response = createMockResponse();

      expect(() => {
        parseAnthropicResponse(response, invalidResponseText);
      }).toThrow(ValidationError);

      try {
        parseAnthropicResponse(response, invalidResponseText);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          "Invalid Anthropic response structure",
        );
        expect((error as ValidationError).context).toHaveProperty(
          "validationErrors",
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle response with missing optional fields", () => {
      const responseText = JSON.stringify({
        id: "msg_01MINIMAL123456789",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "Minimal response" }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: null,
        // stop_sequence is optional and missing
        usage: {
          input_tokens: 5,
          output_tokens: 2,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.metadata?.stopReason).toBeNull();
      expect(result.metadata?.stopSequence).toBeUndefined();
    });

    it("should handle complex tool input parameters", () => {
      const responseText = JSON.stringify({
        id: "msg_01COMPLEX123456789",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu_01COMPLEX123456789",
            name: "complex_tool",
            input: {
              nested: {
                array: [1, 2, 3],
                object: { key: "value" },
              },
              string: "test",
              number: 42,
              boolean: true,
              null_value: null,
            },
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 15,
          output_tokens: 10,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.toolCalls![0].parameters).toEqual({
        nested: {
          array: [1, 2, 3],
          object: { key: "value" },
        },
        string: "test",
        number: 42,
        boolean: true,
        null_value: null,
      });
    });

    it("should handle tool calls with empty input", () => {
      const responseText = JSON.stringify({
        id: "msg_01EMPTYINPUT123456789",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu_01EMPTYINPUT123456789",
            name: "no_param_tool",
            input: {},
          },
        ],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.message.toolCalls![0].parameters).toEqual({});
    });

    it("should handle very large usage numbers", () => {
      const responseText = JSON.stringify({
        id: "msg_01LARGE123456789",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "Large usage test" }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: 999999,
          output_tokens: 888888,
        },
      });

      const response = createMockResponse();
      const result = parseAnthropicResponse(response, responseText);

      expect(result.usage).toEqual({
        promptTokens: 999999,
        completionTokens: 888888,
        totalTokens: 1888887,
      });
    });
  });
});
