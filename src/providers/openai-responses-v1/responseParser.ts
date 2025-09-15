/**
 * OpenAI Responses v1 Response Parser
 *
 * Core response parsing logic that converts OpenAI Responses API v1
 * non-streaming responses to unified message format with usage
 * information and metadata extraction.
 */

import type { Message } from "../../core/messages/message.js";
import type { ContentPart } from "../../core/messages/contentPart.js";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse.js";
import { ValidationError } from "../../core/errors/validationError.js";
import {
  OpenAIResponsesV1ResponseSchema,
  type OpenAIResponsesV1Response,
} from "./responseSchema.js";

/**
 * Convert OpenAI content to unified ContentPart array
 */
function convertOpenAIContentToContentParts(
  content: string | Array<{ type: "text"; text: string }>,
): ContentPart[] {
  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }

  return content.map((part) => ({
    type: "text" as const,
    text: part.text,
  }));
}

/**
 * Convert OpenAI choice to unified Message format
 */
function convertOpenAIChoiceToMessage(
  choice: OpenAIResponsesV1Response["choices"][0],
  responseId: string,
): Message {
  const contentParts = convertOpenAIContentToContentParts(
    choice.message.content,
  );

  return {
    id: responseId,
    role: "assistant",
    content: contentParts,
  };
}

/**
 * Extract usage information from OpenAI response
 */
function extractUsageInformation(usage?: OpenAIResponsesV1Response["usage"]) {
  if (!usage) {
    return undefined;
  }

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}

/**
 * Extract metadata from OpenAI response
 */
function extractMetadata(
  response: OpenAIResponsesV1Response,
): Record<string, unknown> {
  return {
    id: response.id,
    created: response.created,
    finishReason: response.choices[0]?.finish_reason ?? null,
    systemFingerprint: response.system_fingerprint,
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
  message: Message;
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
    throw new ValidationError("Invalid OpenAI response structure", {
      status: response.status,
      statusText: response.statusText,
      validationErrors: validationResult.error.errors,
      responseData:
        typeof responseData === "object" ? responseData : { raw: responseData },
    });
  }

  const openaiResponse = validationResult.data;

  // Handle empty choices
  if (openaiResponse.choices.length === 0) {
    throw new ValidationError("OpenAI response contains no choices", {
      status: response.status,
      statusText: response.statusText,
      responseId: openaiResponse.id,
    });
  }

  // Convert first choice to unified message format
  const message = convertOpenAIChoiceToMessage(
    openaiResponse.choices[0],
    openaiResponse.id,
  );

  // Extract usage and metadata
  const usage = extractUsageInformation(openaiResponse.usage);
  const metadata = extractMetadata(openaiResponse);

  return {
    message,
    usage,
    model: openaiResponse.model,
    metadata,
  };
}
