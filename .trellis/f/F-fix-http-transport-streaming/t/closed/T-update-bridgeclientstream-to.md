---
id: T-update-bridgeclientstream-to
title: Update BridgeClient.stream() to use StreamResponse and remove mock response
status: done
priority: high
parent: F-fix-http-transport-streaming
prerequisites:
  - T-modify-httptransportstream-to
affectedFiles:
  src/client/bridgeClient.ts: Updated stream() method to use StreamResponse
    interface, access real HTTP metadata (status, statusText, headers), and
    convert streamResponse.stream to ReadableStream for provider compatibility.
    Removed mock response creation logic.
log:
  - Task was already completed. Verified that BridgeClient.stream() has been
    successfully updated to use StreamResponse interface and real HTTP metadata
    instead of mock responses. The implementation includes proper stream
    conversion from AsyncIterable to ReadableStream and all unit tests are
    passing.
schema: v1.0
childrenIds: []
created: 2025-09-20T02:02:43.406Z
updated: 2025-09-20T02:02:43.406Z
---

# Update BridgeClient.stream() to Use StreamResponse and Remove Mock Response

## Context

This task updates `BridgeClient.stream()` to consume the new `StreamResponse` interface from `httpTransport.stream()` and removes the problematic mock `ProviderHttpResponse` creation that was causing streaming failures. The current implementation creates fake response metadata and wraps already-processed stream data, breaking provider SSE parsing.

## Current Problem

Lines 500-519 in `src/client/bridgeClient.ts` create a mock response:

```typescript
const httpRes = {
  status: 200, // Mock status
  statusText: "OK", // Mock status text
  headers: { "content-type": "text/event-stream" }, // Mock headers
  body: streamAsReadable, // Wrapped already-processed stream
};
```

This loses real HTTP metadata and passes pre-processed stream data to providers expecting raw SSE frames.

## Implementation Requirements

### 1. Update httpTransport.stream() Call

Replace the current call to destructure the new `StreamResponse`:

```typescript
const streamResponse = await this.httpTransport.stream({
  ...httpReq,
  signal,
});
```

### 2. Create Proper ProviderHttpResponse

Use real metadata from the HTTP response:

```typescript
const httpRes: ProviderHttpResponse = {
  status: streamResponse.status,
  statusText: streamResponse.statusText,
  headers: streamResponse.headers,
  body: this.convertStreamToReadableStream(streamResponse.stream),
};
```

### 3. Convert AsyncIterable to ReadableStream

Create a helper method to convert the raw stream:

```typescript
private convertStreamToReadableStream(
  asyncIterable: AsyncIterable<Uint8Array>
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of asyncIterable) {
          controller.enqueue(chunk);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
```

### 4. Remove Mock Response Creation

Delete the existing mock response logic (lines 500-519) including:

- Mock status and statusText hardcoding
- Mock headers creation
- Manual ReadableStream wrapping of processed data

### 5. Preserve Error Handling and Cancellation

Ensure existing timeout, cancellation, and error handling behavior is maintained.

## Technical Approach

### Stream Conversion Strategy

The raw `AsyncIterable<Uint8Array>` from transport needs to be converted to `ReadableStream<Uint8Array>` for the `ProviderHttpResponse.body` field. This conversion preserves the raw stream data while providing the interface providers expect.

### Error Handling Preservation

Maintain all existing error handling:

- Network errors from transport layer
- HTTP errors based on real status codes
- Provider parsing errors
- Timeout and cancellation errors

### Logging Updates

Update debug logging to use real HTTP metadata instead of mock values.

## Acceptance Criteria

### Functional Requirements

1. **StreamResponse Integration**: Successfully consumes new `httpTransport.stream()` return type
2. **Real Metadata Usage**: Uses actual HTTP status, statusText, and headers from API response
3. **Raw Stream Preservation**: Passes unprocessed stream data to provider parseResponse methods
4. **Mock Response Removal**: All hardcoded mock response logic eliminated
5. **Error Handling Maintained**: Network, HTTP, and provider errors handled correctly
6. **Cancellation Working**: Stream cancellation via AbortSignal functions properly

### Technical Validation

1. **Type Safety**: Code compiles with new interfaces and type definitions
2. **Provider Compatibility**: Existing provider plugins work without modification
3. **Stream Format**: Providers receive raw SSE frames with proper formatting
4. **Memory Efficiency**: No additional buffering beyond necessary ReadableStream conversion
5. **Interface Compliance**: Created ProviderHttpResponse objects match expected schema

### Testing Requirements

1. **Unit Tests Updated**: BridgeClient streaming tests pass with new implementation
2. **Mock Provider Tests**: Test providers receive properly formatted response objects
3. **Error Scenario Tests**: Network and HTTP errors properly propagated
4. **Cancellation Tests**: Stream cancellation behavior verified
5. **Integration Verification**: Tests demonstrate providers can parse received streams

## Implementation Steps

1. Import `StreamResponse` interface and update type annotations
2. Modify `httpTransport.stream()` call to destructure `StreamResponse`
3. Create `convertStreamToReadableStream()` helper method
4. Replace mock response creation with real metadata usage
5. Update error handling to use real status codes
6. Remove all mock response logic and hardcoded values
7. Update logging statements to use real metadata
8. Update unit tests for new implementation
9. Add specific tests for stream conversion and real metadata usage
10. Verify error handling and cancellation behavior

## Files to Modify

- `src/client/bridgeClient.ts` - Main streaming implementation
- `src/client/__tests__/bridgeClient.test.ts` - Update unit tests

## Security Considerations

- Real HTTP headers may contain sensitive information - ensure proper logging sanitization
- Validate that error handling doesn't expose sensitive data
- Maintain existing authentication and authorization header handling

## Performance Requirements

- Stream conversion should have minimal overhead
- No additional memory buffering beyond ReadableStream requirements
- Maintain existing streaming performance characteristics

## Out of Scope

- Provider plugin modifications (should work without changes)
- Transport layer implementation (handled by previous task)
- E2E test updates (handled by verification task)

## Dependencies

- T-modify-httptransportstream-to: Requires updated httpTransport.stream() method returning StreamResponse
