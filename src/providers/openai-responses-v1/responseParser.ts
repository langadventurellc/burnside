/**
 * OpenAI Responses v1 Response Parser
 *
 * Core response parsing logic that converts OpenAI Responses API v1
 * non-streaming responses to unified message format with usage
 * information and metadata extraction.
 */

import type { Message } from "../../core/messages/message";
import type { ContentPart } from "../../core/messages/contentPart";
import type { ToolCall } from "../../core/tools/toolCall";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import { ValidationError } from "../../core/errors/validationError";
import {
  OpenAIResponsesV1ResponseSchema,
  type OpenAIResponsesV1Response,
} from "./responseSchema";
import { parseOpenAIToolCalls } from "./toolCallParser";
import { logger } from "../../core/logging/simpleLogger";

/**
 * Convert OpenAI content to unified ContentPart array (Responses API format)
 */
function convertOpenAIContentToContentParts(
  content: Array<{
    type: "output_text";
    text: string;
    annotations?: unknown[];
    logprobs?: unknown[];
  }>,
): ContentPart[] {
  return content.map((part) => ({
    type: "text" as const,
    text: part.text,
  }));
}

/**
 * Convert OpenAI output message to unified Message format with tool calls
 */
function convertOpenAIOutputToMessage(
  output: OpenAIResponsesV1Response["output"][0],
  responseId: string,
): Message & { toolCalls?: ToolCall[] } {
  // Type guard to ensure we're working with a message output
  if (!("type" in output) || output.type !== "message") {
    throw new ValidationError("Unsupported output type", {
      outputType: "type" in output ? output.type : "unknown",
      responseId,
    });
  }

  // Now TypeScript knows this is a message type
  const messageOutput = output;
  const contentParts = convertOpenAIContentToContentParts(
    messageOutput.content,
  );

  const message: Message & { toolCalls?: ToolCall[] } = {
    id: responseId,
    role: "assistant",
    content: contentParts,
    timestamp: new Date().toISOString(),
  };

  // Parse tool calls if present
  if (messageOutput.tool_calls) {
    try {
      message.toolCalls = parseOpenAIToolCalls(messageOutput.tool_calls);
    } catch (error) {
      // Add tool call parsing error to metadata but don't fail the entire response
      if (error instanceof ValidationError) {
        throw new ValidationError("Failed to parse tool calls in response", {
          cause: error,
          responseId,
          toolCallsData: messageOutput.tool_calls,
        });
      }
      throw error;
    }
  }

  return message;
}

/**
 * Extract usage information from OpenAI response (Responses API format)
 */
function extractUsageInformation(usage?: OpenAIResponsesV1Response["usage"]) {
  if (!usage) {
    return undefined;
  }

  return {
    promptTokens: usage.input_tokens,
    completionTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
  };
}

/**
 * Extract metadata from OpenAI response (Responses API format)
 */
function extractMetadata(
  response: OpenAIResponsesV1Response,
): Record<string, unknown> {
  return {
    id: response.id,
    created_at: response.created_at,
    status: response.status,
    // Note: finish_reason is not part of the standard Responses API output
    // but we include null for backwards compatibility
    finishReason: null,
  };
}

/**
 * Parse OpenAI Responses API v1 non-streaming response to unified format
 *
 * @param response - HTTP response from OpenAI Responses API
 * @param responseText - Pre-read response body as text
 * @returns Parsed response with message, usage, model, and metadata
 * @throws {ValidationError} When response is invalid or malformed
 */
export function parseOpenAIResponse(
  response: ProviderHttpResponse,
  responseText: string,
): {
  message: Message & { toolCalls?: ToolCall[] };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  model: string;
  metadata?: Record<string, unknown>;
} {
  if (!responseText.trim()) {
    throw new ValidationError("Response body is empty", {
      status: response.status,
      statusText: response.statusText,
    });
  }

  let responseData: unknown;
  try {
    responseData = JSON.parse(responseText);
  } catch (error) {
    throw new ValidationError("Failed to parse response as JSON", {
      status: response.status,
      statusText: response.statusText,
      responseText: responseText.substring(0, 500),
      parseError: error instanceof Error ? error.message : String(error),
    });
  }

  // Validate response structure
  const validationResult =
    OpenAIResponsesV1ResponseSchema.safeParse(responseData);
  if (!validationResult.success) {
    // Log response validation failure
    logger.error("OpenAI response validation failed", {
      provider: "openai",
      status: response.status,
      statusText: response.statusText,
      validationErrors: validationResult.error.errors,
      responseType: typeof responseData,
    });

    // Log response details for debugging (truncated)
    logger.debug("OpenAI response details", {
      provider: "openai",
      responseText: responseText.substring(0, 1000),
    });

    throw new ValidationError("Invalid OpenAI response structure", {
      status: response.status,
      statusText: response.statusText,
      validationErrors: validationResult.error.errors,
      responseData:
        typeof responseData === "object" ? responseData : { raw: responseData },
    });
  }

  const openaiResponse = validationResult.data;

  // Handle empty output array
  if (openaiResponse.output.length === 0) {
    throw new ValidationError("OpenAI response contains no output", {
      status: response.status,
      statusText: response.statusText,
      responseId: openaiResponse.id,
    });
  }

  // Find the message type in the output array (it might not be the first item for GPT-5 models)
  const messageOutput = openaiResponse.output.find(
    (item) => "type" in item && item.type === "message",
  );

  let message: Message & { toolCalls?: ToolCall[] };

  if (messageOutput) {
    // Convert the message output to unified message format
    message = convertOpenAIOutputToMessage(messageOutput, openaiResponse.id);
  } else {
    // Check if there are function_call outputs
    const functionCallOutputs = openaiResponse.output.filter(
      (item) => "type" in item && item.type === "function_call",
    );

    if (functionCallOutputs.length === 0) {
      throw new ValidationError(
        "No message or function_call type found in OpenAI response output",
        {
          status: response.status,
          statusText: response.statusText,
          responseId: openaiResponse.id,
          outputTypes: openaiResponse.output.map((item) =>
            "type" in item ? item.type : "unknown",
          ),
        },
      );
    }

    // Convert function_call outputs to a message with tool calls
    // This handles multi-turn scenarios where the API returns only function calls
    const toolCalls: ToolCall[] = functionCallOutputs.map((output) => {
      // Type guard to ensure we have the expected structure
      if (!("type" in output) || output.type !== "function_call") {
        throw new ValidationError(
          "Unexpected output type in function call processing",
        );
      }

      // Cast to the expected function_call structure
      const functionCallOutput = output as {
        type: "function_call";
        id: string;
        call_id?: string;
        name: string;
        arguments: string;
      };

      // Parse the arguments JSON string
      let parameters: Record<string, unknown>;
      try {
        parameters = JSON.parse(functionCallOutput.arguments) as Record<
          string,
          unknown
        >;
      } catch (error) {
        throw new ValidationError("Failed to parse function call arguments", {
          functionName: functionCallOutput.name,
          arguments: functionCallOutput.arguments,
          parseError: error instanceof Error ? error.message : String(error),
        });
      }

      return {
        id: functionCallOutput.call_id || functionCallOutput.id,
        name: functionCallOutput.name,
        parameters,
      };
    });

    // Create a synthetic assistant message with the tool calls
    message = {
      id: openaiResponse.id,
      role: "assistant",
      content: [], // Empty content for tool-only responses
      timestamp: new Date().toISOString(),
      toolCalls,
    };
  }

  // Extract usage and metadata
  const usage = extractUsageInformation(openaiResponse.usage);
  const metadata = extractMetadata(openaiResponse);

  return {
    message: {
      ...message,
      metadata: {
        provider: "openai",
        ...metadata,
      },
    },
    usage,
    model: openaiResponse.model,
    metadata: {
      provider: "openai",
      ...metadata,
    },
  };
}
