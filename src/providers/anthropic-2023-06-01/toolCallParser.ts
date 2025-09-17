/**
 * Anthropic Tool Call Parser
 *
 * Extracts tool calls from Anthropic response content blocks and converts them
 * to the unified ToolCall format.
 */

import type { ToolCall } from "../../core/tools/toolCall";

/**
 * Anthropic tool use content block type
 */
interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Anthropic content block union type
 */
interface AnthropicContentBlock {
  type: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Extract tool calls from Anthropic response content blocks
 *
 * @param contentBlocks - Array of Anthropic content blocks from response
 * @returns Array of ToolCall objects
 */
export function parseAnthropicToolCalls(
  contentBlocks: AnthropicContentBlock[],
): ToolCall[] {
  return contentBlocks
    .filter((block) => block.type === "tool_use")
    .map((block) => {
      // Type assertion after filtering - we know these are tool use blocks
      const toolBlock = block as AnthropicToolUseBlock;
      return {
        id: toolBlock.id || `tool_${Date.now()}`,
        name: toolBlock.name,
        parameters: toolBlock.input,
        metadata: {
          providerId: "anthropic",
          timestamp: new Date().toISOString(),
        },
      };
    });
}
