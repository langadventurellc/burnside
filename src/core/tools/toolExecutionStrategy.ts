/**
 * Tool Execution Strategy Interface
 *
 * Defines pluggable execution patterns for processing multiple tool calls
 * within a single conversation turn. Supports both sequential (safe default)
 * and parallel execution with configurable error handling and result ordering.
 */

import type { ToolCall } from "./toolCall";
import type { ToolExecutionContext } from "./toolExecutionContext";
import type { ToolRouter } from "./toolRouter";
import type { ToolExecutionOptions } from "./toolExecutionOptions";
import type { ToolExecutionResult } from "./toolExecutionResult";

/**
 * Interface for pluggable tool execution strategies
 *
 * Implementations must handle multiple tool calls while maintaining:
 * - Result ordering (results array order matches input tool calls order)
 * - Error handling (fail-fast vs continue-on-error modes)
 * - Timeout enforcement at both individual and strategy levels
 * - Performance metrics collection
 *
 * @example
 * ```typescript
 * const strategy = new SequentialExecutionStrategy();
 * const result = await strategy.execute(
 *   toolCalls,
 *   router,
 *   context,
 *   { errorHandling: "continue-on-error", toolTimeoutMs: 5000 }
 * );
 *
 * // Results are in same order as input tool calls
 * console.log(result.results.length === toolCalls.length); // true
 * console.log(result.success); // false if any tool failed in fail-fast mode
 * ```
 */
export interface ToolExecutionStrategy {
  /**
   * Execute multiple tool calls using this strategy
   *
   * @param toolCalls - Array of tool calls to execute
   * @param router - ToolRouter instance for individual tool execution
   * @param context - Execution context shared across all tool calls
   * @param options - Strategy configuration options
   * @returns Promise resolving to execution results with preserved ordering
   */
  execute(
    toolCalls: ToolCall[],
    router: ToolRouter,
    context: ToolExecutionContext,
    options: ToolExecutionOptions,
  ): Promise<ToolExecutionResult>;
}
