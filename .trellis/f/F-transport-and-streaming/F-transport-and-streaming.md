---
id: F-transport-and-streaming
title: Transport and Streaming Foundations Implementation
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/streaming/chunkParser.ts: Core ChunkParser class implementation with
    JSON boundary detection, buffer management, async iteration, and security
    limits. Includes static methods for parseJson and parseJsonLines with
    comprehensive error handling.
  src/core/streaming/parsedChunk.ts:
    ParsedChunk interface defining the structure
    for parsed JSON data and raw string content returned by the parser.
  src/core/streaming/chunkParserOptions.ts: ChunkParserOptions interface for
    configurable parser settings including maxObjectSize and encoding options.
  src/core/streaming/index.ts: Updated streaming module exports to include
    ChunkParser class and related interfaces for public API access.; Updated
    module exports to include SseParser class and SseEvent interface for public
    API access
  src/core/streaming/__tests__/chunkParser.test.ts:
    Comprehensive test suite with
    23 test cases covering basic parsing, buffer management, error handling,
    string handling, configuration options, and JSON Lines format parsing.
  src/core/streaming/sseEvent.ts: Created SseEvent interface and Zod validation
    schema for parsed SSE events with optional data, event, id, and retry fields
  src/core/streaming/sseParser.ts: Implemented complete SSE parser class with
    static parse method, buffering, multi-line data support, field parsing, and
    error recovery
  src/core/streaming/__tests__/sseEvent.test.ts:
    Created comprehensive test suite
    for SSE event interface and validation schema with 13 test cases
  src/core/streaming/__tests__/sseParser.test.ts:
    Implemented extensive test suite
    with 30 test cases covering basic parsing, streaming scenarios, error
    handling, and real-world provider formats
  src/core/errors/httpErrorNormalizer.ts: Created complete HttpErrorNormalizer
    class implementing ErrorNormalizer interface with HTTP status mapping,
    network error handling, context preservation, retry-after parsing, error
    sanitization, and configurable behavior
  src/core/errors/errorNormalizationConfig.ts: Created ErrorNormalizationConfig
    interface for customizing error normalization behavior including status code
    mapping, error preservation, and stack trace options
  src/core/errors/index.ts: Updated exports to include new HttpErrorNormalizer
    class and ErrorNormalizationConfig interface for public API access
  src/core/errors/__tests__/httpErrorNormalizer.test.ts: Created comprehensive
    test suite with 42 test cases covering HTTP status mapping, network errors,
    context preservation, rate limits, sanitization, static methods, and edge
    cases
  src/core/transport/interceptorChain.ts: Main InterceptorChain class with
    priority-based interceptor management, request/response execution methods,
    context cloning, validation, and error handling
  src/core/transport/interceptorError.ts:
    Specialized error class for interceptor
    execution failures extending BridgeError with interceptor-specific context
  src/core/transport/interceptorErrorContext.ts: Interface defining context information for interceptor execution failures
  src/core/transport/interceptorContext.ts: Interface for context object passed
    through interceptor chain containing request, response, metadata, and abort
    signal
  src/core/transport/requestInterceptorChain.ts: Type definition for request interceptor functions with context parameter
  src/core/transport/responseInterceptorChain.ts: Type definition for response interceptor functions with context parameter
  src/core/transport/index.ts: Updated transport module exports to include new
    interceptor chain classes and types; Updated module exports to include
    HttpTransport class for public API access
  src/core/transport/__tests__/interceptorChain.test.ts:
    Comprehensive test suite
    with 25 test cases covering interceptor registration, execution order, error
    handling, context management, and edge cases
  src/core/transport/__tests__/interceptorError.test.ts: Test suite with 7 test
    cases for InterceptorError class validation, inheritance, and serialization
  src/core/transport/httpTransport.ts: Main HttpTransport class implementation
    with fetch() and stream() methods, integrated streaming parsers (SSE,
    chunk), interceptor chain execution, error normalization, and
    platform-agnostic fetch support
  src/core/transport/__tests__/httpTransport.test.ts: Comprehensive test suite
    with 15 test cases covering fetch requests, streaming responses, error
    handling, interceptor integration, AbortSignal support, and context
    management
log: []
schema: v1.0
childrenIds:
  - T-implement-http-transport-with
  - T-implement-requestresponse
  - T-enhance-error-normalization
  - T-implement-chunked-response
  - T-implement-interceptor-chain
  - T-implement-sse-server-sent
created: 2025-09-15T08:12:57.732Z
updated: 2025-09-15T08:12:57.732Z
---

# Transport and Streaming Foundations Implementation

## Overview

Implement the core transport layer with HTTP fetch functionality and streaming capabilities for LLM provider communications. This feature provides the foundational HTTP transport infrastructure that all provider plugins will use for API communication.

## Purpose and Functionality

- Implement concrete HTTP transport with injected fetch support
- Enable Server-Sent Events (SSE) and chunked response streaming
- Normalize HTTP errors to typed Bridge error classes
- Provide request/response redaction hooks for security
- Support platform-agnostic HTTP operations across Node.js, Electron, and React Native

## Scope Boundaries

**In Scope**: Core transport, streaming parsing, error normalization, redaction hooks
**Out of Scope**: Response caching and rate limiting (deferred to Phase 10), advanced retry logic, connection pooling

## Key Components to Implement

### 1. HTTP Transport Implementation

- **File**: `src/core/transport/httpTransport.ts`
- Implement the `Transport` interface with concrete HTTP functionality
- Use injected fetch function for platform compatibility
- Handle request/response lifecycle with proper error handling
- Support both standard and streaming HTTP requests

### 2. SSE (Server-Sent Events) Parser

- **File**: `src/core/streaming/sseParser.ts`
- Parse SSE format: `data: {...}\n\n` chunks
- Handle multi-line data blocks and event types
- Robust parsing with error recovery for malformed chunks
- Support for `[DONE]` termination signals

### 3. Chunked Response Parser

- **File**: `src/core/streaming/chunkParser.ts`
- Parse chunked transfer encoding responses
- Handle partial JSON objects across chunk boundaries
- Buffer management for incomplete data
- Support various provider streaming formats

### 4. Error Normalization System

- **File**: `src/core/errors/errorNormalizer.ts`
- Map HTTP status codes to Bridge error types
- Provider-agnostic error classification
- Preserve original error context while standardizing format
- Handle network, timeout, and rate limit scenarios

### 5. Request/Response Redaction System

- **File**: `src/core/transport/redactionHooks.ts`
- Configurable redaction rules for sensitive data
- Request header and body redaction (API keys, tokens)
- Response content redaction for logging/debugging
- Pattern-based and field-based redaction strategies

### 6. Interceptor System

- **File**: `src/core/transport/interceptorChain.ts`
- Request interceptors execute in registration order (pre-request)
- Response interceptors execute in reverse registration order (post-response)
- Support async interceptors with error propagation
- Clean separation between request/response interceptor phases

## Detailed Acceptance Criteria

### HTTP Transport Implementation

- ✅ Implements `Transport` interface with `fetch()` and `stream()` methods
- ✅ Uses injected fetch function from `HttpClientConfig`
- ✅ Handles AbortSignal for request cancellation
- ✅ Proper error handling with typed exceptions
- ✅ Request/response interceptor support with defined ordering
- ✅ Platform-agnostic implementation

### Streaming Functionality

- ✅ SSE parsing handles `data:`, `event:`, `id:`, and `retry:` fields
- ✅ Multi-line data block support with proper reconstruction
- ✅ Handles malformed SSE chunks gracefully
- ✅ Chunked response parsing with buffer management
- ✅ Async iterable interface for stream consumption
- ✅ Proper stream termination detection

### Error Normalization

- ✅ HTTP status 400 → `ValidationError` with provider context
- ✅ HTTP status 401/403 → `AuthError` with credential hints
- ✅ HTTP status 429 → `RateLimitError` with retry-after parsing
- ✅ HTTP status 408/504 → `TimeoutError` with timeout context
- ✅ Network errors → `TransportError` with connection details
- ✅ Preserves original error information in context
- ✅ Provider-specific error code mapping support

### Redaction System

- ✅ Redacts `Authorization` headers in request logs
- ✅ Redacts `api-key` headers and similar sensitive fields
- ✅ Configurable redaction patterns via regex
- ✅ Response body redaction for PII and sensitive content
- ✅ Structured logging compatibility with redacted fields
- ✅ Performance-optimized redaction (only when logging enabled)

### Interceptor Ordering Contract

- ✅ Request interceptors execute in registration order: `[pre1, pre2, pre3] → fetch`
- ✅ Response interceptors execute in reverse order: `fetch → [post3, post2, post1]`
- ✅ Error in any interceptor halts chain and propagates
- ✅ Interceptor context passed through chain consistently

### Integration Requirements

- ✅ Works with existing `HttpClient` interface
- ✅ Compatible with `RuntimeAdapter` for platform differences
- ✅ Integrates with existing error taxonomy
- ✅ Supports request/response interceptor patterns
- ✅ Thread-safe and stateless implementation

## Implementation Guidance

### Technical Approach

1. **HTTP Transport**: Use composition over inheritance, injecting fetch via config
2. **Streaming**: Implement async generators for clean stream handling
3. **Error Handling**: Use error factory pattern for consistent error creation
4. **Testing**: Mock fetch responses and stream data for unit tests
5. **Platform Support**: Ensure compatibility across Node.js, Electron, React Native

### Code Patterns to Follow

- Use existing error classes (`TransportError`, `TimeoutError`, `RateLimitError`)
- Follow established file naming conventions
- Maintain ≤400 LOC per module
- Use TypeScript strict mode with no `any` types
- Implement proper resource cleanup for streams

### Security Considerations

- Default redaction for all authorization headers
- Configurable sensitive field patterns
- No logging of complete request/response bodies by default
- Secure handling of streaming data with proper disposal
- AbortSignal support for request cancellation

## Testing Requirements

### Test Organization

**Note**: New tests in `src/core/transport/__tests__` should focus on transport-specific behaviors (httpTransport, SSE parsing, chunking, redaction) and avoid duplicating semantics already covered in existing tests like `providerHttpResponse.test.ts`.

### Unit Tests Required

- ✅ HTTP transport with mocked fetch responses
- ✅ SSE parser with various event formats and malformed data
- ✅ Chunked response parser with partial JSON scenarios
- ✅ Error normalization for all HTTP status codes
- ✅ Redaction system with sensitive data patterns
- ✅ Stream cancellation and cleanup
- ✅ Interceptor chain execution and ordering
- ✅ Platform compatibility tests

### Test Scenarios

- **SSE Parsing**: Multi-line data, empty events, malformed chunks, [DONE] signals
- **Error Mapping**: Network failures, HTTP errors, timeout scenarios
- **Streaming**: Partial chunks, cancellation mid-stream, error during stream
- **Redaction**: API keys, tokens, PII in various request/response formats
- **Interceptors**: Registration order, error propagation, async handling

### Mock Data Requirements

- Sample SSE streams from different providers
- HTTP error responses with provider-specific formats
- Chunked JSON responses with boundary splits
- Various authentication header formats

## Performance Requirements

- ✅ Stream processing with <50ms latency per chunk
- ✅ Memory-efficient buffering for large responses
- ✅ Minimal CPU overhead for redaction (only when needed)
- ✅ Proper backpressure handling in async iterables
- ✅ Resource cleanup on stream termination

## Dependencies

- Existing error classes in `src/core/errors/`
- `Transport` and `HttpClient` interfaces
- `RuntimeAdapter` for platform compatibility
- Jest for unit testing framework

## Files to Create/Modify

- **New**: `src/core/transport/httpTransport.ts`
- **New**: `src/core/streaming/sseParser.ts`
- **New**: `src/core/streaming/chunkParser.ts`
- **New**: `src/core/transport/redactionHooks.ts`
- **New**: `src/core/transport/interceptorChain.ts`
- **Modify**: `src/core/errors/errorNormalizer.ts` (enhance existing)
- **New**: `src/core/transport/__tests__/httpTransport.test.ts`
- **New**: `src/core/streaming/__tests__/sseParser.test.ts`
- **New**: `src/core/streaming/__tests__/chunkParser.test.ts`
- **New**: `src/core/transport/__tests__/redactionHooks.test.ts`
- **New**: `src/core/transport/__tests__/interceptorChain.test.ts`

This feature establishes the critical HTTP transport foundation that all provider implementations will depend on, enabling secure, efficient, and reliable communication with LLM APIs.
