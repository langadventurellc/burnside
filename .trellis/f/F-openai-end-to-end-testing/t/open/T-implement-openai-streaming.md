---
id: T-implement-openai-streaming
title: Implement OpenAI streaming E2E tests
status: open
priority: medium
parent: F-openai-end-to-end-testing
prerequisites:
  - T-implement-tool-call
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T06:24:17.716Z
updated: 2025-09-16T06:24:17.716Z
---

# Implement OpenAI Streaming E2E Tests

## Context

Create comprehensive end-to-end tests for OpenAI streaming functionality using real API calls. These tests validate that the BridgeClient properly handles streaming responses, delta accumulation, and stream lifecycle management.

Related to feature: F-openai-end-to-end-testing

## Specific Implementation Requirements

### 1. Create Streaming E2E Test File

Implement `src/__tests__/e2e/openai/streaming.e2e.test.ts` with comprehensive streaming test coverage:

- Basic streaming chat requests with delta accumulation
- Stream lifecycle management (start, data, end)
- Stream cancellation and timeout scenarios
- Response format validation for streaming deltas

### 2. Test Categories

Implement the following streaming test categories:

- **Basic Streaming**: Simple streaming requests with delta validation
- **Delta Accumulation**: Verify deltas combine into complete responses
- **Stream Control**: Cancellation, timeouts, error handling
- **Format Validation**: StreamDelta schema compliance

### 3. Stream Processing Validation

Validate that streaming deltas match expected format and accumulate correctly into final responses.

## Technical Approach

### Test Structure

```typescript
// streaming.e2e.test.ts
import { describe, test, expect, beforeAll } from "@jest/globals";
import {
  createTestClient,
  ensureModelRegistered,
  getTestModel,
} from "../shared/modelHelpers.js";
import { loadTestConfig } from "../shared/testConfig.js";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import type { StreamDelta } from "../../../client/streamDelta.js";

describe("OpenAI Streaming E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(async () => {
    const config = loadTestConfig();
    client = createTestClient();
    testModel = getTestModel();
    await ensureModelRegistered(client, testModel);
  });

  describe("Basic Streaming", () => {
    test("should stream chat completion deltas", async () => {
      // Test streaming with real API
    });

    test("should accumulate deltas correctly", async () => {
      // Test delta accumulation
    });
  });

  describe("Stream Lifecycle", () => {
    test("should handle stream start and end", async () => {
      // Test stream lifecycle
    });

    test("should handle stream cancellation", async () => {
      // Test cancellation
    });
  });

  describe("Error Handling", () => {
    test("should handle streaming errors gracefully", async () => {
      // Test error scenarios
    });
  });
});
```

### Stream Testing Implementation

1. **Delta Accumulation Tests**
   - Collect all streaming deltas into array
   - Verify deltas have proper StreamDelta structure
   - Accumulate text content and validate final result

2. **Stream Control Tests**
   - Test stream cancellation using AbortController
   - Verify proper cleanup on cancellation
   - Test timeout scenarios

3. **Format Validation Tests**
   - Validate StreamDelta schema compliance
   - Check delta metadata and timing
   - Verify content accumulation logic

## Detailed Acceptance Criteria

### Functional Requirements

1. **Basic Streaming Functionality**
   - ✅ Streaming requests succeed with real OpenAI API
   - ✅ Stream returns AsyncIterable<StreamDelta> as expected
   - ✅ Deltas are received in proper sequence
   - ✅ Stream completes successfully with final delta

2. **Delta Processing**
   - ✅ Each delta has valid StreamDelta schema structure
   - ✅ Text deltas accumulate correctly into complete response
   - ✅ Delta metadata includes timing and sequence information
   - ✅ Final accumulated text matches expected response format

3. **Stream Lifecycle Management**
   - ✅ Stream starts promptly after request
   - ✅ Deltas arrive within reasonable timeframes
   - ✅ Stream ends with proper completion signal
   - ✅ Resources are cleaned up after stream completion

4. **Stream Control**
   - ✅ Stream cancellation works via AbortController
   - ✅ Cancelled streams stop delta generation cleanly
   - ✅ Timeout scenarios are handled gracefully
   - ✅ No resource leaks on cancellation or timeout

### Technical Requirements

1. **Streaming Integration**
   - ✅ Full BridgeClient streaming integration (not mocked)
   - ✅ Real OpenAI streaming API calls
   - ✅ Proper async iteration over stream results
   - ✅ Compatible with existing streaming infrastructure

2. **Performance Validation**
   - ✅ Stream initiation within 5 seconds
   - ✅ Delta frequency appropriate for response length
   - ✅ No excessive delays between deltas
   - ✅ Efficient memory usage for long streams

3. **Error Handling**
   - ✅ Network interruption handled gracefully
   - ✅ Invalid streaming requests fail with clear errors
   - ✅ Authentication errors during streaming are caught
   - ✅ Malformed streaming responses handled safely

## Dependencies

- T-implement-tool-call must complete first (shared helpers)
- OpenAI API access with valid API key
- BridgeClient streaming implementation
- StreamDelta type definitions

## Security Considerations

1. **API Key Protection**
   - Never log or expose API keys in streaming test output
   - Use environment variables exclusively
   - Clear error messages without exposing sensitive data

2. **Stream Data Security**
   - Use minimal, non-sensitive test prompts for streaming
   - No personal information in streaming requests
   - Proper cleanup of streaming data after tests

## Testing Requirements

1. **Streaming Test Coverage**
   - Basic streaming: simple requests, delta reception
   - Delta processing: accumulation, format validation
   - Stream control: cancellation, timeouts, lifecycle
   - Error scenarios: network issues, auth failures

2. **Test Data for Streaming**
   - Prompts that generate predictable streaming responses
   - Requests that produce reasonable delta counts
   - Error scenarios with controlled failure conditions

3. **Stream Validation Utilities**
   - Helper functions to collect and validate deltas
   - Utilities to test stream cancellation scenarios
   - Accumulation logic verification

## Out of Scope

- Chat completion functionality (handled by separate task)
- Tool execution with streaming (handled by separate task)
- Complex streaming scenarios beyond basic functionality
- Streaming performance optimization or benchmarking

## Files to Create

- `src/__tests__/e2e/openai/streaming.e2e.test.ts`

## References

- BridgeClient stream method: `src/client/bridgeClient.ts`
- StreamDelta type: `src/client/streamDelta.ts`
- OpenAI streaming parser: `src/providers/openai-responses-v1/streamingParser.ts`
