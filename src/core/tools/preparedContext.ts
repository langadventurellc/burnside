/**
 * Prepared Context Interface
 *
 * Defines the prepared context structure after validation and preparation stages.
 */

import type { ToolCall } from "./toolCall";
import type { ToolExecutionContext } from "./toolExecutionContext";
import type { ToolDefinition } from "./toolDefinition";

/**
 * Pipeline execution context containing all data needed for execution
 */
export interface PreparedContext {
  toolCall: ToolCall;
  toolDefinition: ToolDefinition;
  executionContext: ToolExecutionContext;
  startTime: number;
}
