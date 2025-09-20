---
id: T-update-httptransport-to-use
title: Update HttpTransport to use RuntimeAdapter for streaming
status: done
priority: high
parent: F-complete-runtime-adapter
prerequisites:
  - T-implement-stream-method-in
  - T-implement-stream-method-in-1
  - T-implement-stream-method-in-2
affectedFiles:
  src/core/transport/httpTransport.ts: "Major refactor: Updated constructor to
    accept RuntimeAdapter or HttpClientConfig with backward compatibility.
    Replaced fetch method calls with runtime adapter. Completely replaced stream
    method implementation to use single adapter.stream() call instead of fetch +
    content-type detection + parsing. Removed all unused streaming utility
    methods (createParsedStream, createRawStreamIterator, createSseStream,
    createJsonStream, etc.). Removed streaming constants and parser imports
    since adapters handle this internally."
  src/core/transport/httpClientConfig.ts: Added RuntimeAdapter as optional
    property. Marked fetch property as deprecated with JSDoc annotations.
    Updated interface documentation to explain migration path to RuntimeAdapter.
  src/core/transport/__tests__/httpTransport.test.ts: Updated all test setup to
    use mock RuntimeAdapter instead of HttpClientConfig. Fixed constructor calls
    to pass RuntimeAdapter as first parameter. Updated all streaming tests to
    mock RuntimeAdapter.stream() method instead of fetch + ReadableStream.
    Created proper async iterables for stream mocking.
log:
  - Successfully updated HttpTransport to use RuntimeAdapter for streaming
    operations. Replaced fetch + stream processing with single
    RuntimeAdapter.stream() call that provides HTTP metadata and stream in one
    operation. Implemented backward compatibility for legacy HttpClientConfig
    usage. Removed unused streaming logic since adapters now handle
    platform-specific streaming internally. All tests updated and passing.
schema: v1.0
childrenIds: []
created: 2025-09-20T06:08:43.178Z
updated: 2025-09-20T06:08:43.178Z
---

# Update HttpTransport to use RuntimeAdapter for streaming

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)
Prerequisites: All platform adapter stream implementations completed

Update HttpTransport to accept a RuntimeAdapter instead of HttpClientConfig and use the adapter for both fetch and streaming operations. The adapter now provides HTTP metadata along with streams, enabling proper StreamResponse creation.

## Reference Implementation

- Current HttpTransport: `src/core/transport/httpTransport.ts`
- HttpClientConfig: `src/core/transport/httpClientConfig.ts`
- Transport interface: `src/core/transport/transport.ts`
- Updated RuntimeAdapter interface with metadata: T-add-stream-method-to

## Implementation Requirements

### Constructor Changes

Update HttpTransport constructor to accept RuntimeAdapter:

```typescript
/**
 * Creates a new HttpTransport instance.
 *
 * @param runtimeAdapter - Runtime adapter for platform operations
 * @param interceptors - Interceptor chain for request/response processing
 * @param errorNormalizer - Error normalizer for consistent error handling
 */
constructor(
  private readonly runtimeAdapter: RuntimeAdapter,
  private readonly interceptors: InterceptorChain,
  private readonly errorNormalizer: HttpErrorNormalizer,
) {}
```

### Fetch Method Update

Update the fetch method to use runtime adapter:

```typescript
// In executeFetchRequest method, replace:
const fetchResponse = await this.config.fetch(processedContext.request.url, {
  method: processedContext.request.method,
  headers: processedContext.request.headers,
  body: processedContext.request.body as BodyInit | null | undefined,
  signal,
});

// With:
const fetchResponse = await this.runtimeAdapter.fetch(
  processedContext.request.url,
  {
    method: processedContext.request.method,
    headers: processedContext.request.headers,
    body: processedContext.request.body as BodyInit | null | undefined,
    signal,
  },
);
```

### Stream Method Update

Update the stream method to use runtime adapter with proper metadata handling:

```typescript
// In executeStreamRequest method, replace the entire fetch logic:
const fetchResponse = await this.config.fetch(processedContext.request.url, {
  method: processedContext.request.method,
  headers: processedContext.request.headers,
  body: processedContext.request.body as BodyInit | null | undefined,
  signal,
});

// Capture HTTP response metadata
const headers: Record<string, string> = {};
fetchResponse.headers.forEach((value, key) => {
  headers[key] = value;
});

// With single adapter call that provides metadata + stream:
const streamResponse = await this.runtimeAdapter.stream(
  processedContext.request.url,
  {
    method: processedContext.request.method,
    headers: processedContext.request.headers,
    body: processedContext.request.body as BodyInit | null | undefined,
    signal,
  },
);

// Use adapter response directly for StreamResponse
return {
  status: streamResponse.status,
  statusText: streamResponse.statusText,
  headers: streamResponse.headers,
  stream: streamResponse.stream,
};
```

### Remove Content Type Detection Logic

Since adapters now handle platform-specific streaming internally:

```typescript
// Remove these lines from executeStreamRequest:
const contentType = fetchResponse.headers.get("content-type") || "";
const isSSE = contentType.includes(STREAMING_CONTENT_TYPES.SSE);

const stream = isSSE
  ? this.createRawStreamIterator(body, signal)
  : this.createParsedStream(body, contentType, signal);

// Adapter handles SSE detection and stream processing internally
```

### HttpClientConfig Updates

Update HttpClientConfig to be optional or deprecated:

```typescript
/**
 * Configuration interface for HTTP clients with runtime adapter injection.
 *
 * @deprecated Use RuntimeAdapter directly instead of HttpClientConfig
 * @property runtimeAdapter - Runtime adapter for platform operations
 * @property requestInterceptors - Optional array of request interceptors
 * @property responseInterceptors - Optional array of response interceptors
 */
export interface HttpClientConfig {
  /** Runtime adapter for platform operations */
  runtimeAdapter?: RuntimeAdapter;

  /** @deprecated Use RuntimeAdapter.fetch instead */
  fetch?: FetchFunction;

  /** Optional array of request interceptors */
  requestInterceptors?: RequestInterceptor[];

  /** Optional array of response interceptors */
  responseInterceptors?: ResponseInterceptor[];
}
```

## Acceptance Criteria

### Constructor Updates

- [ ] HttpTransport constructor accepts `RuntimeAdapter` as first parameter
- [ ] Constructor no longer requires `HttpClientConfig` with fetch function
- [ ] All internal references to `this.config.fetch` removed
- [ ] Constructor properly stores runtime adapter for use in methods

### Fetch Method Integration

- [ ] `executeFetchRequest()` uses `this.runtimeAdapter.fetch()` instead of `this.config.fetch()`
- [ ] All parameters properly passed to runtime adapter fetch method
- [ ] Error handling preserved and properly wrapped
- [ ] Response conversion logic unchanged
- [ ] Interceptor processing remains functional

### Stream Method Integration

- [ ] `executeStreamRequest()` uses `this.runtimeAdapter.stream()` for single call with metadata
- [ ] StreamResponse created directly from adapter response (status, statusText, headers, stream)
- [ ] No separate fetch call for HTTP metadata - adapter provides everything
- [ ] Content type detection logic removed (handled by adapters)
- [ ] Platform-specific streaming (SSE vs standard) handled by adapters
- [ ] Error handling preserved for streaming scenarios

### Metadata Handling

- [ ] HTTP status codes accurately captured from adapter response
- [ ] Status text correctly preserved from adapter response
- [ ] All response headers properly included in StreamResponse
- [ ] No hardcoded status: 200 or other fabricated values

### HttpClientConfig Deprecation

- [ ] HttpClientConfig interface marked as deprecated
- [ ] Backward compatibility maintained for existing users
- [ ] Clear migration path documented
- [ ] RuntimeAdapter becomes the primary configuration method

### Error Handling Preservation

- [ ] All existing error scenarios properly handled
- [ ] TransportError usage preserved
- [ ] Error normalization continues to work
- [ ] Platform-specific errors properly wrapped
- [ ] HTTP error status codes preserved in error context

### Response Processing

- [ ] Response interceptors continue to work
- [ ] Request interceptors continue to work
- [ ] Response conversion logic unchanged for fetch operations
- [ ] Streaming response metadata accurately reflects real HTTP response

## Testing Requirements

- Update unit tests to use RuntimeAdapter instead of HttpClientConfig
- Test both fetch and stream methods with mock RuntimeAdapter
- Verify error handling scenarios continue to work
- Test interceptor chain functionality
- Verify backward compatibility with HttpClientConfig
- Test that streaming responses have accurate HTTP metadata

## Security Considerations

- Maintain existing input validation
- Ensure proper error propagation
- Preserve authentication and authorization flows
- Validate that HTTP status codes are not fabricated

## Performance Requirements

- No performance degradation from adapter usage
- Streaming performance should remain the same
- Memory usage should not increase
- Single network call for streaming (not fetch + stream)

## Out of Scope

- BridgeClient integration (separate task)
- EnhancedHttpTransport updates (separate task)
- Provider plugin updates (separate task)

## Files to Modify

- `src/core/transport/httpTransport.ts` - Update constructor and methods
- `src/core/transport/httpClientConfig.ts` - Add deprecation notices

## Implementation Notes

- The stream method now makes a single call to adapter.stream() which returns metadata + stream
- No need for separate fetch call to get HTTP metadata - adapter provides everything
- Remove content type detection since adapters handle platform-specific streaming internally
- Maintain full backward compatibility during transition
- All existing transport functionality should continue to work
- HTTP metadata must be accurate, not fabricated
