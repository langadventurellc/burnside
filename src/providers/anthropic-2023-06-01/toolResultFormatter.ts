/**
 * Anthropic Tool Result Formatter
 *
 * Formats tool execution results for inclusion in Anthropic message format.
 */

import type { ToolCall } from "../../core/tools/toolCall";

/**
 * Anthropic message type
 */
interface AnthropicMessage {
  role: "user" | "assistant";
  content: Array<{
    type: string;
    tool_use_id?: string;
    content?: string;
    [key: string]: unknown;
  }>;
}

/**
 * Format tool result as Anthropic message
 *
 * @param toolCall - The original tool call
 * @param result - The tool execution result
 * @returns Anthropic message format for tool result
 */
export function formatToolResultMessage(
  toolCall: ToolCall,
  result: unknown,
): AnthropicMessage {
  return {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: toolCall.id,
        content:
          typeof result === "string"
            ? result
            : result === undefined
              ? "undefined"
              : JSON.stringify(result),
      },
    ],
  };
}
