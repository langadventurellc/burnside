import type { Message } from "../core/messages/message";
import type { ToolCall } from "../core/tools/toolCall";
import { logger } from "../core/logging";

/**
 * OpenAI tool call format interface for type safety
 */
interface OpenAIToolCall {
  id: string;
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

/**
 * Type guard to check if an unknown value is an OpenAI tool call
 */
function isOpenAIToolCall(value: unknown): value is OpenAIToolCall {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    "function" in value &&
    typeof (value as Record<string, unknown>).id === "string" &&
    value.function !== null &&
    typeof value.function === "object" &&
    "name" in value.function &&
    "arguments" in value.function &&
    typeof (value.function as Record<string, unknown>).name === "string"
  );
}

/**
 * Extract tool calls from a message's content or metadata
 *
 * Searches message content and metadata for tool call requests from the LLM.
 * Handles provider-specific tool call formats and normalizes them to unified ToolCall format.
 *
 * @param message - Message to extract tool calls from
 * @returns Array of extracted tool calls, empty if none found
 *
 * @example
 * ```typescript
 * const message: Message = {
 *   role: "assistant",
 *   content: [{ type: "text", text: "I'll help you with that." }],
 *   metadata: {
 *     tool_calls: [
 *       { id: "call_123", function: { name: "echo", arguments: '{"text":"hello"}' } }
 *     ]
 *   }
 * };
 *
 * const toolCalls = extractToolCallsFromMessage(message);
 * // Returns: [{ id: "call_123", name: "echo", parameters: { text: "hello" } }]
 * ```
 */
export function extractToolCallsFromMessage(message: Message): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  logger.debug("Tool call extraction started", {
    messageRole: message.role,
    hasMetadata: Boolean(message.metadata),
    hasToolCalls: Boolean(message.metadata?.tool_calls),
  });

  // Check message metadata for tool calls (OpenAI format)
  const toolCallsData = message.metadata?.tool_calls;
  if (toolCallsData && Array.isArray(toolCallsData)) {
    logger.debug("Processing tool calls from message metadata", {
      toolCallsCount: toolCallsData.length,
    });

    for (const toolCallData of toolCallsData) {
      try {
        if (isOpenAIToolCall(toolCallData)) {
          const argumentsValue = toolCallData.function.arguments;
          const parameters =
            typeof argumentsValue === "string"
              ? (JSON.parse(argumentsValue) as Record<string, unknown>)
              : argumentsValue;

          toolCalls.push({
            id: toolCallData.id,
            name: toolCallData.function.name,
            parameters,
            metadata: {
              providerId: "openai",
              timestamp: new Date().toISOString(),
            },
          });

          logger.debug("Tool call extracted successfully", {
            toolName: toolCallData.function.name,
            callId: toolCallData.id,
            hasParameters: Boolean(
              parameters && Object.keys(parameters).length > 0,
            ),
          });
        }
      } catch (error) {
        // Skip malformed tool calls but don't fail the entire extraction
        logger.warn("Failed to parse tool call from message", {
          toolCallId:
            typeof toolCallData === "object" &&
            toolCallData !== null &&
            "id" in toolCallData
              ? (toolCallData as { id: unknown }).id
              : "unknown",
          error: error instanceof Error ? error.message : String(error),
          toolCallDataType: typeof toolCallData,
          isObject: typeof toolCallData === "object" && toolCallData !== null,
        });
      }
    }
  } else {
    logger.debug("No tool calls found in message", {
      messageRole: message.role,
      hasMetadata: Boolean(message.metadata),
    });
  }

  logger.info("Tool call extraction completed", {
    extractedToolCalls: toolCalls.length,
    toolNames: toolCalls.map((tc) => tc.name),
  });

  // TODO: Add support for other provider formats as needed
  // This can be extended to handle different provider-specific tool call formats

  return toolCalls;
}
