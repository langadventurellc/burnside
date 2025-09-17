/**
 * Google Gemini v1 Streaming Parser
 *
 * Converts Google Gemini API v1 Server-Sent Events to unified StreamDelta format.
 * Handles SSE and chunked JSON responses from streamGenerateContent endpoint
 * with robust delta accumulation and stream termination detection.
 *
 * @example Basic streaming parsing
 * ```typescript
 * for await (const delta of parseGeminiResponseStream(response)) {
 *   console.log('Delta:', delta.delta);
 *   if (delta.finished) break;
 * }
 * ```
 */

import { z } from "zod";
import { SseParser } from "../../core/streaming/sseParser";
import type { StreamDelta } from "../../client/streamDelta";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import { BridgeError } from "../../core/errors/bridgeError";
import { StreamingError } from "../../core/errors/streamingError";
import { ValidationError } from "../../core/errors/validationError";
import { GoogleGeminiV1StreamingResponseSchema } from "./responseSchema";

/**
 * Type for a candidate from streaming response
 */
type StreamingCandidate = NonNullable<
  z.infer<typeof GoogleGeminiV1StreamingResponseSchema>["candidates"]
>[0];

/**
 * Interface for managing stream state across chunks
 */
interface StreamState {
  responseId: string;
  accumulatedContent: string;
  lastUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
}

/**
 * Parses Google Gemini API v1 streaming response into StreamDelta objects.
 * Handles Server-Sent Events and chunked JSON format with proper error handling.
 *
 * @param response - HTTP response containing SSE stream from Gemini API
 * @returns AsyncIterable of StreamDelta objects for incremental consumption
 * @throws {StreamingError} For stream processing errors
 * @throws {ValidationError} For malformed chunk validation
 */
export async function* parseGeminiResponseStream(
  response: ProviderHttpResponse,
): AsyncIterable<StreamDelta> {
  if (!response.body) {
    throw new StreamingError("Response body is missing for streaming");
  }

  const streamState: StreamState = {
    responseId: `gemini-stream-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    accumulatedContent: "",
  };

  try {
    for await (const event of SseParser.parse(response.body)) {
      const result = processStreamEvent(event, streamState);

      if (result.shouldTerminate) {
        yield result.delta!;
        return;
      }

      if (result.delta) {
        // If this delta has a finish reason, mark it as finished
        if (result.candidate?.finishReason) {
          result.delta.finished = true;
          result.delta.metadata = {
            ...result.delta.metadata,
            finishReason: result.candidate.finishReason,
          };
        }
        yield result.delta;
      }

      // Check if stream is finished
      if (result.candidate?.finishReason) {
        return;
      }
    }

    // Stream ended without explicit termination
    yield createTerminalDelta(streamState);
  } catch (error) {
    if (error instanceof BridgeError) {
      throw error;
    }

    throw new StreamingError(
      `Streaming parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      { error },
    );
  }
}

/**
 * Processes a single SSE event and returns processing result.
 */
function processStreamEvent(
  event: { data?: string; type?: string },
  streamState: StreamState,
): {
  delta?: StreamDelta;
  shouldTerminate: boolean;
  candidate?: StreamingCandidate;
} {
  // Skip empty events or keep-alive messages
  if (!event.data || event.data.trim() === "") {
    return { shouldTerminate: false };
  }

  // Handle stream termination signals
  if (event.data === "[DONE]" || event.type === "done") {
    return { delta: createTerminalDelta(streamState), shouldTerminate: true };
  }

  return parseAndValidateChunk(event.data, streamState);
}

/**
 * Parses and validates a chunk of data from the stream.
 */
function parseAndValidateChunk(
  data: string,
  streamState: StreamState,
): {
  delta?: StreamDelta;
  shouldTerminate: boolean;
  candidate?: StreamingCandidate;
} {
  try {
    // Parse JSON chunk data
    const chunkData: unknown = JSON.parse(data);

    // Validate chunk against Gemini streaming schema
    const validatedChunk =
      GoogleGeminiV1StreamingResponseSchema.parse(chunkData);

    // Process the validated chunk
    const delta = processGeminiChunk(validatedChunk, streamState);

    // Return the delta, and handle termination separately
    const candidate = validatedChunk.candidates?.[0];
    return {
      delta: delta || undefined,
      shouldTerminate: false,
      candidate: candidate,
    };
  } catch (parseError) {
    if (parseError instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid Gemini streaming chunk format: ${parseError.message}`,
        { chunk: data, validationErrors: parseError.errors },
      );
    }

    if (parseError instanceof SyntaxError) {
      throw new StreamingError(
        `Malformed JSON in streaming chunk: ${parseError.message}`,
        { chunk: data },
      );
    }

    throw parseError;
  }
}

/**
 * Processes a validated Gemini streaming chunk into a StreamDelta.
 *
 * @param chunk - Validated streaming response chunk
 * @param streamState - Mutable stream state for accumulation
 * @returns StreamDelta object or null if no meaningful content
 */
function processGeminiChunk(
  chunk: z.infer<typeof GoogleGeminiV1StreamingResponseSchema>,
  streamState: StreamState,
): StreamDelta | null {
  const candidate = chunk.candidates?.[0];

  if (!candidate) {
    return null;
  }

  // Extract text content from the first text part
  const textPart = candidate.content?.parts?.find(
    (part) => "text" in part && part.text,
  );
  const deltaText = textPart && "text" in textPart ? textPart.text : "";

  // Accumulate content for consistency
  if (deltaText) {
    streamState.accumulatedContent += deltaText;
  }

  // Extract usage metadata if present
  let usage:
    | { promptTokens: number; completionTokens: number; totalTokens?: number }
    | undefined;
  if (
    chunk.usageMetadata &&
    typeof chunk.usageMetadata.promptTokenCount === "number" &&
    typeof chunk.usageMetadata.candidatesTokenCount === "number"
  ) {
    usage = {
      promptTokens: chunk.usageMetadata.promptTokenCount,
      completionTokens: chunk.usageMetadata.candidatesTokenCount,
      totalTokens: chunk.usageMetadata.totalTokenCount,
    };
    streamState.lastUsage = usage;
  }

  // Handle function calls if present
  const functionCallPart = candidate.content?.parts?.find(
    (part) => "functionCall" in part,
  );
  const metadata: Record<string, unknown> = {};

  if (functionCallPart && "functionCall" in functionCallPart) {
    const fc = functionCallPart.functionCall;
    // Store tool calls in metadata following OpenAI format
    metadata.tool_calls = [
      {
        id: `call-${Date.now()}`, // Gemini doesn't provide call IDs
        type: "function",
        function: {
          name: fc.name,
          arguments: JSON.stringify(fc.args || {}),
        },
      },
    ];
  }

  // Add safety ratings and finish reason to metadata
  if (candidate.safetyRatings) {
    metadata.safetyRatings = candidate.safetyRatings;
  }
  if (candidate.finishReason) {
    metadata.finishReason = candidate.finishReason;
  }

  // Build delta message
  const delta: StreamDelta = {
    id: streamState.responseId,
    delta: {
      role: "assistant" as const,
      content: deltaText ? [{ type: "text" as const, text: deltaText }] : [],
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    },
    finished: false,
    usage: usage || streamState.lastUsage,
  };

  return delta;
}

/**
 * Creates a terminal StreamDelta to indicate stream completion.
 *
 * @param streamState - Current stream state with accumulated data
 * @param finishReason - Optional finish reason for completion context
 * @returns Terminal StreamDelta with finished: true
 */
function createTerminalDelta(
  streamState: StreamState,
  finishReason?: string,
): StreamDelta {
  return {
    id: streamState.responseId,
    delta: {
      role: "assistant" as const,
      content: [], // No additional content in terminal delta
    },
    finished: true,
    usage: streamState.lastUsage,
    metadata: finishReason ? { finishReason } : undefined,
  };
}
