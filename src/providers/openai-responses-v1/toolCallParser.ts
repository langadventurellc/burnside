/**
 * OpenAI Tool Call Response Parser
 *
 * Parses OpenAI tool calls from both streaming and non-streaming responses,
 * converting them to unified ToolCall format with comprehensive error handling
 * and validation.
 */

import { z } from "zod";
import type { ToolCall } from "../../core/tools/toolCall";
import { ValidationError } from "../../core/errors/validationError";
import { logger } from "../../core/logging";

/**
 * OpenAI tool call function schema
 */
const OpenAIToolCallFunctionSchema = z.object({
  name: z.string().min(1, "Tool function name cannot be empty"),
  arguments: z.string(), // JSON string, not parsed object
});

/**
 * OpenAI tool call schema
 */
const OpenAIToolCallSchema = z.object({
  id: z.string().min(1, "Tool call ID cannot be empty"),
  type: z.literal("function"),
  function: OpenAIToolCallFunctionSchema,
});

/**
 * Array of OpenAI tool calls schema
 */
const OpenAIToolCallsArraySchema = z.array(OpenAIToolCallSchema);

/**
 * Type definitions
 */
type OpenAIToolCall = z.infer<typeof OpenAIToolCallSchema>;

/**
 * Parse OpenAI tool calls from response and convert to unified ToolCall format
 *
 * @param toolCalls - Array of OpenAI tool calls from response
 * @returns Array of unified ToolCall objects
 * @throws ValidationError for malformed tool calls or invalid JSON
 */
export function parseOpenAIToolCalls(toolCalls: unknown): ToolCall[] {
  const toolCallsArray = Array.isArray(toolCalls) ? toolCalls : [];

  logger.debug("OpenAI tool call parsing started", {
    provider: "openai",
    toolCallsCount: toolCallsArray.length,
    hasToolCalls: toolCallsArray.length > 0,
  });

  // Validate input structure
  const validatedToolCalls = validateToolCallsStructure(toolCalls);

  // Convert each tool call to unified format
  const unifiedToolCalls = validatedToolCalls.map((toolCall) =>
    convertOpenAIToolCallToUnified(toolCall),
  );

  logger.info("OpenAI tool call parsing completed", {
    provider: "openai",
    parsedToolCalls: unifiedToolCalls.length,
    toolNames: unifiedToolCalls.map((tc) => tc.name),
  });

  return unifiedToolCalls;
}

/**
 * Validate OpenAI tool calls structure using Zod schema
 *
 * @param toolCalls - Raw tool calls from OpenAI response
 * @returns Validated tool calls array
 * @throws ValidationError for invalid structure
 */
function validateToolCallsStructure(toolCalls: unknown): OpenAIToolCall[] {
  try {
    return OpenAIToolCallsArraySchema.parse(toolCalls);
  } catch (error) {
    logger.warn("OpenAI tool calls validation failed", {
      provider: "openai",
      validationError: error instanceof Error ? error.message : String(error),
      inputType: typeof toolCalls,
      isArray: Array.isArray(toolCalls),
    });

    throw new ValidationError("Invalid OpenAI tool calls structure", {
      cause: error,
      input: toolCalls,
      context: "tool_calls_validation",
    });
  }
}

/**
 * Convert OpenAI tool call to unified ToolCall format
 *
 * @param openAIToolCall - Validated OpenAI tool call
 * @returns Unified ToolCall object
 * @throws ValidationError for invalid JSON arguments
 */
function convertOpenAIToolCallToUnified(
  openAIToolCall: OpenAIToolCall,
): ToolCall {
  logger.debug("Converting OpenAI tool call to unified format", {
    provider: "openai",
    toolName: openAIToolCall.function.name,
    callId: openAIToolCall.id,
    hasArguments: Boolean(openAIToolCall.function.arguments?.trim()),
  });

  const parameters = parseToolCallArguments(
    openAIToolCall.function.arguments,
    openAIToolCall.id,
  );

  const metadata = extractToolCallMetadata(openAIToolCall);

  return {
    id: openAIToolCall.id,
    name: openAIToolCall.function.name,
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
    const truncatedArgs =
      argumentsJson.length > 500
        ? argumentsJson.substring(0, 500) + "..."
        : argumentsJson;

    logger.warn("OpenAI tool call argument parsing failed", {
      provider: "openai",
      callId: toolCallId,
      error: error instanceof Error ? error.message : String(error),
      argumentsSnippet: truncatedArgs,
    });

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
 * @param openAIToolCall - OpenAI tool call object
 * @returns Metadata object with provider context
 */
function extractToolCallMetadata(openAIToolCall: OpenAIToolCall) {
  return {
    providerId: "openai",
    timestamp: new Date().toISOString(),
    rawCall: openAIToolCall, // Store original for debugging
  };
}
