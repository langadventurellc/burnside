/**
 * xAI v1 Streaming Parser
 *
 * Converts xAI API v1 Server-Sent Events to unified StreamDelta format.
 * Handles real-time content streaming, tool calls, and stream termination detection.
 * Follows OpenAI SSE format but with xAI-specific chunk structure.
 *
 * @example Basic streaming parsing
 * ```typescript
 * for await (const delta of parseXAIV1ResponseStream(response)) {
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
import { XAIV1StreamingResponseSchema } from "./streamingResponseSchema";

/**
 * Internal state for tracking streaming response
 */
interface StreamingState {
  responseId?: string;
  accumulatedUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  toolCalls?: Map<string, { name?: string; arguments?: string }>;
}

/**
 * Parses xAI API v1 streaming response into StreamDelta format
 *
 * @param response - HTTP response containing SSE stream
 * @returns Async iterable of StreamDelta objects
 * @throws {StreamingError} When SSE parsing fails
 * @throws {ValidationError} When event validation fails
 * @throws {BridgeError} When xAI error events are received
 */
export async function* parseXAIV1ResponseStream(
  response: ProviderHttpResponse,
): AsyncIterable<StreamDelta> {
  validateResponseBody(response);

  handleNon200Response(response);

  const state: StreamingState = {
    toolCalls: new Map(),
  };

  try {
    const chunks = convertToUint8ArrayIterable(response.body!);
    yield* processSSEStream(chunks, state);
  } catch (error) {
    handleStreamingError(error, response.status, state);
  }
}

/**
 * Validates that response has a readable body
 */
function validateResponseBody(response: ProviderHttpResponse): void {
  if (!response.body) {
    throw new ValidationError("Response body is null", {
      response: { status: response.status, headers: response.headers },
    });
  }
}

/**
 * Handles non-200 responses by logging status
 */
function handleNon200Response(response: ProviderHttpResponse): void {
  if (response.status !== 200) {
    console.error(`Non-200 response status: ${response.status}`);
  }
}

/**
 * Processes the SSE stream and yields StreamDelta objects
 */
async function* processSSEStream(
  chunks: AsyncIterable<Uint8Array>,
  state: StreamingState,
): AsyncIterable<StreamDelta> {
  for await (const sseEvent of SseParser.parse(chunks)) {
    // Skip events without data
    if (!sseEvent.data) {
      continue;
    }

    // Handle completion sentinel
    if (sseEvent.data === "[DONE]") {
      break;
    }

    const streamDelta = processSingleEvent(sseEvent.data, state);
    if (streamDelta) {
      yield streamDelta;
    }
  }
}

/**
 * Processes a single SSE event and returns StreamDelta if successful
 */
function processSingleEvent(
  eventData: string,
  state: StreamingState,
): StreamDelta | null {
  try {
    const parsedData: unknown = JSON.parse(eventData);
    handleErrorResponse(parsedData);

    const parsedChunk = parseXAIEvent(parsedData);
    if (parsedChunk) {
      return convertEventToStreamDelta(parsedChunk, state);
    }
    return null;
  } catch (parseError) {
    // Re-throw BridgeErrors (like error events) instead of logging them
    if (parseError instanceof BridgeError) {
      throw parseError;
    }
    // Skip malformed events silently unless debugging
    if (process.env.DEBUG_STREAMING) {
      console.warn("Failed to parse xAI SSE event:", eventData, parseError);
    }
    return null;
  }
}

/**
 * Handles error responses in event data
 */
function handleErrorResponse(eventData: unknown): void {
  if (typeof eventData === "object" && eventData !== null) {
    const obj = eventData as Record<string, unknown>;

    // Handle error responses that don't match expected format
    if ("error" in obj && typeof obj.error === "object" && obj.error !== null) {
      const error = obj.error as Record<string, unknown>;
      const message =
        typeof error.message === "string" ? error.message : "Unknown error";
      const code =
        typeof error.code === "string" ? error.code : "PROVIDER_ERROR";
      throw new BridgeError(`xAI API error: ${message}`, code, {
        originalError: obj.error,
      });
    }
  }
}

/**
 * Handles streaming errors with proper wrapping
 */
function handleStreamingError(
  error: unknown,
  responseStatus: number,
  state: StreamingState,
): never {
  // Re-throw BridgeErrors (like error events) without wrapping
  if (error instanceof BridgeError) {
    throw error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new StreamingError(`xAI streaming failed: ${errorMessage}`, {
    responseStatus,
    state,
  });
}

/**
 * Converts ReadableStream to AsyncIterable<Uint8Array> for SseParser
 */
async function* convertToUint8ArrayIterable(
  stream: ReadableStream<Uint8Array>,
): AsyncIterable<Uint8Array> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parses and validates xAI streaming event data
 */
function parseXAIEvent(eventData: unknown) {
  try {
    return XAIV1StreamingResponseSchema.parse(eventData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Skip invalid events silently unless debugging
      if (process.env.DEBUG_STREAMING) {
        console.warn("Invalid xAI streaming event format:", error.message);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Converts xAI streaming chunk to unified StreamDelta format
 */
function convertEventToStreamDelta(
  chunk: z.infer<typeof XAIV1StreamingResponseSchema>,
  state: StreamingState,
): StreamDelta | null {
  // Set response ID from first chunk
  if (!state.responseId && chunk.id) {
    state.responseId = chunk.id;
  }

  // Extract content from xAI format: output[0].delta.content[0].text
  const output = chunk.output?.[0];
  if (!output) {
    return null;
  }

  const delta = output.delta;
  let content: Array<{ type: "text"; text: string }> | undefined;

  // Handle content streaming
  if (delta.content?.[0]?.text) {
    content = [
      {
        type: "text",
        text: delta.content[0].text,
      },
    ];
  }

  // Handle tool calls streaming - accumulate in state for metadata
  let accumulatedToolCalls:
    | Array<{ id: string; function: { name: string; arguments: string } }>
    | undefined;
  if (delta.tool_calls?.length) {
    accumulatedToolCalls = [];
    for (const toolCall of delta.tool_calls) {
      // Accumulate streaming tool calls
      const existing = state.toolCalls?.get(toolCall.id) || {};
      const accumulated = {
        name: existing.name || toolCall.function.name,
        arguments:
          (existing.arguments || "") + (toolCall.function.arguments || ""),
      };
      state.toolCalls?.set(toolCall.id, accumulated);

      // Include current state in metadata format
      accumulatedToolCalls.push({
        id: toolCall.id,
        function: {
          name: accumulated.name || "",
          arguments: accumulated.arguments || "",
        },
      });
    }
  }

  // Handle usage information from xAI format
  let usage: StreamDelta["usage"] | undefined;
  if (chunk.usage) {
    usage = {
      promptTokens: chunk.usage.input_tokens,
      completionTokens: chunk.usage.output_tokens,
      totalTokens: chunk.usage.total_tokens,
    };
    state.accumulatedUsage = usage;
  }

  // Determine if this is the final chunk (has usage info typically)
  const finished = Boolean(chunk.usage);

  return {
    id: state.responseId || chunk.id,
    delta: {
      role: delta.role || "assistant",
      content,
    },
    finished,
    usage: usage || state.accumulatedUsage,
    metadata: {
      provider: "xai",
      model: chunk.model,
      created_at: chunk.created_at,
      status: chunk.status,
      tool_calls: accumulatedToolCalls,
    },
  };
}
