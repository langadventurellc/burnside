/**
 * Multi-turn context snapshot for error debugging and analysis.
 *
 * Provides comprehensive context information when multi-turn errors occur,
 * including state snapshots, metrics, timing, and debug information.
 */

import type { MultiTurnState } from "./multiTurnState";
import type { ExecutionMetrics } from "./executionMetrics";
import type { ExecutionPhase } from "./executionPhase";

/**
 * Multi-turn context snapshot for error debugging and analysis.
 */
export interface MultiTurnContext {
  /**
   * Snapshot of MultiTurnState when error occurred.
   */
  state: Partial<MultiTurnState>;

  /**
   * Execution metrics at time of error.
   */
  metrics?: ExecutionMetrics;

  /**
   * Execution phase where error occurred.
   */
  phase: ExecutionPhase;

  /**
   * Timing information for debugging.
   */
  timing: {
    totalElapsed: number;
    iterationElapsed: number;
    lastIterationTime: number;
  };

  /**
   * Additional debug context.
   */
  debugContext: Record<string, unknown>;
}
