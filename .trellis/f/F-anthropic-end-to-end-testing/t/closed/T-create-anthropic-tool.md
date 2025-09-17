---
id: T-create-anthropic-tool
title: Create Anthropic tool execution E2E tests
status: done
priority: medium
parent: F-anthropic-end-to-end-testing
prerequisites:
  - T-extend-shared-helpers-for
  - T-update-jest-setup-files-for
affectedFiles:
  src/__tests__/e2e/anthropic/tools.e2e.test.ts: "Created comprehensive E2E test
    suite for Anthropic tool execution with 18 test cases exactly mirroring
    OpenAI structure: Tool Registration (2 tests), Function Calling with Tools
    (2 tests including parameterized test.each), Tool System Integration (2
    tests), Tool Error Handling (4 tests), and Tool Behavior Validation (3
    tests). Uses Anthropic-specific helpers and includes maxTokens: 100 for all
    client.chat() calls to meet Anthropic API requirements."
log:
  - Successfully implemented Anthropic tool execution E2E tests that exactly
    mirror the OpenAI tools.e2e.test.ts structure with 18 test cases. The test
    suite validates tool registration, function calling, integration with
    BridgeClient, and error handling using the same test tools and patterns as
    OpenAI. All tests are parameterized across the 5 tool-capable Anthropic
    models from defaultLlmModels.ts and include proper maxTokens parameters
    required by Anthropic API. Quality checks (linting, formatting, type-check)
    all pass successfully.
schema: v1.0
childrenIds: []
created: 2025-09-17T00:51:10.750Z
updated: 2025-09-17T00:51:10.750Z
---

# Create Anthropic Tool Execution E2E Tests

## Context

This task creates the Anthropic tool execution E2E test suite that exactly mirrors the OpenAI `tools.e2e.test.ts` structure with 18 test cases. The tests validate tool registration, function calling, integration with BridgeClient, and error handling using the same test tools and patterns as OpenAI.

## Implementation Requirements

### 1. Create Test File (`src/__tests__/e2e/anthropic/tools.e2e.test.ts`)

Mirror the exact structure of `src/__tests__/e2e/openai/tools.e2e.test.ts` with these adaptations:

**Import Pattern**:

```typescript
import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import { createAnthropicTestClient } from "../shared/modelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getAnthropicTestModel } from "../shared/getTestModel.js";
import { loadAnthropicTestConfig } from "../shared/testConfig.js";
import { validateMessageSchema } from "../shared/testHelpers.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { withTimeout } from "../shared/withTimeout.js";
import { createTestTool } from "../shared/createTestTool.js";
import { testToolHandler } from "../shared/testToolHandler.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";
```

**Tool-Capable Model Filtering**:

```typescript
// Extract Anthropic models that support tool calls
const anthropicProvider = defaultLlmModels.providers.find(
  (p) => p.id === "anthropic",
);
const anthropicModels =
  anthropicProvider?.models
    .filter((model) => model.toolCalls === true)
    .map((model) => ({
      id: `anthropic:${model.id}`,
      name: model.name,
    })) || [];
```

### 2. Test Suite Structure (18 test cases exactly matching OpenAI)

**Tool Registration**:

- Successful tool registration test
- Tool definition validation test

**Function Calling with Tools**:

- Parameterized test for tool-capable Anthropic models (`test.each(anthropicModels)`)
- Tool call processing in chat responses test

**Tool System Integration**:

- Tool execution through BridgeClient test
- Requests when tools available but not used test

**Tool Error Handling**:

- Tool registration errors test
- Tool execution failures test
- Requests when tool system disabled test

**Tool Behavior Validation**:

- Message format consistency with tools test
- Complex tool requests handling test
- Metadata preservation in tool responses test

### 3. Setup and Tool Registration

**beforeAll Setup Pattern**:

```typescript
describe("Anthropic Tool Execution E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    loadAnthropicTestConfig(); // Validate environment configuration
    client = createAnthropicTestClient();
    testModel = getAnthropicTestModel();
    ensureModelRegistered(client, testModel);

    // Ensure model supports tool calls
    const modelInfo = client.getModelRegistry().get(testModel);
    if (!modelInfo?.capabilities?.toolCalls) {
      throw new Error(`Test model ${testModel} does not support tool calls`);
    }

    // Register test tool
    const toolDef = createTestTool();
    client.registerTool(
      toolDef,
      testToolHandler as (params: Record<string, unknown>) => Promise<unknown>,
    );
  });
```

### 4. Exact Test Descriptions and Logic

Use identical test descriptions as OpenAI tests:

- "should register tools successfully"
- "should validate tool definitions"
- "should handle chat requests with tools using $name ($id)"
- "should process tool calls in chat responses"
- "should handle tool execution through BridgeClient"
- "should handle requests when tools are available but not used"
- "should handle tool registration errors gracefully"
- "should handle tool execution failures gracefully"
- "should handle requests when tool system is disabled"
- "should maintain message format consistency with tools"
- "should handle complex tool requests appropriately"
- "should preserve metadata in tool responses"

### 5. Tool Integration Pattern

**Tool Prompts**:

- "Use the e2e_echo_tool to echo the message 'Hello from tool test'"
- "Use the e2e_echo_tool to echo back the message 'Integration test'"
- "Just say hello, don't use any tools"
- "Use the e2e_echo_tool to echo 'Format consistency test'"

**Timeout Pattern**:

- 25s for tool execution tests
- 30s timeout parameter for extended tests

## Acceptance Criteria

- [ ] Test file contains exactly 18 test cases mirroring OpenAI structure
- [ ] Parameterized tests run only on tool-capable Anthropic models
- [ ] Tool registration validates createTestTool definitions correctly
- [ ] Tool execution works through BridgeClient with testToolHandler
- [ ] Tool call processing extracts and formats tool calls correctly
- [ ] Error handling covers registration errors, execution failures, disabled tools
- [ ] Message format validation maintains schema consistency with tools
- [ ] Complex tool scenarios (multiple calls, unused tools) work correctly
- [ ] Metadata preservation works in tool response scenarios
- [ ] Tests use claude-3-5-haiku-latest as default model
- [ ] All timeout patterns match OpenAI equivalents (25s/30s)
- [ ] Tool system integration follows existing BridgeClient patterns

## Dependencies

- Requires T-extend-shared-helpers-for for createAnthropicTestClient and related helpers
- Requires T-update-jest-setup-files-for for environment validation
- Uses existing tool testing utilities (createTestTool, testToolHandler)
- Uses existing shared utilities (validateMessageSchema, withTimeout, etc.)
- References tool-capable Anthropic models from defaultLlmModels.ts

## Security Considerations

- Never log API keys in test output
- Validate tool definitions and inputs securely
- Handle tool execution errors without exposing internals
- Ensure tool result formatting doesn't leak sensitive data

## Testing Requirements

The tests themselves serve as integration tests for tool functionality:

- Tool registration and validation works correctly
- Tool execution through current BridgeClient paths
- Error recovery from tool failures
- Integration with existing message processing pipeline

## Technical Approach

1. Copy structure from OpenAI tools.e2e.test.ts
2. Replace OpenAI-specific imports with Anthropic equivalents
3. Filter models for tool capability (`toolCalls === true`)
4. Use same test tool definitions (createTestTool, testToolHandler)
5. Maintain identical tool prompts and execution patterns
6. Apply same timeout patterns and error handling
7. Ensure tool call processing aligns with current extraction paths

## Out of Scope

- Creating chat or streaming tests (handled by separate tasks)
- Modifying existing OpenAI tool test files
- Adding new tool features not present in OpenAI equivalent
- Creating custom tools beyond the standard e2e_echo_tool
