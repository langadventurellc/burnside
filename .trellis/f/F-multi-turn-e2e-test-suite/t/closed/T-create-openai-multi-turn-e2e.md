---
id: T-create-openai-multi-turn-e2e
title: Create OpenAI multi-turn E2E tests
status: done
priority: medium
parent: F-multi-turn-e2e-test-suite
prerequisites: []
affectedFiles:
  src/__tests__/e2e/openai/multiTurn.e2e.test.ts:
    Created comprehensive multi-turn
    E2E tests with basic conversation flow and maxIterations limit validation
  src/providers/openai-responses-v1/openAIToolSchema.ts: Updated tool schema for OpenAI Responses API format (flat structure)
  src/providers/openai-responses-v1/toolTranslator.ts: Fixed tool translator to
    use Responses API format instead of Chat Completions format
  src/providers/openai-responses-v1/toolsTranslator.ts: Updated tools translator type definitions for consistency
  src/providers/openai-responses-v1/__tests__/toolTranslator.test.ts: Updated test assertions for new tool format
  src/providers/openai-responses-v1/__tests__/fixtures/toolExamples.ts: Updated test fixtures to match Responses API tool format
  src/providers/openai-responses-v1/responseSchema.ts: Added function_call output schema support for multi-turn responses
  src/providers/openai-responses-v1/responseParser.ts: Enhanced parser to handle
    function-call-only responses and create synthetic assistant messages
  src/providers/openai-responses-v1/errorNormalizer.ts: Enhanced error logging for better debugging of validation failures
log:
  - "Successfully implemented OpenAI multi-turn E2E tests with core provider
    fixes. Created multi-turn test file with two test cases following Anthropic
    patterns. Fixed critical OpenAI provider bugs: corrected tool format for
    Responses API, added function_call output schema support, and enhanced
    response parser to handle function-call-only responses by creating synthetic
    assistant messages. Multi-turn execution now works correctly for OpenAI
    provider. Enhanced error logging for better debugging of intermittent API
    issues."
schema: v1.0
childrenIds: []
created: 2025-09-18T16:59:08.345Z
updated: 2025-09-18T16:59:08.345Z
---

# Create OpenAI Multi-Turn E2E Tests

## Context

Create `src/__tests__/e2e/openai/multiTurn.e2e.test.ts` following the exact same patterns as existing `tools.e2e.test.ts` files. This task implements basic multi-turn conversation testing for OpenAI provider with minimal scope - just 2 simple tests to validate the multi-turn execution path.

## Implementation Requirements

### File to Create

- `src/__tests__/e2e/openai/multiTurn.e2e.test.ts` (~100 lines)

### Technical Approach

1. **Copy Structure from Existing Pattern**
   - Use `src/__tests__/e2e/openai/tools.e2e.test.ts` as the template
   - Same imports, same beforeAll setup, same model filtering
   - Same client creation and tool registration patterns
   - Same timeout handling and validation approaches

2. **Required Imports** (copy from tools.e2e.test.ts):

   ```typescript
   import { describe, test, expect, beforeAll } from "@jest/globals";
   import type { BridgeClient } from "../../../client/bridgeClient";
   import { createTestClient } from "../shared/openAIModelHelpers";
   import { ensureModelRegistered } from "../shared/ensureModelRegistered";
   import { getTestModel } from "../shared/getTestModel";
   import { loadTestConfig } from "../shared/openAITestConfig";
   import { validateMessageSchema } from "../shared/testHelpers";
   import { createTestMessages } from "../shared/createTestMessages";
   import { withTimeout } from "../shared/withTimeout";
   import { createTestTool } from "../shared/createTestTool";
   import { testToolHandler } from "../shared/testToolHandler";
   import { defaultLlmModels } from "../../../data/defaultLlmModels";
   ```

3. **Model Filtering** (copy existing pattern):
   ```typescript
   const openaiProvider = defaultLlmModels.providers.find(
     (p) => p.id === "openai",
   );
   const openaiModels =
     openaiProvider?.models
       .filter((model) => model.toolCalls === true)
       .map((model) => ({ id: `openai:${model.id}`, name: model.name })) || [];
   ```

### Test Implementation

1. **Test Suite Structure**:

   ```typescript
   describe("OpenAI Multi-Turn E2E", () => {
     let client: BridgeClient;
     let testModel: string;

     beforeAll(() => {
       // Same setup as tools.e2e.test.ts
       loadTestConfig();
       client = createTestClient();
       testModel = getTestModel();
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

- ✅ File `src/__tests__/e2e/openai/multiTurn.e2e.test.ts` created
- ✅ Follows exact same structure as existing `tools.e2e.test.ts`
- ✅ Uses all existing shared infrastructure (no new helpers needed)
- ✅ Contains exactly 2 test scenarios as specified
- ✅ Filters models to only test those with `toolCalls: true`
- ✅ Uses appropriate timeouts (45 seconds for multi-turn scenarios)
- ✅ **CRITICAL**: Includes `tools` array in chat requests to trigger multi-turn execution path

### Test Coverage Requirements

- ✅ Basic multi-turn conversation execution with natural completion
- ✅ MaxIterations limit enforcement validation
- ✅ Proper response validation using existing `validateMessageSchema`
- ✅ Tool registration and execution within multi-turn context

### Integration Requirements

- ✅ Reuses existing `createTestClient`, `ensureModelRegistered`, `withTimeout`
- ✅ Uses existing `createTestTool` and `testToolHandler`
- ✅ Follows established error handling patterns
- ✅ Uses same model filtering approach as other provider tests

## Dependencies

- No dependencies - can be implemented independently

## Security Considerations

- Uses existing test infrastructure which already handles API key validation
- Follows established patterns for secure test execution

## Testing Requirements

- Tests must pass when run with `npm test` or `npm run test:e2e`
- Must work with OpenAI test model configured in environment
- Should gracefully skip if OpenAI API key not available (following existing patterns)
- **CRITICAL**: Must include `tools` array to ensure `shouldExecuteMultiTurn()` returns true

## Out of Scope

- No new shared infrastructure creation
- No performance testing or measurements
- No streaming interruption testing
- No complex error scenarios (leave to unit tests)
- No parallel tool execution testing
