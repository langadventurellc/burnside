/**
 * Conversation Context Interface
 *
 * Provides conversation context information for multi-turn provider awareness.
 * Enables providers to make informed decisions about conversation continuation,
 * token usage estimation, and termination detection within multi-turn contexts.
 *
 * This interface contains conversation metadata, message history, and execution
 * context to help providers optimize their behavior during multi-turn interactions.
 */

import type { Message } from "../messages/message";
import type { ToolCall } from "../tools/toolCall";
import type { StreamingState } from "./streamingState";

/**
 * Conversation context information for multi-turn provider awareness.
 *
 * Provides providers with comprehensive conversation state including message
 * history, iteration tracking, tool execution context, and timing information
 * to enable intelligent multi-turn behavior and optimization.
 *
 * @example Basic conversation context usage
 * ```typescript
 * const context: ConversationContext = {
 *   conversationHistory: [
 *     { role: "user", content: [{ type: "text", text: "Hello, help me with math" }] },
 *     { role: "assistant", content: [{ type: "text", text: "I'll help you with math!" }] },
 *     { role: "user", content: [{ type: "text", text: "Calculate 15 * 23" }] }
 *   ],
 *   currentIteration: 2,
 *   totalIterations: 10,
 *   startTime: Date.now() - 30000,
 *   lastIterationTime: Date.now() - 5000,
 *   streamingState: "streaming",
 *   toolExecutionHistory: [
 *     {
 *       id: "call_123",
 *       name: "calculator",
 *       parameters: { operation: "multiply", a: 15, b: 23 }
 *     }
 *   ],
 *   estimatedTokensUsed: 150
 * };
 * ```
 *
 * @example Context during streaming interruption
 * ```typescript
 * const streamingContext: ConversationContext = {
 *   conversationHistory: [...],
 *   currentIteration: 3,
 *   streamingState: "paused",
 *   toolExecutionHistory: [...],
 *   estimatedTokensUsed: 250,
 *   // Provider can see streaming was paused for tool execution
 *   startTime: Date.now() - 60000,
 *   lastIterationTime: Date.now() - 2000
 * };
 * ```
 */
export interface ConversationContext {
  /**
   * Complete conversation history including all messages exchanged.
   * Includes user messages, assistant responses, and tool result messages.
   */
  conversationHistory: Message[];

  /**
   * Current iteration number (1-based).
   * Indicates which conversation turn is currently being processed.
   */
  currentIteration: number;

  /**
   * Maximum allowed iterations for this conversation.
   * Helps providers understand conversation length constraints.
   */
  totalIterations: number;

  /**
   * Conversation start timestamp (Unix timestamp in milliseconds).
   * Enables providers to calculate conversation duration and timing patterns.
   */
  startTime: number;

  /**
   * Most recent iteration timestamp (Unix timestamp in milliseconds).
   * Helps providers understand iteration frequency and timing.
   */
  lastIterationTime: number;

  /**
   * Current streaming state for interruption awareness.
   * Informs providers about streaming and tool execution state.
   */
  streamingState: StreamingState;

  /**
   * Historical record of all tool calls executed during the conversation.
   * Enables providers to understand tool usage patterns and complexity.
   */
  toolExecutionHistory: ToolCall[];

  /**
   * Estimated tokens consumed so far in the conversation.
   * Helps providers make decisions about continuation and termination.
   */
  estimatedTokensUsed?: number;
}
