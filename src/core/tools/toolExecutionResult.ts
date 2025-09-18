/**
 * Tool Execution Result Interface
 *
 * Result of executing multiple tool calls through a strategy
 */

import type { ToolResult } from "./toolResult";

/**
 * Result of executing multiple tool calls through a strategy
 *
 * @example
 * ```typescript
 * const result: ToolExecutionResult = {
 *   results: [toolResult1, toolResult2],
 *   success: true,
 *   metadata: {
 *     totalExecutionTime: 1500,
 *     successCount: 2,
 *     errorCount: 0
 *   }
 * };
 * ```
 */
export interface ToolExecutionResult {
  /** Tool results in the same order as input tool calls */
  results: ToolResult[];
  /** Whether all tool executions completed successfully */
  success: boolean;
  /** Execution metadata and performance metrics */
  metadata: {
    /** Total execution time in milliseconds */
    totalExecutionTime: number;
    /** Number of tools that executed successfully */
    successCount: number;
    /** Number of tools that failed */
    errorCount: number;
    /** Strategy-specific execution details */
    strategyMetadata?: Record<string, unknown>;
  };
  /** First error encountered (if any) for fail-fast scenarios */
  firstError?: {
    toolCallId: string;
    error: ToolResult["error"];
  };
}
