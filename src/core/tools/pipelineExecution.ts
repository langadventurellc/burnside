/**
 * Pipeline Execution Stage
 *
 * Executes tool handler with timeout protection using AbortController.
 * Handles all execution errors and converts them to ToolResult format.
 */

import type { ToolResult } from "./toolResult.js";
import type { ExecutionContext } from "./executionContext.js";

/**
 * Execution stage - executes tool handler with timeout protection using AbortController
 */
export async function executeToolHandler(
  context: ExecutionContext,
): Promise<ToolResult> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Timeout after ${context.timeoutMs}ms`));
      }, context.timeoutMs);
    });

    // Execute handler with timeout protection
    const handlerResult = await Promise.race([
      context.toolHandler(
        context.toolCall.parameters,
        context.executionContext,
      ),
      timeoutPromise,
    ]);

    // Clear timeout on successful completion
    clearTimeout(timeoutId);

    // Return success result
    return {
      callId: context.toolCall.id,
      success: true,
      data: handlerResult,
      metadata: {
        executionTime: Date.now() - context.startTime,
      },
    };
  } catch (error) {
    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Check if error was due to timeout
    if (
      controller.signal.aborted ||
      (error instanceof Error && error.message.includes("Timeout after"))
    ) {
      return {
        callId: context.toolCall.id,
        success: false,
        error: {
          code: "timeout_error",
          message: `Tool execution timed out after ${context.timeoutMs}ms`,
          details: {
            timeoutMs: context.timeoutMs,
            toolName: context.toolCall.name,
            parameters: context.toolCall.parameters,
          },
        },
        metadata: {
          executionTime: Date.now() - context.startTime,
        },
      };
    }

    // Handle other execution errors
    return {
      callId: context.toolCall.id,
      success: false,
      error: {
        code: "execution_error",
        message: "Tool handler execution failed",
        details: {
          originalError: error instanceof Error ? error.message : String(error),
          toolName: context.toolCall.name,
          parameters: context.toolCall.parameters,
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      metadata: {
        executionTime: Date.now() - context.startTime,
      },
    };
  }
}
