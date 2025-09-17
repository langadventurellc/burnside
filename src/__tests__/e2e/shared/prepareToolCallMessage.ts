/**
 * Tool Call Message Preparation for E2E Testing
 *
 * Converts unified tool calls to OpenAI raw format for extraction compatibility.
 * Addresses the mismatch between message.toolCalls (unified format) and
 * message.metadata.tool_calls (OpenAI raw format expected by extractToolCallsFromMessage).
 */

import type { Message } from "../../../core/messages/message";
import type { ToolCall } from "../../../core/tools/toolCall";

/**
 * Extended Message type that includes toolCalls property from OpenAI responses
 */
type MessageWithToolCalls = Message & { toolCalls?: ToolCall[] };

/**
 * OpenAI raw tool call format interface for type safety
 */
interface OpenAIRawToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Formats unified ToolCall objects to OpenAI raw format expected by extractToolCallsFromMessage.
 */
function formatToolCallForExtraction(
  toolCalls: ToolCall[],
): OpenAIRawToolCall[] {
  return toolCalls.map((call) => ({
    id: call.id,
    function: {
      name: call.name,
      arguments: JSON.stringify(call.parameters),
    },
  }));
}

/**
 * Converts unified tool calls to OpenAI raw format for extraction compatibility.
 *
 * Takes a message with toolCalls in unified format and ensures it also has
 * the tool calls in message.metadata.tool_calls in the OpenAI raw format
 * expected by extractToolCallsFromMessage.
 *
 * @param message - Message that may contain unified tool calls
 * @returns Message with tool calls in both unified and raw format
 *
 * @example
 * ```typescript
 * const message: MessageWithToolCalls = {
 *   role: "assistant",
 *   content: [{ type: "text", text: "I'll help with that." }],
 *   toolCalls: [{ id: "call_123", name: "echo", parameters: { text: "hello" } }]
 * };
 *
 * const prepared = prepareToolCallMessage(message);
 * // prepared.metadata.tool_calls contains OpenAI raw format for extraction
 * ```
 */
export function prepareToolCallMessage(
  message: MessageWithToolCalls,
): MessageWithToolCalls {
  // If no tool calls, return as-is
  if (!message.toolCalls || message.toolCalls.length === 0) {
    return message;
  }

  // Type assertion since we've checked toolCalls exists and is non-empty
  const toolCalls = message.toolCalls;

  // Convert unified tool calls to OpenAI raw format
  const rawToolCalls = formatToolCallForExtraction(toolCalls);

  // Return message with both formats
  return {
    ...message,
    metadata: {
      ...message.metadata,
      tool_calls: rawToolCalls,
    },
  };
}
