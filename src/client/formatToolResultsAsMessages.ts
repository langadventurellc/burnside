import type { Message } from "../core/messages/message";
import type { ToolResult } from "../core/tools/toolResult";

/**
 * Format tool results as messages for conversation continuation
 *
 * Converts tool execution results into message format that can be added to
 * the conversation history for the next LLM turn.
 *
 * @param toolResults - Array of tool execution results
 * @returns Array of messages representing tool results
 *
 * @example
 * ```typescript
 * const results: ToolResult[] = [
 *   {
 *     success: true,
 *     data: { echoed: "hello world" },
 *     metadata: { toolName: "echo", executionTime: 45 }
 *   }
 * ];
 *
 * const messages = formatToolResultsAsMessages(results);
 * // Returns: [{ role: "tool", content: [...], metadata: {...} }]
 * ```
 */
export function formatToolResultsAsMessages(
  toolResults: ToolResult[],
): Message[] {
  return toolResults.map((result, index) => {
    const content = result.success
      ? [{ type: "text" as const, text: JSON.stringify(result.data) }]
      : [
          {
            type: "text" as const,
            text: `Error: ${result.error?.message ?? "Unknown error"}`,
          },
        ];

    return {
      id: `tool-result-${index}-${Date.now()}`,
      role: "tool" as const,
      content,
      timestamp: new Date().toISOString(),
      metadata: {
        toolResult: true,
        success: result.success,
        toolName: (result.metadata as Record<string, unknown> | undefined)
          ?.toolName,
        executionTime: result.metadata?.executionTime,
        ...(result.metadata || {}),
      },
    };
  });
}
