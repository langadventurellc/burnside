/**
 * OpenAI Responses v1 Request Translator
 *
 * Converts unified ChatRequest format to OpenAI Responses API v1 format.
 */

import type { ChatRequest } from "../../client/chatRequest.js";
import type { Message } from "../../core/messages/message.js";
import type { ContentPart } from "../../core/messages/contentPart.js";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest.js";
import { createHttpRequest } from "../../core/providers/createHttpRequest.js";
import { ValidationError } from "../../core/errors/validationError.js";
import type { OpenAIResponsesV1Config } from "./configSchema.js";
import { OpenAIResponsesV1RequestSchema } from "./requestSchema.js";
import { translateToolsForOpenAI } from "./toolsTranslator.js";

/**
 * Convert unified ContentPart to OpenAI message content format
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
      // Convert base64 data to data URL format expected by OpenAI
      const dataUrl = `data:${part.mimeType};base64,${part.data}`;
      return {
        type: "image_url",
        image_url: {
          url: dataUrl,
          detail: "auto",
        },
      };
    }
    case "code": {
      // Treat code content as text for OpenAI
      return {
        type: "text",
        text: part.text,
      };
    }
    case "document": {
      throw new ValidationError(
        "Document content type is not supported by OpenAI Responses API",
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
 * Convert unified Message format to OpenAI Responses API message format
 */
function convertMessage(message: Message): unknown {
  // Handle simple text-only case (text or code content treated as text)
  if (
    message.content.length === 1 &&
    (message.content[0].type === "text" || message.content[0].type === "code")
  ) {
    return {
      type: "message",
      role: message.role,
      content: message.content[0].text,
    };
  }

  // Handle multi-part content
  const convertedContent = message.content.map(convertContentPart);

  return {
    type: "message",
    role: message.role,
    content: convertedContent,
  };
}

/**
 * Build OpenAI request body from unified request
 */
function buildOpenAIRequestBody(
  request: ChatRequest & { stream?: boolean; tools?: unknown[] },
): Record<string, unknown> {
  const messages = request.messages.map(convertMessage);

  const openaiRequest: Record<string, unknown> = {
    model: request.model,
    input: messages,
  };

  // Add optional parameters
  // Always include stream field, defaulting to false for non-streaming
  openaiRequest.stream = request.stream ?? false;
  if (request.temperature !== undefined) {
    openaiRequest.temperature = request.temperature;
  }
  if (request.maxTokens !== undefined) {
    openaiRequest.max_output_tokens = request.maxTokens;
  }

  // Add tools if provided
  if (
    request.tools &&
    Array.isArray(request.tools) &&
    request.tools.length > 0
  ) {
    try {
      openaiRequest.tools = translateToolsForOpenAI(
        request.tools as Parameters<typeof translateToolsForOpenAI>[0],
      );
    } catch (error) {
      throw new ValidationError(
        `Failed to translate tools for OpenAI request: ${error instanceof Error ? error.message : "Unknown error"}`,
        { originalError: error, tools: request.tools },
      );
    }
  }

  // Add options from the request if provided
  if (request.options) {
    for (const [key, value] of Object.entries(request.options)) {
      // Skip tools if already processed above
      if (key === "tools") continue;

      // Special handling for maxTokens in responses API
      if (key === "maxTokens") {
        openaiRequest.max_output_tokens = value;
        continue;
      }

      // Convert camelCase to snake_case for OpenAI API
      const openaiKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      openaiRequest[openaiKey] = value;
    }
  }

  return openaiRequest;
}

/**
 * Build headers for OpenAI API request
 */
function buildHeaders(config: OpenAIResponsesV1Config): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
  };

  if (config.organization) {
    headers["OpenAI-Organization"] = config.organization;
  }
  if (config.project) {
    headers["OpenAI-Project"] = config.project;
  }
  if (config.headers) {
    Object.assign(headers, config.headers);
  }

  return headers;
}

/**
 * Translate unified ChatRequest to OpenAI Responses API v1 format
 *
 * @param request - Unified chat request with optional stream parameter
 * @param config - OpenAI provider configuration
 * @returns HTTP request for OpenAI Responses API v1
 * @throws {ValidationError} When request or config is invalid
 */
export function translateChatRequest(
  request: ChatRequest & { stream?: boolean },
  config: OpenAIResponsesV1Config,
): ProviderHttpRequest {
  try {
    // Build and validate the request body
    const openaiRequest = buildOpenAIRequestBody(request);
    const validatedRequest =
      OpenAIResponsesV1RequestSchema.parse(openaiRequest);

    // Build headers
    const headers = buildHeaders(config);

    // Construct the URL - NOTE: Using /v1/responses not /v1/responses
    const url = `${config.baseUrl}/responses`;

    return createHttpRequest({
      url,
      method: "POST",
      headers,
      body: validatedRequest,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError("Failed to translate request to OpenAI format", {
      originalError: error,
    });
  }
}
