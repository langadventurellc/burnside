---
id: T-create-xai-multi-turn-e2e
title: Create xAI multi-turn E2E tests
status: done
priority: medium
parent: F-multi-turn-e2e-test-suite
prerequisites:
  - T-create-openai-multi-turn-e2e
affectedFiles:
  src/__tests__/e2e/xai/multiTurn.e2e.test.ts: "Created comprehensive xAI
    multi-turn E2E test suite with 2 test scenarios: basic multi-turn flow and
    maxIterations limit enforcement. Follows exact same patterns as existing xAI
    tools.e2e.test.ts with proper imports, model filtering, and validation
    logic."
  src/providers/xai-v1/responseSchema.ts: Added function_call output schema
    support for multi-turn responses using flat Responses API format
  src/providers/xai-v1/responseParser.ts: Enhanced parser to handle
    function-call-only responses, reasoning-only responses, and create synthetic
    assistant messages for multi-turn scenarios
  src/providers/xai-v1/errorNormalizer.ts: Enhanced error logging for better
    debugging of validation failures and transport errors
  src/providers/xai-v1/xaiTool.ts: Updated tool schema for flat Responses API
    format (flat structure instead of nested function object)
  src/providers/xai-v1/toolTranslator.ts: Fixed tool translator to use flat
    Responses API format instead of nested Chat Completions format
  src/providers/xai-v1/__tests__/fixtures/toolExamples.ts: Updated test fixtures to match flat Responses API tool format
  src/providers/xai-v1/__tests__/fixtures/errorResponses.ts: Updated test fixture to properly test unsupported output types
  src/providers/xai-v1/__tests__/responseParser.test.ts: Updated unit tests to validate new reasoning-only response handling behavior
log:
  - "Successfully implemented xAI multi-turn E2E tests with comprehensive
    provider fixes. Created multi-turn test file with two test cases following
    existing patterns. Fixed critical xAI provider bugs: updated tool schema to
    flat format for Responses API, added function_call output schema support,
    enhanced response parser to handle function_call-only and reasoning-only
    responses by creating synthetic assistant messages, and added enhanced error
    logging for better debugging. Multi-turn execution now works correctly for
    xAI provider matching OpenAI implementation."
schema: v1.0
childrenIds: []
created: 2025-09-18T17:00:26.473Z
updated: 2025-09-18T17:00:26.473Z
---

# Create xAI Multi-Turn E2E Tests

## Context

Create `src/__tests__/e2e/xai/multiTurn.e2e.test.ts` following the exact same patterns as existing xAI `tools.e2e.test.ts` file. This task implements basic multi-turn conversation testing for xAI provider with minimal scope - just 2 simple tests to validate the multi-turn execution path.

## Implementation Requirements

### File to Create

- `src/__tests__/e2e/xai/multiTurn.e2e.test.ts` (~100 lines)

### Technical Approach

1. **Copy Structure from Existing Pattern**
   - Use `src/__tests__/e2e/xai/tools.e2e.test.ts` as the template
   - Same imports pattern but with xAI-specific helpers
   - Same beforeAll setup, same model filtering
   - Same client creation and tool registration patterns

2. **Required Imports** (adapt from xai tools pattern):

   ```typescript
   import { describe, test, expect, beforeAll } from "@jest/globals";
   import type { BridgeClient } from "../../../client/bridgeClient";
   import { createTestClient } from "../shared/xaiModelHelpers";
   import { ensureModelRegistered } from "../shared/ensureModelRegistered";
   import { getXaiTestModel } from "../shared/getXaiTestModel";
   import { loadTestConfig } from "../shared/xaiTestConfig";
   import { validateMessageSchema } from "../shared/testHelpers";
   import { createTestMessages } from "../shared/createTestMessages";
   import { withTimeout } from "../shared/withTimeout";
   import { createTestTool } from "../shared/createTestTool";
   import { testToolHandler } from "../shared/testToolHandler";
   import { defaultLlmModels } from "../../../data/defaultLlmModels";
   ```

3. **Model Filtering** (adapt for xAI):
   ```typescript
   const xaiProvider = defaultLlmModels.providers.find((p) => p.id === "xai");
   const xaiModels =
     xaiProvider?.models
       .filter((model) => model.toolCalls === true)
       .map((model) => ({ id: `xai:${model.id}`, name: model.name })) || [];
   ```

### Test Implementation

1. **Test Suite Structure**:

   ```typescript
   describe("xAI Multi-Turn E2E", () => {
     let client: BridgeClient;
     let testModel: string;

     beforeAll(() => {
       loadTestConfig(); // xAI-specific config loading
       client = createTestClient();
       testModel = getXaiTestModel(); // xAI-specific model getter
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

- ✅ File `src/__tests__/e2e/xai/multiTurn.e2e.test.ts` created
- ✅ Follows exact same structure as existing xAI `tools.e2e.test.ts`
- ✅ Uses xAI-specific shared infrastructure (`xaiModelHelpers`, `getXaiTestModel`, etc.)
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

- ✅ Reuses existing xAI-specific helpers (`createTestClient`, `getXaiTestModel`)
- ✅ Uses existing `createTestTool` and `testToolHandler`
- ✅ Follows established xAI test patterns for configuration and setup
- ✅ Uses same model filtering approach as other xAI tests

## Dependencies

- Requires T-create-openai-multi-turn-e2e to be completed first (to establish patterns)

## Security Considerations

- Uses existing xAI test infrastructure which already handles API key validation
- Follows established patterns for secure test execution with xAI credentials

## Testing Requirements

- Tests must pass when run with `npm test` or `npm run test:e2e`
- Must work with xAI test model configured in environment
- Should gracefully skip if xAI API key not available (following existing patterns)
- **CRITICAL**: Must include `tools` array to ensure `shouldExecuteMultiTurn()` returns true

## Out of Scope

- No new shared infrastructure creation
- No performance testing or measurements
- No streaming interruption testing
- No complex error scenarios (leave to unit tests)
- No parallel tool execution testing
