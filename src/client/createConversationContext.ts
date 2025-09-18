import type { Message } from "../core/messages/message";
import type { ToolCall } from "../core/tools/toolCall";
import type { AgentExecutionOptions } from "../core/agent/agentExecutionOptions";
import type { ConversationContext } from "../core/agent/conversationContext";
import type { StreamingState } from "../core/agent/streamingState";

/**
 * Creates a ConversationContext from request data and execution state
 *
 * Builds a complete conversation context object for provider integration during
 * multi-turn execution. This context enables providers to make informed decisions
 * about conversation continuation, token usage estimation, and termination detection.
 *
 * @param messages - Complete conversation history including all exchanged messages
 * @param options - Agent execution options containing iteration limits and timeout settings
 * @param toolExecutionHistory - Historical record of all tool calls executed in the conversation
 * @param currentIteration - Current iteration number (1-based, defaults to 1)
 * @param streamingState - Current streaming state (defaults to "idle")
 * @param conversationStartTime - When the conversation started (defaults to current time)
 * @param estimatedTokensUsed - Estimated tokens consumed so far (optional)
 * @returns Complete ConversationContext for provider integration
 *
 * @example Basic multi-turn context creation
 * ```typescript
 * const context = createConversationContext(
 *   [
 *     { role: "user", content: [{ type: "text", text: "Help me with math" }] },
 *     { role: "assistant", content: [{ type: "text", text: "I'll help!" }] }
 *   ],
 *   { maxIterations: 5, timeoutMs: 30000 },
 *   [],
 *   2, // Current iteration
 *   "streaming",
 *   Date.now() - 10000 // Started 10 seconds ago
 * );
 * ```
 *
 * @example Context with tool execution history
 * ```typescript
 * const context = createConversationContext(
 *   messages,
 *   options,
 *   [
 *     { id: "call_123", name: "calculator", parameters: { a: 15, b: 23 } },
 *     { id: "call_456", name: "search", parameters: { query: "weather" } }
 *   ],
 *   3,
 *   "tool_execution",
 *   conversationStart,
 *   245 // Estimated tokens used
 * );
 * ```
 */
export function createConversationContext(
  messages: Message[],
  options: AgentExecutionOptions,
  toolExecutionHistory: ToolCall[],
  currentIteration: number = 1,
  streamingState: StreamingState = "idle",
  conversationStartTime: number = Date.now(),
  estimatedTokensUsed?: number,
): ConversationContext {
  return {
    conversationHistory: messages,
    currentIteration,
    totalIterations: options.maxIterations ?? 10,
    startTime: conversationStartTime,
    lastIterationTime: Date.now(),
    streamingState,
    toolExecutionHistory,
    estimatedTokensUsed,
  };
}
