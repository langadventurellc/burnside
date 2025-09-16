/**
 * Prepared Context Interface
 *
 * Defines the prepared context structure after validation and preparation stages.
 */

import type { ToolCall } from "./toolCall.js";
import type { ToolExecutionContext } from "./toolExecutionContext.js";
import type { ToolDefinition } from "./toolDefinition.js";

/**
 * Pipeline execution context containing all data needed for execution
 */
export interface PreparedContext {
  toolCall: ToolCall;
  toolDefinition: ToolDefinition;
  executionContext: ToolExecutionContext;
  startTime: number;
}
