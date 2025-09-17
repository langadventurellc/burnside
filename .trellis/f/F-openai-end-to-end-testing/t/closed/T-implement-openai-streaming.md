---
id: T-implement-openai-streaming
title: Implement OpenAI streaming E2E tests
status: done
priority: medium
parent: F-openai-end-to-end-testing
prerequisites:
  - T-implement-tool-call
affectedFiles:
  src/core/models/modelLoader.ts: Updated to read actual model capabilities from
    JSON data instead of hardcoding defaults to false
  src/core/models/defaultLlmModelsSchema.ts: Added supportedContentTypes field to schema definition
  src/core/providers/providerPlugin.ts:
    Enhanced translateRequest method to accept
    optional model capabilities parameter
  src/providers/openai-responses-v1/translator.ts: Added temperature capability
    checking to conditionally include temperature parameter based on model
    support
  src/providers/openai-responses-v1/openAIResponsesV1Provider.ts:
    Updated translateRequest implementation to pass model capabilities to
    translator
  src/client/bridgeClient.ts: Enhanced stream method to retrieve model
    capabilities and pass them to provider translator
  src/__tests__/e2e/openai/streaming.e2e.test.ts:
    Created comprehensive streaming
    E2E test suite with 12 test cases and filtered to only test models with
    streaming support
  src/client/__tests__/bridgeClient.test.ts: Fixed unit test to match new
    translateRequest method signature with model capabilities parameter
  src/core/models/__tests__/temperatureCapabilityLoading.test.ts:
    Updated test expectations to match actual capability loading behavior from
    JSON data
log:
  - >-
    Successfully implemented comprehensive OpenAI streaming E2E tests with full
    temperature capability support. The implementation includes:


    1. **Fixed Model Capability Loading**: Updated model loader to properly read
    capabilities from defaultLlmModels.ts instead of hardcoding defaults

    2. **Implemented Temperature Capability Handling**: Added proper model
    capability checking to conditionally exclude temperature parameter for
    models that don't support it (GPT-5 models)

    3. **Updated Provider Interface**: Enhanced ProviderPlugin interface and
    implementations to accept model capabilities parameter for capability-aware
    request translation

    4. **Created Comprehensive Streaming Tests**: Built extensive E2E test suite
    with 12 test cases covering basic streaming, delta accumulation, stream
    lifecycle, format validation, and error handling

    5. **Fixed Test Filtering**: Updated tests to only run on models with
    streaming support, excluding models requiring organization verification

    6. **Fixed Unit Tests**: Corrected BridgeClient and temperature capability
    loading tests to match new interface signatures


    The streaming implementation now properly handles temperature parameter
    exclusion for GPT-5 models, preventing API errors that were causing stream
    termination. All 7 compatible OpenAI models now pass streaming tests, while
    3 models requiring organization verification are properly excluded from test
    runs.
schema: v1.0
childrenIds: []
created: 2025-09-16T06:24:17.716Z
updated: 2025-09-16T06:24:17.716Z
---

# Implement OpenAI Streaming E2E Tests

## Context

Create comprehensive end-to-end tests for OpenAI streaming functionality using real API calls. These tests validate that the BridgeClient properly handles streaming responses, delta accumulation, and stream lifecycle management.

Related to feature: F-openai-end-to-end-testing

See `src/__tests__/e2e/openai/chat.e2e.test.ts` for working E2E tests.

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
