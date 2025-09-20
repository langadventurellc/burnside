---
id: T-add-stream-method-to
title: Add stream method to RuntimeAdapter interface
status: open
priority: high
parent: F-complete-runtime-adapter
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T06:06:50.742Z
updated: 2025-09-20T06:06:50.742Z
---

# Add stream method to RuntimeAdapter interface

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)

The RuntimeAdapter interface currently only supports fetch and timer operations. To enable runtime adapters to handle streaming requests, we need to add a stream method that returns both HTTP metadata and stream data to match HttpTransport expectations for StreamResponse.

## Reference Implementation

- Current RuntimeAdapter interface: `src/core/runtime/runtimeAdapter.ts`
- Current HttpTransport streaming: `src/core/transport/httpTransport.ts:303` (returns StreamResponse with status, statusText, headers, stream)
- StreamResponse type: `src/core/transport/streamResponse.ts`

## Implementation Requirements

### Interface Update

Add the following method to the RuntimeAdapter interface:

```typescript
/**
 * Perform HTTP streaming operation with metadata.
 * Platform-specific streaming fetch implementations that return both
 * HTTP response metadata and the streaming data.
 *
 * @param input - URL or Request object
 * @param init - Request configuration options
 * @returns Promise resolving to streaming response with metadata
 */
stream(input: string | URL, init?: RequestInit): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  stream: AsyncIterable<Uint8Array>;
}>;
```

### StreamResponse Compatibility

The return type should match what HttpTransport needs for StreamResponse:

```typescript
// HttpTransport can directly use the adapter response:
const adapterResponse = await this.runtimeAdapter.stream(url, init);
return {
  status: adapterResponse.status,
  statusText: adapterResponse.statusText,
  headers: adapterResponse.headers,
  stream: adapterResponse.stream,
};
```

### Documentation Requirements

- Add comprehensive JSDoc comments explaining the streaming contract
- Document cancellation support via AbortSignal in init.signal
- Explain platform-specific behavior differences
- Add usage examples for different content types (SSE vs regular streams)
- Document the metadata requirements for HTTP response details

## Acceptance Criteria

### Interface Definition

- [ ] `stream()` method added to RuntimeAdapter interface in `src/core/runtime/runtimeAdapter.ts`
- [ ] Method signature returns `Promise<{status: number, statusText: string, headers: Record<string, string>, stream: AsyncIterable<Uint8Array>}>`
- [ ] Method accepts same parameters as fetch: `(input: string | URL, init?: RequestInit)`
- [ ] Return type is directly compatible with StreamResponse requirements
- [ ] Comprehensive JSDoc documentation added with examples and cancellation behavior

### Type Compatibility

- [ ] Return type enables HttpTransport.stream() to create accurate StreamResponse objects
- [ ] HTTP metadata (status, statusText, headers) accessible for error handling
- [ ] AbortSignal cancellation support documented in interface
- [ ] TypeScript compilation succeeds without errors
- [ ] All existing RuntimeAdapter implementations show compilation errors (expected until implementations added)

### Documentation Updates

- [ ] Interface documentation explains streaming vs fetch use cases
- [ ] Platform-specific behavior differences documented
- [ ] Cancellation behavior via AbortSignal clearly explained
- [ ] Usage examples added for different streaming scenarios
- [ ] HTTP metadata requirements clearly documented

## Testing Requirements

- Write unit tests for interface type checking
- Verify TypeScript compilation behavior
- Test that existing adapter implementations need updates (compilation errors expected)

## Security Considerations

- Document input validation requirements for streaming URLs
- Explain cancellation requirements to prevent resource leaks
- Document HTTP status code validation requirements

## Out of Scope

- Implementation in platform adapters (handled by separate tasks)
- Transport layer integration (separate task)
- React Native SSE specifics (handled in adapter implementation tasks)

## Files to Modify

- `src/core/runtime/runtimeAdapter.ts` - Add stream method to interface

## Implementation Notes

This task establishes the contract that all subsequent adapter implementation tasks will follow. The interface should be designed to support:

- Standard HTTP streaming with full metadata for Node.js/Electron
- React Native SSE integration via react-native-sse with metadata extraction
- Proper cancellation via AbortSignal
- Error handling and platform-specific considerations
- Direct compatibility with HttpTransport StreamResponse requirements
