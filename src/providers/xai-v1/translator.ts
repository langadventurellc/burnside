/**
 * xAI v1 Request Translator
 *
 * Converts unified ChatRequest format to xAI Responses API v1 format.
 * xAI uses the OpenAI Responses API format with xAI-specific authentication and models.
 */

import type { ChatRequest } from "../../client/chatRequest";
import type { Message } from "../../core/messages/message";
import type { ContentPart } from "../../core/messages/contentPart";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import { createHttpRequest } from "../../core/providers/createHttpRequest";
import { ValidationError } from "../../core/errors/validationError";
import type { XAIV1Config } from "./configSchema";
import { XAIV1RequestSchema } from "./requestSchema";

/**
 * Convert unified model ID to xAI model name by stripping provider prefix
 *
 * @param unifiedModelId - Unified model ID (e.g., "xai:grok-3")
 * @returns xAI model name (e.g., "grok-3")
 */
function mapModelId(unifiedModelId: string): string {
  // Strip provider prefix: "xai:grok-3" -> "grok-3"
  if (unifiedModelId.startsWith("xai:")) {
    return unifiedModelId.substring(4);
  }
  return unifiedModelId;
}

/**
 * Convert unified ContentPart to xAI message content format
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
      // Convert base64 data to data URL format expected by xAI
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
      // Treat code content as text for xAI
      return {
        type: "text",
        text: part.text,
      };
    }
    case "document": {
      throw new ValidationError(
        "Document content type is not supported by xAI Responses API",
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
 * Convert unified Message format to xAI Responses API message format
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
 * Convert unified tool definitions to xAI function format
 * xAI uses the same tool format as OpenAI
 */
function translateTools(tools: ToolDefinition[]): unknown[] {
  return tools.map((tool) => {
    // Extract JSON Schema from Zod schema or use existing object
    const parametersSchema = extractParametersFromInputSchema(tool.inputSchema);

    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || `Execute ${tool.name} tool`,
        parameters: {
          type: "object",
          properties: parametersSchema.properties || {},
          required: parametersSchema.required || [],
          additionalProperties: false,
        },
      },
    };
  });
}

/**
 * Extract parameters schema from inputSchema (Zod or JSON Schema)
 */
function extractParametersFromInputSchema(inputSchema: unknown): {
  properties?: Record<string, unknown>;
  required?: string[];
} {
  // If it's already a JSON Schema object, extract properties and required
  if (
    inputSchema &&
    typeof inputSchema === "object" &&
    !("_def" in inputSchema)
  ) {
    const jsonSchema = inputSchema as Record<string, unknown>;
    return {
      properties: (jsonSchema.properties as Record<string, unknown>) || {},
      required: (jsonSchema.required as string[]) || [],
    };
  }

  // For Zod schemas, return basic object structure
  // Note: Full Zod-to-JSON conversion would require zodToJsonSchema library
  // For now, we'll use a basic approach since xAI tools follow OpenAI format
  return {
    properties: {},
    required: [],
  };
}

/**
 * Build xAI request body from unified request
 *
 * @param request - The unified chat request
 * @param modelCapabilities - Optional model capabilities to control parameter inclusion
 */
function buildXAIRequestBody(
  request: ChatRequest & { stream?: boolean; tools?: unknown[] },
  modelCapabilities?: { temperature?: boolean },
): Record<string, unknown> {
  const messages = request.messages.map(convertMessage);

  const xaiRequest: Record<string, unknown> = {
    model: mapModelId(request.model),
    input: messages,
  };

  // Add optional parameters
  // Always include stream field, defaulting to false for non-streaming
  xaiRequest.stream = request.stream ?? false;

  if (
    request.temperature !== undefined &&
    modelCapabilities?.temperature !== false
  ) {
    xaiRequest.temperature = request.temperature;
  }
  if (request.maxTokens !== undefined) {
    xaiRequest.max_output_tokens = request.maxTokens;
  }

  // Add tools if provided
  if (
    request.tools &&
    Array.isArray(request.tools) &&
    request.tools.length > 0
  ) {
    try {
      xaiRequest.tools = translateTools(
        request.tools as Parameters<typeof translateTools>[0],
      );
    } catch (error) {
      throw new ValidationError(
        `Failed to translate tools for xAI request: ${error instanceof Error ? error.message : "Unknown error"}`,
        {
          originalError:
            error instanceof Error ? error : new Error(String(error)),
          tools: request.tools,
        },
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
        xaiRequest.max_output_tokens = value;
        continue;
      }

      // Convert camelCase to snake_case for xAI API
      const xaiKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      xaiRequest[xaiKey] = value;
    }
  }

  return xaiRequest;
}

/**
 * Build headers for xAI API request
 */
function buildHeaders(config: XAIV1Config): Record<string, string> {
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
 * Translate unified ChatRequest to xAI Responses API v1 format
 *
 * @param request - Unified chat request with optional stream parameter
 * @param config - xAI provider configuration
 * @returns HTTP request for xAI Responses API v1
 * @throws {ValidationError} When request or config is invalid
 */
export function translateChatRequest(
  request: ChatRequest & { stream?: boolean },
  config: XAIV1Config,
  modelCapabilities?: { temperature?: boolean },
): ProviderHttpRequest {
  try {
    // Build and validate the request body
    const xaiRequest = buildXAIRequestBody(request, modelCapabilities);
    const validatedRequest = XAIV1RequestSchema.parse(xaiRequest);

    // Build headers
    const headers = buildHeaders(config);

    // Construct the URL - Using /responses endpoint for xAI Responses API
    const url = `${config.baseUrl.replace(/\/$/, "")}/responses`;

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
    throw new ValidationError("Failed to translate request to xAI format", {
      originalError: error,
    });
  }
}
