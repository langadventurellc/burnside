import type { StreamingState } from "./streamingState";
import type { ToolCall } from "../tools/toolCall";

/**
 * Specialized error class for streaming interruption and integration failures.
 *
 * Provides detailed context for debugging streaming integration issues including
 * state machine transitions, tool execution coordination, and recovery scenarios.
 * Used throughout AgentLoop streaming integration for comprehensive error handling.
 *
 * @example
 * ```typescript
 * // Handle streaming pause failure
 * try {
 *   await streamingStateMachine.pauseForToolExecution(toolCalls);
 * } catch (error) {
 *   throw StreamingIntegrationError.createStreamingPauseError(
 *     error,
 *     'streaming',
 *     toolCalls
 *   );
 * }
 * ```
 */
export class StreamingIntegrationError extends Error {
  /**
   * Current streaming state when the error occurred.
   */
  readonly streamingState: StreamingState;

  /**
   * Tool execution context relevant to the error.
   */
  readonly toolContext?: {
    pendingToolCalls: ToolCall[];
    executedToolCalls: ToolCall[];
    failedToolCalls: ToolCall[];
  };

  /**
   * Suggested recovery action for handling the error.
   */
  readonly recoveryAction:
    | "retry"
    | "fallback_non_streaming"
    | "abort"
    | "continue";

  /**
   * Additional debug context for error analysis.
   */
  readonly debugContext: Record<string, unknown>;

  /**
   * Timestamp when the error occurred.
   */
  readonly timestamp: number;

  constructor(
    message: string,
    streamingState: StreamingState,
    recoveryAction: "retry" | "fallback_non_streaming" | "abort" | "continue",
    options: {
      cause?: Error;
      toolContext?: {
        pendingToolCalls: ToolCall[];
        executedToolCalls: ToolCall[];
        failedToolCalls: ToolCall[];
      };
      debugContext?: Record<string, unknown>;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "StreamingIntegrationError";
    this.streamingState = streamingState;
    this.toolContext = options.toolContext;
    this.recoveryAction = recoveryAction;
    this.debugContext = options.debugContext ?? {};
    this.timestamp = Date.now();
  }

  /**
   * Creates error for streaming pause failures during tool call detection.
   *
   * @param cause - Original error that caused the pause failure
   * @param streamingState - Current state of the streaming state machine
   * @param pendingToolCalls - Tool calls that were being processed when error occurred
   * @returns StreamingIntegrationError with pause-specific context
   */
  static createStreamingPauseError(
    cause: Error,
    streamingState: StreamingState,
    pendingToolCalls: ToolCall[],
  ): StreamingIntegrationError {
    return new StreamingIntegrationError(
      `Failed to pause streaming for tool execution: ${cause.message}`,
      streamingState,
      "retry",
      {
        cause,
        toolContext: {
          pendingToolCalls,
          executedToolCalls: [],
          failedToolCalls: [],
        },
        debugContext: {
          errorType: "streaming_pause_failure",
          toolCallCount: pendingToolCalls.length,
          originalError: cause.name,
        },
      },
    );
  }

  /**
   * Creates error for tool execution failures during streaming interruption.
   *
   * @param cause - Original error from tool execution
   * @param streamingState - Current streaming state
   * @param toolContext - Complete tool execution context
   * @returns StreamingIntegrationError with tool execution context
   */
  static createToolExecutionDuringStreamingError(
    cause: Error,
    streamingState: StreamingState,
    toolContext: {
      pendingToolCalls: ToolCall[];
      executedToolCalls: ToolCall[];
      failedToolCalls: ToolCall[];
    },
  ): StreamingIntegrationError {
    const recoveryAction =
      toolContext.failedToolCalls.length === toolContext.pendingToolCalls.length
        ? ("fallback_non_streaming" as const)
        : ("continue" as const);

    return new StreamingIntegrationError(
      `Tool execution failed during streaming interruption: ${cause.message}`,
      streamingState,
      recoveryAction,
      {
        cause,
        toolContext,
        debugContext: {
          errorType: "tool_execution_during_streaming_failure",
          totalToolCalls: toolContext.pendingToolCalls.length,
          executedCount: toolContext.executedToolCalls.length,
          failedCount: toolContext.failedToolCalls.length,
          originalError: cause.name,
        },
      },
    );
  }

  /**
   * Creates error for streaming resumption failures after tool execution.
   *
   * @param cause - Original error that caused resume failure
   * @param streamingState - Expected streaming state for resumption
   * @param executedToolCalls - Tool calls that were successfully executed
   * @returns StreamingIntegrationError with resume-specific context
   */
  static createStreamingResumeError(
    cause: Error,
    streamingState: StreamingState,
    executedToolCalls: ToolCall[],
  ): StreamingIntegrationError {
    return new StreamingIntegrationError(
      `Failed to resume streaming after tool execution: ${cause.message}`,
      streamingState,
      "fallback_non_streaming",
      {
        cause,
        toolContext: {
          pendingToolCalls: [],
          executedToolCalls,
          failedToolCalls: [],
        },
        debugContext: {
          errorType: "streaming_resume_failure",
          toolCallsExecuted: executedToolCalls.length,
          originalError: cause.name,
        },
      },
    );
  }

  /**
   * Creates error for state synchronization failures between streaming and multi-turn state.
   *
   * @param cause - Original synchronization error
   * @param streamingState - Current streaming state machine state
   * @param multiTurnStreamingState - Multi-turn state's streaming state value
   * @returns StreamingIntegrationError with synchronization context
   */
  static createStateSynchronizationError(
    cause: Error,
    streamingState: StreamingState,
    multiTurnStreamingState: StreamingState,
  ): StreamingIntegrationError {
    return new StreamingIntegrationError(
      `State synchronization failed between streaming state machine and multi-turn state: ${cause.message}`,
      streamingState,
      "abort",
      {
        cause,
        debugContext: {
          errorType: "state_synchronization_failure",
          streamingMachineState: streamingState,
          multiTurnState: multiTurnStreamingState,
          stateMismatch: streamingState !== multiTurnStreamingState,
          originalError: cause.name,
        },
      },
    );
  }

  /**
   * Creates error for general streaming integration failures with custom context.
   *
   * @param message - Custom error message
   * @param streamingState - Current streaming state
   * @param recoveryAction - Suggested recovery strategy
   * @param debugContext - Additional debug information
   * @param cause - Optional underlying error
   * @returns StreamingIntegrationError with custom context
   */
  static createGenericStreamingError(
    message: string,
    streamingState: StreamingState,
    recoveryAction: "retry" | "fallback_non_streaming" | "abort" | "continue",
    debugContext: Record<string, unknown> = {},
    cause?: Error,
  ): StreamingIntegrationError {
    return new StreamingIntegrationError(
      message,
      streamingState,
      recoveryAction,
      {
        cause,
        debugContext: {
          errorType: "generic_streaming_integration_failure",
          ...debugContext,
        },
      },
    );
  }

  /**
   * Converts error to JSON for logging and debugging.
   *
   * @returns JSON representation of the error with all relevant context
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      streamingState: this.streamingState,
      recoveryAction: this.recoveryAction,
      toolContext: this.toolContext,
      debugContext: this.debugContext,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: this.cause
        ? {
            name: (this.cause as Error).name,
            message: (this.cause as Error).message,
          }
        : undefined,
    };
  }
}
