---
id: T-create-google-multi-turn-e2e
title: Create Google multi-turn E2E tests
status: done
priority: medium
parent: F-multi-turn-e2e-test-suite
prerequisites:
  - T-create-openai-multi-turn-e2e
affectedFiles:
  src/__tests__/e2e/google/multiTurn.e2e.test.ts: "Created comprehensive
    multi-turn E2E test suite for Google provider with 2 test scenarios: basic
    multi-turn flow with maxIterations: 3 and maxIterations limit enforcement
    with maxIterations: 2. Follows exact same patterns as existing Anthropic and
    OpenAI multiTurn tests with proper imports, model filtering, tool
    registration, and validation logic. Uses Google-specific helpers
    (createGoogleTestClient, getGoogleTestModel, loadGoogleTestConfig) and
    shared infrastructure (validateMessageSchema, createTestTool,
    testToolHandler)."
log:
  - "Successfully implemented Google multi-turn E2E test suite following exact
    same patterns as existing provider tests. Created comprehensive test file
    with 2 test scenarios: basic multi-turn conversation flow and maxIterations
    limit enforcement. Tests validate that the multi-turn execution path is
    triggered correctly with Google models, using proper tool integration,
    timeout handling, and response validation. All quality checks pass and tests
    execute successfully within expected timeframes."
schema: v1.0
childrenIds: []
created: 2025-09-18T17:00:01.416Z
updated: 2025-09-18T17:00:01.416Z
---

# Create Google Multi-Turn E2E Tests

## Context

Create `src/__tests__/e2e/google/multiTurn.e2e.test.ts` following the exact same patterns as existing Google `tools.e2e.test.ts` file. This task implements basic multi-turn conversation testing for Google provider with minimal scope - just 2 simple tests to validate the multi-turn execution path.

## Implementation Requirements

### File to Create

- `src/__tests__/e2e/google/multiTurn.e2e.test.ts` (~100 lines)

### Technical Approach

1. **Copy Structure from Existing Pattern**
   - Use `src/__tests__/e2e/google/tools.e2e.test.ts` as the template
   - Same imports pattern but with Google-specific helpers
   - Same beforeAll setup, same model filtering
   - Same client creation and tool registration patterns

2. **Required Imports** (adapt from google tools pattern):

   ```typescript
   import { describe, test, expect, beforeAll } from "@jest/globals";
   import type { BridgeClient } from "../../../client/bridgeClient";
   import { createTestClient } from "../shared/googleModelHelpers";
   import { ensureModelRegistered } from "../shared/ensureModelRegistered";
   import { getGoogleTestModel } from "../shared/getGoogleTestModel";
   import { loadTestConfig } from "../shared/googleTestConfig";
   import { validateMessageSchema } from "../shared/testHelpers";
   import { createTestMessages } from "../shared/createTestMessages";
   import { withTimeout } from "../shared/withTimeout";
   import { createTestTool } from "../shared/createTestTool";
   import { testToolHandler } from "../shared/testToolHandler";
   import { defaultLlmModels } from "../../../data/defaultLlmModels";
   ```

3. **Model Filtering** (adapt for Google):
   ```typescript
   const googleProvider = defaultLlmModels.providers.find(
     (p) => p.id === "google",
   );
   const googleModels =
     googleProvider?.models
       .filter((model) => model.toolCalls === true)
       .map((model) => ({ id: `google:${model.id}`, name: model.name })) || [];
   ```

### Test Implementation

1. **Test Suite Structure**:

   ```typescript
   describe("Google Multi-Turn E2E", () => {
     let client: BridgeClient;
     let testModel: string;

     beforeAll(() => {
       loadTestConfig(); // Google-specific config loading
       client = createTestClient();
       testModel = getGoogleTestModel(); // Google-specific model getter
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

- ✅ File `src/__tests__/e2e/google/multiTurn.e2e.test.ts` created
- ✅ Follows exact same structure as existing Google `tools.e2e.test.ts`
- ✅ Uses Google-specific shared infrastructure (`googleModelHelpers`, `getGoogleTestModel`, etc.)
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

- ✅ Reuses existing Google-specific helpers (`createTestClient`, `getGoogleTestModel`)
- ✅ Uses existing `createTestTool` and `testToolHandler`
- ✅ Follows established Google test patterns for configuration and setup
- ✅ Uses same model filtering approach as other Google tests

## Dependencies

- Requires T-create-openai-multi-turn-e2e to be completed first (to establish patterns)

## Security Considerations

- Uses existing Google test infrastructure which already handles API key validation
- Follows established patterns for secure test execution with Google credentials

## Testing Requirements

- Tests must pass when run with `npm test` or `npm run test:e2e`
- Must work with Google test model configured in environment
- Should gracefully skip if Google API key not available (following existing patterns)
- **CRITICAL**: Must include `tools` array to ensure `shouldExecuteMultiTurn()` returns true

## Out of Scope

- No new shared infrastructure creation
- No performance testing or measurements
- No streaming interruption testing
- No complex error scenarios (leave to unit tests)
- No parallel tool execution testing
