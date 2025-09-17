---
id: T-create-google-chat-completion
title: Create Google chat completion E2E tests
status: done
priority: medium
parent: F-google-gemini-end-to-end
prerequisites:
  - T-create-google-model-helpers
  - T-update-jest-setup-files-for-1
affectedFiles:
  src/__tests__/e2e/google/chat.e2e.test.ts: Created comprehensive Google chat
    completion E2E test suite with 14 test cases mirroring OpenAI/Anthropic
    patterns. Includes parameterized tests across all 5 Google models,
    conversation context handling, response validation, model integration tests,
    and error handling scenarios. Uses Google-specific test helpers and follows
    exact same test structure and validation logic as existing providers.
log:
  - "Implemented Google Gemini chat completion E2E tests that exactly mirror the
    existing OpenAI and Anthropic test structures. Created comprehensive test
    suite with 14 test cases across 4 categories: Basic Chat Functionality,
    Response Validation, Model Integration, and Error Handling. Tests cover all
    5 Google Gemini models with real API calls using the same validation logic
    and timeout patterns as existing providers. All quality checks pass
    successfully."
schema: v1.0
childrenIds: []
created: 2025-09-17T07:01:37.194Z
updated: 2025-09-17T07:01:37.194Z
---

# Create Google Chat Completion E2E Tests

## Context

Create Google Gemini chat completion E2E tests that exactly mirror the existing OpenAI (`chat.e2e.test.ts`) and Anthropic (`chat.e2e.test.ts`) test structures. This file will test all 5 Google Gemini models with real API calls using the same test patterns and validation logic.

## Reference Implementation

Copy and adapt from:

- `src/__tests__/e2e/openai/chat.e2e.test.ts` - Test structure and patterns
- `src/__tests__/e2e/anthropic/chat.e2e.test.ts` - Provider adaptation patterns

## Specific Implementation Requirements

### 1. Google Chat E2E Test File

Create `src/__tests__/e2e/google/chat.e2e.test.ts` with exact structure:

```typescript
import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import type { Message } from "../../../core/messages/message.js";
import { createGoogleTestClient } from "../shared/googleModelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getGoogleTestModel } from "../shared/getGoogleTestModel.js";
import { loadGoogleTestConfig } from "../shared/googleTestConfig.js";
import { validateMessageSchema } from "../shared/testHelpers.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { withTimeout } from "../shared/withTimeout.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";

// Extract Google models from default models data
const googleProvider = defaultLlmModels.providers.find(
  (p) => p.id === "google",
);
const googleModels =
  googleProvider?.models.map((model) => ({
    id: `google:${model.id}`,
    name: model.name,
  })) || [];

describe("Google Gemini Chat Completion E2E", () => {
  // ... exact mirror of OpenAI/Anthropic test structure
});
```

### 2. Test Categories (Mirror OpenAI/Anthropic - 14 tests total)

**Basic Chat Functionality:**

- Parameterized tests across all 5 Google Gemini models
- Simple chat completion requests
- Multi-message conversation handling

**Response Validation:**

- Unified message schema validation
- Metadata checking and timestamp validation
- Content structure verification

**Model Integration:**

- Default model usage verification
- Model registry integration testing
- Model capability verification

**Error Handling:**

- Authentication errors (invalid API key)
- Invalid model requests
- Malformed requests
- Network timeout scenarios

### 3. Google-Specific Adaptations

- Use `createGoogleTestClient()` for BridgeClient creation
- Use `loadGoogleTestConfig()` for environment validation
- Use `getGoogleTestModel()` for default model selection
- Test all 5 Google models: gemini-2.0-flash-lite, gemini-2.5-flash-lite, gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro

## Acceptance Criteria

### Test Coverage Requirements

**All 14 test cases** must be implemented matching OpenAI/Anthropic:

1. **Basic Chat (5 tests)**: Parameterized test across all Google models
2. **Conversation Context (2 tests)**: Multi-message conversations, context preservation
3. **Response Validation (3 tests)**: Schema compliance, metadata verification, timestamp format
4. **Model Integration (2 tests)**: Default model usage, registry verification
5. **Error Handling (2 tests)**: Authentication errors, network timeouts

### Functional Requirements

- All tests use real Google Gemini API calls (not mocked)
- Tests validate response format matches unified message schema
- Error scenarios test actual API error responses
- Timeout values match existing tests (15s basic, 30s extended)
- Test descriptions exactly match OpenAI/Anthropic patterns

### Model Testing

- Parameterized tests run across all 5 Google Gemini models
- Model filtering respects model capabilities from registry
- Custom model registration works if E2E_GOOGLE_MODEL specifies non-seeded model
- Default model (`google:gemini-2.5-flash`) works without additional configuration

### Integration Requirements

- Uses shared test helpers (`validateMessageSchema`, `withTimeout`, etc.)
- Follows same conversation creation patterns
- Uses same validation logic as other providers
- Maintains same error handling patterns

## Technical Approach

1. **Copy test structure** from OpenAI/Anthropic chat tests
2. **Replace provider-specific imports** with Google equivalents
3. **Update model extraction** to use Google provider from defaultLlmModels
4. **Maintain exact test descriptions** and timeout values
5. **Use same validation helpers** for consistency
6. **Follow same parameterized testing** patterns for model coverage

## Dependencies

- T-create-google-model-helpers (requires Google client creation)
- T-update-jest-setup-files-for-1 (requires environment validation)
- GoogleGeminiV1Provider implementation (already complete)
- Existing shared test helpers (already available)

## Out of Scope

- Provider implementation changes
- New test helper creation (use existing helpers)
- Test framework modifications
- Mock/stub implementations (tests use real APIs)

## Files to Create

- `src/__tests__/e2e/google/chat.e2e.test.ts` - Google chat completion E2E tests

## Testing Requirements

### Unit Tests

- No separate unit tests needed (this is an E2E test file)

### E2E Test Validation

- Tests must pass with valid Google API key
- Tests must fail gracefully with invalid credentials
- Tests must handle API rate limiting appropriately
- Tests must validate actual Google API response formats

## Integration Notes

This task creates the first of three Google E2E test files. The tests will validate that the Google Gemini provider integration works correctly with real API calls, following the exact same patterns proven successful with OpenAI and Anthropic providers.
