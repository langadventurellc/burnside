/**
 * Iteration Result Interface
 *
 * Represents the result of completing an iteration in a multi-turn conversation.
 * Provides timing information and continuation status for iteration management.
 */

import type { TerminationReason } from "./terminationReason";

/**
 * Result of completing an iteration
 *
 * Contains metrics and status information from a completed conversation iteration.
 * Used by IterationManager to track iteration performance and determine flow control.
 *
 * @example Successful iteration completion
 * ```typescript
 * const result: IterationResult = {
 *   iterationNumber: 3,
 *   duration: 1250,
 *   canContinue: true
 * };
 * ```
 *
 * @example Final iteration with termination
 * ```typescript
 * const result: IterationResult = {
 *   iterationNumber: 5,
 *   duration: 890,
 *   canContinue: false,
 *   terminationReason: "max_iterations"
 * };
 * ```
 */
export interface IterationResult {
  /** The iteration number that was completed (1-based) */
  iterationNumber: number;
  /** Duration of this iteration in milliseconds */
  duration: number;
  /** Whether the conversation can continue to the next iteration */
  canContinue: boolean;
  /** Optional termination reason if conversation should end */
  terminationReason?: TerminationReason;
}
