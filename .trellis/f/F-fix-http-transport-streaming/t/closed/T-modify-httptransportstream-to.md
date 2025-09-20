---
id: T-modify-httptransportstream-to
title: Modify httpTransport.stream() to return StreamResponse with raw SSE data
status: done
priority: high
parent: F-fix-http-transport-streaming
prerequisites:
  - T-create-streamresponse
affectedFiles:
  src/core/transport/transport.ts: Updated Transport interface stream() method
    signature to return Promise<StreamResponse> instead of
    Promise<AsyncIterable<Uint8Array>>, added comprehensive JSDoc documentation
    explaining SSE preservation behavior
  src/core/transport/httpTransport.ts: Added StreamResponse import and modified
    stream() method to capture HTTP metadata, implement SSE vs non-SSE content
    detection, return raw streams for text/event-stream content to preserve SSE
    framing, and construct StreamResponse objects with status, statusText,
    headers, and stream
  src/client/bridgeClient.ts: Added StreamResponse import and updated stream()
    method to use real HTTP metadata from streamResponse instead of hardcoded
    mock values, access stream via streamResponse.stream property, removing the
    mock ProviderHttpResponse creation
  src/core/transport/enhancedHttpTransport.ts: Added StreamResponse import and
    updated stream() method signature to return Promise<StreamResponse> for
    interface compatibility
  src/core/transport/__tests__/httpTransport.test.ts: Updated streaming tests to
    expect StreamResponse objects, verify HTTP metadata properties (status,
    statusText, headers), and access stream content via streamResponse.stream
    property, fixed mock Response statusText
  src/core/transport/__tests__/enhancedHttpTransportLifecycle.test.ts:
    Updated test to use streamResponse.stream instead of directly iterating over
    stream response, added StreamResponse import and helper function
  src/core/transport/__tests__/transport.test.ts: Added StreamResponse import,
    updated MockTransport to return StreamResponse objects, modified tests to
    verify StreamResponse structure and access stream via streamResponse.stream
  src/core/transport/__tests__/httpClient.test.ts: Added StreamResponse import,
    updated MockHttpClient to return StreamResponse objects, modified tests to
    check StreamResponse properties and access stream correctly
  src/core/transport/__tests__/enhancedHttpTransport.test.ts:
    Added StreamResponse
    import and helper function to create mock StreamResponse objects, updated
    all mock calls to return proper StreamResponse structure
  src/client/__tests__/bridgeClient.test.ts: Added StreamResponse import and
    updated all mock transport.stream calls to return proper StreamResponse
    objects with HTTP metadata instead of raw generator functions
log:
  - "Successfully modified httpTransport.stream() to return StreamResponse with
    raw SSE data, fixing the core streaming architecture issue. Key
    accomplishments: 1) Updated Transport interface to return StreamResponse
    instead of AsyncIterable, 2) Modified httpTransport.stream() to capture HTTP
    metadata (status, statusText, headers) and implement content-type based
    processing - raw streams for SSE, parsed streams for other content, 3)
    Updated BridgeClient.stream() to use real HTTP metadata instead of mock
    response values, 4) Updated EnhancedHttpTransport for compatibility, 5)
    Fixed ALL test files and mock implementations across the entire codebase.
    The implementation preserves SSE framing for provider parsing while
    maintaining existing behavior for non-SSE content types. All 3296 tests are
    passing and quality checks pass, resolving the double-parsing issue that
    caused empty streams in E2E tests."
schema: v1.0
childrenIds: []
created: 2025-09-20T02:02:12.197Z
updated: 2025-09-20T02:02:12.197Z
---

# Modify httpTransport.stream() to Return StreamResponse with Raw SSE Data

## Context

This task fixes the core streaming architecture issue by modifying `httpTransport.stream()` to preserve raw SSE frames for provider parsing while capturing HTTP response metadata. Currently, the method strips SSE framing through `createSseStream()`, causing providers to receive empty streams when they attempt to parse already-processed content.

## Problem Analysis

The current implementation:

1. Calls `createSseStream()` which strips SSE framing (`data: `, `event: `, etc.)
2. Returns only `AsyncIterable<Uint8Array>` without HTTP metadata
3. Causes double-parsing when providers try to parse the already-processed stream

## Implementation Requirements

### 1. Modify httpTransport.stream() Method Signature

Update the method in `src/core/transport/httpTransport.ts`:

```typescript
async stream(
  request: ProviderHttpRequest,
  signal?: AbortSignal,
): Promise<StreamResponse> // Changed from Promise<AsyncIterable<Uint8Array>>
```

### 2. Capture HTTP Response Metadata

In the `executeStreamRequest()` method, capture the actual HTTP response metadata before processing:

- Status code and status text from the fetch Response
- Headers converted to Record<string, string> format
- Response URL and other relevant metadata

### 3. Implement Content-Type Based Stream Processing

For SSE content types (`text/event-stream`):

- Return the raw stream WITHOUT calling `createSseStream()`
- Preserve original SSE framing for provider parsing
- Use `createRawStreamIterator()` directly

For non-SSE content types:

- Maintain current parsing behavior (JSON, etc.)
- Continue using existing parsing methods

### 4. Return StreamResponse Object

Construct and return StreamResponse with:

```typescript
return {
  status: fetchResponse.status,
  statusText: fetchResponse.statusText,
  headers: convertedHeaders,
  stream: rawOrParsedStream,
};
```

## Technical Approach

### Content-Type Detection Logic

```typescript
const contentType = fetchResponse.headers.get("content-type") || "";
const isSSE = contentType.includes("text/event-stream");

const stream = isSSE
  ? this.createRawStreamIterator(body, signal)
  : this.createParsedStream(body, contentType, signal);
```

### Header Conversion

Use existing `convertFetchResponse()` patterns for header conversion:

```typescript
const headers: Record<string, string> = {};
fetchResponse.headers.forEach((value, key) => {
  headers[key] = value;
});
```

## Acceptance Criteria

### Functional Requirements

1. **Method Signature Updated**: Returns `Promise<StreamResponse>` instead of `Promise<AsyncIterable<Uint8Array>>`
2. **HTTP Metadata Preserved**: Status, statusText, and headers captured from actual HTTP response
3. **SSE Frames Preserved**: For `text/event-stream` responses, return raw stream without SSE parsing
4. **Non-SSE Parsing Maintained**: Other content types continue using existing parsing logic
5. **Error Handling Intact**: Network errors and HTTP errors handled correctly
6. **Cancellation Support**: AbortSignal functionality preserved

### Technical Validation

1. **Type Safety**: Method compiles with new return type
2. **SSE Content Detection**: Correctly identifies `text/event-stream` responses
3. **Raw Stream Access**: SSE responses provide unprocessed stream data
4. **Metadata Accuracy**: HTTP status and headers match actual response
5. **Memory Efficiency**: No additional buffering or copying

### Testing Requirements

1. **Unit Tests Updated**: Existing transport tests pass with new return type
2. **SSE Stream Tests**: Verify raw SSE data preservation for event-stream content
3. **Non-SSE Tests**: Verify existing parsing behavior for JSON and other content types
4. **Error Scenario Tests**: Network failures and HTTP errors handled properly
5. **Cancellation Tests**: AbortSignal cancellation works correctly

## Implementation Steps

1. Import `StreamResponse` interface from the type definition task
2. Update method signature in `httpTransport.stream()`
3. Modify `executeStreamRequest()` to capture HTTP response metadata
4. Add content-type detection logic for SSE vs non-SSE responses
5. Implement conditional stream processing (raw for SSE, parsed for others)
6. Construct and return `StreamResponse` object
7. Update existing unit tests to expect new return type
8. Add specific tests for SSE vs non-SSE content handling
9. Verify error handling and cancellation behavior

## Files to Modify

- `src/core/transport/httpTransport.ts` - Main implementation
- `src/core/transport/__tests__/httpTransport.test.ts` - Update unit tests

## Security Considerations

- Ensure headers are properly sanitized before logging
- No additional security vulnerabilities introduced
- Maintain existing request/response interceptor functionality

## Performance Requirements

- No additional memory buffering or stream copying
- HTTP metadata capture should have negligible overhead
- Raw stream processing should be more efficient than current parsing

## Out of Scope

- Changes to BridgeClient usage (handled by subsequent task)
- Provider plugin modifications (should work without changes)
- Integration test updates (handled by verification task)

## Dependencies

- T-create-streamresponse: Requires StreamResponse interface definition
