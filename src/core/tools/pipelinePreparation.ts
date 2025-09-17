/**
 * Pipeline Preparation Stage
 *
 * Prepares execution context and validated parameters for tool execution.
 * Returns pipeline context on success or ToolResult on preparation failure.
 */

import type { ToolCall } from "./toolCall";
import type { ToolResult } from "./toolResult";
import type { ToolExecutionContext } from "./toolExecutionContext";
import type { ToolDefinition } from "./toolDefinition";
import type { PreparedContext } from "./preparedContext";

/**
 * Preparation stage - prepares execution context and validated parameters
 */
export function prepareExecution(
  toolCall: ToolCall,
  toolDefinition: ToolDefinition,
  executionContext: ToolExecutionContext,
): PreparedContext | ToolResult {
  try {
    // Validate required inputs
    if (!toolCall || !toolDefinition || !executionContext) {
      throw new Error("Missing required execution parameters");
    }

    const startTime = Date.now();

    // Prepare pipeline context
    const context: PreparedContext = {
      toolCall,
      toolDefinition,
      executionContext,
      startTime,
    };

    return context;
  } catch (error) {
    return {
      callId: toolCall.id,
      success: false,
      error: {
        code: "preparation_error",
        message: "Failed to prepare execution context",
        details: {
          originalError: error instanceof Error ? error.message : String(error),
          toolCall,
          executionContext,
        },
      },
      metadata: {
        executionTime: 0,
      },
    };
  }
}
