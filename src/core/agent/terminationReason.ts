/**
 * Termination Reason Type
 *
 * Defines the possible reasons why a multi-turn conversation ended.
 * Provides clear context for conversation completion or interruption.
 */

/**
 * Termination reasons for multi-turn conversations.
 * Provides clear context for why a conversation ended.
 *
 * @example Natural completion
 * ```typescript
 * const reason: TerminationReason = "natural_completion";
 * // Agent completed the task and has no more actions to take
 * ```
 *
 * @example Safety limit reached
 * ```typescript
 * const reason: TerminationReason = "max_iterations";
 * // Conversation hit the configured maximum iteration limit
 * ```
 *
 * @example Timeout scenario
 * ```typescript
 * const reason: TerminationReason = "timeout";
 * // Overall execution timeout was reached
 * ```
 */
export type TerminationReason =
  | "natural_completion" // Agent naturally completed the conversation
  | "max_iterations" // Hit maximum iteration limit
  | "timeout" // Execution timeout reached
  | "cancelled" // User or system cancelled execution
  | "error"; // Terminated due to unrecoverable error
