---
id: T-implement-streaming-response-1
title: Implement streaming response parser with SSE handling
status: open
priority: high
parent: F-google-gemini-v1-provider
prerequisites:
  - T-implement-non-streaming-1
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T03:29:00.698Z
updated: 2025-09-17T03:29:00.698Z
---

# Implement Streaming Response Parser with SSE Handling

## Context

This task implements the streaming response parser for Google Gemini API's `streamGenerateContent` endpoint. This handles Server-Sent Events (SSE) or chunked JSON responses, parsing them into `StreamDelta` objects that can be consumed by the unified streaming interface.

**Related Feature**: F-google-gemini-v1-provider - Google Gemini v1 Provider Implementation
**Reference Implementation**: `src/providers/openai-responses-v1/streamingParser.ts`

## Implementation Requirements

### 1. Create Streaming Parser

Create `src/providers/google-gemini-v1/streamingParser.ts` with:

- `parseGeminiResponseStream()` function for streaming responses
- SSE and chunked JSON format handling
- Delta chunk parsing and accumulation
- Stream termination detection
- Error handling for malformed chunks

### 2. Stream Format Handling

- Parse Server-Sent Events (SSE) format with proper event boundaries
- Handle chunked JSON responses (newline-delimited JSON)
- Robust chunk framing and delta assembly
- Buffer management for partial chunks
- Connection error and retry handling

### 3. Delta Processing

- Convert Gemini response chunks to `StreamDelta` objects
- Incremental content accumulation across chunks
- Function call delta handling (tool calls mid-stream)
- Citation metadata preservation across streaming chunks
- Usage token accumulation throughout stream

### 4. Stream Termination

- Detect stream completion signals from Gemini API
- Handle premature stream termination
- Proper cleanup and resource management
- Error propagation for stream failures
- AbortSignal integration for cancellation

## Technical Approach

### Step 1: Study Existing Patterns

- Analyze `src/providers/openai-responses-v1/streamingParser.ts` for structure
- Analyze `src/providers/anthropic-2023-06-01/streamingParser.ts` for alternatives
- Study how other providers handle SSE and chunked responses
- Follow established streaming and error handling patterns

### Step 2: Implement Stream Parser

```typescript
// src/providers/google-gemini-v1/streamingParser.ts
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import type { StreamDelta } from "../../client/streamDelta";

export async function* parseGeminiResponseStream(
  response: ProviderHttpResponse,
): AsyncIterable<StreamDelta> {
  // Implementation here
}
```

### Step 3: Implement Chunk Processing

- `parseStreamChunk()` for individual chunk parsing
- `accumulateDeltas()` for incremental content building
- `detectTermination()` for stream completion detection
- `handleStreamError()` for error scenarios

### Step 4: Handle Different Stream Formats

```typescript
async function* handleSSEStream(stream: ReadableStream): AsyncIterable<string> {
  // SSE parsing logic
}

async function* handleChunkedJSON(
  stream: ReadableStream,
): AsyncIterable<string> {
  // Chunked JSON parsing logic
}
```

### Step 5: Create Unit Tests

Write comprehensive unit tests in `src/providers/google-gemini-v1/__tests__/streamingParser.test.ts`:

- Test SSE format parsing with complete streams
- Test chunked JSON format parsing
- Test delta accumulation and content building
- Test stream termination detection
- Test error handling for malformed chunks
- Test cancellation with AbortSignal
- Test partial chunk buffering and recovery

## Acceptance Criteria

### Functional Requirements

- ✅ parseGeminiResponseStream() yields StreamDelta objects correctly
- ✅ SSE format parsing handles event boundaries properly
- ✅ Chunked JSON format parsing works with newline delimiters
- ✅ Delta accumulation builds complete content incrementally
- ✅ Stream termination detected accurately
- ✅ Function call deltas emitted properly for tool execution

### Stream Processing Requirements

- ✅ Robust chunk framing prevents data loss
- ✅ Partial chunk buffering and recovery works correctly
- ✅ Stream cancellation with AbortSignal handled properly
- ✅ Connection errors propagated with meaningful context
- ✅ Buffer management prevents memory leaks

### Delta Processing Requirements

- ✅ Content deltas accumulate correctly across chunks
- ✅ Citation metadata preserved throughout streaming
- ✅ Function call deltas trigger tool execution properly
- ✅ Usage token counts accumulate accurately
- ✅ Multiple content types handle in same stream

### Streaming Format Requirements

- ✅ SSE parsing handles event boundaries and data fields
- ✅ Chunked JSON parsing handles newline-delimited format
- ✅ Format detection works automatically or via headers
- ✅ Malformed chunks handled gracefully without stream termination
- ✅ Empty chunks and keep-alive messages handled appropriately

### Technical Requirements

- ✅ AsyncIterable interface implementation correct
- ✅ Proper error handling with meaningful error messages
- ✅ Memory efficient streaming without buffering entire response
- ✅ Type safety with no 'any' types
- ✅ Performance optimized for real-time streaming

### Testing Requirements

- ✅ Unit tests cover all streaming scenarios
- ✅ Tests verify SSE and chunked JSON parsing
- ✅ Tests check delta accumulation accuracy
- ✅ Tests validate stream termination detection
- ✅ Tests verify cancellation and error handling
- ✅ Tests handle edge cases (empty streams, malformed chunks)
- ✅ Test coverage meets project standards (>90%)
- ✅ All tests pass with zero TypeScript errors

### Code Quality

- ✅ Module stays under 400 logical LOC limit
- ✅ Single responsibility: streaming response parsing only
- ✅ No 'any' types - all properly typed
- ✅ Follows project linting and formatting standards
- ✅ Clear documentation and examples in code comments

## Files to Create/Modify

- Create: `src/providers/google-gemini-v1/streamingParser.ts`
- Create: `src/providers/google-gemini-v1/__tests__/streamingParser.test.ts`

## Dependencies

- Requires: T-implement-non-streaming-1 (response parsing patterns)
- Requires: Core StreamDelta and ProviderHttpResponse types
- Requires: Gemini response schema for validation
- Blocks: Provider implementation and integration tasks

## Out of Scope

- Non-streaming response parsing (handled by response parser task)
- Request translation (handled by translator tasks)
- Error normalization (handled by error handling tasks)
- Provider registration (handled by provider implementation task)
