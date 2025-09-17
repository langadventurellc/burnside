/**
 * Anthropic Messages API Streaming Parser
 *
 * Converts Anthropic Messages API v2023-06-01 SSE streaming responses to
 * unified StreamDelta format. Leverages the core SseParser infrastructure
 * for robust SSE event parsing and handles all Anthropic streaming event types.
 *
 * @example Basic streaming parsing
 * ```typescript
 * for await (const delta of parseAnthropicResponseStream(response)) {
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
import { AnthropicStreamingResponseSchema } from "./responseSchema";

type AnthropicStreamingEvent = z.infer<typeof AnthropicStreamingResponseSchema>;

/**
 * Internal state for tracking streaming response
 */
interface StreamingState {
  messageId?: string;
  contentBlocks: Array<{
    type: string;
    id?: string;
    name?: string;
    accumulatedInput?: string;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
}

/**
 * Parses Anthropic Messages API streaming response into StreamDelta format
 *
 * @param response - HTTP response containing SSE stream
 * @returns Async iterable of StreamDelta objects
 * @throws {StreamingError} When SSE parsing fails
 * @throws {ValidationError} When event validation fails
 * @throws {BridgeError} When Anthropic error events are received
 */
export async function* parseAnthropicResponseStream(
  response: ProviderHttpResponse,
): AsyncIterable<StreamDelta> {
  if (!response.body) {
    throw new ValidationError("Response body is null", {
      response: { status: response.status, headers: response.headers },
    });
  }

  const state: StreamingState = {
    contentBlocks: [],
  };

  try {
    const chunks = convertToUint8ArrayIterable(response.body);
    yield* processSSEEvents(chunks, state);
  } catch (error) {
    // Re-throw BridgeErrors (like error events) without wrapping
    if (error instanceof BridgeError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new StreamingError(`Anthropic streaming failed: ${errorMessage}`, {
      responseStatus: response.status,
      state,
    });
  }
}

/**
 * Processes SSE events from chunks and yields StreamDeltas
 */
async function* processSSEEvents(
  chunks: AsyncIterable<Uint8Array>,
  state: StreamingState,
): AsyncIterable<StreamDelta> {
  for await (const sseEvent of SseParser.parse(chunks)) {
    const shouldStop = handleSpecialEvents(sseEvent);
    if (shouldStop) {
      break; // Stop processing on [DONE] sentinel
    }

    // Skip events without data
    if (!sseEvent.data) {
      continue;
    }

    const delta = processSingleEvent(sseEvent, state);
    if (delta) {
      yield delta;
    }
  }
}

/**
 * Handles special SSE events like errors and termination
 */
function handleSpecialEvents(sseEvent: {
  event?: string;
  data?: string;
}): boolean {
  // Handle error events
  if (sseEvent.event === "error") {
    const rawErrorData: unknown = JSON.parse(sseEvent.data || "{}");
    if (typeof rawErrorData === "object" && rawErrorData !== null) {
      const errorData = rawErrorData as Record<string, unknown>;
      const error = errorData.error as Record<string, unknown> | undefined;
      const message =
        typeof error?.message === "string" ? error.message : "Unknown error";
      const type =
        typeof error?.type === "string" ? error.type : "PROVIDER_ERROR";
      throw new BridgeError(`Anthropic streaming error: ${message}`, type, {
        originalError: error,
      });
    }
    throw new BridgeError(
      "Anthropic streaming error: Invalid error format",
      "PROVIDER_ERROR",
    );
  }

  // Handle [DONE] sentinel
  if (sseEvent.data === "[DONE]") {
    return true; // Signal termination
  }

  return false; // Continue processing
}

/**
 * Processes a single SSE event and returns StreamDelta
 */
function processSingleEvent(
  sseEvent: { data?: string },
  state: StreamingState,
): StreamDelta | null {
  try {
    const eventData: unknown = JSON.parse(sseEvent.data || "{}");
    const validatedEvent = AnthropicStreamingResponseSchema.parse(eventData);
    return processStreamingEvent(validatedEvent, state);
  } catch (parseError) {
    // Re-throw BridgeErrors (like error events) instead of logging them
    if (parseError instanceof BridgeError) {
      throw parseError;
    }
    // Skip malformed events but continue streaming
    if (process.env.DEBUG_STREAMING) {
      console.warn(
        "Skipped malformed Anthropic streaming event:",
        sseEvent.data,
        parseError,
      );
    }
    return null;
  }
}

/**
 * Converts ReadableStream to AsyncIterable<Uint8Array> for SseParser.
 * Supports multiple body types following OpenAI pattern.
 */
async function* convertToUint8ArrayIterable(
  body: string | ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
): AsyncIterable<Uint8Array> {
  if (typeof body === "string") {
    yield new TextEncoder().encode(body);
    return;
  }

  if (body[Symbol.asyncIterator]) {
    yield* body as AsyncIterable<Uint8Array>;
    return;
  }

  // Handle ReadableStream
  const reader = (body as ReadableStream<Uint8Array>).getReader();
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
 * Processes a single Anthropic streaming event and converts to StreamDelta
 */
function processStreamingEvent(
  event: AnthropicStreamingEvent,
  state: StreamingState,
): StreamDelta | null {
  switch (event.type) {
    case "message_start":
      return handleMessageStart(event, state);

    case "content_block_start":
      return handleContentBlockStart(event, state);

    case "content_block_delta":
      return handleContentBlockDelta(event, state);

    case "content_block_stop":
      return handleContentBlockStop(event, state);

    case "message_delta":
      return handleMessageDelta(event, state);

    case "message_stop":
      return handleMessageStop(event, state);

    default:
      // Skip unknown event types silently
      return null;
  }
}

/**
 * Handles message_start events - initializes streaming with metadata
 */
function handleMessageStart(
  event: AnthropicStreamingEvent,
  state: StreamingState,
): StreamDelta {
  const messageId = event.message?.id || generateId();
  state.messageId = messageId;

  return {
    id: messageId,
    delta: {
      role: "assistant",
    },
    finished: false,
    metadata: {
      provider: "anthropic",
      eventType: "message_start",
      model: event.message?.model,
    },
  };
}

/**
 * Handles content_block_start events - initializes content blocks
 */
function handleContentBlockStart(
  event: AnthropicStreamingEvent,
  state: StreamingState,
): StreamDelta | null {
  const blockIndex = event.index ?? state.contentBlocks.length;

  // Ensure we have space for this block
  while (state.contentBlocks.length <= blockIndex) {
    state.contentBlocks.push({ type: "unknown" });
  }

  if (event.content_block) {
    state.contentBlocks[blockIndex] = {
      type: event.content_block.type || "unknown",
      id: event.content_block.id,
      name: event.content_block.name,
    };
  }

  const messageId = state.messageId || generateId();

  return {
    id: messageId,
    delta: {},
    finished: false,
    metadata: {
      provider: "anthropic",
      eventType: "content_block_start",
      blockIndex,
      blockType: event.content_block?.type,
    },
  };
}

/**
 * Handles content_block_delta events - processes incremental content
 */
function handleContentBlockDelta(
  event: AnthropicStreamingEvent,
  state: StreamingState,
): StreamDelta | null {
  const blockIndex = event.index ?? 0;
  const messageId = state.messageId || generateId();

  // Text delta
  if (event.delta?.text) {
    return {
      id: messageId,
      delta: {
        role: "assistant",
        content: [{ type: "text", text: event.delta.text }],
      },
      finished: false,
      metadata: {
        provider: "anthropic",
        eventType: "content_block_delta",
        deltaType: "text",
        blockIndex,
      },
    };
  }

  // Tool call input delta
  if (event.delta?.input) {
    // Ensure we have space for this block
    while (state.contentBlocks.length <= blockIndex) {
      state.contentBlocks.push({ type: "unknown" });
    }

    const block = state.contentBlocks[blockIndex];

    // Accumulate partial JSON input
    const inputText =
      typeof event.delta.input === "string"
        ? event.delta.input
        : JSON.stringify(event.delta.input);

    block.accumulatedInput = (block.accumulatedInput || "") + inputText;

    // Create tool call delta if we have the necessary info
    if (block.type === "tool_use" && block.id && block.name) {
      return {
        id: messageId,
        delta: {
          role: "assistant",
          metadata: {
            tool_calls: [
              {
                id: block.id,
                type: "function",
                function: {
                  name: block.name,
                  arguments: block.accumulatedInput,
                },
              },
            ],
          },
        },
        finished: false,
        metadata: {
          provider: "anthropic",
          eventType: "content_block_delta",
          deltaType: "tool_use",
          blockIndex,
        },
      };
    }
  }

  return null;
}

/**
 * Handles content_block_stop events - finalizes content blocks
 */
function handleContentBlockStop(
  event: AnthropicStreamingEvent,
  state: StreamingState,
): StreamDelta | null {
  const messageId = state.messageId || generateId();
  const blockIndex = event.index ?? 0;

  return {
    id: messageId,
    delta: {},
    finished: false,
    metadata: {
      provider: "anthropic",
      eventType: "content_block_stop",
      blockIndex,
    },
  };
}

/**
 * Handles message_delta events - processes message-level updates
 */
function handleMessageDelta(
  event: AnthropicStreamingEvent,
  state: StreamingState,
): StreamDelta | null {
  const messageId = state.messageId || generateId();

  return {
    id: messageId,
    delta: {},
    finished: false,
    metadata: {
      provider: "anthropic",
      eventType: "message_delta",
      stopReason: event.delta?.stop_reason,
      stopSequence: event.delta?.stop_sequence,
    },
  };
}

/**
 * Handles message_stop events - signals stream completion
 */
function handleMessageStop(
  event: AnthropicStreamingEvent,
  state: StreamingState,
): StreamDelta {
  const messageId = state.messageId || generateId();

  return {
    id: messageId,
    delta: {},
    finished: true,
    usage: state.usage,
    metadata: {
      provider: "anthropic",
      eventType: "message_stop",
      finished: true,
    },
  };
}

/**
 * Generates a unique ID for stream deltas
 */
function generateId(): string {
  return `anthropic-stream-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
