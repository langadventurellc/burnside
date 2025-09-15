---
id: T-implement-http-transport-with
title: Implement HTTP Transport with Streaming
status: open
priority: high
parent: F-transport-and-streaming
prerequisites:
  - T-implement-sse-server-sent
  - T-implement-chunked-response
  - T-implement-interceptor-chain
  - T-enhance-error-normalization
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T08:22:02.171Z
updated: 2025-09-15T08:22:02.171Z
---

# Implement HTTP Transport with Streaming

## Context

This task implements the main HTTP transport layer that brings together all the foundational components (SSE parser, chunk parser, interceptors, error normalization) into a concrete implementation of the `Transport` interface. This is the core HTTP client that all provider plugins will use.

**Reference**: Feature F-transport-and-streaming
**File**: `src/core/transport/httpTransport.ts`
**Test File**: `src/core/transport/__tests__/httpTransport.test.ts`

## Implementation Requirements

Create a comprehensive HTTP transport implementation that integrates all the streaming and error handling components:

### Core Functionality

1. **Transport Interface Implementation**: Implement both `fetch()` and `stream()` methods
2. **Injected Fetch Support**: Use fetch function provided via `HttpClientConfig`
3. **Streaming Integration**: Integrate SSE and chunk parsers for streaming responses
4. **Error Handling**: Use error normalization for consistent error responses
5. **Interceptor Integration**: Execute interceptor chains for requests and responses
6. **AbortSignal Support**: Handle request cancellation properly

### Technical Approach

1. Implement `HttpTransport` class extending the `Transport` interface
2. Integrate with `InterceptorChain` for request/response lifecycle
3. Use `SseParser` and `ChunkParser` for streaming responses
4. Apply `HttpErrorNormalizer` for error standardization
5. Use `RedactionProcessor` for secure logging
6. Support platform-agnostic operation via injected fetch

### API Implementation

```typescript
class HttpTransport implements Transport {
  constructor(
    private config: HttpClientConfig,
    private interceptors: InterceptorChain,
    private errorNormalizer: HttpErrorNormalizer,
    private redactionProcessor?: RedactionProcessor
  );

  async fetch(request: ProviderHttpRequest, signal?: AbortSignal): Promise<ProviderHttpResponse>;
  async stream(request: ProviderHttpRequest, signal?: AbortSignal): Promise<AsyncIterable<Uint8Array>>;
}
```

## Detailed Acceptance Criteria

### Transport Interface Implementation

- ✅ Implements `Transport.fetch()` with full HTTP functionality
- ✅ Implements `Transport.stream()` with async iterable return
- ✅ Uses injected fetch function from `HttpClientConfig`
- ✅ Handles all HTTP methods (GET, POST, PUT, DELETE, etc.)
- ✅ Proper header and body handling

### Streaming Support

- ✅ Detects SSE responses and uses `SseParser`
- ✅ Detects chunked responses and uses `ChunkParser`
- ✅ Falls back to raw chunk streaming for unknown formats
- ✅ Handles stream termination gracefully
- ✅ Supports stream cancellation via AbortSignal

### Error Handling Integration

- ✅ Uses `HttpErrorNormalizer` for all error scenarios
- ✅ Network errors properly mapped to `TransportError`
- ✅ HTTP errors mapped to appropriate error types
- ✅ Original error context preserved
- ✅ AbortSignal errors handled correctly

### Interceptor Integration

- ✅ Executes request interceptors before fetch
- ✅ Executes response interceptors after fetch
- ✅ Proper context threading through interceptor chain
- ✅ Error handling during interceptor execution
- ✅ Context includes request, response, and metadata

### Security Features

- ✅ Integrates with `RedactionProcessor` for secure logging
- ✅ Headers redacted in logs and debugging output
- ✅ Request/response bodies redacted when configured
- ✅ No sensitive data leakage in error messages
- ✅ AbortSignal prevents request hanging

### Platform Compatibility

- ✅ Works with Node.js fetch implementations
- ✅ Compatible with Electron fetch polyfills
- ✅ Supports React Native fetch adaptations
- ✅ Graceful degradation when features unavailable
- ✅ Consistent behavior across platforms

## Testing Requirements (Include in Same Task)

Create comprehensive unit tests in `src/core/transport/__tests__/httpTransport.test.ts`:

### Basic HTTP Operations

- GET requests with various response types
- POST requests with JSON bodies
- Custom headers and authentication
- Query parameters handling
- Response status code handling

### Streaming Tests

- SSE response streaming
- Chunked response streaming
- Raw byte streaming
- Stream cancellation via AbortSignal
- Stream error handling

### Error Handling Tests

- Network connection errors
- HTTP error status codes (400, 401, 429, 500, etc.)
- Timeout scenarios
- AbortSignal cancellation
- Malformed responses

### Interceptor Integration Tests

- Request interceptor execution
- Response interceptor execution
- Error handling in interceptors
- Context modification by interceptors
- Multiple interceptors execution order

### Platform Compatibility Tests

- Different fetch implementations
- Platform-specific error scenarios
- Feature availability checks
- Graceful degradation testing
- AbortSignal support variations

### Security Tests

- Request redaction functionality
- Response redaction functionality
- Sensitive header masking
- Error message sanitization
- Context data protection

## Security Considerations

- Ensure no credential leakage in logs or errors
- Validate all inputs to prevent injection attacks
- Handle AbortSignal to prevent resource leaks
- Sanitize error messages from providers
- Apply redaction rules consistently

## Dependencies

- `SseParser` from SSE parser task
- `ChunkParser` from chunk parser task
- `InterceptorChain` from interceptor task
- `HttpErrorNormalizer` from error normalization task
- `RedactionProcessor` from redaction task
- Existing `Transport`, `HttpClient` interfaces
- `ProviderHttpRequest`, `ProviderHttpResponse` types

## Out of Scope

- Advanced retry logic (basic error handling only)
- Connection pooling or keep-alive optimization
- Response caching (deferred to Phase 10)
- Rate limiting implementation (deferred to Phase 10)
- Performance optimization beyond basic requirements
- Provider-specific request/response transformation (handled by provider plugins)
