---
id: T-create-test-fixtures-and
title: Create test fixtures and contract tests for OpenAI integration
status: open
priority: medium
parent: F-openai-v1-provider-implementat
prerequisites:
  - T-register-openai-responses-v1
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T19:41:13.591Z
updated: 2025-09-15T19:41:13.591Z
---

# Create Test Fixtures and Contract Tests for OpenAI Integration

Create comprehensive test fixtures and contract tests to validate the OpenAI Responses v1 provider implementation against recorded API responses.

## Context

This task creates the contract testing infrastructure for the OpenAI provider, using recorded API responses to ensure compatibility and correctness. This follows the Phase 4 acceptance criteria for contract tests with recorded fixtures.

Reference: Existing test patterns in `src/core/**/__tests__/` and testing infrastructure.

## Implementation Requirements

### Files to Create

- `src/providers/openai-responses-v1/__tests__/fixtures/` - Directory for recorded fixtures
- `src/providers/openai-responses-v1/__tests__/integration.test.ts` - End-to-end integration tests
- Update existing unit test files with fixture-based tests

### 1. Test Fixtures (`src/providers/openai-responses-v1/__tests__/fixtures/`)

**Non-Streaming Response Fixtures:**

- `chat-completion-success.json` - Successful OpenAI Responses API response
- `chat-completion-empty.json` - Empty or minimal response
- `chat-completion-with-usage.json` - Response with detailed usage information

**Streaming Response Fixtures:**

- `stream-events-complete.json` - Full streaming event sequence
- `stream-events-error.json` - Streaming sequence with error termination
- `stream-events-partial.json` - Individual streaming events for unit tests

**Error Response Fixtures:**

- `error-401-auth.json` - Authentication error response
- `error-429-rate-limit.json` - Rate limiting error response
- `error-400-validation.json` - Validation error response
- `error-500-server.json` - Server error response

**Request Fixtures:**

- `request-basic-chat.json` - Simple chat request
- `request-with-options.json` - Request with temperature, max_tokens, etc.
- `request-streaming.json` - Streaming request configuration

### 2. Integration Tests (`src/providers/openai-responses-v1/__tests__/integration.test.ts`)

**End-to-End Test Scenarios:**

- **Non-streaming chat completion**: Request → Response parsing → Message creation
- **Streaming chat completion**: Request → Event stream → Delta accumulation → Final message
- **Error handling**: Various error responses → Proper error normalization
- **Configuration validation**: Invalid configs → ValidationError

**Test Structure:**

```typescript
describe("OpenAI Responses v1 Provider Integration", () => {
  let provider: ProviderPlugin;

  beforeEach(() => {
    provider = openaiResponsesV1Provider;
  });

  describe("Non-streaming responses", () => {
    it("should handle successful chat completion", () => {
      // Load fixture, test translation + parsing
    });
  });

  describe("Streaming responses", () => {
    it("should process complete event stream", async () => {
      // Test full streaming pipeline
    });
  });

  describe("Error handling", () => {
    it("should normalize various error types", () => {
      // Test error normalization with fixtures
    });
  });
});
```

### 3. Contract Test Implementation

**Fixture-Based Testing:**

- Load recorded API responses from fixtures
- Mock HTTP transport to return fixture data
- Test complete request/response pipeline
- Validate against actual OpenAI API format

**Streaming Event Validation:**

- Test complete streaming event sequences
- Validate event ordering and structure
- Test delta accumulation and final message reconstruction
- Verify termination detection works correctly

**Request Format Validation:**

- Test request translation with various input scenarios
- Validate generated requests match OpenAI API specification
- Test authentication headers and configuration
- Verify parameter mapping (temperature, max_tokens, etc.)

### 4. Phase 4 Acceptance Test

**E2E Streaming Delta Accumulation:**

```typescript
it("should prove E2E streaming deltas accumulate to final text", async () => {
  // This test specifically addresses Phase 4 acceptance criteria
  const streamFixture = loadFixture("stream-events-complete.json");
  const mockResponse = createMockStreamingResponse(streamFixture);

  const deltas: StreamDelta[] = [];
  const stream = provider.parseResponse(mockResponse, true);

  for await (const delta of stream) {
    deltas.push(delta);
    if (provider.isTerminal(delta)) break;
  }

  // Verify deltas accumulate to complete text
  const fullText = accumulateDeltas(deltas);
  expect(fullText).toBe(expectedCompleteText);
  expect(deltas[deltas.length - 1].finished).toBe(true);
});
```

## Technical Approach

1. **Realistic Fixtures**: Use actual OpenAI API response structures
2. **Mock Infrastructure**: Mock HTTP transport while testing full pipeline
3. **Edge Case Coverage**: Test error conditions and edge cases
4. **Performance Validation**: Ensure tests run efficiently
5. **Maintainability**: Structure tests for easy updates when API changes

## Acceptance Criteria

### Fixture Requirements

- [ ] Comprehensive fixtures covering success, error, and edge cases
- [ ] Realistic OpenAI API response structures
- [ ] Both streaming and non-streaming response fixtures
- [ ] Error response fixtures for each major error type

### Integration Test Requirements

- [ ] End-to-end tests for complete request/response pipeline
- [ ] Streaming tests validate full event processing
- [ ] Error handling tests cover all error normalization paths
- [ ] Configuration tests validate provider setup

### Contract Test Requirements

- [ ] Tests validate against recorded OpenAI API responses
- [ ] Request format validation ensures API compatibility
- [ ] Response parsing handles all documented OpenAI formats
- [ ] Streaming event processing matches API specification

### Phase 4 Acceptance Requirements

- [ ] E2E test proves streaming deltas accumulate to final text
- [ ] Contract tests pass with recorded OpenAI fixtures
- [ ] Tests demonstrate BridgeClient compatibility
- [ ] Error handling covers documented OpenAI error conditions

### Testing Requirements (Include in this task)

- [ ] All fixture files are properly structured JSON
- [ ] Integration tests have >90% code coverage of provider
- [ ] Tests run reliably without external dependencies
- [ ] Test performance is acceptable (<5 seconds total)
- [ ] Mock infrastructure properly isolates external dependencies

## Dependencies

- Task: "Register OpenAI Responses v1 provider with ProviderRegistry"
- All provider implementation tasks
- Existing testing infrastructure and patterns
- Jest testing framework

## Out of Scope

- Live API testing against real OpenAI endpoints (security/cost concerns)
- Performance testing under load (not Phase 4 requirement)
- Compatibility testing with multiple OpenAI API versions
- Advanced streaming scenarios beyond basic Phase 4 scope
