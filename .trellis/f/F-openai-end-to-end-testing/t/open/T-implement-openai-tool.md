---
id: T-implement-openai-tool
title: Implement OpenAI tool execution E2E tests
status: open
priority: medium
parent: F-openai-end-to-end-testing
prerequisites:
  - T-implement-tool-call
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T06:24:58.631Z
updated: 2025-09-16T06:24:58.631Z
---

# Implement OpenAI Tool Execution E2E Tests

## Context

Create comprehensive end-to-end tests for OpenAI tool execution functionality using real API calls. These tests validate the complete tool call flow: function calling requests to OpenAI, tool call extraction, tool execution through the agent loop, and result formatting.

Related to feature: F-openai-end-to-end-testing

## Specific Implementation Requirements

### 1. Create Tool Execution E2E Test File

Implement `src/__tests__/e2e/openai/tools.e2e.test.ts` with comprehensive tool execution coverage:

- Tool registration and definition validation
- Tool call requests to OpenAI with function calling
- Tool call extraction from OpenAI responses (using reconciliation helpers)
- Agent loop execution with single-turn behavior
- Tool result formatting and message generation

### 2. Test Categories

Implement the following tool execution test categories:

- **Tool Registration**: Tool definition and registration validation
- **Function Calling**: OpenAI requests with tool definitions
- **Tool Extraction**: Tool call parsing from OpenAI responses
- **Execution Flow**: Complete tool execution through agent loop
- **Result Formatting**: Tool result message generation

### 3. Tool Call Path Validation

Validate the complete tool call flow accounting for the current implementation paths and single-turn behavior using the reconciliation helpers.

## Technical Approach

### Test Structure

```typescript
// tools.e2e.test.ts
import { describe, test, expect, beforeAll } from "@jest/globals";
import {
  createTestClient,
  ensureModelRegistered,
  getTestModel,
} from "../shared/modelHelpers.js";
import { loadTestConfig } from "../shared/testConfig.js";
import {
  createTestTool,
  testToolHandler,
  prepareToolCallMessage,
} from "../shared/toolHelpers.js";
import type { BridgeClient } from "../../../client/bridgeClient.js";

describe("OpenAI Tool Execution E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(async () => {
    const config = loadTestConfig();
    client = createTestClient();
    testModel = getTestModel();
    await ensureModelRegistered(client, testModel);

    // Ensure model supports tool calls (avoid o1-2024-12-17 which has toolCalls: false)
    const modelInfo = client.getModelRegistry().get(testModel);
    if (!modelInfo?.capabilities?.toolCalls) {
      throw new Error(`Test model ${testModel} does not support tool calls`);
    }

    // Register test tool
    const toolDef = createTestTool();
    client.registerTool(toolDef, testToolHandler);
  });

  describe("Tool Registration", () => {
    test("should register tools successfully", async () => {
      // Test tool registration
    });

    test("should validate tool definitions", async () => {
      // Test tool definition validation
    });
  });

  describe("Function Calling", () => {
    test("should request tool calls from OpenAI", async () => {
      // Test OpenAI function calling request
    });

    test("should receive tool calls in response", async () => {
      // Test tool call parsing from response
    });
  });

  describe("Tool Extraction", () => {
    test("should extract tool calls using reconciliation helper", async () => {
      // Test tool call extraction with prepareToolCallMessage
    });

    test("should handle tool call format conversion", async () => {
      // Test conversion between unified and OpenAI raw formats
    });
  });

  describe("Tool Execution", () => {
    test("should execute tools through agent loop", async () => {
      // Test complete tool execution flow
    });

    test("should format tool results correctly", async () => {
      // Test tool result formatting
    });
  });

  describe("Current Implementation Behavior", () => {
    test("should handle single-turn tool execution", async () => {
      // Test current single-turn behavior
    });

    test("should handle missing tool gracefully", async () => {
      // Test error handling for non-registered tools
    });
  });
});
```

### Tool Call Flow Testing

1. **Tool Registration Tests**
   - Register test tool with BridgeClient
   - Validate tool definition schema compliance
   - Verify tool is available in router

2. **Function Calling Tests**
   - Send chat request with tool definitions
   - Verify OpenAI returns function call responses
   - Test tool call extraction from response metadata

3. **Extraction Flow Tests**
   - Use prepareToolCallMessage helper to convert tool call formats
   - Test tool extraction using actual extractToolCallsFromMessage implementation
   - Validate single-turn execution returning original message

4. **Error Handling Tests**
   - Test scenarios where tool call references non-registered tool
   - Verify graceful handling of malformed tool calls
   - Test tool execution errors

## Detailed Acceptance Criteria

### Functional Requirements

1. **Tool Registration and Validation**
   - ✅ Test tools register successfully with BridgeClient
   - ✅ Tool definitions pass validation checks
   - ✅ Registered tools are available for execution
   - ✅ Tool schema validation works with Zod schemas

2. **OpenAI Function Calling**
   - ✅ Chat requests with tools parameter succeed
   - ✅ OpenAI returns responses containing function calls
   - ✅ Function call format matches expected structure
   - ✅ Tool calls reference registered tool names correctly

3. **Tool Call Extraction**
   - ✅ Tool calls are extracted from OpenAI response messages
   - ✅ Tool call reconciliation helper correctly converts formats
   - ✅ prepareToolCallMessage transforms unified to OpenAI raw format
   - ✅ extractToolCallsFromMessage finds tool calls correctly after conversion

4. **Tool Execution Flow**
   - ✅ Tool calls execute through BridgeClient tool system
   - ✅ Tool handler receives correct parameters
   - ✅ Tool execution returns expected results
   - ✅ Tool results are formatted as proper messages

5. **Current Implementation Behavior**
   - ✅ Single-turn tool execution works as currently implemented
   - ✅ Original message is returned (not continuation turn)
   - ✅ Tool result messages are generated correctly
   - ✅ Agent loop single-turn behavior is validated

6. **Error Handling**
   - ✅ Non-registered tools in function calls are handled gracefully
   - ✅ Malformed tool call parameters handled safely
   - ✅ Tool execution errors are caught and formatted appropriately

### Technical Requirements

1. **Integration Testing**
   - ✅ Full BridgeClient tool integration (not mocked)
   - ✅ Real OpenAI API calls with function calling
   - ✅ Complete tool execution through current architecture
   - ✅ Tool call extraction using reconciliation helpers

2. **Tool Call Path Alignment**
   - ✅ Uses prepareToolCallMessage helper for format conversion
   - ✅ Tests work with current extractToolCallsFromMessage implementation
   - ✅ Tool calls found in expected metadata location after conversion
   - ✅ No "tool calls not found" errors during execution

3. **Model Compatibility**
   - ✅ Validates test model supports tool calls before running tests
   - ✅ Uses models with toolCalls: true capability
   - ✅ Avoids models that don't support function calling

## Dependencies

- T-implement-tool-call must complete first (tool helpers and reconciliation)
- OpenAI API access with valid API key
- BridgeClient tool system and agent loop
- Tool execution infrastructure

## Security Considerations

1. **Tool Safety**
   - Test tools perform only safe, predictable operations
   - No execution of arbitrary code or dangerous operations
   - Tool parameters validated before execution

2. **API Key Protection**
   - Never log or expose API keys in tool test output
   - Use environment variables exclusively
   - Clear error messages without exposing sensitive data

## Testing Requirements

1. **Tool Execution Test Coverage**
   - Tool registration: definition validation, registration success
   - Function calling: OpenAI requests, response parsing
   - Tool extraction: format conversion, call extraction
   - Execution flow: complete tool execution, result formatting
   - Current behavior: single-turn execution validation
   - Error scenarios: missing tools, malformed calls, execution errors

2. **Test Tool Implementation**
   - Simple, predictable test tool (echo functionality)
   - Consistent results for validation
   - Safe operations only (no side effects)

3. **Tool Call Scenarios**
   - Valid tool calls that should succeed
   - Invalid tool calls that should fail gracefully
   - Missing tool scenarios
   - Tool execution error scenarios

## Out of Scope

- Complex multi-turn tool execution (beyond current implementation)
- Tool call streaming (if not currently supported)
- Advanced tool orchestration
- Production tool implementations (test tools only)

## Files to Create

- `src/__tests__/e2e/openai/tools.e2e.test.ts`

## References

- BridgeClient tool methods: `src/client/bridgeClient.ts`
- Tool call extraction: `src/client/extractToolCallsFromMessage.ts`
- Agent loop: `src/core/agent/agentLoop.ts`
- Tool system: `src/core/tools/`
