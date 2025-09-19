import type { Message } from "../messages/message";
import type { MultiTurnState } from "./multiTurnState";
import type { ExecutionMetrics } from "./executionMetrics";
import type { StreamingResult } from "./streamingResult";

/**
 * Result interface for streaming turn operations in multi-turn conversations.
 *
 * Coordinates between streaming state machine and multi-turn orchestration,
 * providing comprehensive results for streaming interruption scenarios including
 * tool call detection, execution, and conversation resumption.
 *
 * @example
 * ```typescript
 * const streamingTurnResult: StreamingTurnResult = {
 *   finalMessages: [
 *     { role: 'assistant', content: 'Let me search for that information...' },
 *     { role: 'tool', tool_call_id: 'call_123', content: 'Search results...' }
 *   ],
 *   updatedState: {
 *     iteration: 2,
 *     totalIterations: 5,
 *     streamingState: 'idle',
 *     pendingToolCalls: [],
 *     completedToolCalls: [{ id: 'call_123', function: 'search', arguments: '{}' }]
 *   },
 *   executionMetrics: {
 *     iterationDuration: 1250,
 *     toolExecutionTime: 340,
 *     tokenCount: { input: 150, output: 89 }
 *   },
 *   streamingResult: {
 *     state: 'completed',
 *     content: 'Let me search for that information...',
 *     detectedToolCalls: [{ id: 'call_123', function: 'search' }],
 *     success: true,
 *     executionMetrics: { streamingDuration: 450, chunksProcessed: 12 }
 *   }
 * };
 * ```
 */
export interface StreamingTurnResult {
  /**
   * Final conversation messages after streaming and tool execution completion.
   *
   * Includes the accumulated streaming content as assistant messages and any
   * tool call results appended during the streaming interruption cycle.
   * Messages maintain proper chronological ordering for conversation history.
   */
  finalMessages: Message[];

  /**
   * Updated multi-turn conversation state after streaming turn completion.
   *
   * Reflects changes to iteration tracking, streaming state transitions,
   * tool execution status, and termination conditions. This state is used
   * to coordinate with the next iteration in multi-turn orchestration.
   */
  updatedState: MultiTurnState;

  /**
   * Performance and execution metrics for the streaming turn.
   *
   * Captures timing information for streaming, tool execution, and overall
   * turn duration. Used for performance monitoring, optimization, and
   * debugging of streaming interruption overhead.
   */
  executionMetrics: ExecutionMetrics;

  /**
   * Detailed streaming operation result from the state machine.
   *
   * Provides comprehensive information about the streaming process including
   * tool call detection, buffer management, state transitions, and any
   * streaming-specific errors or metadata.
   */
  streamingResult: StreamingResult;

  /**
   * Optional error information if streaming turn encountered recoverable issues.
   *
   * Captures non-fatal errors during streaming or tool execution that were
   * handled gracefully. Fatal errors are thrown as exceptions rather than
   * returned in this field.
   */
  error?: Error;

  /**
   * Optional metadata about the streaming turn execution.
   *
   * Additional context for debugging, monitoring, or advanced use cases.
   * May include information about fallback strategies used, retry attempts,
   * or provider-specific streaming characteristics.
   */
  metadata?: Record<string, unknown>;
}
