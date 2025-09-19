/**
 * Agent Execution Options Interface
 *
 * Configuration options for agent execution behavior.
 * Controls execution limits, timeouts, and error handling policies for
 * agent loop processing. Provides sensible defaults for single-turn
 * execution while allowing customization for specific use cases.
 */

/**
 * Configuration options for agent execution behavior
 *
 * Controls execution limits, timeouts, and error handling policies for both
 * single-turn and multi-turn agent execution. All new multi-turn options are
 * optional to maintain backward compatibility with existing code.
 *
 * @example
 * ```typescript
 * // Single-turn execution (existing behavior)
 * const singleTurnOptions: AgentExecutionOptions = {
 *   maxToolCalls: 1,           // Single-turn execution
 *   timeoutMs: 10000,          // 10 second overall timeout
 *   toolTimeoutMs: 5000,       // 5 second per-tool timeout
 *   continueOnToolError: true  // Continue conversation on errors
 * };
 *
 * // Multi-turn execution (new capabilities)
 * const multiTurnOptions: AgentExecutionOptions = {
 *   maxToolCalls: 5,                    // Multiple tool calls per turn
 *   timeoutMs: 60000,                   // 1 minute overall timeout
 *   toolTimeoutMs: 10000,               // 10 second per-tool timeout
 *   continueOnToolError: true,          // Continue on errors
 *   maxIterations: 5,                   // Maximum conversation turns
 *   iterationTimeoutMs: 15000,          // 15 seconds per turn
 *   enableStreaming: true,              // Enable streaming interruption
 *   toolExecutionStrategy: "parallel",  // Execute tools in parallel
 *   maxConcurrentTools: 2               // Max 2 tools concurrently
 * };
 *
 * // Cancellation support (external abort signals)
 * const abortController = new AbortController();
 * const cancellableOptions: AgentExecutionOptions = {
 *   signal: abortController.signal,           // External cancellation signal
 *   cancellationCheckIntervalMs: 100,        // Check every 100ms
 *   gracefulCancellationTimeoutMs: 5000,     // 5 second graceful timeout
 *   cleanupOnCancel: true                    // Cleanup resources on cancel
 * };
 * // User can call abortController.abort() to cancel execution
 * ```
 */
export interface AgentExecutionOptions {
  // Existing single-turn options (unchanged for backward compatibility)
  /** Maximum number of tool calls allowed in a single execution cycle (default: 1) */
  maxToolCalls?: number;
  /** Overall execution timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Individual tool execution timeout in milliseconds (default: 5000) */
  toolTimeoutMs?: number;
  /** Whether to continue conversation flow if tool execution fails (default: true) */
  continueOnToolError?: boolean;

  // New multi-turn configuration options
  /** Maximum number of conversation iterations in multi-turn mode (default: 10) */
  maxIterations?: number;
  /** Timeout for each individual iteration in milliseconds (default: undefined - no per-iteration limit) */
  iterationTimeoutMs?: number;
  /** Enable streaming interruption handling for tool calls (default: true) */
  enableStreaming?: boolean;
  /** Strategy for executing multiple tool calls within a turn (default: "sequential") */
  toolExecutionStrategy?: "sequential" | "parallel";
  /** Maximum number of tools to execute concurrently when using parallel strategy (default: 3) */
  maxConcurrentTools?: number;

  // Cancellation configuration options
  /**
   * External cancellation signal for aborting agent execution
   *
   * When provided, allows external systems (e.g., chat applications) to cancel
   * agent execution by calling AbortController.abort() on the associated controller.
   * Cancellation will be checked at strategic points during execution.
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   * const options: AgentExecutionOptions = {
   *   signal: controller.signal
   * };
   * // Later: controller.abort("User cancelled");
   * ```
   */
  signal?: AbortSignal;

  /**
   * Interval in milliseconds for checking cancellation status during execution (default: 100)
   *
   * Controls how frequently the agent checks for cancellation during long-running operations.
   * Lower values provide more responsive cancellation but may impact performance.
   *
   * @example
   * ```typescript
   * const options: AgentExecutionOptions = {
   *   cancellationCheckIntervalMs: 50  // Check every 50ms for faster response
   * };
   * ```
   */
  cancellationCheckIntervalMs?: number;

  /**
   * Timeout in milliseconds for graceful cancellation before forced termination (default: 5000)
   *
   * When cancellation is requested, the agent will attempt to complete current operations
   * and cleanup resources within this timeout. If exceeded, execution will be forcefully
   * terminated.
   *
   * @example
   * ```typescript
   * const options: AgentExecutionOptions = {
   *   gracefulCancellationTimeoutMs: 3000  // Allow 3 seconds for graceful shutdown
   * };
   * ```
   */
  gracefulCancellationTimeoutMs?: number;

  /**
   * Whether to perform resource cleanup when cancellation occurs (default: true)
   *
   * Controls automatic cleanup of resources (memory, network connections, temporary files)
   * when agent execution is cancelled. Disabling may improve cancellation speed but
   * could lead to resource leaks.
   *
   * @example
   * ```typescript
   * const options: AgentExecutionOptions = {
   *   cleanupOnCancel: false  // Skip cleanup for faster cancellation
   * };
   * ```
   */
  cleanupOnCancel?: boolean;
}
