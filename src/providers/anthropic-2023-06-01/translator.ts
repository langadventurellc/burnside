/**
 * Anthropic Messages API Request Translator
 *
 * Converts unified ChatRequest format to Anthropic Messages API v2023-06-01 format.
 */

import type { ChatRequest } from "../../client/chatRequest.js";
import type { Message } from "../../core/messages/message.js";
import type { ContentPart } from "../../core/messages/contentPart.js";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest.js";
import { createHttpRequest } from "../../core/providers/createHttpRequest.js";
import { ValidationError } from "../../core/errors/validationError.js";
import type { AnthropicMessagesConfigType } from "./configSchema.js";

/**
 * Convert unified ContentPart to Anthropic message content format
 */
function convertContentPart(part: ContentPart): unknown {
  switch (part.type) {
    case "text": {
      return {
        type: "text",
        text: part.text,
      };
    }
    case "image": {
      // Convert base64 data to Anthropic's image format
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: part.mimeType,
          data: part.data,
        },
      };
    }
    case "code": {
      // Treat code content as text for Anthropic
      return {
        type: "text",
        text: part.text,
      };
    }
    case "document": {
      throw new ValidationError(
        "Document content type is not supported by Anthropic Messages API",
        { contentType: part.type },
      );
    }
    default: {
      const unknownPart = part as { type: string };
      throw new ValidationError(
        `Unsupported content type: ${unknownPart.type}`,
        { contentType: unknownPart.type },
      );
    }
  }
}

/**
 * Convert unified Message format to Anthropic Messages API message format
 */
function convertMessage(message: Message): unknown {
  // Handle simple text-only case (text or code content treated as text)
  if (
    message.content.length === 1 &&
    (message.content[0].type === "text" || message.content[0].type === "code")
  ) {
    return {
      role: message.role,
      content: message.content[0].text,
    };
  }

  // Handle multi-part content
  const convertedContent = message.content.map(convertContentPart);

  return {
    role: message.role,
    content: convertedContent,
  };
}

/**
 * Extract system message from messages array
 */
function extractSystemMessage(messages: Message[]): string | undefined {
  const systemMessage = messages.find((msg) => msg.role === "system");
  return systemMessage?.content[0]?.type === "text"
    ? systemMessage.content[0].text
    : undefined;
}

/**
 * Build Anthropic request body from unified request
 */
function buildAnthropicRequestBody(
  request: ChatRequest & { stream?: boolean },
  systemMessage?: string,
): Record<string, unknown> {
  // Filter out system messages from the messages array
  const filteredMessages = request.messages.filter(
    (msg) => msg.role !== "system",
  );

  if (filteredMessages.length === 0) {
    throw new ValidationError("Messages array cannot be empty after filtering");
  }

  const messages = filteredMessages.map(convertMessage);

  const anthropicRequest: Record<string, unknown> = {
    model: request.model,
    max_tokens: request.maxTokens,
    messages,
  };

  // Add system message if present
  if (systemMessage) {
    anthropicRequest.system = systemMessage;
  }

  // Add optional parameters
  if (request.temperature !== undefined) {
    if (request.temperature < 0 || request.temperature > 1) {
      throw new ValidationError(
        "Temperature must be between 0 and 1 for Anthropic API",
        { temperature: request.temperature },
      );
    }
    anthropicRequest.temperature = request.temperature;
  }

  if (request.options?.topP !== undefined) {
    anthropicRequest.top_p = request.options.topP;
  }

  if (
    request.options?.stopSequences &&
    Array.isArray(request.options.stopSequences) &&
    request.options.stopSequences.length > 0
  ) {
    anthropicRequest.stop_sequences = request.options.stopSequences;
  }

  // Handle streaming flag from request
  if (request.stream === true) {
    anthropicRequest.stream = true;
  }

  // Add tools placeholder (will be implemented in separate task)
  if (
    request.tools &&
    Array.isArray(request.tools) &&
    request.tools.length > 0
  ) {
    // Placeholder - detailed implementation in separate task
    anthropicRequest.tools = [];
  }

  return anthropicRequest;
}

/**
 * Build headers for Anthropic API request
 */
function buildHeaders(
  config: AnthropicMessagesConfigType,
): Record<string, string> {
  const headers: Record<string, string> = {
    "x-api-key": config.apiKey,
    "anthropic-version": config.version,
  };

  return headers;
}

/**
 * Translate unified ChatRequest to Anthropic Messages API v2023-06-01 format
 *
 * @param request - Unified chat request with optional stream parameter
 * @param config - Anthropic provider configuration
 * @returns HTTP request for Anthropic Messages API v2023-06-01
 * @throws {ValidationError} When request or config is invalid
 */
export function translateChatRequest(
  request: ChatRequest & { stream?: boolean },
  config: AnthropicMessagesConfigType,
): ProviderHttpRequest {
  try {
    // Validate required fields
    if (!request.messages || request.messages.length === 0) {
      throw new ValidationError("Messages array cannot be empty");
    }

    if (!request.maxTokens) {
      throw new ValidationError("maxTokens is required for Anthropic API");
    }

    // Extract system message
    const systemMessage = extractSystemMessage(request.messages);

    // Build and validate the request body
    const anthropicRequest = buildAnthropicRequestBody(request, systemMessage);

    // Build headers
    const headers = buildHeaders(config);

    // Construct the URL
    const url = `${config.baseUrl}/v1/messages`;

    return createHttpRequest({
      url,
      method: "POST",
      headers,
      body: anthropicRequest,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      "Failed to translate request to Anthropic format",
      {
        originalError: error,
      },
    );
  }
}
