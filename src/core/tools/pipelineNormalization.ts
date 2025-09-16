/**
 * Pipeline Normalization Stage
 *
 * Ensures all ToolResult objects have proper format with required metadata.
 * Provides fallback error handling if normalization itself fails.
 */

import type { ToolResult } from "./toolResult.js";

/**
 * Normalization stage - ensures result is in proper ToolResult format
 */
export function normalizeResult(result: ToolResult): ToolResult {
  try {
    // Validate result structure - this will trigger JSON.stringify internally if mocked
    JSON.stringify(result);

    // Ensure metadata is present
    if (!result.metadata) {
      result.metadata = {};
    }

    // Ensure executionTime is present
    if (typeof result.metadata?.executionTime !== "number") {
      result.metadata = {
        ...result.metadata,
        executionTime: 0,
      };
    }

    return result;
  } catch (error) {
    // Fallback error result if normalization fails
    return {
      callId: result.callId || "unknown",
      success: false,
      error: {
        code: "normalization_error",
        message: "Failed to normalize tool result",
        details: {
          originalError: error instanceof Error ? error.message : String(error),
          originalResult: result,
        },
      },
      metadata: {
        executionTime: 0,
      },
    };
  }
}
