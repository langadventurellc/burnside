---
id: T-create-google-tool-execution
title: Create Google tool execution E2E tests
status: done
priority: medium
parent: F-google-gemini-end-to-end
prerequisites:
  - T-create-google-model-helpers
  - T-update-jest-setup-files-for-1
affectedFiles:
  src/__tests__/e2e/google/tools.e2e.test.ts: "Created comprehensive Google tool
    execution E2E test suite with 18 test cases exactly mirroring
    OpenAI/Anthropic patterns. Includes all required test categories: Tool
    Registration (2 tests for successful registration and definition
    validation), Function Calling (2 tests for basic execution and parameterized
    model testing), Tool System Integration (2 tests for BridgeClient
    integration and unused tool handling), Tool Error Handling (4 tests for
    registration errors, execution failures, disabled systems, and invalid
    configurations), and Tool Behavior Validation (8 tests for message format
    consistency, complex requests, multiple calls, context preservation,
    argument validation, response formatting, metadata preservation, and
    execution timing). Uses Google-specific imports, real Google Gemini APIs,
    25s/30s timeouts, and e2e_echo_tool for predictable testing results."
log:
  - "Successfully created comprehensive Google tool execution E2E tests with
    exactly 18 test cases mirroring OpenAI/Anthropic patterns. The test file
    covers all required categories: Tool Registration (2 tests), Function
    Calling (2 tests), Tool System Integration (2 tests), Tool Error Handling (4
    tests), and Tool Behavior Validation (8 tests). All tests use real Google
    Gemini function calling APIs with the e2e_echo_tool for predictable results.
    The implementation follows exact same test structure, timeouts, and
    validation patterns as existing providers while using Google-specific test
    helpers. All quality checks (lint, format, type-check) pass successfully."
schema: v1.0
childrenIds: []
created: 2025-09-17T07:02:48.513Z
updated: 2025-09-17T07:02:48.513Z
---

# Create Google Tool Execution E2E Tests

## Context

Create Google Gemini tool execution E2E tests that exactly mirror the existing OpenAI (`tools.e2e.test.ts`) and Anthropic (`tools.e2e.test.ts`) test structures. This file will test function calling and tool execution across all tool-capable Google Gemini models with real API calls.

## Reference Implementation

Copy and adapt from:

- `src/__tests__/e2e/openai/tools.e2e.test.ts` - Tool execution patterns
- `src/__tests__/e2e/anthropic/tools.e2e.test.ts` - Provider-specific tool adaptations

## Specific Implementation Requirements

### 1. Google Tool E2E Test File

Create `src/__tests__/e2e/google/tools.e2e.test.ts` with exact structure:

```typescript
import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import type { Message } from "../../../core/messages/message.js";
import { createGoogleTestClient } from "../shared/googleModelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getGoogleTestModel } from "../shared/getGoogleTestModel.js";
import { loadGoogleTestConfig } from "../shared/googleTestConfig.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { createTestTool } from "../shared/createTestTool.js";
import { testToolHandler } from "../shared/testToolHandler.js";
import { validateToolExecution } from "../shared/validateToolExecution.js";
import { prepareToolCallMessage } from "../shared/toolHelpers.js";
import { withTimeout } from "../shared/withTimeout.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";

// Extract tool-capable Google models
const googleProvider = defaultLlmModels.providers.find(
  (p) => p.id === "google",
);
const toolCapableGoogleModels =
  googleProvider?.models
    .filter((model) => model.toolCalls)
    .map((model) => ({
      id: `google:${model.id}`,
      name: model.name,
    })) || [];

describe("Google Gemini Tool Execution E2E", () => {
  // ... exact mirror of OpenAI/Anthropic tool test structure
});
```

### 2. Test Categories (Mirror OpenAI/Anthropic - 18 tests total)

**Tool Registration (2 tests):**

- Successful tool registration and validation
- Tool definition verification

**Function Calling with Tools (2 tests):**

- Basic tool execution across tool-capable models
- Parameterized tests across all tool-capable Google models

**Tool System Integration (2 tests):**

- BridgeClient tool system integration
- Tool result formatting and message generation

**Tool Error Handling (4 tests):**

- Tool registration errors
- Tool execution failures
- Invalid tool configurations
- Disabled tool system scenarios

**Tool Behavior Validation (8 tests):**

- Tool call extraction from responses
- Tool result processing
- Multiple tool calls handling
- Tool execution context preservation
- Tool argument validation
- Tool response formatting
- Tool metadata preservation
- Tool execution timing

### 3. Google-Specific Tool Features

- All 5 Google models support tool calls (from defaultLlmModels.ts)
- Google uses function calling with JSON schema format
- Tool definition translation from Zod schemas to Google format
- Tool call extraction following unified tool system patterns

## Acceptance Criteria

### Test Coverage Requirements

**All 18 test cases** must be implemented matching OpenAI/Anthropic:

1. **Tool Registration (2 tests)**: Registration success, definition validation
2. **Function Calling (2 tests)**: Basic execution, model parameterization
3. **System Integration (2 tests)**: BridgeClient integration, result formatting
4. **Error Handling (4 tests)**: Registration errors, execution failures, disabled system, invalid configs
5. **Behavior Validation (8 tests)**: Call extraction, result processing, multiple calls, context preservation, argument validation, response formatting, metadata preservation, execution timing

### Functional Requirements

- All tests use real Google Gemini function calling APIs
- Tests use shared test tools (echo tool) for predictable results
- Tool call extraction works with current message format paths
- Tool execution follows existing BridgeClient tool system patterns
- Error scenarios test actual API error responses

### Tool System Integration

- Uses `createTestTool()` for consistent test tool definitions
- Uses `testToolHandler()` for predictable tool execution
- Uses `validateToolExecution()` for result verification
- Uses `prepareToolCallMessage()` for tool call format compatibility
- Follows current tool call extraction paths from existing codebase

### Model Coverage

- Tests filter to only tool-capable Google models
- All 5 Google models support tools per defaultLlmModels.ts
- Parameterized tests run across all tool-capable models
- Model capabilities respected during test execution

## Technical Approach

1. **Copy tool test structure** from OpenAI/Anthropic
2. **Replace provider imports** with Google equivalents
3. **Filter models by tool capability** from defaultLlmModels
4. **Use shared tool helpers** for consistency
5. **Follow same tool execution patterns** as existing tests
6. **Maintain same timeout values** (30s for tool tests)

## Dependencies

- T-create-google-model-helpers (requires Google client creation)
- T-update-jest-setup-files-for-1 (requires environment validation)
- GoogleGeminiV1Provider tool implementation (already complete)
- Existing shared tool test helpers (already available)

## Out of Scope

- Tool system implementation changes
- New tool test helpers (use existing)
- Provider tool translation changes
- Mock tool implementations (tests use real APIs)

## Files to Create

- `src/__tests__/e2e/google/tools.e2e.test.ts` - Google tool execution E2E tests

## Testing Requirements

### E2E Test Validation

- Tests must pass with valid Google API key
- Tool calls must be extracted correctly from Google responses
- Tool execution must follow current BridgeClient patterns
- Tool results must format correctly for continuation
- Error handling must work for tool failures

### Tool Integration

- Echo tool must work with Google function calling
- Tool argument validation must work correctly
- Tool result processing must follow unified patterns
- Multiple tool calls must be handled properly

## Integration Notes

This task creates the third and final Google E2E test file, focusing on tool execution and function calling. The tests validate that Google Gemini's function calling capabilities work correctly through the unified tool system, following patterns proven with OpenAI and Anthropic providers.
