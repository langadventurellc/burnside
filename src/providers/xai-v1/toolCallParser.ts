/**
 * xAI Tool Call Response Parser
 *
 * Parses xAI tool calls from both streaming and non-streaming responses,
 * converting them to unified ToolCall format with comprehensive error handling
 * and validation.
 */

import { z } from "zod";
import type { ToolCall } from "../../core/tools/toolCall";
import { ValidationError } from "../../core/errors/validationError";

/**
 * xAI tool call function schema
 */
const XAIToolCallFunctionSchema = z.object({
  name: z.string().min(1, "Tool function name cannot be empty"),
  arguments: z.string(), // JSON string, not parsed object
});

/**
 * xAI tool call schema
 */
const XAIToolCallSchema = z.object({
  id: z.string().min(1, "Tool call ID cannot be empty"),
  type: z.literal("function"),
  function: XAIToolCallFunctionSchema,
});

/**
 * Array of xAI tool calls schema
 */
const XAIToolCallsArraySchema = z.array(XAIToolCallSchema);

/**
 * Type definitions
 */
type XAIToolCall = z.infer<typeof XAIToolCallSchema>;

/**
 * Parse xAI tool calls from response and convert to unified ToolCall format
 *
 * @param toolCalls - Array of xAI tool calls from response
 * @returns Array of unified ToolCall objects
 * @throws ValidationError for malformed tool calls or invalid JSON
 */
export function parseXAIToolCalls(toolCalls: unknown): ToolCall[] {
  // Validate input structure
  const validatedToolCalls = validateToolCallsStructure(toolCalls);

  // Convert each tool call to unified format
  return validatedToolCalls.map((toolCall) =>
    convertXAIToolCallToUnified(toolCall),
  );
}

/**
 * Validate xAI tool calls structure using Zod schema
 *
 * @param toolCalls - Raw tool calls from xAI response
 * @returns Validated tool calls array
 * @throws ValidationError for invalid structure
 */
function validateToolCallsStructure(toolCalls: unknown): XAIToolCall[] {
  try {
    return XAIToolCallsArraySchema.parse(toolCalls);
  } catch (error) {
    throw new ValidationError("Invalid xAI tool calls structure", {
      cause: error,
      input: toolCalls,
      context: "tool_calls_validation",
    });
  }
}

/**
 * Convert xAI tool call to unified ToolCall format
 *
 * @param xaiToolCall - Validated xAI tool call
 * @returns Unified ToolCall object
 * @throws ValidationError for invalid JSON arguments
 */
function convertXAIToolCallToUnified(xaiToolCall: XAIToolCall): ToolCall {
  const parameters = parseToolCallArguments(
    xaiToolCall.function.arguments,
    xaiToolCall.id,
  );

  const metadata = extractToolCallMetadata(xaiToolCall);

  return {
    id: xaiToolCall.id,
    name: xaiToolCall.function.name,
    parameters,
    metadata,
  };
}

/**
 * Parse tool call arguments from JSON string with error handling
 *
 * @param argumentsJson - JSON string containing tool arguments
 * @param toolCallId - Tool call ID for error context
 * @returns Parsed arguments object
 * @throws ValidationError for malformed JSON
 */
function parseToolCallArguments(
  argumentsJson: string,
  toolCallId: string,
): Record<string, unknown> {
  try {
    // Handle empty arguments
    if (!argumentsJson.trim()) {
      return {};
    }

    const parsed: unknown = JSON.parse(argumentsJson);

    // Ensure we get an object, not a primitive
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new ValidationError(
        `Tool call arguments must be a JSON object, got ${typeof parsed}`,
        {
          input: argumentsJson,
          context: `tool_call_${toolCallId}`,
        },
      );
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(
      `Invalid JSON in tool call arguments: ${error instanceof Error ? error.message : "Unknown JSON parsing error"}`,
      {
        cause: error,
        input: argumentsJson,
        context: `tool_call_${toolCallId}`,
      },
    );
  }
}

/**
 * Extract metadata for tool call context and tracking
 *
 * @param xaiToolCall - xAI tool call object
 * @returns Metadata object with provider context
 */
function extractToolCallMetadata(xaiToolCall: XAIToolCall) {
  return {
    providerId: "xai",
    timestamp: new Date().toISOString(),
    rawCall: xaiToolCall, // Store original for debugging
  };
}
