/**
 * Tool Result Interface
 *
 * Represents the outcome of a tool execution with success/error states and metadata.
 * Used to communicate tool execution results back to LLM providers and maintain
 * execution tracking throughout the tool system pipeline.
 *
 * @example Success Result
 * ```typescript
 * const successResult: ToolResult = {
 *   callId: "call_abc123",
 *   success: true,
 *   data: { sum: 8, operation: "addition" },
 *   metadata: {
 *     executionTime: 150,
 *     memoryUsage: 1024
 *   }
 * };
 * ```
 *
 * @example Error Result
 * ```typescript
 * const errorResult: ToolResult = {
 *   callId: "call_abc123",
 *   success: false,
 *   error: {
 *     code: "validation_error",
 *     message: "Parameter 'a' must be a number",
 *     details: { field: "a", received: "string" }
 *   },
 *   metadata: {
 *     executionTime: 50,
 *     retryCount: 0
 *   }
 * };
 * ```
 */

/**
 * Represents the outcome of a tool execution.
 *
 * This interface defines the structure for tool execution results, supporting
 * both successful and failed executions. The success field determines whether
 * the data field (for success) or error field (for failure) is populated.
 * These states are mutually exclusive to ensure clear result semantics.
 */
export interface ToolResult {
  /**
   * Identifier linking this result back to the originating ToolCall.
   * Must match the ToolCall.id that initiated this execution.
   */
  callId: string;

  /**
   * Whether the tool execution succeeded.
   * - true: execution completed successfully, data field contains results
   * - false: execution failed, error field contains failure information
   */
  success: boolean;

  /**
   * Tool output data when execution succeeds.
   * Only present when success is true. Contains the actual results
   * returned by the tool execution.
   */
  data?: unknown;

  /**
   * Error information when execution fails.
   * Only present when success is false. Provides structured error
   * information for debugging and user feedback.
   */
  error?: {
    /**
     * Error category or type.
     * Examples: "validation_error", "execution_error", "timeout_error"
     */
    code: string;

    /**
     * Human-readable error message.
     * Should provide clear information about what went wrong.
     */
    message: string;

    /**
     * Additional error context and details.
     * Can contain structured information about the error condition.
     */
    details?: unknown;
  };

  /**
   * Optional execution metadata for monitoring and debugging.
   * Provides performance and execution tracking information.
   */
  metadata?: {
    /**
     * Tool execution time in milliseconds.
     * Useful for performance monitoring and timeout analysis.
     */
    executionTime?: number;

    /**
     * Memory usage during execution in bytes.
     * Helpful for resource monitoring and optimization.
     */
    memoryUsage?: number;

    /**
     * Number of retry attempts made for this execution.
     * Tracks retry behavior for failed or unstable tools.
     */
    retryCount?: number;
  };
}
