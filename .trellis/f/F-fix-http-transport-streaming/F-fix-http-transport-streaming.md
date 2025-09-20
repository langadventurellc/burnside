---
id: F-fix-http-transport-streaming
title: Fix HTTP Transport Streaming Architecture
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/transport/streamResponse.ts:
    Created new StreamResponse interface with
    comprehensive JSDoc documentation. Interface includes status, statusText,
    headers, and stream properties to preserve both HTTP metadata and raw stream
    content.
  src/core/transport/index.ts: Added StreamResponse export to streaming support
    section alongside existing StreamingResponse export.
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
    mock ProviderHttpResponse creation; Updated stream() method to use
    StreamResponse interface, access real HTTP metadata (status, statusText,
    headers), and convert streamResponse.stream to ReadableStream for provider
    compatibility. Removed mock response creation logic.
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
  - "Auto-completed: All child tasks are complete"
schema: v1.0
childrenIds:
  - T-create-streamresponse
  - T-modify-httptransportstream-to
  - T-update-bridgeclientstream-to
created: 2025-09-20T01:47:48.933Z
updated: 2025-09-20T01:47:48.933Z
---

# Fix HTTP Transport Streaming Architecture

## Problem Statement

The current streaming implementation has a critical architectural flaw causing E2E streaming tests to fail. The HTTP transport layer pre-processes SSE streams by stripping SSE framing, but provider plugins expect raw SSE data for parsing, creating a double-parsing conflict that results in zero stream deltas.

## Root Cause Analysis

1. **httpTransport.stream()** calls `createSseStream()` which uses `SseParser.parse()` to strip SSE framing (`data: `, `event: `, etc.) and returns only data content
2. **BridgeClient.stream()** wraps these processed chunks into a mock `ProviderHttpResponse`
3. **Provider parseResponse()** methods expect raw SSE frames and attempt to parse using `SseParser.parse()` again
4. **Result**: SSE parser finds no events in already-processed content, yielding zero deltas

## Technical Requirements

### Core Architecture Changes

1. **Modify httpTransport.stream() Interface**
   - Return both HTTP response metadata (status, headers, statusText) AND raw stream
   - Create new `StreamResponse` interface containing: `{ status, statusText, headers, stream }`
   - Preserve raw SSE content for SSE responses, allow normal parsing for other content types
   - Maintain provider agnosticism by keeping transport layer ignorant of specific provider needs

2. **Update BridgeClient.stream() Implementation**
   - Remove mock ProviderHttpResponse creation
   - Use real response metadata from httpTransport.stream()
   - Pass raw stream content to provider parseResponse methods
   - Maintain existing timeout and cancellation behavior

3. **Preserve Provider Plugin Interface**
   - Keep existing ProviderPlugin.parseResponse() signature unchanged
   - Ensure all provider plugins receive proper ProviderHttpResponse objects
   - Maintain provider agnosticism - no provider-specific logic in transport layer

### Implementation Details

#### New StreamResponse Interface

```typescript
interface StreamResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  stream: AsyncIterable<Uint8Array>;
}
```

#### Transport Layer Changes

- Modify `httpTransport.stream()` to return `StreamResponse` instead of `AsyncIterable<Uint8Array>`
- For SSE content-type responses: return raw stream without SSE parsing
- For non-SSE responses: maintain current parsing behavior
- Ensure HTTP metadata is captured and preserved from the actual HTTP response

#### BridgeClient Changes

- Update stream method to destructure `StreamResponse`
- Create proper `ProviderHttpResponse` using real metadata and raw stream
- Remove mock response object creation
- Preserve existing error handling and cancellation logic

## Acceptance Criteria

### Functional Requirements

1. **E2E Streaming Tests Pass**: All OpenAI streaming E2E tests produce multiple deltas and complete successfully
2. **Unit Tests Continue Passing**: All existing BridgeClient and transport unit tests remain passing
3. **Provider Agnosticism Maintained**: No provider-specific logic in transport or client layers
4. **HTTP Metadata Preserved**: Real status codes, headers, and status text from API responses
5. **Error Handling Intact**: Network errors, HTTP errors, and provider errors handled correctly
6. **Cancellation Working**: Stream cancellation via AbortSignal functions properly

### Technical Validation

1. **SSE Format Preservation**: Provider parsers receive raw SSE frames with proper `data: ` prefixes
2. **Content-Type Handling**: SSE streams bypass pre-parsing, other formats maintain current behavior
3. **Memory Efficiency**: No additional buffering or double-processing of stream data
4. **Interface Compatibility**: All existing provider plugins work without modification

### Testing Requirements

1. **E2E Streaming Verification**: Run `npm run test:e2e` OpenAI streaming tests
2. **Unit Test Regression**: Run full test suite to ensure no breaking changes
3. **Multiple Provider Support**: Verify fix works for any provider implementing streaming
4. **Edge Case Handling**: Test error responses, network failures, and cancellation scenarios

## Implementation Guidance

### Phase 1: Transport Layer Updates

1. Create `StreamResponse` interface in transport types
2. Modify `httpTransport.stream()` to capture and return HTTP response metadata
3. Add content-type detection to preserve raw SSE streams
4. Update transport tests to verify new interface

### Phase 2: Client Layer Updates

1. Update `BridgeClient.stream()` to use new `StreamResponse` interface
2. Remove mock `ProviderHttpResponse` creation logic
3. Create proper response objects using real HTTP metadata
4. Update client tests to expect new behavior

### Phase 3: Integration Testing

1. Run E2E streaming tests to verify delta production
2. Validate all unit tests still pass
3. Test error scenarios and cancellation
4. Verify provider agnosticism maintained

## Security Considerations

- Ensure HTTP response headers are properly sanitized before logging
- Maintain existing request/response interceptor functionality
- Preserve authentication and authorization header handling
- No additional security vulnerabilities introduced by metadata preservation

## Performance Requirements

- No additional memory buffering or copying of stream data
- Maintain existing streaming performance characteristics
- HTTP metadata capture should have negligible overhead
- No blocking operations in stream processing path

## Files to Modify

- `src/core/transport/httpTransport.ts` - Modify stream method and add StreamResponse interface
- `src/client/bridgeClient.ts` - Update streaming implementation to use real response metadata
- `src/core/transport/providerHttpResponse.ts` - Consider if StreamResponse belongs here
- `src/__tests__/e2e/openai/streaming.e2e.test.ts` - Should pass after implementation
- Unit test files for transport and client layers

## Dependencies

- None - This is a self-contained architectural fix
- Must maintain backward compatibility with all existing provider plugins
- No breaking changes to public library interfaces
