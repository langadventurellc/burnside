/**
 * Streaming State Type
 *
 * Defines the streaming state machine for multi-turn conversation flow.
 * Manages the lifecycle of streaming responses and tool execution interruptions.
 */

/**
 * Streaming state machine for multi-turn conversation flow.
 * Manages the lifecycle of streaming responses and tool execution interruptions.
 *
 * State transitions:
 * - idle → streaming (response starts)
 * - streaming → paused (tool calls detected)
 * - paused → tool_execution (tools begin executing)
 * - tool_execution → resuming (tools complete)
 * - resuming → streaming (next iteration begins)
 *
 * @example State transition during streaming interruption
 * ```typescript
 * let state: StreamingState = "idle";
 * state = "streaming";        // Agent starts streaming response
 * state = "paused";          // Tool calls detected, pause stream
 * state = "tool_execution";  // Execute detected tool calls
 * state = "resuming";        // Tools complete, prepare to resume
 * state = "streaming";       // Resume streaming for next iteration
 * ```
 */
export type StreamingState =
  | "idle" // Not currently streaming, ready for next action
  | "streaming" // Actively streaming response from provider
  | "paused" // Stream paused due to tool call detection
  | "tool_execution" // Executing tools while stream is paused
  | "resuming"; // Resuming stream after tool execution completion
