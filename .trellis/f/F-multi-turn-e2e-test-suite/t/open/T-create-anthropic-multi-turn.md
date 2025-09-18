---
id: T-create-anthropic-multi-turn
title: Create Anthropic multi-turn E2E tests
status: open
priority: medium
parent: F-multi-turn-e2e-test-suite
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T16:59:37.679Z
updated: 2025-09-18T16:59:37.679Z
---

# Create Anthropic Multi-Turn E2E Tests

## Context

Create `src/__tests__/e2e/anthropic/multiTurn.e2e.test.ts` following the exact same patterns as existing Anthropic `tools.e2e.test.ts` file. This task implements basic multi-turn conversation testing for Anthropic provider with minimal scope - just 2 simple tests to validate the multi-turn execution path.

## Implementation Requirements

### File to Create

- `src/__tests__/e2e/anthropic/multiTurn.e2e.test.ts` (~100 lines)

### Technical Approach

1. **Copy Structure from Existing Pattern**
   - Use `src/__tests__/e2e/anthropic/tools.e2e.test.ts` as the template
   - Same imports pattern but with Anthropic-specific helpers
   - Same beforeAll setup, same model filtering
   - Same client creation and tool registration patterns

2. **Required Imports** (adapt from anthropic tools pattern):

   ```typescript
   import { describe, test, expect, beforeAll } from "@jest/globals";
   import type { BridgeClient } from "../../../client/bridgeClient";
   import { createTestClient } from "../shared/anthropicModelHelpers";
   import { ensureModelRegistered } from "../shared/ensureModelRegistered";
   import { getAnthropicTestModel } from "../shared/getAnthropicTestModel";
   import { loadTestConfig } from "../shared/anthropicTestConfig";
   import { validateMessageSchema } from "../shared/testHelpers";
   import { createTestMessages } from "../shared/createTestMessages";
   import { withTimeout } from "../shared/withTimeout";
   import { createTestTool } from "../shared/createTestTool";
   import { testToolHandler } from "../shared/testToolHandler";
   import { defaultLlmModels } from "../../../data/defaultLlmModels";
   ```

3. **Model Filtering** (adapt for Anthropic):
   ```typescript
   const anthropicProvider = defaultLlmModels.providers.find(
     (p) => p.id === "anthropic",
   );
   const anthropicModels =
     anthropicProvider?.models
       .filter((model) => model.toolCalls === true)
       .map((model) => ({ id: `anthropic:${model.id}`, name: model.name })) ||
     [];
   ```

### Test Implementation

1. **Test Suite Structure**:

   ```typescript
   describe("Anthropic Multi-Turn E2E", () => {
     let client: BridgeClient;
     let testModel: string;

     beforeAll(() => {
       loadTestConfig(); // Anthropic-specific config loading
       client = createTestClient();
       testModel = getAnthropicTestModel(); // Anthropic-specific model getter
       ensureModelRegistered(client, testModel);

       // Ensure model supports tool calls
       const modelInfo = client.getModelRegistry().get(testModel);
       if (!modelInfo?.capabilities?.toolCalls) {
         throw new Error(`Test model ${testModel} does not support tool calls`);
       }

       // Register test tool
       const toolDef = createTestTool();
       client.registerTool(toolDef, testToolHandler);
     });
   ```

2. **Test 1: Basic Multi-Turn Flow**

   ```typescript
   test("should handle basic multi-turn conversation", async () => {
     const toolDef = createTestTool();
     const messages = createTestMessages(
       "Use the e2e_echo_tool multiple times to process this request step by step",
     );

     const response = await withTimeout(
       client.chat({
         messages,
         model: testModel,
         tools: [toolDef], // Required for multi-turn execution
         multiTurn: { maxIterations: 3 },
       }),
       45000, // Longer timeout for multi-turn
     );

     // Validate response using existing patterns
     expect(response).toBeDefined();
     validateMessageSchema(response);
     expect(response.role).toBe("assistant");
     expect(response.content).toBeDefined();
   });
   ```

3. **Test 2: MaxIterations Limit**

   ```typescript
   test("should respect maxIterations limit", async () => {
     const toolDef = createTestTool();
     const messages = createTestMessages(
       "Use the e2e_echo_tool repeatedly - keep going until stopped",
     );

     const response = await withTimeout(
       client.chat({
         messages,
         model: testModel,
         tools: [toolDef], // Required for multi-turn execution
         multiTurn: { maxIterations: 2 },
       }),
       45000,
     );

     // Validate response and that conversation terminated properly
     expect(response).toBeDefined();
     validateMessageSchema(response);
     expect(response.role).toBe("assistant");
   });
   ```

## Detailed Acceptance Criteria

### Functional Requirements

- ✅ File `src/__tests__/e2e/anthropic/multiTurn.e2e.test.ts` created
- ✅ Follows exact same structure as existing Anthropic `tools.e2e.test.ts`
- ✅ Uses Anthropic-specific shared infrastructure (`anthropicModelHelpers`, `getAnthropicTestModel`, etc.)
- ✅ Contains exactly 2 test scenarios as specified
- ✅ Filters models to only test those with `toolCalls: true` from defaultLlmModels
- ✅ Uses appropriate timeouts (45 seconds for multi-turn scenarios)
- ✅ **CRITICAL**: Includes `tools` array in chat requests to trigger multi-turn execution path

### Test Coverage Requirements

- ✅ Basic multi-turn conversation execution with natural completion
- ✅ MaxIterations limit enforcement validation
- ✅ Proper response validation using existing `validateMessageSchema`
- ✅ Tool registration and execution within multi-turn context

### Integration Requirements

- ✅ Reuses existing Anthropic-specific helpers (`createTestClient`, `getAnthropicTestModel`)
- ✅ Uses existing `createTestTool` and `testToolHandler`
- ✅ Follows established Anthropic test patterns for configuration and setup
- ✅ Uses same model filtering approach as other Anthropic tests

## Dependencies

- Requires T-create-openai-multi-turn-e2e to be completed first (to establish patterns)

## Security Considerations

- Uses existing Anthropic test infrastructure which already handles API key validation
- Follows established patterns for secure test execution with Anthropic credentials

## Testing Requirements

- Tests must pass when run with `npm test` or `npm run test:e2e`
- Must work with Anthropic test model configured in environment
- Should gracefully skip if Anthropic API key not available (following existing patterns)
- **CRITICAL**: Must include `tools` array to ensure `shouldExecuteMultiTurn()` returns true

## Out of Scope

- No new shared infrastructure creation
- No performance testing or measurements
- No streaming interruption testing
- No complex error scenarios (leave to unit tests)
- No parallel tool execution testing
