/**
 * Execution Metrics Interface
 *
 * Represents comprehensive execution metrics for performance monitoring
 * and optimization of multi-turn conversations.
 */

import type { TerminationReason } from "./terminationReason";

/**
 * Execution metrics for performance monitoring and optimization
 *
 * Provides detailed statistics about conversation execution including timing,
 * iteration counts, and termination context. Used for performance analysis,
 * debugging, and system optimization.
 *
 * @example Active conversation metrics
 * ```typescript
 * const metrics: ExecutionMetrics = {
 *   totalExecutionTimeMs: 12500,
 *   totalIterations: 3,
 *   averageIterationTimeMs: 4166,
 *   minIterationTimeMs: 3200,
 *   maxIterationTimeMs: 5800,
 *   currentIteration: 4,
 *   isTerminated: false
 * };
 * ```
 *
 * @example Completed conversation metrics
 * ```typescript
 * const metrics: ExecutionMetrics = {
 *   totalExecutionTimeMs: 25000,
 *   totalIterations: 5,
 *   averageIterationTimeMs: 5000,
 *   minIterationTimeMs: 2100,
 *   maxIterationTimeMs: 8900,
 *   currentIteration: 5,
 *   isTerminated: true,
 *   terminationReason: "natural_completion"
 * };
 * ```
 */
export interface ExecutionMetrics {
  /** Total execution time in milliseconds */
  totalExecutionTimeMs: number;
  /** Total number of iterations completed */
  totalIterations: number;
  /** Average iteration time in milliseconds */
  averageIterationTimeMs: number;
  /** Minimum iteration time in milliseconds */
  minIterationTimeMs: number;
  /** Maximum iteration time in milliseconds */
  maxIterationTimeMs: number;
  /** Current iteration number (1-based) */
  currentIteration: number;
  /** Whether the conversation has terminated */
  isTerminated: boolean;
  /** Termination reason if applicable */
  terminationReason?: TerminationReason;
}
