/**
 * Parallel Tool Execution Strategy
 *
 * Executes tool calls concurrently with configurable concurrency limits,
 * optimizing total execution time while maintaining stable result ordering
 * and graceful handling of partial failures.
 */

import type { ToolCall } from "./toolCall";
import type { ToolResult } from "./toolResult";
import type { ToolExecutionContext } from "./toolExecutionContext";
import type { ToolRouter } from "./toolRouter";
import type { ToolExecutionStrategy } from "./toolExecutionStrategy";
import type { ToolExecutionOptions } from "./toolExecutionOptions";
import type { ToolExecutionResult } from "./toolExecutionResult";

/**
 * Simple semaphore implementation for concurrency limiting
 */
class ConcurrencyLimiter {
  private available: number;
  private waitingQueue: Array<() => void> = [];

  constructor(maxConcurrency: number) {
    this.available = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitingQueue.length > 0) {
      const next = this.waitingQueue.shift();
      next?.();
    } else {
      this.available++;
    }
  }
}

/**
 * Parallel execution strategy implementation
 *
 * Executes tool calls concurrently with configurable limits:
 * - Maintains stable ordering of results regardless of completion timing
 * - Respects maxConcurrentTools configuration to prevent resource exhaustion
 * - Handles mixed success/failure scenarios with proper error aggregation
 * - Provides comprehensive concurrency metrics and timing data
 *
 * @example
 * ```typescript
 * const strategy = new ParallelExecutionStrategy();
 * const result = await strategy.execute(
 *   [toolCall1, toolCall2, toolCall3],
 *   router,
 *   context,
 *   {
 *     errorHandling: "continue-on-error",
 *     maxConcurrentTools: 2
 *   }
 * );
 * ```
 */
export class ParallelExecutionStrategy implements ToolExecutionStrategy {
  /**
   * Process settled promise results and maintain ordering
   */
  private processSettledResults(
    settledResults: PromiseSettledResult<{
      result: ToolResult;
      index: number;
      toolCall: ToolCall;
    }>[],
    toolCalls: ToolCall[],
    executionStartTimes: Map<string, number>,
    results: ToolResult[],
    toolExecutionTimes: number[],
  ): {
    successCount: number;
    errorCount: number;
    firstError: ToolExecutionResult["firstError"];
  } {
    let successCount = 0;
    let errorCount = 0;
    let firstError: ToolExecutionResult["firstError"];

    settledResults.forEach((settledResult, index) => {
      if (settledResult.status === "fulfilled") {
        const { result, index: originalIndex } = settledResult.value;
        results[originalIndex] = result;

        // Calculate individual tool execution time
        const startTime = executionStartTimes.get(result.callId);
        if (startTime) {
          toolExecutionTimes.push(Date.now() - startTime);
        }

        if (result.success) {
          successCount++;
        } else {
          errorCount++;

          // Capture first error (by original order, not completion order)
          if (
            !firstError ||
            originalIndex <
              results.findIndex((r) => r?.callId === firstError?.toolCallId)
          ) {
            firstError = {
              toolCallId: result.callId,
              error: result.error,
            };
          }
        }
      } else {
        // Handle promise rejection (should be rare due to try/catch above)
        const toolCall = toolCalls[index];
        const rejectionResult: ToolResult = {
          callId: toolCall.id,
          success: false,
          error: {
            code: "parallel_execution_rejection",
            message: "Tool execution promise was rejected",
            details: {
              originalError: String(settledResult.reason),
              toolCall,
              executionIndex: index,
            },
          },
          metadata: {
            executionTime: 0,
          },
        };

        results[index] = rejectionResult;
        errorCount++;

        if (!firstError) {
          firstError = {
            toolCallId: rejectionResult.callId,
            error: rejectionResult.error,
          };
        }
      }
    });

    return { successCount, errorCount, firstError };
  }

  /**
   * Create execution promises for all tool calls with concurrency limiting
   */
  private createExecutionPromises(
    toolCalls: ToolCall[],
    router: ToolRouter,
    context: ToolExecutionContext,
    options: ToolExecutionOptions,
    limiter: ConcurrencyLimiter,
    executionStartTimes: Map<string, number>,
  ): Promise<{ result: ToolResult; index: number; toolCall: ToolCall }>[] {
    return toolCalls.map(async (toolCall, index) => {
      // Acquire semaphore slot
      await limiter.acquire();

      try {
        executionStartTimes.set(toolCall.id, Date.now());

        // Execute individual tool with timeout
        const result = await router.execute(
          toolCall,
          context,
          options.toolTimeoutMs,
        );

        return { result, index, toolCall };
      } catch (error) {
        // Handle unexpected execution errors
        const errorResult: ToolResult = {
          callId: toolCall.id,
          success: false,
          error: {
            code: "strategy_execution_error",
            message: "Parallel execution failed unexpectedly",
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

        return { result: errorResult, index, toolCall };
      } finally {
        // Always release semaphore slot
        limiter.release();
      }
    });
  }

  /**
   * Execute tool calls in parallel with concurrency limiting
   */
  async execute(
    toolCalls: ToolCall[],
    router: ToolRouter,
    context: ToolExecutionContext,
    options: ToolExecutionOptions,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

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
            strategy: "parallel",
            executionMode: "empty-array",
            maxConcurrency: options.maxConcurrentTools ?? 3,
          },
        },
      };
    }

    // Use configured concurrency or default to 3
    const maxConcurrency = Math.min(
      options.maxConcurrentTools ?? 3,
      toolCalls.length,
    );
    const limiter = new ConcurrencyLimiter(maxConcurrency);
    const executionStartTimes = new Map<string, number>();

    // Create and execute all tool calls
    const executionPromises = this.createExecutionPromises(
      toolCalls,
      router,
      context,
      options,
      limiter,
      executionStartTimes,
    );

    // Wait for all executions to complete
    const settledResults = await Promise.allSettled(executionPromises);

    // Initialize results array and process settled results
    const results: ToolResult[] = new Array<ToolResult>(toolCalls.length);
    const toolExecutionTimes: number[] = [];

    const processedResults = this.processSettledResults(
      settledResults,
      toolCalls,
      executionStartTimes,
      results,
      toolExecutionTimes,
    );

    const totalExecutionTime = Date.now() - startTime;

    // Determine overall success based on error handling mode
    const success =
      processedResults.errorCount === 0 ||
      options.errorHandling === "continue-on-error";

    return {
      results,
      success,
      metadata: {
        totalExecutionTime,
        successCount: processedResults.successCount,
        errorCount: processedResults.errorCount,
        strategyMetadata: {
          strategy: "parallel",
          executionMode: options.errorHandling,
          maxConcurrency,
          toolsProcessed: results.length,
          toolsRequested: toolCalls.length,
          averageToolTime:
            toolExecutionTimes.length > 0
              ? toolExecutionTimes.reduce((sum, time) => sum + time, 0) /
                toolExecutionTimes.length
              : 0,
          concurrencyUtilization: maxConcurrency / toolCalls.length,
          parallelEfficiency:
            toolExecutionTimes.length > 0
              ? Math.max(...toolExecutionTimes) / totalExecutionTime
              : 0,
        },
      },
      firstError: processedResults.firstError,
    };
  }
}
