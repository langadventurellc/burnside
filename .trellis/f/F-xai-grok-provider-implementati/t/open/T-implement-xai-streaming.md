---
id: T-implement-xai-streaming
title: Implement xAI streaming parser with SSE handling
status: open
priority: high
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-implement-xai-request-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T19:58:10.538Z
updated: 2025-09-17T19:58:10.538Z
---

# Implement xAI Streaming Parser with SSE Handling

## Context

This task implements the streaming response parser for xAI Server-Sent Events (SSE), converting streaming chunks to unified StreamDelta format. The parser handles real-time content streaming, tool calls, and stream termination detection.

## Reference Implementation

Use these files as reference patterns:

- `src/providers/openai-responses-v1/streamingParser.ts` (primary template)
- `src/providers/google-gemini-v1/streamingParser.ts` (alternative patterns)
- `src/client/streamDelta.ts` (unified streaming format)

## Implementation Requirements

Create `src/providers/xai-v1/streamingParser.ts` with the following components:

### Main Streaming Parser Function

```typescript
export async function* parseXaiResponseStream(
  response: ProviderHttpResponse,
  originalRequest: ChatRequest,
): AsyncGenerator<StreamDelta, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new ProviderError("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let messageId: string | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const delta = parseSseLine(line);
        if (delta) {
          // Set message ID from first chunk
          if (!messageId && delta.delta.id) {
            messageId = delta.delta.id;
          }

          yield delta;

          // Check for stream termination
          if (isStreamTerminated(delta)) {
            return;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### SSE Line Parsing

```typescript
function parseSseLine(line: string): StreamDelta | null {
  // Skip empty lines and comments
  if (!line.trim() || line.startsWith(":")) {
    return null;
  }

  // Handle SSE format: "data: {...}"
  if (line.startsWith("data: ")) {
    const dataContent = line.substring(6).trim();

    // Handle termination marker
    if (dataContent === "[DONE]") {
      return {
        delta: {
          type: "termination",
          content: null,
          finishReason: "stop",
        },
        metadata: {
          provider: "xai",
          terminated: true,
        },
      };
    }

    try {
      const chunkData = JSON.parse(dataContent);
      return convertChunkToStreamDelta(chunkData);
    } catch (error) {
      console.warn("Failed to parse SSE chunk:", dataContent, error);
      return null;
    }
  }

  return null;
}
```

### Chunk Conversion to StreamDelta

```typescript
function convertChunkToStreamDelta(chunk: any): StreamDelta {
  // Validate chunk structure
  const validatedChunk = XAIV1StreamingResponseSchema.parse(chunk);

  const choice = validatedChunk.choices[0];
  if (!choice) {
    throw new ProviderError("No choices in streaming chunk");
  }

  const delta = choice.delta;

  return {
    delta: {
      type: "content",
      content: delta.content || null,
      role: delta.role,
      toolCall: delta.function_call
        ? {
            id: generateToolCallId(),
            name: delta.function_call.name,
            arguments: delta.function_call.arguments,
          }
        : undefined,
      finishReason: choice.finish_reason || undefined,
    },
    metadata: {
      provider: "xai",
      id: validatedChunk.id,
      model: validatedChunk.model,
      created: validatedChunk.created,
      index: choice.index,
    },
  };
}
```

### Stream Termination Detection

```typescript
export function isStreamTerminated(delta: StreamDelta): boolean {
  return (
    delta.delta.type === "termination" ||
    delta.delta.finishReason !== undefined ||
    delta.metadata?.terminated === true
  );
}
```

### Tool Call Accumulation

```typescript
class ToolCallAccumulator {
  private partialCalls = new Map<
    string,
    {
      name?: string;
      arguments?: string;
    }
  >();

  accumulate(delta: StreamDelta): void {
    if (delta.delta.toolCall) {
      const call = delta.delta.toolCall;
      const existing = this.partialCalls.get(call.id) || {};

      this.partialCalls.set(call.id, {
        name: existing.name || call.name,
        arguments: (existing.arguments || "") + (call.arguments || ""),
      });
    }
  }

  getCompletedCalls(): Array<{ id: string; name: string; arguments: string }> {
    return Array.from(this.partialCalls.entries())
      .filter(([_, call]) => call.name && call.arguments)
      .map(([id, call]) => ({
        id,
        name: call.name!,
        arguments: call.arguments!,
      }));
  }
}
```

### Error Handling for Streams

```typescript
function handleStreamingError(error: unknown, line?: string): void {
  if (error instanceof SyntaxError) {
    console.warn("Invalid JSON in SSE stream:", line);
    return; // Continue processing other chunks
  }

  if (error instanceof z.ZodError) {
    console.warn("Invalid chunk format:", error.message);
    return; // Continue processing other chunks
  }

  // Re-throw serious errors
  throw error;
}
```

## Acceptance Criteria

### Functional Requirements

✅ **SSE Parsing**: Server-Sent Events parse correctly from xAI streaming response
✅ **Content Streaming**: Text content streams in real-time as StreamDelta objects
✅ **Tool Call Streaming**: Function calls stream and accumulate correctly
✅ **Stream Termination**: [DONE] marker and finish reasons detected properly
✅ **Error Recovery**: Malformed chunks handled gracefully without stopping stream
✅ **Resource Cleanup**: Stream reader properly released when done

### Streaming Requirements

✅ **Real-time Processing**: Chunks processed immediately as they arrive
✅ **Buffer Management**: Partial lines handled correctly in buffer
✅ **Encoding Handling**: UTF-8 decoding works correctly for all content
✅ **Backpressure Handling**: AsyncGenerator provides proper flow control
✅ **Memory Efficiency**: No memory leaks from accumulating large streams

### Error Handling Requirements

✅ **Network Errors**: Connection failures handled gracefully
✅ **Parse Errors**: Invalid JSON chunks don't terminate stream
✅ **Validation Errors**: Schema validation errors handled appropriately
✅ **Resource Cleanup**: Reader released even when errors occur

## Testing Requirements

Include comprehensive unit tests covering:

### Success Case Tests

- Basic text content streaming
- Function call streaming and accumulation
- Stream termination detection ([DONE] marker)
- Multiple chunk processing
- Empty content chunk handling

### Error Case Tests

- Invalid JSON chunk handling
- Network interruption during streaming
- Missing choices in chunk
- Malformed SSE format lines
- Reader cleanup on errors

### Edge Case Tests

- Very large chunks (memory handling)
- Rapid successive chunks
- Partial function call arguments
- Mixed content and tool call chunks
- Empty or whitespace-only chunks

### Performance Tests

- Large stream processing efficiency
- Memory usage during long streams
- Chunk processing latency

## Implementation Steps

1. **Create Streaming Parser File**: Set up async generator structure
2. **SSE Format Parsing**: Implement Server-Sent Events line parsing
3. **Chunk Validation**: Validate streaming chunks against schema
4. **Delta Conversion**: Convert xAI chunks to unified StreamDelta format
5. **Termination Detection**: Implement stream termination logic
6. **Tool Call Accumulation**: Handle streaming function calls
7. **Error Recovery**: Graceful handling of malformed chunks
8. **Resource Management**: Proper stream reader cleanup
9. **Write Unit Tests**: Comprehensive test coverage for all scenarios
10. **Performance Testing**: Verify memory and processing efficiency

## Dependencies

- **Prerequisites**: T-implement-xai-request-and (streaming response schema)
- **Works with**: T-create-xai-response-parser (non-streaming counterpart)
- **Blocks**: Main provider class integration

## Out of Scope

- Non-streaming response parsing (handled in separate parser)
- HTTP streaming setup (handled by transport layer)
- Request initiation (handled in translator)
- Provider configuration (handled in config schema)

## Technical Notes

- Follow OpenAI's SSE format which xAI uses identically
- Ensure proper UTF-8 decoding for international content
- Handle partial chunks in buffer correctly
- Implement efficient tool call accumulation for large arguments
- Provide graceful degradation when chunks are malformed
