---
id: T-implement-sse-server-sent
title: Implement SSE (Server-Sent Events) Parser
status: done
priority: high
parent: F-transport-and-streaming
prerequisites: []
affectedFiles:
  src/core/streaming/sseEvent.ts: Created SseEvent interface and Zod validation
    schema for parsed SSE events with optional data, event, id, and retry fields
  src/core/streaming/sseParser.ts: Implemented complete SSE parser class with
    static parse method, buffering, multi-line data support, field parsing, and
    error recovery
  src/core/streaming/index.ts: Updated module exports to include SseParser class
    and SseEvent interface for public API access
  src/core/streaming/__tests__/sseEvent.test.ts:
    Created comprehensive test suite
    for SSE event interface and validation schema with 13 test cases
  src/core/streaming/__tests__/sseParser.test.ts:
    Implemented extensive test suite
    with 30 test cases covering basic parsing, streaming scenarios, error
    handling, and real-world provider formats
log:
  - >-
    Successfully implemented SSE (Server-Sent Events) Parser with comprehensive
    functionality including:


    1. **Core SSE Parsing**: Created robust parser that handles `data:`,
    `event:`, `id:`, and `retry:` fields according to W3C SSE specification

    2. **Multi-line Support**: Properly handles data blocks spanning multiple
    lines with correct reconstruction

    3. **Termination Detection**: Recognizes `[DONE]` signals and handles empty
    line event boundaries

    4. **Error Recovery**: Graceful handling of malformed chunks without
    breaking the stream, with detailed logging

    5. **Async Iteration**: Clean async generator interface for consuming parsed
    events with proper resource management

    6. **Security Features**: Input validation, memory limits (1MB max event
    size), and UTF-8 encoding safety

    7. **Performance Optimization**: Efficient buffering and minimal latency
    chunk processing


    The implementation follows established codebase patterns from ChunkParser,
    uses existing error handling with StreamingError, and includes comprehensive
    test coverage (43 test cases) covering basic parsing, field validation,
    streaming scenarios, error handling, and real-world provider formats
    (OpenAI/Anthropic style).


    All quality checks pass with only one acceptable warning about function
    length due to parsing complexity. The parser is ready for integration with
    HTTP transport layer.
schema: v1.0
childrenIds: []
created: 2025-09-15T08:19:29.066Z
updated: 2025-09-15T08:19:29.066Z
---

# Implement SSE (Server-Sent Events) Parser

## Context

This task implements the SSE parsing functionality that will be used by the HTTP transport layer to handle streaming responses from LLM providers. SSE is a standard format used by many providers (OpenAI, Anthropic, etc.) for streaming chat completions.

**Reference**: Feature F-transport-and-streaming
**File**: `src/core/streaming/sseParser.ts`
**Test File**: `src/core/streaming/__tests__/sseParser.test.ts`

## Implementation Requirements

Create a robust SSE parser that handles the standard SSE format used by LLM providers:

```
data: {"chunk": "content"}

data: [DONE]

```

### Core Functionality

1. **Parse SSE Fields**: Handle `data:`, `event:`, `id:`, and `retry:` fields
2. **Multi-line Support**: Handle data blocks that span multiple lines
3. **Termination Detection**: Recognize `[DONE]` signals and provider-specific termination markers
4. **Error Recovery**: Handle malformed chunks gracefully without breaking the stream
5. **Async Iteration**: Provide async iterable interface for consuming parsed events

### Technical Approach

1. Create a `SseParser` class that processes `Uint8Array` chunks
2. Implement buffering for incomplete lines across chunk boundaries
3. Parse each SSE event according to the [SSE specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
4. Use async generators for clean streaming interface
5. Handle encoding properly (assume UTF-8)

### API Design

```typescript
interface SseEvent {
  data?: string;
  event?: string;
  id?: string;
  retry?: number;
}

class SseParser {
  static parse(chunks: AsyncIterable<Uint8Array>): AsyncIterable<SseEvent>;
}
```

## Detailed Acceptance Criteria

### Core Parsing

- ✅ Parses `data: {"content": "value"}` format correctly
- ✅ Handles multi-line data blocks with proper reconstruction
- ✅ Parses `event:`, `id:`, and `retry:` fields when present
- ✅ Ignores comment lines starting with `:`
- ✅ Handles empty lines as event separators

### Streaming Support

- ✅ Works with async iterable input of `Uint8Array` chunks
- ✅ Buffers incomplete lines across chunk boundaries
- ✅ Returns async iterable of parsed events
- ✅ Handles partial UTF-8 characters across boundaries

### Error Handling

- ✅ Gracefully handles malformed SSE chunks
- ✅ Continues parsing after encountering invalid data
- ✅ Logs warnings for malformed data without breaking stream
- ✅ Properly handles empty chunks and null data

### Termination

- ✅ Recognizes `data: [DONE]` termination signals
- ✅ Supports custom termination patterns
- ✅ Cleanly ends async iteration on termination

### Performance

- ✅ Memory-efficient buffering (no excessive accumulation)
- ✅ Processes chunks with <50ms latency
- ✅ Proper cleanup of resources on completion/error

## Testing Requirements (Include in Same Task)

Create comprehensive unit tests in `src/core/streaming/__tests__/sseParser.test.ts`:

### Basic Parsing Tests

- Single-line data events
- Multi-line data events
- Events with id and retry fields
- Comment lines (should be ignored)
- Empty events

### Streaming Tests

- Chunks split across event boundaries
- Partial UTF-8 characters across chunks
- Large data events
- Mixed chunk sizes

### Error Scenarios

- Malformed SSE data
- Invalid UTF-8 sequences
- Unexpected termination
- Empty stream input

### Real-world Scenarios

- OpenAI-style streaming responses
- Anthropic-style streaming responses
- `[DONE]` termination handling
- Multiple rapid events

## Security Considerations

- Validate input encoding (UTF-8)
- Prevent memory exhaustion from large data blocks
- Sanitize log output to avoid information leakage
- Handle malicious input gracefully

## Dependencies

- Standard library encoding/decoding utilities
- Jest testing framework
- Existing streaming interfaces in `src/core/streaming/`

## Out of Scope

- Provider-specific response parsing (handled by provider plugins)
- HTTP transport integration (handled by HTTP transport task)
- Advanced buffering strategies (basic buffering sufficient)
- Response caching (deferred to Phase 10)
