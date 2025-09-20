---
id: T-implement-stream-method-in
title: Implement stream method in NodeRuntimeAdapter with lazy loading
status: open
priority: high
parent: F-complete-runtime-adapter
prerequisites:
  - T-add-stream-method-to
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T06:07:17.488Z
updated: 2025-09-20T06:07:17.488Z
---

# Implement stream method in NodeRuntimeAdapter with lazy loading

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)
Prerequisites: T-add-stream-method-to (RuntimeAdapter interface updated)

Implement the stream method in NodeRuntimeAdapter to provide streaming capabilities with HTTP metadata for Node.js environments. This task also addresses bundle safety by implementing lazy loading for Node.js-specific imports to prevent React Native bundle failures.

## Reference Implementation

- NodeRuntimeAdapter: `src/core/runtime/adapters/nodeRuntimeAdapter.ts`
- Current HttpTransport streaming: `src/core/transport/httpTransport.ts:303-525`
- Updated RuntimeAdapter interface from T-add-stream-method-to

## Implementation Requirements

### Stream Method Implementation

```typescript
async stream(input: string | URL, init?: RequestInit): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  stream: AsyncIterable<Uint8Array>;
}> {
  try {
    // Use global fetch (available in Node 18+)
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
        { status: response.status, statusText: response.statusText }
      );
    }

    // Return metadata + stream
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      stream: this.createAsyncIterable(body, init?.signal),
    };
  } catch (error) {
    throw new RuntimeError(
      `HTTP stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      "RUNTIME_HTTP_ERROR",
      { input: input.toString(), init, originalError: error }
    );
  }
}
```

### Lazy Loading Implementation

Update file operations to use lazy loading for bundle safety:

```typescript
async readFile(path: string, options?: FileOperationOptions): Promise<string> {
  try {
    // Lazy load to prevent React Native bundle issues
    const { promises: fs } = await import('node:fs');
    const encoding = options?.encoding ?? "utf8";
    return await fs.readFile(path, { encoding });
  } catch (error) {
    throw new RuntimeError(
      `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
      "RUNTIME_FILE_ERROR",
      { operation: "readFile", path, options, originalError: error }
    );
  }
}

async writeFile(path: string, content: string, options?: FileOperationOptions): Promise<void> {
  try {
    const { promises: fs } = await import('node:fs');
    const encoding = options?.encoding ?? "utf8";

    if (options?.createDirectories) {
      const pathModule = await import('node:path');
      const dir = pathModule.dirname(path);
      await fs.mkdir(dir, { recursive: true });
    }

    await fs.writeFile(path, content, { encoding });
  } catch (error) {
    throw new RuntimeError(
      `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
      "RUNTIME_FILE_ERROR",
      { operation: "writeFile", path, contentLength: content.length, options, originalError: error }
    );
  }
}
```

### Helper Method for Stream Conversion

```typescript
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
- [ ] Method uses globalThis.fetch for HTTP streaming
- [ ] HTTP metadata properly extracted from fetch Response (status, statusText, headers)
- [ ] Headers converted from Headers object to Record<string, string>
- [ ] Proper error handling with RuntimeError wrapping
- [ ] Empty body validation with clear error messages
- [ ] AbortSignal cancellation support implemented

### Lazy Loading Implementation

- [ ] `readFile()` method uses lazy loading: `await import('node:fs')`
- [ ] `writeFile()` method uses lazy loading for both 'node:fs' and 'node:path'
- [ ] `fileExists()` method updated to use lazy loading
- [ ] All Node.js imports are dynamically imported to prevent React Native bundle issues
- [ ] Error handling preserved for all file operations

### Stream Conversion Logic

- [ ] Helper method `createAsyncIterable()` converts ReadableStream to AsyncIterable
- [ ] Cancellation checking on each iteration via AbortSignal
- [ ] Proper resource cleanup with reader.releaseLock() in finally block
- [ ] Stream chunks yielded as Uint8Array without modification

### HTTP Metadata Extraction

- [ ] Response status code correctly captured
- [ ] Response status text correctly captured
- [ ] All response headers converted to Record<string, string> format
- [ ] No information loss during metadata extraction

### Error Handling

- [ ] Consistent RuntimeError usage with appropriate error codes
- [ ] Original error preservation in error context
- [ ] Network failures properly wrapped and reported
- [ ] Stream-specific error scenarios handled (empty body, cancellation)
- [ ] HTTP error status codes preserved in error context

## Testing Requirements

- Write unit tests for stream method with mock fetch responses
- Test HTTP metadata extraction from various response types
- Test cancellation behavior with AbortSignal
- Test error scenarios (network failure, empty body, HTTP errors)
- Verify lazy loading works correctly for file operations
- Test AsyncIterable conversion from ReadableStream

## Security Considerations

- Validate input URLs to prevent malicious requests
- Ensure proper cancellation prevents resource leaks
- Maintain existing error handling patterns
- Preserve HTTP status code information for security decisions

## Performance Requirements

- Stream startup time should be minimal
- Memory usage should be efficient for large streams
- Cancellation should be responsive (within 100ms)
- HTTP metadata extraction should have minimal overhead

## Out of Scope

- React Native SSE integration (separate task)
- Transport layer integration (separate task)
- HttpTransport modifications (separate task)

## Files to Modify

- `src/core/runtime/adapters/nodeRuntimeAdapter.ts` - Add stream method and update file operations for lazy loading

## Implementation Notes

- Use existing RuntimeError patterns from other adapter methods
- Follow the same error handling structure as the fetch method
- Return type must match the RuntimeAdapter interface exactly
- Lazy loading prevents React Native bundler from including Node.js-specific modules
- HTTP metadata extraction is critical for proper error handling and response processing
