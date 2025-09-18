/**
 * Tool Execution Options Interface
 *
 * Configuration options for tool execution strategy behavior
 */

/**
 * Configuration options for tool execution strategy behavior
 *
 * @example
 * ```typescript
 * const options: ToolExecutionOptions = {
 *   errorHandling: "continue-on-error",
 *   toolTimeoutMs: 5000,
 *   maxConcurrentTools: 3
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
}
