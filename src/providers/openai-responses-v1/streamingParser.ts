/**
 * OpenAI Responses v1 Streaming Parser
 *
 * Converts OpenAI Responses API v1 semantic SSE events to unified StreamDelta format.
 * Leverages the existing SseParser infrastructure for robust event parsing and
 * handles all required OpenAI semantic event types.
 *
 * @example Basic streaming parsing
 * ```typescript
 * for await (const delta of parseOpenAIResponseStream(response)) {
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

/**
 * Zod schemas for OpenAI semantic event validation
 */
const baseEventSchema = z.object({
  type: z.string(),
});

const responseCreatedEventSchema = baseEventSchema.extend({
  type: z.literal("response.created"),
  response: z
    .object({
      id: z.string(),
    })
    .optional(),
});

const outputTextDeltaEventSchema = baseEventSchema.extend({
  type: z.literal("response.output_text.delta"),
  delta: z.string().optional(), // Real OpenAI API format: direct string
  item_id: z.string().optional(),
  output_index: z.number().optional(),
  content_index: z.number().optional(),
  sequence_number: z.number().optional(),
  response: z
    .object({
      id: z.string(),
    })
    .optional(),
});

const responseCompletedEventSchema = baseEventSchema.extend({
  type: z.literal("response.completed"),
  response: z
    .object({
      id: z.string(),
    })
    .optional(),
  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
      total_tokens: z.number().optional(),
    })
    .optional(),
});

const errorEventSchema = baseEventSchema.extend({
  type: z.literal("error"),
  error: z.object({
    message: z.string(),
    type: z.string().optional(),
    code: z.string().optional(),
  }),
});

const openAIEventSchema = z.union([
  responseCreatedEventSchema,
  outputTextDeltaEventSchema,
  responseCompletedEventSchema,
  errorEventSchema,
]);

type OpenAIEvent = z.infer<typeof openAIEventSchema>;

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
}

/**
 * Parses OpenAI Responses API v1 streaming response into StreamDelta format
 *
 * @param response - HTTP response containing SSE stream
 * @returns Async iterable of StreamDelta objects
 * @throws {StreamingError} When SSE parsing fails
 * @throws {ValidationError} When event validation fails
 * @throws {BridgeError} When OpenAI error events are received
 */
// eslint-disable-next-line statement-count/function-statement-count-warn, statement-count/function-statement-count-error
export async function* parseOpenAIResponseStream(
  response: ProviderHttpResponse,
): AsyncIterable<StreamDelta> {
  if (!response.body) {
    throw new ValidationError("Response body is null", {
      response: { status: response.status, headers: response.headers },
    });
  }

  console.error("=== STREAMING RESPONSE DEBUG ===");
  console.error("Response status:", response.status);
  console.error("Response headers:", response.headers);
  console.error("================================");

  // For non-200 status, try to read the error response body
  if (response.status !== 200) {
    try {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const errorBody = new TextDecoder().decode(combined);
      console.error("=== ERROR RESPONSE BODY ===");
      console.error(errorBody);
      console.error("===========================");
    } catch (e) {
      console.error("Failed to read error response body:", e);
    }
  }

  const state: StreamingState = {};

  try {
    const chunks = convertToUint8ArrayIterable(response.body);

    let eventCount = 0;
    for await (const sseEvent of SseParser.parse(chunks)) {
      eventCount++;
      if (eventCount <= 5) {
        console.error(`=== SSE EVENT ${eventCount} ===`);
        console.error("Event data:", sseEvent.data);
        console.error("=========================");
      }

      // Skip events without data
      if (!sseEvent.data) {
        continue;
      }

      // Handle completion sentinel
      if (sseEvent.data === "[DONE]") {
        break;
      }

      try {
        const eventData: unknown = JSON.parse(sseEvent.data);

        // Check for error responses that might not match our schema
        if (typeof eventData === "object" && eventData !== null) {
          const obj = eventData as Record<string, unknown>;

          // Handle error responses that don't match expected format
          if (
            "error" in obj &&
            typeof obj.error === "object" &&
            obj.error !== null
          ) {
            const error = obj.error as Record<string, unknown>;
            const message =
              typeof error.message === "string"
                ? error.message
                : "Unknown error";
            const code =
              typeof error.code === "string" ? error.code : "PROVIDER_ERROR";
            throw new BridgeError(`OpenAI API error: ${message}`, code, {
              originalError: obj.error,
            });
          }
        }

        const parsedEvent = parseOpenAIEvent(eventData);

        if (parsedEvent) {
          const streamDelta = convertEventToStreamDelta(parsedEvent, state);
          if (streamDelta) {
            yield streamDelta;
          }
        }
      } catch (parseError) {
        // Re-throw BridgeErrors (like error events) instead of logging them
        if (parseError instanceof BridgeError) {
          throw parseError;
        }
        // Skip malformed events silently unless debugging
        if (process.env.DEBUG_STREAMING) {
          console.warn(
            "Failed to parse OpenAI SSE event:",
            sseEvent.data,
            parseError,
          );
        }
      }
    }
  } catch (error) {
    // Re-throw BridgeErrors (like error events) without wrapping
    if (error instanceof BridgeError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new StreamingError(`OpenAI streaming failed: ${errorMessage}`, {
      responseStatus: response.status,
      state,
    });
  }
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
 * Parses and validates OpenAI event data
 */
function parseOpenAIEvent(eventData: unknown): OpenAIEvent | null {
  try {
    return openAIEventSchema.parse(eventData);
  } catch {
    // Skip unknown event types silently to reduce log noise
    // Only log in debug mode if needed for troubleshooting
    return null;
  }
}

/**
 * Converts OpenAI semantic event to StreamDelta format
 */
function convertEventToStreamDelta(
  event: OpenAIEvent,
  state: StreamingState,
): StreamDelta | null {
  switch (event.type) {
    case "response.created":
      return handleResponseCreated(event, state);

    case "response.output_text.delta":
      return handleOutputTextDelta(event, state);

    case "response.completed":
      return handleResponseCompleted(event, state);

    case "error":
      handleErrorEvent(event);
      return null; // Will throw, so this won't be reached

    default:
      // This case should never be reached due to union type, but included for completeness
      console.warn("Unhandled OpenAI event type:", event);
      return null;
  }
}

/**
 * Handles response.created events - initializes streaming
 */
function handleResponseCreated(
  event: z.infer<typeof responseCreatedEventSchema>,
  state: StreamingState,
): StreamDelta {
  const responseId = event.response?.id || generateId();
  state.responseId = responseId;

  return {
    id: responseId,
    delta: {},
    finished: false,
    metadata: { eventType: "response.created" },
  };
}

/**
 * Handles response.output_text.delta events - provides incremental content
 */
function handleOutputTextDelta(
  event: z.infer<typeof outputTextDeltaEventSchema>,
  state: StreamingState,
): StreamDelta {
  const responseId = event.response?.id || state.responseId || generateId();
  state.responseId = responseId;

  const text = event.delta || "";

  return {
    id: responseId,
    delta: {
      role: "assistant",
      content: [{ type: "text", text }],
    },
    finished: false,
    metadata: { eventType: "response.output_text.delta" },
  };
}

/**
 * Handles response.completed events - signals stream termination
 */
function handleResponseCompleted(
  event: z.infer<typeof responseCompletedEventSchema>,
  state: StreamingState,
): StreamDelta {
  const responseId = event.response?.id || state.responseId || generateId();

  // Accumulate usage if provided
  if (event.usage) {
    state.accumulatedUsage = {
      promptTokens: event.usage.prompt_tokens || 0,
      completionTokens: event.usage.completion_tokens || 0,
      totalTokens: event.usage.total_tokens,
    };
  }

  return {
    id: responseId,
    delta: {},
    finished: true,
    usage: state.accumulatedUsage,
    metadata: { eventType: "response.completed" },
  };
}

/**
 * Handles error events - throws appropriate BridgeError
 */
function handleErrorEvent(event: z.infer<typeof errorEventSchema>): never {
  const errorMessage = event.error.message;
  const errorType = event.error.type || "unknown";
  const errorCode = event.error.code || "PROVIDER_ERROR";

  throw new BridgeError(`OpenAI streaming error: ${errorMessage}`, errorCode, {
    errorType,
    originalError: event.error,
  });
}

/**
 * Generates a unique ID for stream deltas
 */
function generateId(): string {
  return `stream-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
