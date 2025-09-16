---
id: T-implement-openai-chat
title: Implement OpenAI chat completion E2E tests
status: open
priority: medium
parent: F-openai-end-to-end-testing
prerequisites:
  - T-implement-tool-call
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T06:23:44.174Z
updated: 2025-09-16T06:23:44.174Z
---

# Implement OpenAI Chat Completion E2E Tests

## Context

Create comprehensive end-to-end tests for OpenAI chat completion functionality using real API calls. These tests validate that the BridgeClient properly integrates with OpenAI's chat completion API and returns correctly formatted responses.

Related to feature: F-openai-end-to-end-testing

## Specific Implementation Requirements

### 1. Create Chat E2E Test File

Implement `src/__tests__/e2e/openai/chat.e2e.test.ts` with comprehensive test coverage:

- Basic chat completion with simple prompts
- Response format validation against unified message schema
- Error handling for authentication and invalid requests
- Multiple model testing using seeded models

### 2. Test Categories

Implement the following test categories:

- **Smoke Tests**: Basic connectivity and authentication
- **Functional Tests**: Core chat functionality with real responses
- **Error Tests**: Network failures, auth errors, invalid requests
- **Model Tests**: Different models from the registry

### 3. Response Validation

Validate that responses match the expected unified message schema and contain proper metadata.

## Technical Approach

### Test Structure

```typescript
// chat.e2e.test.ts
import { describe, test, expect, beforeAll } from "@jest/globals";
import {
  createTestClient,
  ensureModelRegistered,
  getTestModel,
} from "../shared/modelHelpers.js";
import { loadTestConfig } from "../shared/testConfig.js";
import type { BridgeClient } from "../../../client/bridgeClient.js";

describe("OpenAI Chat Completion E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(async () => {
    const config = loadTestConfig();
    client = createTestClient();
    testModel = getTestModel();
    await ensureModelRegistered(client, testModel);
  });

  describe("Basic Chat Functionality", () => {
    test("should complete simple chat request", async () => {
      // Test implementation
    });

    test("should handle conversation context", async () => {
      // Test implementation
    });
  });

  describe("Response Validation", () => {
    test("should return unified message schema", async () => {
      // Test implementation
    });

    test("should include proper metadata", async () => {
      // Test implementation
    });
  });

  describe("Error Handling", () => {
    test("should handle authentication errors", async () => {
      // Test implementation
    });

    test("should handle invalid requests", async () => {
      // Test implementation
    });
  });
});
```

### Test Implementation Details

1. **Simple Chat Tests**
   - Use predictable prompts that generate consistent responses
   - Validate response structure matches Message schema
   - Check that content includes expected text responses

2. **Error Handling Tests**
   - Test with invalid API keys (use separate client instance)
   - Test with malformed requests
   - Validate error types match expected error hierarchy

3. **Response Schema Validation**
   - Verify Message structure (id, role, content, timestamp)
   - Validate ContentPart structure within content array
   - Check metadata includes provider-specific information

## Detailed Acceptance Criteria

### Functional Requirements

1. **Basic Chat Functionality**
   - ✅ Simple chat completion requests succeed with real OpenAI API
   - ✅ Responses contain valid text content in unified message format
   - ✅ Multiple consecutive requests work correctly
   - ✅ Conversation context is properly maintained

2. **Response Format Validation**
   - ✅ Response messages have correct schema (id, role, content, timestamp)
   - ✅ Content array contains valid ContentPart objects
   - ✅ Role is set to "assistant" for AI responses
   - ✅ Timestamp is valid ISO string format

3. **Model Integration**
   - ✅ Tests use models from existing registry seed
   - ✅ Default model (openai:gpt-4o-2024-08-06) works correctly
   - ✅ Model override via E2E_OPENAI_MODEL environment variable works
   - ✅ Model registry integration prevents "model not found" errors

4. **Error Handling**
   - ✅ Invalid API key returns proper AuthError
   - ✅ Malformed requests return ValidationError
   - ✅ Network failures are handled gracefully
   - ✅ Error messages are descriptive and actionable

### Technical Requirements

1. **Test Organization**
   - ✅ Tests are grouped logically by functionality
   - ✅ Proper setup and teardown for each test group
   - ✅ Tests are independent and can run in any order
   - ✅ No hard-coded API keys or sensitive data

2. **Performance Considerations**
   - ✅ Tests complete within 30-second timeout
   - ✅ Minimal API usage to control costs
   - ✅ Efficient test data that produces predictable responses
   - ✅ No unnecessary API calls

3. **Integration Testing**
   - ✅ Full BridgeClient integration (not mocked)
   - ✅ Real OpenAI API calls
   - ✅ Proper provider registration and initialization
   - ✅ Tool system disabled for chat-only tests

## Dependencies

- T-implement-tool-call must complete first (shared helpers)
- OpenAI API access with valid API key
- Model registry with seeded models
- BridgeClient and OpenAI provider implementations

## Security Considerations

1. **API Key Protection**
   - Never log or expose API keys in test output
   - Use environment variables exclusively
   - Clear error messages without exposing sensitive data

2. **Test Data Security**
   - Use minimal, non-sensitive test prompts
   - No personal information in test requests
   - Predictable test data that doesn't expose system details

## Testing Requirements

1. **Test Coverage**
   - Basic functionality: simple chat, conversation context
   - Error scenarios: auth failure, invalid requests, network issues
   - Response validation: schema compliance, metadata presence
   - Model integration: default and override scenarios

2. **Test Data**
   - Simple prompts that generate predictable responses
   - Error scenarios with controlled failure conditions
   - Conversation examples that test context handling

## Out of Scope

- Streaming functionality (handled by separate task)
- Tool execution (handled by separate task)
- Advanced conversation features beyond basic context
- Performance benchmarking or load testing

## Files to Create

- `src/__tests__/e2e/openai/chat.e2e.test.ts`

## References

- BridgeClient chat method: `src/client/bridgeClient.ts`
- Message schema: `src/core/messages/message.ts`
- OpenAI provider: `src/providers/openai-responses-v1/`
