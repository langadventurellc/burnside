/**
 * Execution Context Interface
 *
 * Defines the complete execution context with handler and timeout for tool execution.
 */

import type { ToolHandler } from "./toolHandler.js";
import type { PreparedContext } from "./preparedContext.js";

/**
 * Complete pipeline context with handler and timeout
 */
export interface ExecutionContext extends PreparedContext {
  toolHandler: ToolHandler;
  timeoutMs: number;
}
