---
id: F-complete-runtime-adapter
title: Complete Runtime Adapter Integration
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/runtime/runtimeAdapter.ts: Added stream method to RuntimeAdapter
    interface with comprehensive JSDoc documentation including platform-specific
    behavior notes, cancellation support via AbortSignal, and multiple usage
    examples
  src/core/runtime/adapters/nodeRuntimeAdapter.ts:
    Added functional stream method
    implementation using Node.js fetch with proper error handling and
    AsyncIterable conversion; Enhanced stream method with AbortSignal
    cancellation support using createAsyncIterable helper method, implemented
    lazy loading for all Node.js imports (node:fs, node:path) in readFile,
    writeFile, and fileExists methods to prevent React Native bundle failures
  src/core/runtime/adapters/electronRuntimeAdapter.ts: Added functional stream
    method implementation using Electron renderer fetch with proper error
    handling and AsyncIterable conversion; Enhanced stream method with
    AbortSignal cancellation support, added platform context to error messages,
    and refactored to use helper method createAsyncIterable() for consistent
    resource management
  src/core/runtime/adapters/reactNativeRuntimeAdapter.ts:
    "Added functional stream
    method implementation using React Native fetch with notes for future
    react-native-sse integration; Added complete stream method implementation
    with SSE support including: SSE detection based on Accept headers, lazy
    loading of react-native-sse library, graceful fallback to standard
    streaming, HTTP metadata extraction helper methods, proper AbortSignal
    cancellation support, and comprehensive error handling with platform
    context"
  src/core/runtime/__tests__/adapterRegistry.test.ts: Added stream method mock to test adapter to satisfy interface requirements
  src/core/runtime/__tests__/runtimeAdapter.test.ts: Added stream method mock
    implementation to test adapter with proper AsyncIterable structure
  src/core/runtime/adapters/__tests__/reactNativeRuntimeAdapter.test.ts:
    "Added comprehensive test coverage for new stream method functionality
    including: standard streaming tests, SSE detection tests, fallback behavior
    tests, error handling tests, and AbortSignal cancellation tests"
  src/core/runtime/__tests__/nodeRuntimeAdapter.test.ts:
    Added comprehensive test
    coverage for stream method including AbortSignal cancellation, HTTP metadata
    extraction, error scenarios, and empty stream handling; updated all file
    operation tests to work with lazy loading mocks
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
  src/client/bridgeClient.ts: "Complete RuntimeAdapter integration: Updated
    imports to add RuntimeAdapter and AdapterRegistry while removing unused
    HttpClientConfig and FetchFunction imports. Added optional runtimeAdapter
    parameter to constructor dependencies interface. Added private readonly
    runtimeAdapter property. Implemented adapter resolution logic with
    comprehensive error handling including platform detection for debugging
    context. Updated transport creation to pass RuntimeAdapter directly instead
    of creating HttpClientConfig with globalThis.fetch. Replaced setTimeout and
    clearTimeout calls in createTimeoutSignal method with RuntimeAdapter timer
    methods for true platform abstraction.; Updated ToolRouter instantiation to
    pass this.runtimeAdapter as third parameter"
  src/core/tools/executionContext.ts: Added RuntimeAdapter import and
    runtimeAdapter property to ExecutionContext interface for platform-agnostic
    timer operations
  src/core/tools/pipelineExecution.ts: Replaced direct setTimeout/clearTimeout
    calls with runtime adapter timer methods, changed NodeJS.Timeout to
    TimerHandle type, maintained exact same timeout behavior
  src/core/tools/toolExecutionPipeline.ts: Added RuntimeAdapter parameter to
    execute method and included runtimeAdapter in ExecutionContext creation
  src/core/tools/toolRouter.ts: Added RuntimeAdapter to constructor parameters,
    stored as class property, and passed to pipeline.execute calls
  src/core/tools/__tests__/toolRouter.test.ts: Added mock RuntimeAdapter setup
    that works with Jest fake timers and updated all ToolRouter instantiations
    to include runtime adapter parameter, added test timeout for timer tests
  src/core/tools/__tests__/toolExecutionPipeline.test.ts: Added mock
    RuntimeAdapter to test setup that works with Jest fake timers, updated all
    pipeline.execute calls to include runtime adapter, fixed executeToolHandler
    direct tests with proper runtime adapter mock, added test timeouts for timer
    tests
  src/core/tools/__tests__/toolExecutionStrategy.test.ts: Added mock
    RuntimeAdapter setup and updated ToolRouter instantiations for strategy
    tests
  src/core/tools/__tests__/toolExecutionCancellation.test.ts: Added mock
    RuntimeAdapter setup and updated ToolRouter instantiation for cancellation
    tests
  src/core/agent/__tests__/agentLoop.test.ts:
    Added mock RuntimeAdapter setup and
    updated ToolRouter instantiation for agent loop tests
  src/core/agent/__tests__/terminationIntegration.test.ts: Added mock
    RuntimeAdapter setup and updated ToolRouter instantiation for termination
    integration tests
log: []
schema: v1.0
childrenIds:
  - T-replace-direct-timer-usage-in-1
  - T-replace-direct-timer-usage-in-2
  - T-replace-direct-timer-usage-in-3
  - T-replace-direct-timer-usage-in
  - T-add-stream-method-to
  - T-implement-stream-method-in-1
  - T-implement-stream-method-in-2
  - T-implement-stream-method-in
  - T-update-bridgeclient-to-use
  - T-update-httptransport-to-use
created: 2025-09-20T05:58:55.351Z
updated: 2025-09-20T05:58:55.351Z
---

# Complete Runtime Adapter Integration

## Purpose

Fully integrate the existing runtime adapter system throughout the LLM Bridge library to provide true platform abstraction for HTTP operations, streaming, and timers across Node.js, Electron, and React Native environments.

## Current State Analysis

- Runtime adapters exist with fetch and timer support
- BridgeClient partially integrates runtime adapters (fetch and createTimeoutSignal)
- Stream functionality is missing from runtime adapters
- Direct timer usage exists in multiple components
- React Native SSE support needs implementation
- Transport layer doesn't use runtime adapters for streaming

## Key Components to Implement

### 1. Runtime Adapter Stream Support

- Add `stream()` method to RuntimeAdapter interface matching transport expectations
- Implement platform-specific streaming in all adapter implementations
- Add React Native SSE support using react-native-sse peer dependency with lazy loading
- Handle stream cancellation and error scenarios

### 2. BridgeClient Runtime Adapter Integration

- Complete integration of runtime adapter throughout BridgeClient
- Replace globalThis.fetch usage with runtime adapter
- Ensure adapter is resolved via AdapterRegistry and injected into transport
- Handle adapter initialization failures gracefully

### 3. Transport Layer Integration

- Update HttpTransport to use runtime adapters for streaming operations
- Remove direct fetch usage from transport configuration
- Ensure proper stream response handling across platforms

### 4. Timer Usage Migration

- Replace direct setTimeout/setInterval usage throughout codebase
- Update components to use runtime adapter timer methods
- Maintain existing timeout/cancellation functionality

### 5. Platform-Specific Implementation & Bundle Safety

- Node.js: Use standard fetch streaming
- Electron: Use platform-appropriate streaming based on process type
- React Native: Integrate react-native-sse with lazy loading for bundle safety
- Add platform guards for Node.js specific imports (node:fs) to prevent React Native bundle issues

## Detailed Acceptance Criteria

### BridgeClient Runtime Adapter Integration (Critical)

- [ ] BridgeClient constructor resolves runtime adapter via AdapterRegistry.getInstance().getAdapter()
- [ ] BridgeClient passes runtime adapter to HttpTransport instead of bare fetch function
- [ ] BridgeClient uses runtime adapter for all timer operations (replaces direct setTimeout in createTimeoutSignal)
- [ ] Runtime adapter injection works via dependency injection (BridgeClientDependencies.runtimeAdapter)
- [ ] Graceful error handling when runtime adapter resolution fails with clear error messages

### Runtime Adapter Interface Updates

- [ ] Add `stream(input: string | URL, init?: RequestInit): Promise<AsyncIterable<Uint8Array>>` method to RuntimeAdapter interface
- [ ] All platform adapters implement stream method returning AsyncIterable<Uint8Array> to match HttpTransport expectations
- [ ] Stream cancellation works via AbortSignal across all platforms
- [ ] React Native adapter uses react-native-sse for SSE streams when content-type is text/event-stream

### Platform Bundle Safety

- [ ] Node.js imports (node:fs, node:path) are lazy-loaded or guarded to prevent React Native bundle failures
- [ ] react-native-sse is lazy-loaded in React Native adapter to avoid import errors when not available
- [ ] Platform detection works correctly during adapter initialization
- [ ] AdapterRegistry initialization handles missing platform dependencies gracefully

### Timer System Integration

- [ ] All direct setTimeout/clearTimeout calls replaced with runtime adapter calls in:
  - Tool execution pipeline (`src/core/tools/pipelineExecution.ts`)
  - Transport retry logic (`src/core/transport/retry/delayPromise.ts`)
  - Agent loop timeouts (`src/core/agent/agentLoop.ts`)
  - Cancellation managers (`src/core/agent/cancellation/`)
  - Stream cancellation handlers
- [ ] Timer handles properly managed across platform boundaries
- [ ] No breaking changes to existing timeout/cancellation APIs

### Transport Layer Updates

- [ ] HttpTransport constructor accepts RuntimeAdapter instead of HttpClientConfig with bare fetch
- [ ] HttpTransport.stream() method uses runtime adapter for streaming (single network call, not fetch + stream)
- [ ] HttpTransport.fetch() method uses runtime adapter
- [ ] Streaming responses work correctly across all supported platforms
- [ ] Error handling preserved for network and stream failures

### React Native SSE Support

- [ ] react-native-sse library integration for Server-Sent Events with lazy loading
- [ ] Proper content-type detection for SSE vs regular streams
- [ ] Error handling for React Native specific streaming scenarios
- [ ] Graceful fallback when react-native-sse is not available

### Cross-Platform Compatibility

- [ ] All existing streaming functionality works on Node.js
- [ ] Electron main and renderer processes handle streaming correctly
- [ ] React Native streaming works with and without SSE support
- [ ] No platform-specific code outside of runtime adapters
- [ ] Bundle compatibility across all target platforms

### Error Handling and Logging

- [ ] Consistent error types across platform adapter implementations
- [ ] Proper error propagation from adapter layer to application layer
- [ ] Debug logging for adapter selection and stream operations
- [ ] Graceful degradation when platform features unavailable

### Testing Requirements

- [ ] Unit tests for all runtime adapter stream implementations
- [ ] Integration tests for timer replacement in critical paths
- [ ] Cross-platform compatibility tests for streaming
- [ ] Error scenario tests for network failures and cancellation
- [ ] React Native SSE integration tests (mock-based)
- [ ] Bundle safety tests for platform-specific imports

## Implementation Guidance

### Stream Implementation Pattern

```typescript
// Runtime adapter stream method signature - returns AsyncIterable to match transport
async stream(input: string | URL, init?: RequestInit): Promise<AsyncIterable<Uint8Array>> {
  // Platform-specific streaming implementation
  // Handle cancellation via AbortSignal
  // Return AsyncIterable<Uint8Array> that HttpTransport expects
  // For React Native: convert react-native-sse events to AsyncIterable
}
```

### BridgeClient Integration Pattern

```typescript
// BridgeClient constructor - resolve and use runtime adapter
constructor(config: BridgeConfig, deps?: BridgeClientDependencies) {
  // Resolve runtime adapter for platform operations
  this.runtimeAdapter = deps?.runtimeAdapter ?? AdapterRegistry.getInstance().getAdapter();

  // Pass adapter to transport instead of bare fetch
  const baseTransport = new HttpTransport(
    this.runtimeAdapter,
    interceptors,
    errorNormalizer,
  );
}
```

### Timer Migration Pattern

```typescript
// Before: Direct timer usage
const timer = setTimeout(() => controller.abort(), timeoutMs);
clearTimeout(timer);

// After: Runtime adapter usage
const timer = this.runtimeAdapter.setTimeout(
  () => controller.abort(),
  timeoutMs,
);
this.runtimeAdapter.clearTimeout(timer);
```

### Transport Integration Pattern

```typescript
// Transport should receive runtime adapter and use its methods
class HttpTransport {
  constructor(
    private readonly runtimeAdapter: RuntimeAdapter,
    private readonly interceptors: InterceptorChain,
    private readonly errorNormalizer: HttpErrorNormalizer
  ) {}

  async stream(request: ProviderHttpRequest): Promise<StreamResponse> {
    // Single network call using adapter stream method
    const stream = await this.runtimeAdapter.stream(request.url, {...});
    // Process and return StreamResponse with HTTP metadata + stream
    return { status, statusText, headers, stream };
  }
}
```

### Platform Safety Pattern

```typescript
// React Native adapter - lazy load react-native-sse
async stream(input: string | URL, init?: RequestInit): Promise<AsyncIterable<Uint8Array>> {
  try {
    // Lazy load to prevent bundle issues
    const { EventSource } = await import('react-native-sse');
    // Use EventSource for SSE streams
  } catch (error) {
    // Fallback to standard fetch streaming
  }
}

// Node adapter - lazy load node modules
async readFile(path: string): Promise<string> {
  const { promises: fs } = await import('node:fs');
  return fs.readFile(path, 'utf8');
}
```

## Security Considerations

- Validate stream inputs to prevent malicious URLs
- Ensure proper cancellation prevents resource leaks
- Maintain existing authentication and authorization flows
- Protect against streaming abuse with timeouts and limits

## Performance Requirements

- Stream startup time should not increase significantly
- Timer operations should have minimal overhead
- Memory usage should not increase due to adapter abstraction
- Cancellation should be responsive (within 100ms for streams)

## Dependencies

- No new external dependencies except leveraging existing react-native-sse peer dependency
- No breaking changes to public APIs
- Backward compatibility with existing configuration patterns

## Files to Modify

- `src/core/runtime/runtimeAdapter.ts` - Add stream method to interface
- `src/core/runtime/adapters/` - All adapter implementations with platform safety
- `src/core/transport/httpTransport.ts` - Accept runtime adapter, use for streaming
- `src/core/transport/httpClientConfig.ts` - Update to accept runtime adapter
- `src/core/tools/pipelineExecution.ts` - Replace direct timer usage
- `src/core/transport/retry/delayPromise.ts` - Use adapter timers
- `src/core/agent/` - Update cancellation and timeout logic
- `src/client/bridgeClient.ts` - Complete adapter integration (remove globalThis usage)

## Testing Strategy

- Mock runtime adapters for unit testing components
- Integration tests with real adapters for E2E validation
- Platform-specific test suites for adapter implementations
- Error injection tests for failure scenarios
- Performance regression tests for timing-sensitive operations
- Bundle compatibility tests for React Native builds
