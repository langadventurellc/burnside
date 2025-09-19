/**
 * Multi-Turn State Interface
 *
 * Extends AgentExecutionState to track multi-turn conversation state including
 * iteration counts, streaming states, tool execution tracking, and termination
 * reasons across multiple conversation turns.
 *
 * This interface provides comprehensive state management for multi-turn agent
 * conversations, enabling robust orchestration, streaming interruption handling,
 * and detailed execution tracking throughout extended agent interactions.
 */

import type { AgentExecutionState } from "./agentExecutionState";
import type { ToolCall } from "../tools/toolCall";
import type { StreamingState } from "./streamingState";
import type { TerminationReason } from "./terminationReason";
import type { UnifiedTerminationSignal } from "./unifiedTerminationSignal";

/**
 * Multi-turn conversation state that extends single-turn AgentExecutionState
 * to provide comprehensive tracking across multiple conversation iterations.
 *
 * This interface manages iteration counts, streaming state transitions, tool
 * execution tracking, and termination context for robust multi-turn agent
 * orchestration with streaming interruption support.
 *
 * @example Basic multi-turn state creation
 * ```typescript
 * const state: MultiTurnState = {
 *   // Inherited from AgentExecutionState
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Hello, help me calculate something" }] }
 *   ],
 *   toolCalls: [],
 *   results: [],
 *   shouldContinue: true,
 *   lastResponse: "I'll help you with calculations. What would you like me to calculate?",
 *
 *   // Multi-turn specific properties
 *   iteration: 1,
 *   totalIterations: 10,
 *   startTime: Date.now(),
 *   lastIterationTime: Date.now(),
 *   streamingState: "idle",
 *   pendingToolCalls: [],
 *   completedToolCalls: []
 * };
 * ```
 *
 * @example State during streaming interruption
 * ```typescript
 * const streamingState: MultiTurnState = {
 *   // ... base properties
 *   iteration: 2,
 *   streamingState: "paused",
 *   pendingToolCalls: [
 *     {
 *       id: "call_123",
 *       name: "calculator",
 *       parameters: { operation: "add", a: 5, b: 3 }
 *     }
 *   ],
 *   completedToolCalls: [
 *     {
 *       id: "call_previous",
 *       name: "search",
 *       parameters: { query: "math operations" }
 *     }
 *   ]
 * };
 * ```
 *
 * @example Completed conversation state
 * ```typescript
 * const completedState: MultiTurnState = {
 *   // ... base properties
 *   iteration: 4,
 *   streamingState: "idle",
 *   shouldContinue: false,
 *   terminationReason: "natural_completion",
 *   pendingToolCalls: [],
 *   completedToolCalls: [
 *     // All tool calls executed during conversation
 *   ]
 * };
 * ```
 */
export interface MultiTurnState extends AgentExecutionState {
  /**
   * Current iteration number (1-based).
   * Tracks which conversation turn is currently being processed.
   */
  iteration: number;

  /**
   * Maximum allowed iterations for this conversation.
   * Used to prevent runaway conversations and enforce safety limits.
   */
  totalIterations: number;

  /**
   * Conversation start timestamp (Unix timestamp in milliseconds).
   * Records when the multi-turn conversation began for timeout tracking.
   */
  startTime: number;

  /**
   * Most recent iteration timestamp (Unix timestamp in milliseconds).
   * Updated at the start of each iteration for timing analysis.
   */
  lastIterationTime: number;

  /**
   * Current streaming state for interruption handling.
   * Manages the state machine for streaming response and tool execution.
   *
   * State transitions:
   * - idle → streaming (response starts)
   * - streaming → paused (tool calls detected)
   * - paused → tool_execution (tools begin executing)
   * - tool_execution → resuming (tools complete)
   * - resuming → streaming (next iteration begins)
   */
  streamingState: StreamingState;

  /**
   * Tool calls awaiting execution.
   * Populated when tool calls are detected during streaming and need execution.
   */
  pendingToolCalls: ToolCall[];

  /**
   * All tool calls completed across all conversation turns.
   * Maintains historical record of tool execution for debugging and context.
   */
  completedToolCalls: ToolCall[];

  /**
   * Optional reason why the conversation terminated.
   * Provides clear context for conversation completion or interruption.
   * Only set when the conversation has ended (shouldContinue = false).
   */
  terminationReason?: TerminationReason;

  /**
   * History of termination signals analyzed across all iterations.
   * Tracks termination analysis results from each iteration for debugging
   * and provider consistency analysis.
   */
  terminationSignalHistory?: UnifiedTerminationSignal[];

  /**
   * Most recent termination signal analysis.
   * Contains the latest termination analysis including reason, confidence,
   * and provider-specific metadata for the current iteration.
   */
  currentTerminationSignal?: UnifiedTerminationSignal;

  /**
   * Provider-specific termination metadata for debugging.
   * Preserves raw provider termination context for troubleshooting
   * and analysis of provider-specific termination behavior.
   */
  providerTerminationMetadata?: Record<string, unknown>;
}
