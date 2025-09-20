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
    AsyncIterable conversion
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
log: []
schema: v1.0
childrenIds:
  - T-implement-stream-method-in-2
  - T-implement-stream-method-in
  - T-replace-direct-timer-usage-in-1
  - T-replace-direct-timer-usage-in-2
  - T-replace-direct-timer-usage-in-3
  - T-replace-direct-timer-usage-in
  - T-update-bridgeclient-to-use
  - T-update-httptransport-to-use
  - T-add-stream-method-to
  - T-implement-stream-method-in-1
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
