/**
 * Execution phase context for multi-turn error scenarios.
 *
 * Defines the specific phase of multi-turn execution where an error occurred,
 * enabling precise debugging and error context analysis.
 */
export type ExecutionPhase =
  | "initialization"
  | "iteration_start"
  | "provider_request"
  | "streaming_response"
  | "tool_execution"
  | "state_update"
  | "termination_check"
  | "cleanup";
