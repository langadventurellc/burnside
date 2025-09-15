---
id: T-update-providerplugin
title: Update ProviderPlugin interface to support async parseResponse for
  ReadableStream body reading
status: done
priority: high
parent: F-openai-v1-provider-implementat
prerequisites: []
affectedFiles:
  src/core/providers/providerPlugin.ts:
    Updated parseResponse method signature to
    return Promise<ResponseObject> for non-streaming responses, updated JSDoc
    examples to show async/await usage patterns
  src/core/validation/providerSchemas.ts: Enhanced parseResponse validation to
    accept functions returning Promise or AsyncIterable using Zod union type
  src/core/providers/inMemoryProviderRegistry.ts: Updated provider registration
    validation to accept async parseResponse functions
  src/providers/openai-responses-v1/index.ts: Implemented async parseResponse
    method with ReadableStream body reading, added private readResponseBody
    method with proper stream handling and error management
  src/core/providers/__tests__/providerRegistry.test.ts: Updated test mocks to
    return promises using Promise.resolve for async parseResponse behavior
  src/client/__tests__/bridgeClientRegistries.test.ts: Changed jest mocks from
    mockReturnValue to mockResolvedValue for async parseResponse testing
  src/core/validation/__tests__/providerSchemas.test.ts: Updated test functions to async for parseResponse validation compatibility
  src/providers/openai-responses-v1/__tests__/index.test.ts: Updated tests to
    handle new async parseResponse behavior, added tests for ValidationError on
    null response body and streaming NOT_IMPLEMENTED behavior
log:
  - "Successfully updated ProviderPlugin interface to support async
    parseResponse for ReadableStream body reading. Implementation includes: 1)
    Updated core interface to return Promise<ResponseObject> for non-streaming
    responses while maintaining AsyncIterable<StreamDelta> for streaming, 2)
    Enhanced validation schemas to accept both async and sync function
    implementations, 3) Implemented async parseResponse in OpenAI provider with
    proper ReadableStream reading logic, 4) Updated all test mocks to use async
    patterns with mockResolvedValue, 5) Added comprehensive error handling for
    null response bodies and stream reading failures. All quality checks and
    tests pass successfully."
schema: v1.0
childrenIds: []
created: 2025-09-15T20:40:14.731Z
updated: 2025-09-15T20:40:14.731Z
---

# Update ProviderPlugin Interface for Async Response Parsing

## Problem Context

The current `ProviderPlugin.parseResponse()` method has a design limitation that prevents proper implementation of response parsing for HTTP responses with `ReadableStream<Uint8Array>` bodies. The interface expects synchronous return types, but reading from a ReadableStream requires asynchronous operations.

**Current Issue:**

- `ProviderHttpResponse.body` is `ReadableStream<Uint8Array> | null`
- Reading stream content requires async operations (`reader.read()`)
- `ProviderPlugin.parseResponse()` interface expects synchronous return types
- OpenAI provider implementation is blocked by this interface limitation

**Related Implementation:**

- Task T-implement-response-parser-for has been completed with working async parser logic
- Parser is implemented in `src/providers/openai-responses-v1/responseParser.ts`
- Provider plugin currently throws "Not implemented" due to interface constraint

## Implementation Requirements

### 1. Update ProviderPlugin Interface (`src/core/providers/providerPlugin.ts`)

**Current Signature:**

```typescript
parseResponse(
  response: ProviderHttpResponse,
  isStreaming: boolean,
):
  | {
      message: Message;
      usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens?: number;
      };
      model: string;
      metadata?: Record<string, unknown>;
    }
  | AsyncIterable<StreamDelta>;
```

**Required Update:**

```typescript
parseResponse(
  response: ProviderHttpResponse,
  isStreaming: boolean,
):
  | Promise<{
      message: Message;
      usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens?: number;
      };
      model: string;
      metadata?: Record<string, unknown>;
    }>
  | AsyncIterable<StreamDelta>;
```

**Changes Required:**

- Wrap non-streaming return type in `Promise<...>`
- Update JSDoc documentation examples to show `await` usage
- Update interface comments to reflect async nature
- Preserve existing streaming return type (already async)

### 2. Update Validation Schemas

**Files to Update:**

- `src/core/providers/inMemoryProviderRegistry.ts:20`
- `src/core/validation/providerSchemas.ts:108`

**Current:**

```typescript
parseResponse: z.function(),
```

**Required Update:**

```typescript
parseResponse: z.function().returns(z.union([z.promise(z.any()), z.any()])),
```

**Validation Logic:**

- Accept functions that return either Promise or AsyncIterable
- Maintain backward compatibility with existing validation
- Ensure runtime validation allows async functions

### 3. Update OpenAI Provider Implementation (`src/providers/openai-responses-v1/index.ts`)

**Current Implementation:**

```typescript
parseResponse(response: ProviderHttpResponse, isStreaming: boolean) {
  // Currently throws "Not implemented" due to interface limitation
  throw new BridgeError("Non-streaming response parsing requires async body reading", ...);
}
```

**Required Implementation:**

```typescript
async parseResponse(response: ProviderHttpResponse, isStreaming: boolean) {
  if (isStreaming) {
    throw new BridgeError("Streaming response parsing not implemented", ...);
  }

  // Read response body asynchronously
  const responseText = await this.readResponseBody(response);
  return parseOpenAIResponse(response, responseText);
}

private async readResponseBody(response: ProviderHttpResponse): Promise<string> {
  // Implementation to read ReadableStream to string
}
```

**Implementation Details:**

- Add private method to read ReadableStream to string
- Integrate with existing `parseOpenAIResponse` function
- Handle errors during stream reading
- Maintain proper error context and validation

### 4. Update Test Files

**Files Requiring Updates:**

- `src/client/__tests__/bridgeClientRegistries.test.ts` (lines 146, 183, 213)
- `src/core/providers/__tests__/providerRegistry.test.ts` (lines 28, 123)
- `src/core/validation/__tests__/providerSchemas.test.ts` (lines 238, 364)
- `src/providers/openai-responses-v1/__tests__/index.test.ts` (line 191+)

**Mock Updates Required:**

```typescript
// Current
parseResponse: jest.fn().mockReturnValue({...})

// Updated
parseResponse: jest.fn().mockResolvedValue({...})
```

**Test Logic Updates:**

- Change synchronous test expectations to async/await
- Update mock implementations to return promises
- Ensure test coverage for both success and error cases
- Update assertion patterns for promise-based returns

## Technical Approach

### Step 1: Interface Update

1. Open `src/core/providers/providerPlugin.ts`
2. Locate `parseResponse` method signature (around line 108)
3. Wrap non-streaming return type in `Promise<...>`
4. Update JSDoc examples to demonstrate async usage
5. Update method documentation to clarify async behavior

### Step 2: Validation Schema Updates

1. Update `src/core/providers/inMemoryProviderRegistry.ts`
   - Modify `parseResponse` validation to accept async functions
2. Update `src/core/validation/providerSchemas.ts`
   - Enhance function validation for async return types
   - Test validation accepts both Promise and AsyncIterable returns

### Step 3: OpenAI Provider Implementation

1. Update `src/providers/openai-responses-v1/index.ts`
   - Make `parseResponse` method async
   - Add private `readResponseBody` method
   - Integrate with existing parser logic
   - Maintain error handling and validation

### Step 4: Test Updates

1. Update all test files that mock `parseResponse`
   - Change `mockReturnValue` to `mockResolvedValue`
   - Add `await` to test assertions
   - Update test logic for async behavior
2. Run existing test suites to ensure compatibility
3. Add specific tests for async behavior if needed

### Step 5: Helper Method Implementation

```typescript
private async readResponseBody(response: ProviderHttpResponse): Promise<string> {
  if (!response.body) {
    throw new ValidationError("Response body is null", {
      status: response.status,
      statusText: response.statusText
    });
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Combine chunks and decode to string
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(combined);
}
```

## Acceptance Criteria

### Functional Requirements

- [ ] `ProviderPlugin.parseResponse()` interface accepts async implementations
- [ ] Non-streaming responses return `Promise<ResponseObject>`
- [ ] Streaming responses continue to return `AsyncIterable<StreamDelta>`
- [ ] OpenAI provider successfully reads `ReadableStream` response bodies
- [ ] Response parsing works end-to-end with async interface

### Interface Compatibility

- [ ] Existing provider plugins can be updated to async without breaking changes
- [ ] Validation schemas accept both sync and async function implementations
- [ ] Interface documentation clearly explains async usage patterns
- [ ] Examples demonstrate proper async/await usage

### Test Coverage

- [ ] All existing tests pass with updated async mocks
- [ ] Test mocks properly simulate async behavior
- [ ] Error handling tests cover stream reading failures
- [ ] Tests validate both Promise and AsyncIterable return paths

### Error Handling

- [ ] Stream reading errors are properly caught and wrapped in ValidationError
- [ ] Context information is preserved in error handling
- [ ] Response validation continues to work with async implementation
- [ ] Error messages provide clear debugging information

### Integration Testing

- [ ] OpenAI provider parseResponse works with actual response parsing
- [ ] Response body reading handles various stream sizes correctly
- [ ] Memory usage is reasonable for large response bodies
- [ ] Timeout handling works correctly for slow streams

## Dependencies

**Prerequisites:**

- Task T-implement-response-parser-for (completed) - provides the parser logic
- No blocking dependencies - this is an interface update

**Impacts:**

- All future provider implementations will use async parseResponse
- BridgeClient integration will need to handle Promise returns (future work)
- Streaming parser implementations will maintain existing async patterns

## Security Considerations

- **Input Validation**: Ensure response body size limits are enforced during stream reading
- **Memory Safety**: Implement reasonable limits on response body size to prevent memory exhaustion
- **Error Information**: Ensure error messages don't leak sensitive response data
- **Stream Handling**: Properly release stream resources in all error conditions

## Performance Considerations

- **Memory Usage**: Read response bodies efficiently without excessive memory allocation
- **Streaming**: Maintain efficient streaming for large responses
- **Error Handling**: Fast-fail on invalid responses to avoid unnecessary processing
- **Resource Cleanup**: Ensure proper cleanup of ReadableStream resources

## Testing Requirements

### Unit Tests (Include in Implementation)

- Test async parseResponse method with various response types
- Test error handling for null/invalid response bodies
- Test stream reading with different chunk sizes
- Test timeout and error scenarios during stream reading
- Test integration with existing parseOpenAIResponse function

### Mock Updates

- Update all test mocks to return promises instead of direct values
- Ensure test assertions use async/await patterns
- Verify error testing works with async implementations

## Out of Scope

- BridgeClient integration with async parseResponse (separate future task)
- Performance optimization of stream reading (basic implementation sufficient)
- Alternative streaming approaches (stick to current ReadableStream API)
- Breaking changes to streaming interface (maintain existing AsyncIterable)
- Implementation of actual chat/stream methods in BridgeClient (Phase 2 work)
