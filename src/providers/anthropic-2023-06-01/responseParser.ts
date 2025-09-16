/**
 * Anthropic Messages API Response Parser
 *
 * Core response parsing logic that converts Anthropic Messages API v2023-06-01
 * non-streaming responses to unified message format with usage information
 * and metadata extraction.
 */

import type { Message } from "../../core/messages/message.js";
import type { ContentPart } from "../../core/messages/contentPart.js";
import type { ToolCall } from "../../core/tools/toolCall.js";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse.js";
import { ProviderError } from "../../core/errors/providerError.js";
import { ValidationError } from "../../core/errors/validationError.js";
import {
  AnthropicMessagesResponseSchema,
  AnthropicErrorResponseSchema,
  type AnthropicMessagesResponseType,
} from "./responseSchema.js";

/**
 * Convert Anthropic content blocks to unified ContentPart array
 */
function parseContentBlocks(
  blocks: AnthropicMessagesResponseType["content"],
): ContentPart[] {
  return blocks
    .filter((block) => block.type === "text")
    .map((block) => ({
      type: "text" as const,
      text: (block as { text: string }).text,
    }));
}

/**
 * Extract tool calls from Anthropic content blocks
 */
function extractToolCalls(
  blocks: AnthropicMessagesResponseType["content"],
): ToolCall[] {
  return blocks
    .filter((block) => block.type === "tool_use")
    .map((block) => {
      const toolUseBlock = block as {
        id: string;
        name: string;
        input: Record<string, unknown>;
      };

      return {
        id: toolUseBlock.id,
        name: toolUseBlock.name,
        parameters: toolUseBlock.input,
      };
    });
}

/**
 * Extract metadata from Anthropic response
 */
function extractResponseMetadata(
  response: AnthropicMessagesResponseType,
): Record<string, unknown> {
  return {
    id: response.id,
    stopReason: response.stop_reason,
    stopSequence: response.stop_sequence,
    model: response.model,
  };
}

/**
 * Parse Anthropic Messages API non-streaming response to unified format
 *
 * @param response - HTTP response from Anthropic Messages API
 * @param responseText - Pre-read response body as text
 * @returns Parsed response with message, usage, model, and metadata
 * @throws {ProviderError} When API returns error response
 * @throws {ValidationError} When response is invalid or malformed
 */
export function parseAnthropicResponse(
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

  // Parse responseText as JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    throw new ProviderError("Invalid JSON in Anthropic response", {
      cause: error,
      context: {
        provider: "anthropic",
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500),
      },
    });
  }

  // Check for error response
  if (
    parsed &&
    typeof parsed === "object" &&
    "type" in parsed &&
    parsed.type === "error"
  ) {
    const errorValidation = AnthropicErrorResponseSchema.safeParse(parsed);
    if (errorValidation.success) {
      const errorResponse = errorValidation.data;
      throw new ProviderError(errorResponse.error.message, {
        context: {
          provider: "anthropic",
          errorType: errorResponse.error.type,
          status: response.status,
          statusText: response.statusText,
        },
      });
    } else {
      throw new ProviderError("Anthropic API returned an error", {
        context: {
          provider: "anthropic",
          status: response.status,
          statusText: response.statusText,
          errorData: parsed,
        },
      });
    }
  }

  // Validate and parse successful response
  const validationResult = AnthropicMessagesResponseSchema.safeParse(parsed);
  if (!validationResult.success) {
    throw new ValidationError("Invalid Anthropic response structure", {
      status: response.status,
      statusText: response.statusText,
      validationErrors: validationResult.error.errors,
      responseData: typeof parsed === "object" ? parsed : { raw: parsed },
    });
  }

  const validatedResponse = validationResult.data;

  // Convert to structured format
  const message: Message & { toolCalls?: ToolCall[] } = {
    id: validatedResponse.id,
    role: "assistant",
    content: parseContentBlocks(validatedResponse.content),
    toolCalls: extractToolCalls(validatedResponse.content),
    timestamp: new Date().toISOString(),
    metadata: {
      provider: "anthropic",
      model: validatedResponse.model,
      stopReason: validatedResponse.stop_reason,
    },
  };

  const usage = {
    promptTokens: validatedResponse.usage.input_tokens,
    completionTokens: validatedResponse.usage.output_tokens,
    totalTokens:
      validatedResponse.usage.input_tokens +
      validatedResponse.usage.output_tokens,
  };

  const metadata = extractResponseMetadata(validatedResponse);

  return {
    message,
    usage,
    model: validatedResponse.model,
    metadata: {
      provider: "anthropic",
      ...metadata,
    },
  };
}
