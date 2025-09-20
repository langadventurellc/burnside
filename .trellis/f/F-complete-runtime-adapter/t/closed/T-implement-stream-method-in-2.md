---
id: T-implement-stream-method-in-2
title: Implement stream method in ReactNativeRuntimeAdapter with SSE support
status: done
priority: high
parent: F-complete-runtime-adapter
prerequisites:
  - T-add-stream-method-to
affectedFiles:
  src/core/runtime/adapters/reactNativeRuntimeAdapter.ts: "Added complete stream
    method implementation with SSE support including: SSE detection based on
    Accept headers, lazy loading of react-native-sse library, graceful fallback
    to standard streaming, HTTP metadata extraction helper methods, proper
    AbortSignal cancellation support, and comprehensive error handling with
    platform context"
  src/core/runtime/adapters/__tests__/reactNativeRuntimeAdapter.test.ts:
    "Added comprehensive test coverage for new stream method functionality
    including: standard streaming tests, SSE detection tests, fallback behavior
    tests, error handling tests, and AbortSignal cancellation tests"
log:
  - Successfully implemented stream method in ReactNativeRuntimeAdapter with
    comprehensive SSE support. The implementation includes SSE detection based
    on Accept headers, lazy loading of react-native-sse library to prevent
    bundle issues, graceful fallback to standard streaming when SSE is
    unavailable, proper HTTP metadata extraction for both SSE and standard
    streams, AbortSignal cancellation support, and comprehensive error handling
    with platform-specific context. All functionality has been thoroughly tested
    with 28 passing unit tests covering standard streaming, SSE detection,
    fallback behavior, error scenarios, and cancellation handling.
schema: v1.0
childrenIds: []
created: 2025-09-20T06:08:12.503Z
updated: 2025-09-20T06:08:12.503Z
---

# Implement stream method in ReactNativeRuntimeAdapter with SSE support

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)
Prerequisites: T-add-stream-method-to (RuntimeAdapter interface updated)

Implement the stream method in ReactNativeRuntimeAdapter with Server-Sent Events (SSE) support using the react-native-sse peer dependency. This implementation requires lazy loading to prevent bundle issues when the library is not available and must return HTTP metadata along with the stream.

## Reference Implementation

- ReactNativeRuntimeAdapter: `src/core/runtime/adapters/reactNativeRuntimeAdapter.ts`
- NodeRuntimeAdapter stream implementation: T-implement-stream-method-in
- React Native SSE peer dependency: `react-native-sse` (already in package.json)
- Updated RuntimeAdapter interface from T-add-stream-method-to

## Implementation Requirements

### Stream Method with SSE Support

```typescript
async stream(input: string | URL, init?: RequestInit): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  stream: AsyncIterable<Uint8Array>;
}> {
  try {
    // Detect content type for SSE handling
    const url = input.toString();
    const isSSE = this.shouldUseSSE(init?.headers);

    if (isSSE) {
      return this.createSSEStream(url, init);
    } else {
      return this.createStandardStream(input, init);
    }
  } catch (error) {
    throw new RuntimeError(
      `HTTP stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      "RUNTIME_HTTP_ERROR",
      {
        input: input.toString(),
        init,
        platform: "react-native",
        originalError: error,
      }
    );
  }
}
```

### SSE Stream Implementation with Metadata

```typescript
private async createSSEStream(url: string, init?: RequestInit): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  stream: AsyncIterable<Uint8Array>;
}> {
  try {
    // Lazy load react-native-sse to prevent bundle issues
    const { EventSource } = await import('react-native-sse');

    // For SSE, we need to extract metadata from a HEAD request first
    // since EventSource doesn't provide full HTTP response details
    const headResponse = await globalThis.fetch(url, {
      ...init,
      method: 'HEAD',
    });

    const headers: Record<string, string> = {};
    headResponse.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: headResponse.status,
      statusText: headResponse.statusText,
      headers,
      stream: this.createSSEAsyncIterable(url, init),
    };
  } catch (importError) {
    // Fallback to standard streaming if react-native-sse not available
    console.warn('react-native-sse not available, falling back to standard streaming');
    return this.createStandardStream(url, init);
  }
}

private async *createSSEAsyncIterable(url: string, init?: RequestInit): AsyncIterable<Uint8Array> {
  const { EventSource } = await import('react-native-sse');

  const eventSource = new EventSource(url, {
    headers: init?.headers as Record<string, string> || {},
    method: init?.method || 'GET',
  });

  try {
    while (true) {
      // Check for cancellation
      if (init?.signal?.aborted) {
        throw new Error("Stream was aborted");
      }

      const event = await this.waitForSSEEvent(eventSource);
      if (event.type === 'close') {
        break;
      }

      if (event.data) {
        yield new TextEncoder().encode(event.data);
      }
    }
  } finally {
    eventSource.close();
  }
}

private waitForSSEEvent(eventSource: any): Promise<{type: string, data?: string}> {
  return new Promise((resolve, reject) => {
    const onMessage = (event: any) => {
      cleanup();
      resolve({ type: 'message', data: event.data });
    };

    const onError = (error: any) => {
      cleanup();
      reject(error);
    };

    const onClose = () => {
      cleanup();
      resolve({ type: 'close' });
    };

    const cleanup = () => {
      eventSource.removeEventListener('message', onMessage);
      eventSource.removeEventListener('error', onError);
      eventSource.removeEventListener('close', onClose);
    };

    eventSource.addEventListener('message', onMessage);
    eventSource.addEventListener('error', onError);
    eventSource.addEventListener('close', onClose);
  });
}
```

### Standard Stream Fallback with Metadata

```typescript
private async createStandardStream(input: string | URL, init?: RequestInit): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  stream: AsyncIterable<Uint8Array>;
}> {
  // Use React Native's fetch implementation
  const response = await globalThis.fetch(input, init);

  // Extract HTTP metadata
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Validate response has body
  const body = response.body;
  if (!body) {
    throw new RuntimeError(
      "Response body is empty for streaming request",
      "RUNTIME_HTTP_ERROR",
      {
        status: response.status,
        statusText: response.statusText,
        platform: "react-native"
      }
    );
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    stream: this.createAsyncIterable(body, init?.signal),
  };
}
```

### Content Type Detection and Helper Methods

```typescript
private shouldUseSSE(headers?: HeadersInit): boolean {
  if (!headers) return false;

  const headersObj = headers instanceof Headers ?
    Object.fromEntries(headers.entries()) :
    headers as Record<string, string>;

  const accept = headersObj['accept'] || headersObj['Accept'] || '';
  return accept.includes('text/event-stream');
}

private async *createAsyncIterable(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncIterable<Uint8Array> {
  const reader = stream.getReader();

  try {
    while (true) {
      // Check for cancellation
      if (signal?.aborted) {
        throw new Error("Stream was aborted");
      }

      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        yield value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

## Acceptance Criteria

### Stream Method Implementation

- [ ] `stream()` method implemented returning object with `{status, statusText, headers, stream}`
- [ ] Content type detection for SSE vs standard streams
- [ ] Lazy loading of react-native-sse library to prevent bundle issues
- [ ] Graceful fallback to standard streaming when SSE library unavailable
- [ ] Platform-specific error context includes "react-native" identifier

### SSE Integration with Metadata

- [ ] react-native-sse library lazy loaded with `await import('react-native-sse')`
- [ ] HTTP metadata extracted via HEAD request before SSE streaming
- [ ] EventSource properly configured with URL, headers, and method
- [ ] SSE events converted to AsyncIterable<Uint8Array> format
- [ ] Event data properly encoded as UTF-8 bytes
- [ ] EventSource cleanup in finally block

### Standard Stream Fallback with Metadata

- [ ] Uses React Native's globalThis.fetch for non-SSE streams
- [ ] HTTP metadata properly extracted from fetch Response (status, statusText, headers)
- [ ] Headers converted from Headers object to Record<string, string>
- [ ] Empty body validation with clear error messages
- [ ] AbortSignal cancellation support implemented

### Error Handling & Lazy Loading

- [ ] Import errors for react-native-sse handled gracefully
- [ ] Console warning when falling back from SSE to standard streaming
- [ ] Consistent RuntimeError usage with appropriate error codes
- [ ] Original error preservation in error context
- [ ] Platform identification in all error contexts
- [ ] HTTP error status codes preserved in error context

### Content Type Detection

- [ ] `shouldUseSSE()` method detects 'text/event-stream' in Accept headers
- [ ] Handles Headers object and plain object header formats
- [ ] Case-insensitive header checking (Accept vs accept)
- [ ] Defaults to false when headers not provided

## Testing Requirements

- Write unit tests for stream method with both SSE and standard modes
- Mock react-native-sse import for testing SSE functionality
- Test metadata extraction for both SSE and standard streams
- Test fallback behavior when react-native-sse import fails
- Test content type detection logic
- Test cancellation behavior with AbortSignal
- Test error scenarios (network failure, empty body, HTTP errors)

## Security Considerations

- Validate input URLs to prevent malicious requests
- Ensure proper cancellation prevents resource leaks
- Maintain existing error handling patterns
- Validate headers to prevent header injection
- Preserve HTTP status code information for security decisions

## Performance Requirements

- Stream startup time should be minimal
- Lazy loading should not significantly impact performance
- Memory usage should be efficient for large streams
- Cancellation should be responsive (within 100ms)
- HTTP metadata extraction should have minimal overhead

## Out of Scope

- Node.js/Electron streaming (separate tasks)
- Transport layer integration (separate task)
- HttpTransport modifications (separate task)
- react-native-sse library implementation details

## Files to Modify

- `src/core/runtime/adapters/reactNativeRuntimeAdapter.ts` - Add stream method with SSE support

## Implementation Notes

- The react-native-sse library is already a peer dependency in package.json
- Lazy loading prevents bundler issues when the library is not installed
- SSE detection should be based on Accept headers as that's the standard approach
- EventSource needs proper cleanup to prevent memory leaks
- HEAD request for SSE metadata extraction is necessary since EventSource doesn't provide full HTTP response details
- Fall back gracefully when SSE is not available to maintain compatibility
- HTTP metadata extraction is critical for proper error handling and response processing
