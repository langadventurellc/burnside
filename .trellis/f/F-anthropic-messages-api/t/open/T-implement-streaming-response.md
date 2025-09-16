---
id: T-implement-streaming-response
title: Implement streaming response parser with SSE handling
status: open
priority: high
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-api-request
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T13:28:37.804Z
updated: 2025-09-16T13:28:37.804Z
---

# Implement Streaming Response Parser with SSE Handling

Implement the streaming response parser that processes Anthropic's Server-Sent Events (SSE) streaming format, converting deltas to unified Bridge `StreamDelta` objects with proper accumulation and termination detection.

## Context

This task implements streaming response parsing for Anthropic's Messages API. The parser processes SSE events, accumulates deltas, handles tool calls in streaming, and provides proper termination detection using the correct SseParser from the core streaming module.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/streamingParser.ts` and use SseParser from core streaming

**API Documentation**: Anthropic Messages API v2025-05-14 streaming format

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Location

Create `src/providers/anthropic-2025-05-14/streamingParser.ts`

### Core Streaming Functions

1. **Main Streaming Parser**:

   ```typescript
   export async function* parseAnthropicResponseStream(
     response: ProviderHttpResponse,
   ): AsyncIterable<StreamDelta> {
     // Implementation using SseParser from core streaming
   }
   ```

2. **Delta Processing**:

   ```typescript
   function processStreamingEvent(event: SSEEvent): StreamDelta | null {
     // Convert Anthropic streaming events to StreamDelta
   }
   ```

3. **Termination Detection**:

   ```typescript
   export function isAnthropicStreamTerminal(delta: StreamDelta): boolean {
     // Detect stream completion from delta content
   }
   ```

4. **Delta Accumulation Helpers**:
   ```typescript
   function accumulateContentDelta(
     event: AnthropicStreamingEvent,
   ): Partial<StreamDelta> {
     // Process content_block_delta events
   }
   ```

### SSE Integration with SseParser

1. **Correct Import Usage**:

   ```typescript
   import { SseParser } from "../../core/streaming/sseParser.js";
   ```

2. **Uint8Array Conversion Pattern** (follow OpenAI example):

   ```typescript
   // Convert response.body to AsyncIterable<Uint8Array>
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
   ```

3. **SseParser Usage**:
   ```typescript
   const chunks = convertToUint8ArrayIterable(response.body);
   for await (const sseEvent of SseParser.parse(chunks)) {
     if (sseEvent.data === "[DONE]") break;

     const event = JSON.parse(sseEvent.data);
     const delta = processStreamingEvent(event);
     if (delta) yield delta;
   }
   ```

### Streaming Event Processing

1. **Event Type Handling**:
   - `message_start`: Initialize message with metadata
   - `content_block_start`: Start new content block
   - `content_block_delta`: Accumulate text or tool input
   - `content_block_stop`: Complete content block
   - `message_delta`: Update message metadata
   - `message_stop`: Signal stream completion

2. **Delta Construction**:

   ```typescript
   // Text delta example
   {
     type: "content",
     content: [{ type: "text", text: "incremental text" }],
     metadata: {
       provider: "anthropic",
       deltaType: "text",
       blockIndex: 0,
     }
   }

   // Tool call delta example
   {
     type: "tool_calls",
     toolCalls: [{
       id: "tool_call_id",
       name: "function_name",
       arguments: "partial_json",
     }],
     metadata: {
       provider: "anthropic",
       deltaType: "tool_use",
       blockIndex: 1,
     }
   }
   ```

### Technical Approach

```typescript
import type { StreamDelta } from "../../client/streamDelta.js";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse.js";
import { SseParser } from "../../core/streaming/sseParser.js";
import { ProviderError } from "../../core/errors/providerError.js";
import { ValidationError } from "../../core/errors/validationError.js";
import { AnthropicStreamingDelta } from "./responseSchema.js";

export async function* parseAnthropicResponseStream(
  response: ProviderHttpResponse,
): AsyncIterable<StreamDelta> {
  if (!response.body) {
    throw new ProviderError("No response body for streaming");
  }

  try {
    // Convert body to Uint8Array stream using OpenAI pattern
    const chunks = convertToUint8ArrayIterable(response.body);

    // Use SseParser from core streaming
    for await (const sseEvent of SseParser.parse(chunks)) {
      // Handle error events
      if (sseEvent.event === "error") {
        const errorData = JSON.parse(sseEvent.data);
        throw new ProviderError(errorData.error?.message || "Streaming error");
      }

      // Handle [DONE] sentinel
      if (sseEvent.data === "[DONE]") {
        break;
      }

      if (sseEvent.data) {
        try {
          const streamingEvent = JSON.parse(sseEvent.data);
          const validatedEvent = AnthropicStreamingDelta.parse(streamingEvent);

          const delta = processStreamingEvent(validatedEvent);
          if (delta) {
            yield delta;
          }
        } catch (parseError) {
          // Skip malformed events but continue streaming
          console.warn("Skipped malformed streaming event:", parseError);
        }
      }
    }
  } catch (error) {
    throw new ProviderError("Failed to parse streaming response", {
      cause: error,
      context: { provider: "anthropic" },
    });
  }
}

function processStreamingEvent(
  event: AnthropicStreamingEvent,
): StreamDelta | null {
  switch (event.type) {
    case "message_start":
      return {
        type: "metadata",
        metadata: {
          provider: "anthropic",
          messageId: event.message?.id,
          model: event.message?.model,
        },
      };

    case "content_block_delta":
      if (event.delta?.text) {
        return {
          type: "content",
          content: [{ type: "text", text: event.delta.text }],
          metadata: {
            provider: "anthropic",
            deltaType: "text",
            blockIndex: event.index,
          },
        };
      }
      break;

    case "message_stop":
      return {
        type: "done",
        metadata: {
          provider: "anthropic",
          finished: true,
        },
      };

    // Handle other event types...
  }

  return null;
}

export function isAnthropicStreamTerminal(delta: StreamDelta): boolean {
  return (
    delta.type === "done" ||
    (delta.metadata?.provider === "anthropic" &&
      delta.metadata?.finished === true)
  );
}

async function* convertToUint8ArrayIterable(
  body: string | ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
): AsyncIterable<Uint8Array> {
  // Implementation following OpenAI pattern
  // ... (as shown above)
}
```

### Error Handling

1. **SSE Parsing Errors**: Handle malformed SSE streams using SseParser
2. **JSON Parsing Errors**: Skip malformed events but continue streaming
3. **Schema Validation**: Validate streaming events against schema
4. **Network Errors**: Handle connection interruptions gracefully
5. **Event Sequence Errors**: Handle out-of-order or missing events

## Acceptance Criteria

1. **SSE Processing**:
   - ✅ **Uses SseParser from `src/core/streaming/sseParser.ts`**
   - ✅ **Follows OpenAI pattern for Uint8Array conversion**
   - ✅ Handles all Anthropic streaming event types
   - ✅ Processes events in correct order
   - ✅ **Handles [DONE] sentinel correctly**
   - ✅ Handles malformed events gracefully

2. **Delta Generation**:
   - ✅ Converts streaming events to unified StreamDelta format
   - ✅ Text deltas properly constructed with incremental content
   - ✅ Tool call deltas handle partial JSON arguments
   - ✅ Metadata included in all deltas for debugging

3. **Stream Management**:
   - ✅ Proper async iterator implementation
   - ✅ Memory-efficient processing (no unbounded accumulation)
   - ✅ Clean error handling with continued streaming when possible
   - ✅ Proper resource cleanup on stream completion/error

4. **Termination Detection**:
   - ✅ Correctly identifies stream completion events
   - ✅ `isAnthropicStreamTerminal` function works with provider pattern
   - ✅ Handles various completion scenarios (success, tool calls, limits)

5. **Error Handling**:
   - ✅ Network errors properly propagated
   - ✅ Malformed events skipped without breaking stream
   - ✅ Clear error messages with proper context
   - ✅ Graceful degradation for parsing failures

6. **Unit Tests** (included in this task):
   - ✅ Test successful streaming parsing with SseParser
   - ✅ Test various event type processing
   - ✅ Test termination detection
   - ✅ Test error handling scenarios
   - ✅ Test malformed event handling
   - ✅ **Test [DONE] sentinel handling**
   - ✅ Test memory efficiency with large streams
   - ✅ Achieve >90% code coverage

## Dependencies

- **SseParser from `src/core/streaming/sseParser.ts`**
- StreamDelta types from client
- Response schemas from T-create-anthropic-api-request
- Core error classes

## Out of Scope

- Tool call execution (handled by core tool system)
- Delta accumulation for final message reconstruction (handled by client)
- Advanced streaming optimizations beyond basic efficiency
- Streaming cancellation (handled by HTTP transport layer)

## Testing Requirements

Create `src/providers/anthropic-2025-05-14/__tests__/streamingParser.test.ts` with:

- Successful streaming scenarios using SseParser
- Various event type processing
- Termination detection tests
- **[DONE] sentinel handling tests**
- Error handling scenarios
- Malformed event handling
- Memory efficiency tests
- Performance tests for large streams
