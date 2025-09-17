---
id: T-create-anthropic-chat
title: Create Anthropic chat completion E2E tests
status: done
priority: medium
parent: F-anthropic-end-to-end-testing
prerequisites:
  - T-extend-shared-helpers-for
  - T-update-jest-setup-files-for
affectedFiles:
  src/__tests__/e2e/anthropic/chat.e2e.test.ts: "Created comprehensive E2E test
    suite for Anthropic chat completion with 14 test cases exactly mirroring
    OpenAI structure, including parameterized tests across all Anthropic models,
    conversation context handling, response validation, model integration, and
    error handling scenarios; Fixed Anthropic API requirement by adding
    maxTokens: 100 to all client.chat() calls, ensuring tests work with live
    Anthropic APIs that require maxTokens parameter (unlike OpenAI which makes
    it optional)"
log:
  - Successfully implemented Anthropic chat completion E2E tests that exactly
    mirror the OpenAI structure with 14 test cases across 4 test suites. The
    tests validate basic chat functionality (4 tests including parameterized
    tests for all Anthropic models), response validation (3 tests for schema,
    metadata, timestamps), model integration (2 tests for default model and
    registry), and error handling (4 tests for auth, invalid models, malformed
    requests, timeouts). Uses claude-3-5-haiku-latest as default model and
    follows identical patterns to OpenAI tests with proper timeout handling (15s
    basic, 30s extended). All quality checks pass with proper linting,
    formatting, and type checking.
schema: v1.0
childrenIds: []
created: 2025-09-17T00:50:04.751Z
updated: 2025-09-17T00:50:04.751Z
---

# Create Anthropic Chat Completion E2E Tests

## Context

This task creates the Anthropic chat completion E2E test suite that exactly mirrors the OpenAI `chat.e2e.test.ts` structure with 14 test cases. The tests validate basic chat functionality, response validation, model integration, and error handling with live Anthropic APIs.

## Implementation Requirements

### 1. Create Test File (`src/__tests__/e2e/anthropic/chat.e2e.test.ts`)

Mirror the exact structure of `src/__tests__/e2e/openai/chat.e2e.test.ts` with these adaptations:

**Import Pattern**:

```typescript
import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import type { Message } from "../../../core/messages/message.js";
import { createAnthropicTestClient } from "../shared/modelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getAnthropicTestModel } from "../shared/getTestModel.js";
import { loadAnthropicTestConfig } from "../shared/testConfig.js";
import { validateMessageSchema } from "../shared/testHelpers.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { withTimeout } from "../shared/withTimeout.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";
```

**Model Extraction Pattern**:

```typescript
// Extract Anthropic models from default models data
const anthropicProvider = defaultLlmModels.providers.find(
  (p) => p.id === "anthropic",
);
const anthropicModels =
  anthropicProvider?.models.map((model) => ({
    id: `anthropic:${model.id}`,
    name: model.name,
  })) || [];
```

### 2. Test Suite Structure (14 test cases exactly matching OpenAI)

**Basic Chat Functionality**:

- Parameterized test for all Anthropic models (`test.each(anthropicModels)`)
- Conversation context handling test
- Multiple consecutive requests test

**Response Validation**:

- Unified message schema validation test
- Metadata checking test
- Timestamp format validation test

**Model Integration**:

- Default model usage test
- Model registry integration test

**Error Handling**:

- Authentication errors test (invalid API key)
- Invalid model requests test
- Malformed requests test (empty messages array)
- Network timeout test (1ms timeout)

### 3. Exact Test Descriptions and Logic

Use identical test descriptions as OpenAI tests but adapted for Anthropic:

- "should complete simple chat request with $name ($id)"
- "should handle conversation context"
- "should handle multiple consecutive requests"
- "should return unified message schema"
- "should include proper metadata"
- "should have valid timestamp format"
- "should work with default model"
- "should handle model registry integration"
- "should handle authentication errors"
- "should handle invalid model requests"
- "should handle malformed requests"
- "should handle network timeouts gracefully"

### 4. Timeout and Configuration

Use same timeout patterns as OpenAI:

- 15s for basic requests
- 30s for extended operations
- Same withTimeout wrapper usage

## Acceptance Criteria

- [ ] Test file contains exactly 14 test cases mirroring OpenAI structure
- [ ] Parameterized tests run across all Anthropic models from defaultLlmModels.ts
- [ ] All tests use claude-3-5-haiku-latest as default model
- [ ] Response validation checks unified message schema, metadata, and timestamps
- [ ] Error handling covers authentication, invalid models, malformed requests, timeouts
- [ ] Conversation context and multi-turn interactions work correctly
- [ ] Tests use same timeout values and patterns as OpenAI equivalents
- [ ] All test descriptions match OpenAI patterns with Anthropic-specific adaptations
- [ ] Tests validate Anthropic provider integration with BridgeClient
- [ ] Model registry integration verification works correctly

## Dependencies

- Requires T-extend-shared-helpers-for for createAnthropicTestClient and related helpers
- Requires T-update-jest-setup-files-for for environment validation
- Uses existing shared utilities (validateMessageSchema, withTimeout, etc.)
- References Anthropic models from defaultLlmModels.ts

## Security Considerations

- Never log API keys in test output
- Use secure environment variable loading
- Validate API key format before test execution
- Handle authentication errors gracefully

## Testing Requirements

The tests themselves serve as integration tests, but ensure:

- Tests fail gracefully with clear error messages
- Proper cleanup of resources
- Consistent test isolation
- Deterministic test behavior where possible

## Technical Approach

1. Copy the structure from `src/__tests__/e2e/openai/chat.e2e.test.ts`
2. Replace OpenAI-specific imports with Anthropic equivalents
3. Update model extraction to use Anthropic provider
4. Maintain identical test logic and validation patterns
5. Use same helper functions and timeout patterns
6. Ensure test descriptions clearly indicate Anthropic provider

## Out of Scope

- Creating streaming or tool execution tests (handled by separate tasks)
- Modifying existing OpenAI test files
- Adding new test categories not present in OpenAI equivalent
