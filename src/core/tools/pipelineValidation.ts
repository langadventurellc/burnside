/**
 * Pipeline Validation Stage
 *
 * Validates ToolCall format and tool definition compatibility.
 * Returns ToolResult with error if validation fails, null if valid.
 */

import type { ToolCall } from "./toolCall";
import type { ToolResult } from "./toolResult";
import type { ToolDefinition } from "./toolDefinition";
import { ToolCallSchema } from "./toolCallSchema";
import { safeValidate } from "../validation/safeValidate";

/**
 * Validation stage - validates ToolCall format and tool definition compatibility
 */
export function validateToolCall(
  toolCall: ToolCall,
  toolDefinition: ToolDefinition,
): ToolResult | null {
  try {
    // Validate ToolCall structure
    const validationResult = safeValidate(ToolCallSchema, toolCall);
    if (!validationResult.success) {
      return {
        callId: toolCall.id,
        success: false,
        error: {
          code: "validation_error",
          message: "Invalid tool call format",
          details: {
            validationErrors: validationResult.error.issues,
            toolCall,
          },
        },
        metadata: {
          executionTime: 0,
        },
      };
    }

    // Validate tool name matches definition
    if (toolCall.name !== toolDefinition.name) {
      return {
        callId: toolCall.id,
        success: false,
        error: {
          code: "validation_error",
          message: "Tool name mismatch",
          details: {
            expected: toolDefinition.name,
            received: toolCall.name,
          },
        },
        metadata: {
          executionTime: 0,
        },
      };
    }

    // Validate parameters against tool schema if provided
    if (toolDefinition.inputSchema) {
      // Check if inputSchema is a Zod schema (has safeParse method)
      if (
        typeof toolDefinition.inputSchema === "object" &&
        "safeParse" in toolDefinition.inputSchema
      ) {
        const paramValidation = safeValidate(
          toolDefinition.inputSchema as Parameters<typeof safeValidate>[0],
          toolCall.parameters,
        );
        if (!paramValidation.success) {
          return {
            callId: toolCall.id,
            success: false,
            error: {
              code: "validation_error",
              message: "Invalid tool parameters",
              details: {
                validationErrors: paramValidation.error.issues,
                parameters: toolCall.parameters,
              },
            },
            metadata: {
              executionTime: 0,
            },
          };
        }
      }
      // Note: JSON Schema validation is skipped for now - would need separate JSON Schema validator
    }

    return null; // No validation errors
  } catch (error) {
    return {
      callId: toolCall.id,
      success: false,
      error: {
        code: "validation_error",
        message: "Validation stage failed",
        details: {
          originalError: error instanceof Error ? error.message : String(error),
          toolCall,
        },
      },
      metadata: {
        executionTime: 0,
      },
    };
  }
}
