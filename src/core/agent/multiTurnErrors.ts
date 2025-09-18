/**
 * Base Multi-Turn Execution Error
 *
 * Foundation error class for multi-turn conversation scenarios with
 * rich debugging context, recovery strategies, and error serialization.
 * Other multi-turn specific errors extend this base class.
 *
 * @example Basic error handling in multi-turn execution
 * ```typescript
 * import {
 *   MultiTurnExecutionError,
 *   MaxIterationsExceededError
 * } from './multiTurnErrors';
 *
 * try {
 *   const result = await agentLoop.executeMultiTurn(messages, options);
 * } catch (error) {
 *   if (error instanceof MaxIterationsExceededError) {
 *     console.log(`Conversation exceeded ${error.maxIterations} iterations`);
 *     console.log(`Final state:`, error.multiTurnContext.state);
 *   }
 * }
 * ```
 */

import type { MultiTurnState } from "./multiTurnState";
import type { ExecutionMetrics } from "./executionMetrics";
import type { ExecutionPhase } from "./executionPhase";
import type { MultiTurnContext } from "./multiTurnContext";

/**
 * Base class for multi-turn execution errors with comprehensive context.
 *
 * Provides foundation for all multi-turn specific errors with rich debugging
 * information, recovery strategies, and error serialization capabilities.
 */
export class MultiTurnExecutionError extends Error {
  /**
   * Multi-turn context snapshot when error occurred.
   */
  readonly multiTurnContext: MultiTurnContext;

  /**
   * Suggested recovery action for handling the error.
   */
  readonly recoveryAction:
    | "retry"
    | "fallback_single_turn"
    | "abort"
    | "continue";

  /**
   * Timestamp when the error occurred.
   */
  readonly timestamp: number;

  constructor(
    message: string,
    phase: ExecutionPhase,
    originalError: Error,
    context: Partial<MultiTurnState>,
    options: {
      metrics?: ExecutionMetrics;
      recoveryAction?: "retry" | "fallback_single_turn" | "abort" | "continue";
      debugContext?: Record<string, unknown>;
      timing?: {
        totalElapsed: number;
        iterationElapsed: number;
        lastIterationTime: number;
      };
    } = {},
  ) {
    super(message, { cause: originalError });
    this.name = "MultiTurnExecutionError";

    this.multiTurnContext = {
      state: context,
      metrics: options.metrics,
      phase,
      timing: options.timing ?? {
        totalElapsed: Date.now() - (context.startTime ?? Date.now()),
        iterationElapsed:
          Date.now() - (context.lastIterationTime ?? Date.now()),
        lastIterationTime: context.lastIterationTime ?? Date.now(),
      },
      debugContext: {
        originalError: originalError.name,
        originalMessage: originalError.message,
        ...options.debugContext,
      },
    };

    this.recoveryAction = options.recoveryAction ?? "abort";
    this.timestamp = Date.now();
  }

  /**
   * Creates error for general multi-turn execution failures.
   *
   * @param phase - Execution phase where error occurred
   * @param originalError - Original error that caused the failure
   * @param context - Multi-turn state context
   * @param options - Additional context and recovery options
   * @returns MultiTurnExecutionError with execution context
   */
  static createExecutionError(
    phase: ExecutionPhase,
    originalError: Error,
    context: Partial<MultiTurnState>,
    options: {
      metrics?: ExecutionMetrics;
      recoveryAction?: "retry" | "fallback_single_turn" | "abort" | "continue";
      debugContext?: Record<string, unknown>;
    } = {},
  ): MultiTurnExecutionError {
    return new MultiTurnExecutionError(
      `Multi-turn execution failed during ${phase}: ${originalError.message}`,
      phase,
      originalError,
      context,
      {
        ...options,
        debugContext: {
          errorType: "multi_turn_execution_failure",
          ...options.debugContext,
        },
      },
    );
  }

  /**
   * Converts error to JSON for logging and debugging.
   * Redacts sensitive information while preserving debugging context.
   *
   * @returns JSON representation with redacted sensitive data
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      multiTurnContext: {
        ...this.multiTurnContext,
        state: {
          iteration: this.multiTurnContext.state.iteration,
          totalIterations: this.multiTurnContext.state.totalIterations,
          streamingState: this.multiTurnContext.state.streamingState,
          terminationReason: this.multiTurnContext.state.terminationReason,
          shouldContinue: this.multiTurnContext.state.shouldContinue,
          // Redact messages and tool details for security
          messageCount: this.multiTurnContext.state.messages?.length,
          toolCallCount: this.multiTurnContext.state.toolCalls?.length,
          pendingToolCallCount:
            this.multiTurnContext.state.pendingToolCalls?.length,
          completedToolCallCount:
            this.multiTurnContext.state.completedToolCalls?.length,
        },
      },
      recoveryAction: this.recoveryAction,
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
