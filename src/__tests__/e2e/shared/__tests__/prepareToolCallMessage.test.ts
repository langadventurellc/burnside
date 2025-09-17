/**
 * Unit tests for prepareToolCallMessage helper
 */

import { prepareToolCallMessage } from "../prepareToolCallMessage";
import type { Message } from "../../../../core/messages/message";
import type { ToolCall } from "../../../../core/tools/toolCall";

describe("prepareToolCallMessage", () => {
  const mockToolCall: ToolCall = {
    id: "call_123",
    name: "echo",
    parameters: { text: "hello" },
    metadata: {
      providerId: "openai",
      timestamp: "2024-01-01T00:00:00.000Z",
    },
  };

  const baseMessage: Message = {
    role: "assistant",
    content: [{ type: "text", text: "I'll help with that." }],
  };

  describe("with tool calls", () => {
    it("should convert unified tool calls to OpenAI raw format", () => {
      const messageWithToolCalls = {
        ...baseMessage,
        toolCalls: [mockToolCall],
      };

      const result = prepareToolCallMessage(messageWithToolCalls);

      expect(result.metadata?.tool_calls).toEqual([
        {
          id: "call_123",
          function: {
            name: "echo",
            arguments: '{"text":"hello"}',
          },
        },
      ]);
    });

    it("should preserve existing metadata while adding tool_calls", () => {
      const messageWithMetadata = {
        ...baseMessage,
        toolCalls: [mockToolCall],
        metadata: {
          existingField: "value",
          responseId: "resp_456",
        },
      };

      const result = prepareToolCallMessage(messageWithMetadata);

      expect(result.metadata).toEqual({
        existingField: "value",
        responseId: "resp_456",
        tool_calls: [
          {
            id: "call_123",
            function: {
              name: "echo",
              arguments: '{"text":"hello"}',
            },
          },
        ],
      });
    });

    it("should handle multiple tool calls", () => {
      const multipleToolCalls = [
        mockToolCall,
        {
          id: "call_456",
          name: "calculate",
          parameters: { a: 5, b: 3 },
          metadata: { providerId: "openai" },
        },
      ];

      const messageWithMultipleToolCalls = {
        ...baseMessage,
        toolCalls: multipleToolCalls,
      };

      const result = prepareToolCallMessage(messageWithMultipleToolCalls);

      expect(result.metadata?.tool_calls).toEqual([
        {
          id: "call_123",
          function: {
            name: "echo",
            arguments: '{"text":"hello"}',
          },
        },
        {
          id: "call_456",
          function: {
            name: "calculate",
            arguments: '{"a":5,"b":3}',
          },
        },
      ]);
    });

    it("should handle complex nested parameters", () => {
      const complexToolCall: ToolCall = {
        id: "call_complex",
        name: "process_data",
        parameters: {
          users: [
            { id: 1, name: "Alice", active: true },
            { id: 2, name: "Bob", active: false },
          ],
          filters: {
            status: ["active", "pending"],
            metadata: { source: "api", version: "1.0" },
          },
        },
      };

      const messageWithComplexToolCall = {
        ...baseMessage,
        toolCalls: [complexToolCall],
      };

      const result = prepareToolCallMessage(messageWithComplexToolCall);

      expect(result.metadata?.tool_calls).toEqual([
        {
          id: "call_complex",
          function: {
            name: "process_data",
            arguments: JSON.stringify(complexToolCall.parameters),
          },
        },
      ]);

      // Verify the JSON is valid
      const toolCallsArray = result.metadata?.tool_calls as Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
      const parsedArgs = JSON.parse(toolCallsArray[0].function.arguments);
      expect(parsedArgs).toEqual(complexToolCall.parameters);
    });

    it("should preserve original toolCalls in result", () => {
      const messageWithToolCalls = {
        ...baseMessage,
        toolCalls: [mockToolCall],
      };

      const result = prepareToolCallMessage(messageWithToolCalls);

      expect(result.toolCalls).toEqual([mockToolCall]);
    });
  });

  describe("without tool calls", () => {
    it("should return message unchanged when no toolCalls property", () => {
      const result = prepareToolCallMessage(baseMessage);

      expect(result).toEqual(baseMessage);
      expect(result.metadata?.tool_calls).toBeUndefined();
    });

    it("should return message unchanged when toolCalls is undefined", () => {
      const messageWithUndefinedToolCalls = {
        ...baseMessage,
        toolCalls: undefined,
      };

      const result = prepareToolCallMessage(messageWithUndefinedToolCalls);

      expect(result).toEqual(messageWithUndefinedToolCalls);
      expect(result.metadata?.tool_calls).toBeUndefined();
    });

    it("should return message unchanged when toolCalls is empty array", () => {
      const messageWithEmptyToolCalls = {
        ...baseMessage,
        toolCalls: [],
      };

      const result = prepareToolCallMessage(messageWithEmptyToolCalls);

      expect(result).toEqual(messageWithEmptyToolCalls);
      expect(result.metadata?.tool_calls).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle tool calls with empty parameters", () => {
      const toolCallWithEmptyParams: ToolCall = {
        id: "call_empty",
        name: "no_params_tool",
        parameters: {},
      };

      const messageWithEmptyParams = {
        ...baseMessage,
        toolCalls: [toolCallWithEmptyParams],
      };

      const result = prepareToolCallMessage(messageWithEmptyParams);

      expect(result.metadata?.tool_calls).toEqual([
        {
          id: "call_empty",
          function: {
            name: "no_params_tool",
            arguments: "{}",
          },
        },
      ]);
    });

    it("should handle special characters in parameters", () => {
      const toolCallWithSpecialChars: ToolCall = {
        id: "call_special",
        name: "process_text",
        parameters: {
          text: 'Hello "world"! How are you?\n\tTabs and newlines',
          emoji: "🚀🎉",
          unicode: "Héllo Wörld",
        },
      };

      const messageWithSpecialChars = {
        ...baseMessage,
        toolCalls: [toolCallWithSpecialChars],
      };

      const result = prepareToolCallMessage(messageWithSpecialChars);

      expect(result.metadata?.tool_calls).toHaveLength(1);
      const toolCallsArray = result.metadata?.tool_calls as Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
      const rawToolCall = toolCallsArray[0];

      // Verify the JSON is valid and preserves special characters
      const parsedArgs = JSON.parse(rawToolCall.function.arguments);
      expect(parsedArgs).toEqual(toolCallWithSpecialChars.parameters);
    });
  });
});
