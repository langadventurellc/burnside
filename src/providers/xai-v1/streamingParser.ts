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

import { SseParser } from "../../core/streaming/sseParser";
import type { StreamDelta } from "../../client/streamDelta";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import { BridgeError } from "../../core/errors/bridgeError";
import { StreamingError } from "../../core/errors/streamingError";
import { ValidationError } from "../../core/errors/validationError";

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
    console.error("xAI Stream Parser: Error in processing:", error);
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

    // Handle new xAI event-based streaming format
    const result = convertXAIEventToStreamDelta(parsedData, state);
    return result;
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
 * Converts new xAI event-based streaming format to unified StreamDelta format
 */
function convertXAIEventToStreamDelta(
  eventData: unknown,
  state: StreamingState,
): StreamDelta | null {
  if (typeof eventData !== "object" || eventData === null) {
    return null;
  }

  const event = eventData as Record<string, unknown>;
  const eventType = event.type as string;

  // Handle response.created event to initialize state
  if (eventType === "response.created") {
    const response = event.response as Record<string, unknown>;
    if (response?.id && typeof response.id === "string") {
      state.responseId = response.id;
    }
    return null; // Don't emit delta for creation event
  }

  // Handle response.output_text.delta events (main streaming content)
  if (eventType === "response.output_text.delta") {
    const text = event.delta as string;

    if (typeof text === "string" && text.length > 0) {
      return {
        id: state.responseId || "unknown",
        delta: {
          role: "assistant",
          content: [
            {
              type: "text",
              text,
            },
          ],
        },
        finished: false,
        metadata: {
          provider: "xai",
          eventType,
        },
      };
    }
  }

  // Handle response.completed event (final delta)
  if (eventType === "response.completed") {
    const response = event.response as Record<string, unknown>;
    const usage = response?.usage as Record<string, unknown>;

    let usageInfo: StreamDelta["usage"] | undefined;
    if (usage) {
      usageInfo = {
        promptTokens: (usage.input_tokens as number) || 0,
        completionTokens: (usage.output_tokens as number) || 0,
        totalTokens: (usage.total_tokens as number) || 0,
      };
      state.accumulatedUsage = usageInfo;
    }

    return {
      id: state.responseId || "unknown",
      delta: {
        role: "assistant",
        content: [],
      },
      finished: true,
      usage: usageInfo || state.accumulatedUsage,
      metadata: {
        provider: "xai",
        eventType,
        model: response?.model,
      },
    };
  }

  // Skip other event types (response.in_progress, etc.)
  return null;
}
