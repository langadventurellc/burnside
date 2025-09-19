/**
 * Tool Execution Options Interface
 *
 * Configuration options for tool execution strategy behavior
 */

/**
 * Configuration options for tool execution strategy behavior
 *
 * @example Basic usage
 * ```typescript
 * const options: ToolExecutionOptions = {
 *   errorHandling: "continue-on-error",
 *   toolTimeoutMs: 5000,
 *   maxConcurrentTools: 3
 * };
 * ```
 *
 * @example With cancellation support
 * ```typescript
 * const abortController = new AbortController();
 * const options: ToolExecutionOptions = {
 *   errorHandling: "fail-fast",
 *   signal: abortController.signal,
 *   cancellationMode: "graceful",
 *   gracefulCancellationTimeoutMs: 3000
 * };
 * ```
 */
export interface ToolExecutionOptions {
  /** Whether to stop execution on first error (fail-fast) or continue with remaining tools */
  errorHandling: "fail-fast" | "continue-on-error";
  /** Timeout for individual tool execution in milliseconds */
  toolTimeoutMs?: number;
  /** Maximum number of concurrent tool executions (parallel strategy only) */
  maxConcurrentTools?: number;

  // Cancellation options
  /** AbortSignal for cancellation support */
  signal?: AbortSignal;
  /** Cancellation mode: graceful allows current tools to complete, immediate cancels all tools */
  cancellationMode?: "graceful" | "immediate";
  /** Timeout for graceful cancellation in milliseconds (default: 5000ms) */
  gracefulCancellationTimeoutMs?: number;
}
