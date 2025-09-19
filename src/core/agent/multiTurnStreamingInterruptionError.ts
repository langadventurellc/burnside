/**
 * Error thrown when streaming interruption fails during multi-turn execution.
 *
 * Wraps streaming-specific errors with multi-turn context for comprehensive
 * debugging of streaming interruption scenarios during multi-turn conversations.
 */

import type { MultiTurnState } from "./multiTurnState";
import type { StreamingState } from "./streamingState";
import type { ExecutionMetrics } from "./executionMetrics";
import { MultiTurnExecutionError } from "./multiTurnErrors";

/**
 * Error thrown when streaming interruption fails during multi-turn execution.
 *
 * Wraps streaming-specific errors with multi-turn context for comprehensive
 * debugging of streaming interruption scenarios during multi-turn conversations.
 */
export class MultiTurnStreamingInterruptionError extends MultiTurnExecutionError {
  /**
   * Streaming state when interruption failed.
   */
  readonly streamingState: StreamingState;

  /**
   * Details about the streaming interruption failure.
   */
  readonly interruptionContext: {
    expectedState: StreamingState;
    actualState: StreamingState;
    operationType: "pause" | "resume" | "tool_execution" | "state_sync";
  };

  constructor(
    streamingState: StreamingState,
    cause: Error,
    context: Partial<MultiTurnState>,
    options: {
      metrics?: ExecutionMetrics;
      interruptionContext?: {
        expectedState: StreamingState;
        actualState: StreamingState;
        operationType: "pause" | "resume" | "tool_execution" | "state_sync";
      };
      debugContext?: Record<string, unknown>;
    } = {},
  ) {
    super(
      `Streaming interruption failed during multi-turn execution: ${cause.message}`,
      "streaming_response",
      cause,
      context,
      {
        ...options,
        recoveryAction: "fallback_single_turn",
        debugContext: {
          errorType: "streaming_interruption_failure",
          streamingState,
          ...options.debugContext,
        },
      },
    );

    this.name = "MultiTurnStreamingInterruptionError";
    this.streamingState = streamingState;
    this.interruptionContext = options.interruptionContext ?? {
      expectedState: streamingState,
      actualState: streamingState,
      operationType: "pause",
    };
  }

  /**
   * Creates error for streaming pause failures during tool call detection.
   *
   * @param cause - Original streaming interruption error
   * @param context - Multi-turn state context
   * @param streamingState - Current streaming state
   * @returns MultiTurnStreamingInterruptionError with pause context
   */
  static createPauseError(
    cause: Error,
    context: Partial<MultiTurnState>,
    streamingState: StreamingState = "streaming",
  ): MultiTurnStreamingInterruptionError {
    return new MultiTurnStreamingInterruptionError(
      streamingState,
      cause,
      context,
      {
        interruptionContext: {
          expectedState: "paused",
          actualState: streamingState,
          operationType: "pause",
        },
        debugContext: {
          interruptionType: "streaming_pause_failure",
        },
      },
    );
  }

  /**
   * Creates error for streaming resumption failures after tool execution.
   *
   * @param cause - Original streaming resumption error
   * @param context - Multi-turn state context
   * @param streamingState - Current streaming state
   * @returns MultiTurnStreamingInterruptionError with resume context
   */
  static createResumeError(
    cause: Error,
    context: Partial<MultiTurnState>,
    streamingState: StreamingState = "resuming",
  ): MultiTurnStreamingInterruptionError {
    return new MultiTurnStreamingInterruptionError(
      streamingState,
      cause,
      context,
      {
        interruptionContext: {
          expectedState: "streaming",
          actualState: streamingState,
          operationType: "resume",
        },
        debugContext: {
          interruptionType: "streaming_resume_failure",
        },
      },
    );
  }

  /**
   * Converts error to JSON with streaming-specific context.
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      streamingState: this.streamingState,
      interruptionContext: this.interruptionContext,
    };
  }
}
