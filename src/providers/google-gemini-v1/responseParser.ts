/**
 * Google Gemini v1 Response Parser
 *
 * Converts Google Gemini API v1 non-streaming responses to unified LLM Bridge format.
 * Handles content extraction, citation processing, function call parsing, and usage metadata.
 *
 * @example
 * ```typescript
 * import { parseGeminiResponse } from "./responseParser";
 *
 * const result = await parseGeminiResponse(httpResponse);
 * // Result contains: { message, usage, model, metadata }
 * ```
 */

import type { Message } from "../../core/messages/message";
import type { ContentPart } from "../../core/messages/contentPart";
import type { SourceRef } from "../../core/messages/sourceRef";
import type { ToolCall } from "../../core/tools/toolCall";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import { ValidationError } from "../../core/errors/validationError";
import {
  GoogleGeminiV1ResponseSchema,
  type GoogleGeminiV1Response,
} from "./responseSchema";
import { toolTranslator } from "./toolTranslator";

// Type alias for Gemini candidate to avoid repetitive typing
type GeminiCandidate = NonNullable<GoogleGeminiV1Response["candidates"]>[0];

/**
 * Parse Google Gemini v1 API response to unified format
 *
 * Converts complete (non-streaming) Gemini API responses to the unified Message format
 * with extracted usage metadata, citations, and function calls.
 *
 * @param response - The HTTP response from Gemini API
 * @param responseText - Pre-read response body as text
 * @returns Parsed message with usage metadata and response information
 * @throws ValidationError for malformed responses or parsing failures
 */
export function parseGeminiResponse(
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
  // Check for empty response
  if (!responseText.trim()) {
    throw new ValidationError("Empty response from Gemini API", {
      status: response.status,
      statusText: response.statusText,
    });
  }

  // Parse JSON response
  let responseData: unknown;
  try {
    responseData = JSON.parse(responseText);
  } catch (error: unknown) {
    throw new ValidationError("Failed to parse Gemini API response as JSON", {
      status: response.status,
      statusText: response.statusText,
      responseText: responseText.substring(0, 200), // First 200 chars for debugging
      originalError: error instanceof Error ? error.message : String(error),
    });
  }

  // Validate response structure
  let validatedResponse: GoogleGeminiV1Response;
  try {
    validatedResponse = GoogleGeminiV1ResponseSchema.parse(responseData);
  } catch (error: unknown) {
    throw new ValidationError("Invalid Gemini API response structure", {
      responseData,
      originalError: error instanceof Error ? error.message : String(error),
    });
  }

  // Extract the first candidate (standard practice)
  const candidate = validatedResponse.candidates?.[0];
  if (!candidate) {
    throw new ValidationError("No candidates found in Gemini response", {
      validatedResponse,
    });
  }

  // Extract content parts, citations, and tool calls
  const contentParts = extractContentParts(candidate);
  const sourceRefs = extractSourceRefs(candidate);
  const toolCalls = extractToolCalls(candidate);
  const usage = extractUsageMetadata(validatedResponse);
  const metadata = extractResponseMetadata(validatedResponse);

  // Build unified message
  const message: Message & { toolCalls?: ToolCall[] } = {
    id: `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    role: "assistant",
    content: contentParts,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata,
      provider: "google",
    },
    sources: sourceRefs.length > 0 ? sourceRefs : undefined,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };

  return {
    message,
    usage,
    model: validatedResponse.modelVersion || "gemini-unknown",
    metadata: {
      ...metadata,
      provider: "google",
    },
  };
}

/**
 * Extract content parts from Gemini candidate response
 *
 * Converts Gemini response parts to unified ContentPart format.
 * Handles text content and preserves content structure.
 *
 * @param candidate - Gemini candidate response object
 * @returns Array of unified ContentPart objects
 */
function extractContentParts(candidate: GeminiCandidate): ContentPart[] {
  if (!candidate?.content?.parts) {
    return [];
  }

  const contentParts: ContentPart[] = [];

  for (const part of candidate.content.parts) {
    if ("text" in part) {
      // Text content part
      contentParts.push({
        type: "text",
        text: part.text,
      });
    }
    // Note: Function calls are handled separately in extractToolCalls
    // Multimodal content (images, documents) would be handled here in future
  }

  return contentParts;
}

/**
 * Extract source references from Gemini citation metadata
 *
 * Converts Gemini citation metadata to unified SourceRef format.
 * Maps citation sources with URIs, titles, and metadata preservation.
 *
 * @param candidate - Gemini candidate response object
 * @returns Array of unified SourceRef objects
 */
function extractSourceRefs(candidate: GeminiCandidate): SourceRef[] {
  const citationMetadata = candidate?.citationMetadata;
  if (!citationMetadata?.citationSources) {
    return [];
  }

  const sourceRefs: SourceRef[] = [];

  for (const [index, citation] of citationMetadata.citationSources.entries()) {
    const sourceRef: SourceRef = {
      id: citation.uri
        ? `gemini-citation-${citation.uri.replace(/[^a-zA-Z0-9]/g, "_")}`
        : `gemini-citation-${index}`,
      url: citation.uri,
      title: citation.uri
        ? `Citation from ${citation.uri}`
        : `Citation ${index + 1}`,
      metadata: {
        startIndex: citation.startIndex,
        endIndex: citation.endIndex,
        license: citation.license,
        provider: "google",
      },
    };

    sourceRefs.push(sourceRef);
  }

  return sourceRefs;
}

/**
 * Extract tool calls from Gemini candidate response
 *
 * Converts Gemini function call parts to unified ToolCall format.
 * Uses the tool translator to parse function calls correctly.
 *
 * @param candidate - Gemini candidate response object
 * @returns Array of unified ToolCall objects
 */
function extractToolCalls(candidate: GeminiCandidate): ToolCall[] {
  if (!candidate?.content?.parts) {
    return [];
  }

  const toolCalls: ToolCall[] = [];

  for (const part of candidate.content.parts) {
    if ("functionCall" in part) {
      try {
        // Use the tool translator to parse the function call
        const unifiedCall = toolTranslator.parseFunctionCall(part.functionCall);

        const toolCall: ToolCall = {
          id:
            unifiedCall.id ||
            `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: unifiedCall.name,
          parameters: unifiedCall.arguments,
          metadata: {
            providerId: "google-gemini-v1",
            timestamp: new Date().toISOString(),
          },
        };

        toolCalls.push(toolCall);
      } catch (error) {
        throw new ValidationError("Failed to parse Gemini function call", {
          functionCall: part.functionCall,
          originalError: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return toolCalls;
}

/**
 * Extract usage metadata from Gemini response
 *
 * Converts Gemini usage metadata to unified token usage format.
 * Maps prompt, completion, and total token counts.
 *
 * @param response - Validated Gemini response object
 * @returns Usage metadata object or undefined if not available
 */
function extractUsageMetadata(response: GoogleGeminiV1Response):
  | {
      promptTokens: number;
      completionTokens: number;
      totalTokens?: number;
    }
  | undefined {
  const usageMetadata = response.usageMetadata;
  if (!usageMetadata) {
    return undefined;
  }

  return {
    promptTokens: usageMetadata.promptTokenCount || 0,
    completionTokens: usageMetadata.candidatesTokenCount || 0,
    totalTokens: usageMetadata.totalTokenCount,
  };
}

/**
 * Extract additional response metadata from Gemini response
 *
 * Preserves Gemini-specific metadata for debugging and context.
 * Includes safety ratings, finish reasons, and prompt feedback.
 *
 * @param response - Validated Gemini response object
 * @returns Metadata object with preserved Gemini response information
 */
function extractResponseMetadata(
  response: GoogleGeminiV1Response,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    provider: "google-gemini-v1",
  };

  // Include model version if available
  if (response.modelVersion) {
    metadata.modelVersion = response.modelVersion;
  }

  // Include prompt feedback if available
  if (response.promptFeedback) {
    metadata.promptFeedback = response.promptFeedback;
  }

  // Include candidate metadata from first candidate
  const candidate = response.candidates?.[0];
  if (candidate) {
    if (candidate.finishReason) {
      metadata.finishReason = candidate.finishReason;
    }
    if (candidate.safetyRatings) {
      metadata.safetyRatings = candidate.safetyRatings;
    }
    if (candidate.index !== undefined) {
      metadata.candidateIndex = candidate.index;
    }
  }

  return metadata;
}
