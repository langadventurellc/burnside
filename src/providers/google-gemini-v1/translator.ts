/**
 * Google Gemini v1 Request Translator
 *
 * Converts unified ChatRequest format to Google Gemini API v1 format.
 * Handles message role mapping, content part translation, and system message merging.
 */

import type { ChatRequest } from "../../client/chatRequest";
import type { Message } from "../../core/messages/message";
import type { ContentPart } from "../../core/messages/contentPart";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import { createHttpRequest } from "../../core/providers/createHttpRequest";
import { ValidationError } from "../../core/errors/validationError";
import type { GoogleGeminiV1Config } from "./configSchema";
import { GoogleGeminiV1RequestSchema } from "./requestSchema";

/**
 * Convert unified ContentPart to Gemini content part format
 */
function convertContentPart(part: ContentPart): unknown {
  switch (part.type) {
    case "text": {
      return {
        text: part.text,
      };
    }
    case "image": {
      return {
        inline_data: {
          mime_type: part.mimeType,
          data: part.data,
        },
      };
    }
    case "document": {
      return {
        inline_data: {
          mime_type: part.mimeType,
          data: part.data,
        },
      };
    }
    case "code": {
      // Treat code content as text for Gemini
      return {
        text: part.text,
      };
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
 * Convert unified Message format to Gemini content format
 */
function convertMessage(message: Message): unknown {
  // Map role from unified format to Gemini format
  let geminiRole: "user" | "model";
  switch (message.role) {
    case "user":
      geminiRole = "user";
      break;
    case "assistant":
      geminiRole = "model";
      break;
    case "system":
      // System messages will be handled separately and merged into user messages
      geminiRole = "user";
      break;
    default: {
      const unknownRole = message.role as string;
      throw new ValidationError(`Unsupported message role: ${unknownRole}`, {
        role: unknownRole,
      });
    }
  }

  // Convert content parts
  const parts = message.content.map(convertContentPart);

  return {
    role: geminiRole,
    parts,
  };
}

/**
 * Extract system messages and merge them into user messages.
 * Gemini doesn't support system role, so we merge system content into the first user message.
 */
function extractAndMergeSystemMessages(messages: Message[]): Message[] {
  const systemMessages = messages.filter((msg) => msg.role === "system");
  const nonSystemMessages = messages.filter((msg) => msg.role !== "system");

  if (systemMessages.length === 0) {
    return nonSystemMessages;
  }

  // Combine all system message content
  const systemContent = systemMessages.flatMap((msg) => msg.content);

  // Find first user message to merge system content into
  const firstUserIndex = nonSystemMessages.findIndex(
    (msg) => msg.role === "user",
  );

  if (firstUserIndex === -1) {
    // No user messages, create one with system content
    return [
      {
        role: "user" as const,
        content: systemContent,
      },
      ...nonSystemMessages,
    ];
  }

  // Merge system content into first user message
  const updatedMessages = [...nonSystemMessages];
  updatedMessages[firstUserIndex] = {
    ...updatedMessages[firstUserIndex],
    content: [...systemContent, ...updatedMessages[firstUserIndex].content],
  };

  return updatedMessages;
}

/**
 * Build Gemini request body from unified request
 */
function buildGeminiRequestBody(
  request: ChatRequest & { stream?: boolean },
): Record<string, unknown> {
  // Extract and merge system messages
  const processedMessages = extractAndMergeSystemMessages(request.messages);

  if (processedMessages.length === 0) {
    throw new ValidationError("At least one message is required", {
      messageCount: processedMessages.length,
    });
  }

  // Convert messages to Gemini contents format
  const contents = processedMessages.map(convertMessage);

  const geminiRequest: Record<string, unknown> = {
    contents,
  };

  // Add generation config if parameters are provided
  if (
    request.temperature !== undefined ||
    request.maxTokens !== undefined ||
    request.options?.topK !== undefined ||
    request.options?.topP !== undefined ||
    request.options?.stopSequences !== undefined
  ) {
    const generationConfig: Record<string, unknown> = {};

    if (request.temperature !== undefined) {
      generationConfig.temperature = request.temperature;
    }
    if (request.maxTokens !== undefined) {
      generationConfig.maxOutputTokens = request.maxTokens;
    }
    if (request.options?.topK !== undefined) {
      generationConfig.topK = request.options.topK;
    }
    if (request.options?.topP !== undefined) {
      generationConfig.topP = request.options.topP;
    }
    if (request.options?.stopSequences !== undefined) {
      generationConfig.stopSequences = request.options.stopSequences;
    }

    geminiRequest.generationConfig = generationConfig;
  }

  // Tools will be handled by separate tool translator when implemented
  // For now, leave empty if tools are provided
  if (
    request.tools &&
    Array.isArray(request.tools) &&
    request.tools.length > 0
  ) {
    // TODO: Implement tool translation when tool translator is available
    // geminiRequest.tools = translateToolsForGemini(request.tools);
  }

  return geminiRequest;
}

/**
 * Build headers for Gemini API request
 */
function buildHeaders(config: GoogleGeminiV1Config): Record<string, string> {
  const headers: Record<string, string> = {
    "x-goog-api-key": config.apiKey,
    "Content-Type": "application/json",
  };

  return headers;
}

/**
 * Build endpoint URL for Gemini API request
 */
function buildEndpointUrl(
  config: GoogleGeminiV1Config,
  request: ChatRequest & { stream?: boolean },
): string {
  const baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
  const endpoint = request.stream
    ? `:streamGenerateContent`
    : `:generateContent`;

  return `${baseUrl}/models/${request.model}${endpoint}`;
}

/**
 * Translate unified ChatRequest to Google Gemini API v1 format
 *
 * @param request - Unified chat request with optional stream parameter
 * @param config - Google Gemini provider configuration
 * @returns HTTP request for Google Gemini API v1
 * @throws {ValidationError} When request or config is invalid
 */
export function translateChatRequest(
  request: ChatRequest & { stream?: boolean },
  config: GoogleGeminiV1Config,
  _modelCapabilities?: { temperature?: boolean },
): ProviderHttpRequest {
  try {
    // Validate input
    if (!request.messages || request.messages.length === 0) {
      throw new ValidationError("At least one message is required", {
        messageCount: request.messages?.length ?? 0,
      });
    }

    // Build and validate the request body
    const geminiRequest = buildGeminiRequestBody(request);
    const validatedRequest = GoogleGeminiV1RequestSchema.parse(geminiRequest);

    // Build headers
    const headers = buildHeaders(config);

    // Construct the URL
    const url = buildEndpointUrl(config, request);

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
    throw new ValidationError("Failed to translate request to Gemini format", {
      originalError: error,
    });
  }
}
