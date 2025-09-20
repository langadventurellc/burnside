/**
 * Execution Context Interface
 *
 * Defines the complete execution context with handler and timeout for tool execution.
 */

import type { ToolHandler } from "./toolHandler";
import type { PreparedContext } from "./preparedContext";
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";

/**
 * Complete pipeline context with handler and timeout
 */
export interface ExecutionContext extends PreparedContext {
  toolHandler: ToolHandler;
  timeoutMs: number;
  runtimeAdapter: RuntimeAdapter;
}
