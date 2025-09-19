/**
 * Timeout Status Interface
 *
 * Represents the current timeout status for both overall conversation
 * and individual iteration timeouts in multi-turn conversations.
 */

/**
 * Status of timeout checking for multi-turn conversations
 *
 * Provides comprehensive timeout information for both overall conversation
 * and current iteration timeouts. Used for timeout monitoring and early
 * warning systems in conversation management.
 *
 * @example No timeouts active
 * ```typescript
 * const status: TimeoutStatus = {
 *   hasTimeout: false,
 *   overallTimeout: false,
 *   iterationTimeout: false,
 *   remainingOverallMs: 45000,
 *   remainingIterationMs: 8000
 * };
 * ```
 *
 * @example Overall timeout exceeded
 * ```typescript
 * const status: TimeoutStatus = {
 *   hasTimeout: true,
 *   overallTimeout: true,
 *   iterationTimeout: false,
 *   remainingOverallMs: 0,
 *   remainingIterationMs: 2000
 * };
 * ```
 */
export interface TimeoutStatus {
  /** Whether any timeout has been exceeded */
  hasTimeout: boolean;
  /** Whether the overall conversation timeout was exceeded */
  overallTimeout: boolean;
  /** Whether the current iteration timeout was exceeded */
  iterationTimeout: boolean;
  /** Remaining time in milliseconds for overall conversation (null if no limit) */
  remainingOverallMs: number | null;
  /** Remaining time in milliseconds for current iteration (null if no limit) */
  remainingIterationMs: number | null;
}
