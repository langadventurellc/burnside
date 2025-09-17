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
 * @example
 * ```typescript
 * const options: AgentExecutionOptions = {
 *   maxToolCalls: 1,           // Single-turn execution
 *   timeoutMs: 10000,          // 10 second overall timeout
 *   toolTimeoutMs: 5000,       // 5 second per-tool timeout
 *   continueOnToolError: true  // Continue conversation on errors
 * };
 * ```
 */
export interface AgentExecutionOptions {
  /** Maximum number of tool calls allowed in a single execution cycle (default: 1) */
  maxToolCalls?: number;
  /** Overall execution timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Individual tool execution timeout in milliseconds (default: 5000) */
  toolTimeoutMs?: number;
  /** Whether to continue conversation flow if tool execution fails (default: true) */
  continueOnToolError?: boolean;
}
