/**
 * Anthropic Messages API Request Translator
 *
 * Converts unified ChatRequest format to Anthropic Messages API v2023-06-01 format.
 */

import type { ChatRequest } from "../../client/chatRequest";
import type { Message } from "../../core/messages/message";
import type { ContentPart } from "../../core/messages/contentPart";
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import { createHttpRequest } from "../../core/providers/createHttpRequest";
import { ValidationError } from "../../core/errors/validationError";
import type { AnthropicMessagesConfigType } from "./configSchema";
import { z } from "zod";
import isOptional from "../../core/validation/isOptional";

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
 * Convert Zod schema to JSON Schema for Anthropic API
 */
function zodToJsonSchema(zodSchema: z.ZodType): Record<string, unknown> {
  // For now, we'll handle basic Zod types commonly used in tools
  // This is a simplified implementation - a full Zod to JSON Schema converter would be more complex

  if (zodSchema instanceof z.ZodObject) {
    const shape = zodSchema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      if (value instanceof z.ZodString) {
        properties[key] = { type: "string" };
        if (!isOptional(value, zodSchema)) {
          required.push(key);
        }
      } else if (value instanceof z.ZodNumber) {
        properties[key] = { type: "number" };
        if (!isOptional(value, zodSchema)) {
          required.push(key);
        }
      } else if (value instanceof z.ZodBoolean) {
        properties[key] = { type: "boolean" };
        if (!isOptional(value, zodSchema)) {
          required.push(key);
        }
      } else {
        // Fallback for other types
        properties[key] = { type: "string" };
        if (!isOptional(value, zodSchema)) {
          required.push(key);
        }
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0 && { required }),
    };
  }

  // Fallback for non-object schemas
  return { type: "object" };
}

/**
 * Convert ToolDefinition to Anthropic tool format
 */
function convertToolDefinition(tool: ToolDefinition): Record<string, unknown> {
  let inputSchema: Record<string, unknown>;

  // Handle both Zod schemas and JSON Schema objects
  if (tool.inputSchema instanceof z.ZodType) {
    inputSchema = zodToJsonSchema(tool.inputSchema);
  } else {
    // Assume it's already a JSON Schema object
    inputSchema = tool.inputSchema as Record<string, unknown>;
  }

  return {
    name: tool.name,
    description: tool.description,
    input_schema: inputSchema,
  };
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

  // Add tools if present
  if (
    request.tools &&
    Array.isArray(request.tools) &&
    request.tools.length > 0
  ) {
    anthropicRequest.tools = request.tools.map(convertToolDefinition);
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
