/**
 * Sequential Tool Execution Strategy
 *
 * Executes tool calls one after another in order, providing predictable
 * execution timing and resource usage. This is the safe default strategy
 * that maintains execution order and provides clear error handling.
 */

import type { ToolCall } from "./toolCall";
import type { ToolResult } from "./toolResult";
import type { ToolExecutionContext } from "./toolExecutionContext";
import type { ToolRouter } from "./toolRouter";
import type { ToolExecutionStrategy } from "./toolExecutionStrategy";
import type { ToolExecutionOptions } from "./toolExecutionOptions";
import type { ToolExecutionResult } from "./toolExecutionResult";

/**
 * Sequential execution strategy implementation
 *
 * Executes tool calls one after another in the original order:
 * - Stops on first failure when using "fail-fast" mode
 * - Continues executing remaining tools when using "continue-on-error" mode
 * - Maintains predictable resource usage and timing
 * - Provides detailed execution metrics for monitoring
 *
 * @example
 * ```typescript
 * const strategy = new SequentialExecutionStrategy();
 * const result = await strategy.execute(
 *   [toolCall1, toolCall2, toolCall3],
 *   router,
 *   context,
 *   { errorHandling: "continue-on-error" }
 * );
 * ```
 */
export class SequentialExecutionStrategy implements ToolExecutionStrategy {
  /**
   * Handle execution of a single tool call
   */
  private async executeSingleTool(
    toolCall: ToolCall,
    router: ToolRouter,
    context: ToolExecutionContext,
    options: ToolExecutionOptions,
    index: number,
  ): Promise<ToolResult> {
    try {
      return await router.execute(toolCall, context, options.toolTimeoutMs);
    } catch (error) {
      return {
        callId: toolCall.id,
        success: false,
        error: {
          code: "strategy_execution_error",
          message: "Sequential execution failed unexpectedly",
          details: {
            originalError:
              error instanceof Error ? error.message : String(error),
            toolCall,
            executionIndex: index,
            stack: error instanceof Error ? error.stack : undefined,
          },
        },
        metadata: {
          executionTime: 0,
        },
      };
    }
  }

  /**
   * Process execution results and update counters
   */
  private processResult(
    result: ToolResult,
    successCount: number,
    errorCount: number,
    firstError: ToolExecutionResult["firstError"],
  ): {
    successCount: number;
    errorCount: number;
    firstError: ToolExecutionResult["firstError"];
    shouldStop: boolean;
  } {
    let newSuccessCount = successCount;
    let newErrorCount = errorCount;
    let newFirstError = firstError;
    const shouldStop = false;

    if (result.success) {
      newSuccessCount++;
    } else {
      newErrorCount++;

      if (!newFirstError) {
        newFirstError = {
          toolCallId: result.callId,
          error: result.error,
        };
      }
    }

    return {
      successCount: newSuccessCount,
      errorCount: newErrorCount,
      firstError: newFirstError,
      shouldStop,
    };
  }

  /**
   * Execute tool calls sequentially in original order
   */
  async execute(
    toolCalls: ToolCall[],
    router: ToolRouter,
    context: ToolExecutionContext,
    options: ToolExecutionOptions,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const results: ToolResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let firstError: ToolExecutionResult["firstError"];

    // Handle empty array case
    if (toolCalls.length === 0) {
      return {
        results: [],
        success: true,
        metadata: {
          totalExecutionTime: 0,
          successCount: 0,
          errorCount: 0,
          strategyMetadata: {
            strategy: "sequential",
            executionMode: "empty-array",
          },
        },
      };
    }

    // Execute tools one by one
    for (let i = 0; i < toolCalls.length; i++) {
      const toolCall = toolCalls[i];
      const result = await this.executeSingleTool(
        toolCall,
        router,
        context,
        options,
        i,
      );

      results.push(result);

      const processedResult = this.processResult(
        result,
        successCount,
        errorCount,
        firstError,
      );

      successCount = processedResult.successCount;
      errorCount = processedResult.errorCount;
      firstError = processedResult.firstError;

      // Stop execution on first error in fail-fast mode
      if (!result.success && options.errorHandling === "fail-fast") {
        break;
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    const success =
      errorCount === 0 || options.errorHandling === "continue-on-error";

    return {
      results,
      success,
      metadata: {
        totalExecutionTime,
        successCount,
        errorCount,
        strategyMetadata: {
          strategy: "sequential",
          executionMode: options.errorHandling,
          toolsProcessed: results.length,
          toolsRequested: toolCalls.length,
          averageToolTime:
            results.length > 0 ? totalExecutionTime / results.length : 0,
        },
      },
      firstError,
    };
  }
}
