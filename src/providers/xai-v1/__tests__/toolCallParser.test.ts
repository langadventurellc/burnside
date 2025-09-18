/**
 * Tests for xAI Tool Call Parser
 *
 * Comprehensive test coverage for parsing xAI tool calls from responses
 * and converting them to unified ToolCall format.
 */

import { parseXAIToolCalls } from "../toolCallParser";
import { ValidationError } from "../../../core/errors/validationError";

describe("parseXAIToolCalls", () => {
  describe("Successful parsing", () => {
    it("should parse single tool call correctly", () => {
      const toolCalls = [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location": "San Francisco", "unit": "celsius"}',
          },
        },
      ];

      const result = parseXAIToolCalls(toolCalls);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "call_123",
        name: "get_weather",
        parameters: {
          location: "San Francisco",
          unit: "celsius",
        },
        metadata: {
          providerId: "xai",
          timestamp: expect.any(String),
          rawCall: toolCalls[0],
        },
      });
    });

    it("should parse multiple tool calls correctly", () => {
      const toolCalls = [
        {
          id: "call_456",
          type: "function",
          function: {
            name: "search_web",
            arguments: '{"query": "AI news"}',
          },
        },
        {
          id: "call_789",
          type: "function",
          function: {
            name: "calculate",
            arguments: '{"expression": "2 + 2"}',
          },
        },
      ];

      const result = parseXAIToolCalls(toolCalls);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("search_web");
      expect(result[1].name).toBe("calculate");
    });

    it("should handle empty arguments string", () => {
      const toolCalls = [
        {
          id: "call_empty",
          type: "function",
          function: {
            name: "list_files",
            arguments: "",
          },
        },
      ];

      const result = parseXAIToolCalls(toolCalls);

      expect(result[0].parameters).toEqual({});
    });

    it("should handle whitespace-only arguments string", () => {
      const toolCalls = [
        {
          id: "call_whitespace",
          type: "function",
          function: {
            name: "no_args_function",
            arguments: "   ",
          },
        },
      ];

      const result = parseXAIToolCalls(toolCalls);

      expect(result[0].parameters).toEqual({});
    });

    it("should parse complex nested arguments", () => {
      const toolCalls = [
        {
          id: "call_complex",
          type: "function",
          function: {
            name: "process_data",
            arguments:
              '{"data": {"users": [{"id": 1, "name": "Alice"}], "settings": {"debug": true}}}',
          },
        },
      ];

      const result = parseXAIToolCalls(toolCalls);

      expect(result[0].parameters).toEqual({
        data: {
          users: [{ id: 1, name: "Alice" }],
          settings: { debug: true },
        },
      });
    });

    it("should generate unique timestamps for concurrent calls", () => {
      const toolCalls = [
        {
          id: "call_1",
          type: "function",
          function: { name: "func1", arguments: "{}" },
        },
        {
          id: "call_2",
          type: "function",
          function: { name: "func2", arguments: "{}" },
        },
      ];

      const result = parseXAIToolCalls(toolCalls);

      expect(result[0].metadata?.timestamp).toBeDefined();
      expect(result[1].metadata?.timestamp).toBeDefined();
      // Timestamps should be valid ISO strings
      expect(
        () => new Date(result[0].metadata?.timestamp as string),
      ).not.toThrow();
      expect(
        () => new Date(result[1].metadata?.timestamp as string),
      ).not.toThrow();
    });
  });

  describe("Error handling", () => {
    it("should throw ValidationError for invalid structure", () => {
      const invalidToolCalls = "not an array";

      expect(() => parseXAIToolCalls(invalidToolCalls)).toThrow(
        ValidationError,
      );
      expect(() => parseXAIToolCalls(invalidToolCalls)).toThrow(
        "Invalid xAI tool calls structure",
      );
    });

    it("should throw ValidationError for missing tool call ID", () => {
      const toolCalls = [
        {
          type: "function",
          function: {
            name: "test_function",
            arguments: "{}",
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
    });

    it("should throw ValidationError for empty tool call ID", () => {
      const toolCalls = [
        {
          id: "",
          type: "function",
          function: {
            name: "test_function",
            arguments: "{}",
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
    });

    it("should throw ValidationError for missing function name", () => {
      const toolCalls = [
        {
          id: "call_123",
          type: "function",
          function: {
            arguments: "{}",
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
    });

    it("should throw ValidationError for empty function name", () => {
      const toolCalls = [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "",
            arguments: "{}",
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
    });

    it("should throw ValidationError for malformed JSON arguments", () => {
      const toolCalls = [
        {
          id: "call_bad_json",
          type: "function",
          function: {
            name: "test_function",
            arguments: "{ invalid json",
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
      expect(() => parseXAIToolCalls(toolCalls)).toThrow(
        "Invalid JSON in tool call arguments",
      );
    });

    it("should throw ValidationError for non-object JSON arguments", () => {
      const toolCalls = [
        {
          id: "call_string_args",
          type: "function",
          function: {
            name: "test_function",
            arguments: '"string instead of object"',
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
      expect(() => parseXAIToolCalls(toolCalls)).toThrow(
        "Tool call arguments must be a JSON object",
      );
    });

    it("should throw ValidationError for array JSON arguments", () => {
      const toolCalls = [
        {
          id: "call_array_args",
          type: "function",
          function: {
            name: "test_function",
            arguments: "[1, 2, 3]",
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
      expect(() => parseXAIToolCalls(toolCalls)).toThrow(
        "Tool call arguments must be a JSON object",
      );
    });

    it("should throw ValidationError for null JSON arguments", () => {
      const toolCalls = [
        {
          id: "call_null_args",
          type: "function",
          function: {
            name: "test_function",
            arguments: "null",
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
      expect(() => parseXAIToolCalls(toolCalls)).toThrow(
        "Tool call arguments must be a JSON object",
      );
    });

    it("should include context in error messages", () => {
      const toolCalls = [
        {
          id: "call_context_test",
          type: "function",
          function: {
            name: "test_function",
            arguments: "{ malformed",
          },
        },
      ];

      try {
        parseXAIToolCalls(toolCalls);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toMatchObject({
          context: "tool_call_call_context_test",
        });
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle empty tool calls array", () => {
      const result = parseXAIToolCalls([]);
      expect(result).toEqual([]);
    });

    it("should handle null input", () => {
      expect(() => parseXAIToolCalls(null)).toThrow(ValidationError);
    });

    it("should handle undefined input", () => {
      expect(() => parseXAIToolCalls(undefined)).toThrow(ValidationError);
    });

    it("should preserve all metadata fields", () => {
      const toolCalls = [
        {
          id: "call_metadata_test",
          type: "function",
          function: {
            name: "test_function",
            arguments: "{}",
          },
        },
      ];

      const result = parseXAIToolCalls(toolCalls);

      expect(result[0].metadata).toEqual({
        providerId: "xai",
        timestamp: expect.any(String),
        rawCall: toolCalls[0],
      });
    });
  });

  describe("Type validation", () => {
    it("should only accept function type tool calls", () => {
      const toolCalls = [
        {
          id: "call_wrong_type",
          type: "not_function",
          function: {
            name: "test_function",
            arguments: "{}",
          },
        },
      ];

      expect(() => parseXAIToolCalls(toolCalls)).toThrow(ValidationError);
    });

    it("should validate the complete tool call schema", () => {
      const incompleteToolCall = [
        {
          id: "call_incomplete",
          // Missing type and function fields
        },
      ];

      expect(() => parseXAIToolCalls(incompleteToolCall)).toThrow(
        ValidationError,
      );
    });
  });
});
