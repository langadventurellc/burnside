/**
 * Cancellation execution phases where cancellation can occur.
 *
 * Specialized subset of ExecutionPhase focusing on cancellation contexts.
 */
export type CancellationPhase =
  | "initialization"
  | "execution"
  | "tool_calls"
  | "streaming"
  | "cleanup";
