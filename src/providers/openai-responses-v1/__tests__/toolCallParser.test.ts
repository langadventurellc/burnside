/**
 * Tool Call Parser Tests
 *
 * Comprehensive unit tests for OpenAI tool call parsing logic,
 * covering validation, conversion, and error handling scenarios.
 */

import { describe, it, expect } from "@jest/globals";
import { parseOpenAIToolCalls } from "../toolCallParser";
import { ValidationError } from "../../../core/errors/validationError";
import {
  nonStreamingToolCallSuccess,
  nonStreamingMultipleToolCalls,
  malformedToolCallArguments,
  missingToolCallFields,
  complexToolCallParameters,
  emptyToolCallArguments,
  toolCallErrorScenarios,
} from "./fixtures/toolCallResponses";

describe("parseOpenAIToolCalls", () => {
  describe("Valid tool call parsing", () => {
    it("should parse single tool call correctly", () => {
      const toolCalls =
        nonStreamingToolCallSuccess.choices[0].message.tool_calls;
      const result = parseOpenAIToolCalls(toolCalls);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "call_abc123",
        name: "calculate_sum",
        parameters: { a: 5, b: 3 },
        metadata: {
          providerId: "openai",
          timestamp: expect.any(String),
          rawCall: toolCalls[0],
        },
      });
    });

    it("should parse multiple tool calls correctly", () => {
      const toolCalls =
        nonStreamingMultipleToolCalls.choices[0].message.tool_calls;
      const result = parseOpenAIToolCalls(toolCalls);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "call_def456",
        name: "calculate_sum",
        parameters: { a: 10, b: 20 },
      });
      expect(result[1]).toMatchObject({
        id: "call_ghi789",
        name: "calculate_product",
        parameters: { x: 4, y: 7 },
      });
    });

    it("should handle empty tool call arguments", () => {
      const toolCalls = emptyToolCallArguments.choices[0].message.tool_calls;
      const result = parseOpenAIToolCalls(toolCalls);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "call_empty123",
        name: "get_current_time",
        parameters: {},
      });
    });

    it("should handle complex nested parameters", () => {
      const toolCalls = complexToolCallParameters.choices[0].message.tool_calls;
      const result = parseOpenAIToolCalls(toolCalls);

      expect(result).toHaveLength(1);
      expect(result[0].parameters).toMatchObject({
        users: [
          { id: 1, name: "Alice", active: true },
          { id: 2, name: "Bob", active: false },
        ],
        filters: {
          status: ["active", "pending"],
          roles: null,
          metadata: {
            source: "api",
            version: "1.2.3",
          },
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 150,
        },
      });
    });

    it("should include correct metadata for all tool calls", () => {
      const toolCalls =
        nonStreamingToolCallSuccess.choices[0].message.tool_calls;
      const result = parseOpenAIToolCalls(toolCalls);

      expect(result[0].metadata).toMatchObject({
        providerId: "openai",
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        rawCall: toolCalls[0],
      });
    });
  });

  describe("Error handling", () => {
    it("should throw ValidationError for malformed JSON arguments", () => {
      const toolCalls =
        malformedToolCallArguments.choices[0].message.tool_calls;

      expect(() => parseOpenAIToolCalls(toolCalls)).toThrow(ValidationError);
      expect(() => parseOpenAIToolCalls(toolCalls)).toThrow(
        /Invalid JSON in tool call arguments/,
      );
    });

    it("should throw ValidationError for missing required fields", () => {
      const toolCalls = missingToolCallFields.choices[0].message.tool_calls;

      expect(() => parseOpenAIToolCalls(toolCalls)).toThrow(ValidationError);
      expect(() => parseOpenAIToolCalls(toolCalls)).toThrow(
        /Invalid OpenAI tool calls structure/,
      );
    });

    it("should throw ValidationError for arguments that are not objects", () => {
      const toolCalls =
        toolCallErrorScenarios.invalidArgumentsType.choices[0].message
          .tool_calls;

      expect(() => parseOpenAIToolCalls(toolCalls)).toThrow(ValidationError);
      expect(() => parseOpenAIToolCalls(toolCalls)).toThrow(
        /Tool call arguments must be a JSON object/,
      );
    });

    it("should throw ValidationError for arguments that are arrays", () => {
      const toolCalls =
        toolCallErrorScenarios.argumentsArray.choices[0].message.tool_calls;

      expect(() => parseOpenAIToolCalls(toolCalls)).toThrow(ValidationError);
      expect(() => parseOpenAIToolCalls(toolCalls)).toThrow(
        /Tool call arguments must be a JSON object/,
      );
    });

    it("should throw ValidationError for null input", () => {
      expect(() => parseOpenAIToolCalls(null)).toThrow(ValidationError);
      expect(() => parseOpenAIToolCalls(null)).toThrow(
        /Invalid OpenAI tool calls structure/,
      );
    });

    it("should throw ValidationError for undefined input", () => {
      expect(() => parseOpenAIToolCalls(undefined)).toThrow(ValidationError);
      expect(() => parseOpenAIToolCalls(undefined)).toThrow(
        /Invalid OpenAI tool calls structure/,
      );
    });

    it("should throw ValidationError for non-array input", () => {
      expect(() => parseOpenAIToolCalls({})).toThrow(ValidationError);
      expect(() => parseOpenAIToolCalls({})).toThrow(
        /Invalid OpenAI tool calls structure/,
      );
    });

    it("should throw ValidationError for empty tool call ID", () => {
      const toolCallsWithEmptyId = [
        {
          id: "",
          type: "function",
          function: {
            name: "test_tool",
            arguments: "{}",
          },
        },
      ];

      expect(() => parseOpenAIToolCalls(toolCallsWithEmptyId)).toThrow(
        ValidationError,
      );
      expect(() => parseOpenAIToolCalls(toolCallsWithEmptyId)).toThrow(
        /Invalid OpenAI tool calls structure/,
      );
    });

    it("should throw ValidationError for empty function name", () => {
      const toolCallsWithEmptyName = [
        {
          id: "call_test123",
          type: "function",
          function: {
            name: "",
            arguments: "{}",
          },
        },
      ];

      expect(() => parseOpenAIToolCalls(toolCallsWithEmptyName)).toThrow(
        ValidationError,
      );
      expect(() => parseOpenAIToolCalls(toolCallsWithEmptyName)).toThrow(
        /Invalid OpenAI tool calls structure/,
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle empty tool calls array", () => {
      const result = parseOpenAIToolCalls([]);

      expect(result).toEqual([]);
    });

    it("should handle whitespace-only arguments", () => {
      const toolCallsWithWhitespace = [
        {
          id: "call_whitespace123",
          type: "function",
          function: {
            name: "test_tool",
            arguments: "   ",
          },
        },
      ];

      const result = parseOpenAIToolCalls(toolCallsWithWhitespace);

      expect(result).toHaveLength(1);
      expect(result[0].parameters).toEqual({});
    });

    it("should preserve tool call order in multiple calls", () => {
      const toolCalls =
        nonStreamingMultipleToolCalls.choices[0].message.tool_calls;
      const result = parseOpenAIToolCalls(toolCalls);

      expect(result[0].id).toBe("call_def456");
      expect(result[1].id).toBe("call_ghi789");
    });

    it("should handle tool calls with special characters in parameters", () => {
      const toolCallsWithSpecialChars = [
        {
          id: "call_special123",
          type: "function",
          function: {
            name: "process_text",
            arguments: JSON.stringify({
              text: 'Hello "world"! How are you?\n\tTabs and newlines: \\n\\t',
              emoji: "🚀🎉",
              unicode: "Héllo Wörld",
            }),
          },
        },
      ];

      const result = parseOpenAIToolCalls(toolCallsWithSpecialChars);

      expect(result[0].parameters).toMatchObject({
        text: 'Hello "world"! How are you?\n\tTabs and newlines: \\n\\t',
        emoji: "🚀🎉",
        unicode: "Héllo Wörld",
      });
    });
  });

  describe("Error context preservation", () => {
    it("should include tool call ID in error context for JSON parsing errors", () => {
      const toolCalls =
        malformedToolCallArguments.choices[0].message.tool_calls;

      try {
        parseOpenAIToolCalls(toolCalls);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError && error.context) {
          expect(error.context.context).toBe("tool_call_call_bad123");
          expect(error.context.input).toBe('{"a": 5, "b":}');
        }
      }
    });

    it("should include original input in validation errors", () => {
      try {
        parseOpenAIToolCalls({ invalid: "structure" });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError && error.context) {
          expect(error.context.input).toEqual({ invalid: "structure" });
          expect(error.context.context).toBe("tool_calls_validation");
        }
      }
    });
  });
});
