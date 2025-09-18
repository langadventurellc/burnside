---
id: T-implement-xai-chat-completion
title: Implement xAI chat completion E2E tests
status: done
priority: medium
parent: F-xai-grok-provider-e2e-testing
prerequisites:
  - T-create-xai-bridgeclient
affectedFiles:
  src/__tests__/e2e/xai/chat.e2e.test.ts: "Created comprehensive E2E test suite
    for xAI chat completion functionality following exact OpenAI patterns with 4
    test categories: Basic Chat Functionality (parameterized tests for all 3
    Grok models, conversation context, consecutive requests), Response
    Validation (unified message schema, metadata, timestamp format), Model
    Integration (default model and registry integration), and Error Handling
    (authentication errors, invalid models, malformed requests, network
    timeouts)"
  src/providers/xai-v1/responseSchema.ts: "Fixed critical schema validation
    issues: updated XAIResponseContentPartSchema logprobs/annotations to
    nullable, made main schema fields (temperature, top_p, user, etc.) nullable,
    updated TextResponseConfigSchema to accept object format, fixed
    ReasoningResponseSchema effort/summary to nullable, and updated
    IncompleteDetailsSchema to nullable"
  src/providers/xai-v1/responseParser.ts:
    Updated convertXAIContentToContentParts
    function signature to handle nullable logprobs and annotations fields
    instead of optional arrays to match corrected schema
log:
  - Implemented comprehensive xAI chat completion E2E tests following exact
    OpenAI patterns. Created complete test suite covering all three Grok models
    (grok-3-mini, grok-3, grok-4-0709) with parameterized testing, conversation
    context validation, response schema verification, and robust error handling.
    Tests validate real API integration with xAI's Grok services including
    authentication, model registry integration, and network timeout scenarios.
    All quality checks and existing unit tests pass successfully.
  - >-
    **CRITICAL FIXES APPLIED**: After initial implementation, discovered and
    fixed major schema validation issues preventing E2E tests from passing.


    **Root Cause**: The xAI response schema was misaligned with actual API
    responses. Key issues:

    1. Many fields expected as required were actually nullable (temperature,
    top_p, user, etc.)

    2. Content part logprobs and annotations were nullable, not optional
    arrays  

    3. text.format was object instead of array in some responses

    4. reasoning.effort and reasoning.summary were nullable for some models
    (e.g., Grok 3)


    **Schema Fixes Applied**:

    - Updated XAIResponseContentPartSchema: logprobs and annotations now
    nullable instead of optional

    - Updated main schema: temperature, top_p, user, max_output_tokens,
    previous_response_id, metadata now nullable

    - Updated TextResponseConfigSchema: format now accepts both object and array
    formats

    - Updated ReasoningResponseSchema: effort and summary now nullable instead
    of optional

    - Updated IncompleteDetailsSchema: changed from optional to nullable


    **Testing Results**: All 14 xAI E2E tests now pass successfully, including:

    - ✅ Parameterized tests across all 3 Grok models (grok-3-mini, grok-3,
    grok-4-0709)

    - ✅ Conversation context validation

    - ✅ Response schema compliance

    - ✅ Error handling scenarios

    - ✅ Model registry integration


    **Quality Assurance**: All linting, formatting, and type checks pass.
    Implementation now ready for production use.
schema: v1.0
childrenIds: []
created: 2025-09-18T00:10:59.348Z
updated: 2025-09-18T00:10:59.348Z
---

# Implement xAI Chat Completion E2E Tests

## Context

This task implements comprehensive chat completion E2E tests for the xAI Grok provider, following the exact patterns established by the OpenAI E2E testing framework. These tests validate real API integration with xAI's Grok models for basic chat functionality.

## Reference Implementation

Follow this existing OpenAI E2E testing pattern:

- `src/__tests__/e2e/openai/chat.e2e.test.ts` - Complete chat completion test suite

## Implementation Requirements

### 1. Create xAI Chat E2E Test File (`src/__tests__/e2e/xai/chat.e2e.test.ts`)

Mirror the structure of the OpenAI chat tests but adapted for xAI:

```typescript
import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import type { Message } from "../../../core/messages/message";
import { createTestClient } from "../shared/xaiModelHelpers";
import { ensureModelRegistered } from "../shared/ensureModelRegistered";
import { getXaiTestModel } from "../shared/getXaiTestModel";
import { loadXaiTestConfig } from "../shared/xaiTestConfig";
import { validateMessageSchema } from "../shared/testHelpers";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { defaultLlmModels } from "../../../data/defaultLlmModels";

// Extract xAI models from default models data
const xaiProvider = defaultLlmModels.providers.find((p) => p.id === "xai");
const xaiModels =
  xaiProvider?.models.map((model) => ({
    id: `xai:${model.id}`,
    name: model.name,
  })) || [];
```

### 2. Implement Test Categories

#### Basic Chat Functionality

- **Parameterized model testing**: Test all three Grok models (grok-3-mini, grok-3, grok-4-0709)
- **Simple chat requests**: Basic prompts with response validation
- **Conversation context**: Multi-turn dialogue handling
- **Consecutive requests**: Independent request handling with unique IDs

#### Response Validation

- **Unified message schema**: Validate response format compliance
- **Metadata presence**: Verify provider identification and metadata structure
- **Timestamp validation**: ISO string format and recency checks
- **Content validation**: Text content structure and presence

#### Model Integration

- **Default model testing**: Use grok-3-mini as primary test model
- **Model registry integration**: Verify model availability and registration
- **Custom model support**: Test environment variable override functionality

#### Error Handling

- **Authentication errors**: Invalid API key scenarios
- **Invalid model requests**: Non-existent model handling
- **Malformed requests**: Empty messages and invalid parameters
- **Network timeouts**: Timeout scenario testing

### 3. Key Test Implementations

#### Parameterized Model Testing

```typescript
test.each(xaiModels)(
  "should complete simple chat request with $name ($id)",
  async ({ id: modelId }) => {
    ensureModelRegistered(client, modelId);

    const messages = createTestMessages("Say hello.");

    const response = await withTimeout(
      client.chat({ messages, model: modelId }),
      15000,
    );

    expect(response).toBeDefined();
    expect(validateMessageSchema(response)).toBe(true);
    expect(response.role).toBe("assistant");
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    if (response.content[0].type === "text") {
      expect(typeof response.content[0].text).toBe("string");
      expect(response.content[0].text.length).toBeGreaterThan(0);
    }
    expect(response.timestamp).toBeDefined();
    expect(response.id).toBeDefined();
  },
);
```

#### Conversation Context Testing

```typescript
test("should handle conversation context", async () => {
  const messages = createConversation([
    "My name is Alice.",
    "Hello Alice! Nice to meet you.",
    "What is my name?",
  ]);

  const response = await withTimeout(
    client.chat({ messages, model: testModel }),
    30000,
  );

  expect(response).toBeDefined();
  expect(validateMessageSchema(response)).toBe(true);
  expect(response.role).toBe("assistant");
  if (response.content[0].type === "text") {
    expect(response.content[0].text.toLowerCase()).toContain("alice");
  }
});
```

#### Error Handling Tests

```typescript
test("should handle authentication errors", async () => {
  const invalidClient = createTestClient({
    providers: {
      xai: { apiKey: "invalid-key" },
    },
  });

  const messages = createTestMessages("Say hello.");

  await expect(
    withTimeout(invalidClient.chat({ messages, model: testModel }), 30000),
  ).rejects.toThrow();
});
```

### 4. Test Structure

Follow the exact describe block structure from OpenAI tests:

- **"xAI Chat Completion E2E"** - Main test suite
  - **"Basic Chat Functionality"** - Core functionality tests
  - **"Response Validation"** - Schema and format validation
  - **"Model Integration"** - Registry and model management
  - **"Error Handling"** - Failure scenarios

## Technical Approach

1. **Mirror OpenAI patterns exactly**: Use identical test structure and validation approaches
2. **xAI-specific adaptations**: Use xAI models, provider, and configuration
3. **Real API integration**: Execute actual API calls to xAI services
4. **Comprehensive validation**: Test all response format requirements
5. **Error scenario coverage**: Handle authentication, network, and validation failures

## Acceptance Criteria

### Functional Requirements

- ✅ All three Grok models tested with parameterized tests
- ✅ Basic chat requests return valid responses with proper schema
- ✅ Conversation context maintained across multi-turn dialogues
- ✅ Response format matches unified message schema exactly
- ✅ Metadata includes provider identification and proper structure
- ✅ Consecutive requests maintain independence with unique IDs

### Response Validation

- ✅ Message structure validation (id, role, content, timestamp)
- ✅ Content part validation (type: "text", non-empty text)
- ✅ Timestamp format validation (ISO string, recent)
- ✅ Metadata presence and structure validation

### Error Handling

- ✅ Authentication errors throw appropriate exceptions
- ✅ Invalid model requests handled gracefully
- ✅ Malformed requests (empty messages) rejected properly
- ✅ Network timeout scenarios handled with proper error messages

### Performance Requirements

- ✅ Tests complete within generous timeouts (15-30 seconds)
- ✅ No unnecessary API calls or resource waste
- ✅ Efficient test data usage to minimize costs

## Dependencies

- Previous task: T-create-xai-bridgeclient (for xAI BridgeClient factory)
- Existing shared E2E helpers (createTestMessages, withTimeout, validateMessageSchema)
- xAI provider implementation and model registry
- Valid XAI_API_KEY for real API testing

## Files to Create

**New Files:**

- `src/__tests__/e2e/xai/chat.e2e.test.ts`

## Testing Strategy

### Test Scenarios

1. **Happy Path**: All models, basic prompts, conversation context
2. **Validation**: Response schema, metadata, timestamps
3. **Integration**: Model registry, provider registration
4. **Error Cases**: Authentication, invalid models, malformed requests
5. **Performance**: Timeout handling, resource efficiency

### Test Data

- Use simple, predictable prompts for consistent responses
- Test conversation scenarios with clear context expectations
- Minimize token usage while ensuring comprehensive coverage

## Technical Notes

### Model Testing

- Extract xAI models from `defaultLlmModels` data structure
- Use model ID format "xai:grok-3-mini", "xai:grok-3", "xai:grok-4-0709"
- Ensure model registration before testing each model

### Timeout Strategy

- Use 15-second timeout for single requests
- Use 30-second timeout for conversation and complex scenarios
- Match OpenAI timeout patterns for consistency

### Validation Approach

- Reuse existing `validateMessageSchema` for consistency
- Add xAI-specific validation where needed
- Validate provider identification in metadata

## Out of Scope

- Streaming functionality testing (handled by streaming task)
- Tool execution testing (handled by tools task)
- Performance benchmarking (basic observability only)
- Integration testing with other providers
