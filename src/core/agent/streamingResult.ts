import type { ToolCall } from "../tools/toolCall";
import type { StreamingState } from "./streamingState";

/**
 * Streaming Result Interface
 *
 * Represents the result of a streaming response processing operation.
 * Contains the final state, accumulated content, detected tool calls,
 * and execution metadata for streaming interruption handling.
 *
 * @example
 * ```typescript
 * const result: StreamingResult = {
 *   state: "paused",
 *   content: "Hello, I can help you with",
 *   detectedToolCalls: [
 *     { id: "call_123", name: "search", parameters: { query: "weather" } }
 *   ],
 *   success: true,
 *   executionMetrics: {
 *     streamingDuration: 1250,
 *     chunksProcessed: 12,
 *     toolCallsDetected: 1
 *   }
 * };
 * ```
 */
export interface StreamingResult {
  /**
   * Final streaming state after processing.
   * Indicates the current state of the streaming state machine.
   */
  state: StreamingState;

  /**
   * Accumulated content from the streaming response.
   * Contains all text content assembled from stream chunks.
   */
  content: string;

  /**
   * Tool calls detected during streaming processing.
   * Array of tool calls that triggered streaming interruption.
   */
  detectedToolCalls: ToolCall[];

  /**
   * Success status of the streaming operation.
   * True if streaming completed successfully, false if errors occurred.
   */
  success: boolean;

  /**
   * Error message if streaming failed.
   * Provides context for debugging streaming failures.
   */
  error?: string;

  /**
   * Execution metrics for performance monitoring.
   * Contains timing and processing statistics.
   */
  executionMetrics: {
    /**
     * Total time spent processing streaming response (milliseconds).
     * Measured from stream start to completion or interruption.
     */
    streamingDuration: number;

    /**
     * Number of stream chunks processed.
     * Count of individual StreamDelta chunks received and processed.
     */
    chunksProcessed: number;

    /**
     * Number of tool calls detected during streaming.
     * Count of tool calls that triggered streaming interruption.
     */
    toolCallsDetected: number;

    /**
     * Token usage information if available.
     * Aggregated token consumption from streaming chunks.
     */
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens?: number;
    };
  };

  /**
   * Additional metadata from streaming processing.
   * Provider-specific or debugging information.
   */
  metadata?: Record<string, unknown>;
}
