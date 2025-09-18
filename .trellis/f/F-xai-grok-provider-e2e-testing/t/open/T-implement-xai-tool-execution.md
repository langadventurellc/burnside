---
id: T-implement-xai-tool-execution
title: Implement xAI tool execution E2E tests
status: open
priority: medium
parent: F-xai-grok-provider-e2e-testing
prerequisites:
  - T-create-xai-bridgeclient
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T00:12:51.959Z
updated: 2025-09-18T00:12:51.959Z
---

# Implement xAI Tool Execution E2E Tests

## Context

This task implements comprehensive tool execution E2E tests for the xAI Grok provider, following the exact patterns established by the OpenAI E2E tools tests. These tests validate tool registration, function calling, and integration with the current tool system architecture.

## Reference Implementation

Follow this existing OpenAI E2E testing pattern:

- `src/__tests__/e2e/openai/tools.e2e.test.ts` - Complete tool execution test suite

## Implementation Requirements

### 1. Create xAI Tools E2E Test File (`src/__tests__/e2e/xai/tools.e2e.test.ts`)

Mirror the structure of the OpenAI tools tests but adapted for xAI:

```typescript
import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { createTestClient } from "../shared/xaiModelHelpers";
import { ensureModelRegistered } from "../shared/ensureModelRegistered";
import { getXaiTestModel } from "../shared/getXaiTestModel";
import { loadXaiTestConfig } from "../shared/xaiTestConfig";
import { validateMessageSchema } from "../shared/testHelpers";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { createTestTool } from "../shared/createTestTool";
import { testToolHandler } from "../shared/testToolHandler";
import { defaultLlmModels } from "../../../data/defaultLlmModels";

// Extract xAI models that support tool calls
const xaiProvider = defaultLlmModels.providers.find((p) => p.id === "xai");
const xaiModels =
  xaiProvider?.models
    .filter((model) => model.toolCalls === true)
    .map((model) => ({
      id: `xai:${model.id}`,
      name: model.name,
    })) || [];
```

### 2. Implement Test Setup

#### BeforeAll Setup

```typescript
beforeAll(() => {
  loadXaiTestConfig(); // Validate environment configuration
  client = createTestClient();
  testModel = getXaiTestModel();
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

### 3. Implement Test Categories

#### Tool Registration

- **Tool registration validation**: Verify tools register successfully
- **Tool definition validation**: Check tool schema compliance
- **Error handling**: Invalid tool registration scenarios

#### Function Calling with Tools

- **Parameterized model testing**: Test all tool-capable Grok models
- **Tool call processing**: Validate tool execution through chat requests
- **Response format**: Ensure responses maintain proper schema with tools

#### Tool System Integration

- **BridgeClient integration**: Test tool execution through complete workflow
- **Tool availability**: Test requests when tools available but not used
- **Current implementation**: Work with existing tool system behavior

#### Tool Error Handling

- **Registration errors**: Invalid tool definitions
- **Execution failures**: Tool handler errors and recovery
- **System disabled**: Behavior when tool system not enabled

#### Tool Behavior Validation

- **Message format consistency**: Maintain schema with tool processing
- **Complex requests**: Multiple tool usage scenarios
- **Metadata preservation**: Tool-related metadata handling

### 4. Key Test Implementations

#### Parameterized Tool Testing

```typescript
test.each(xaiModels)(
  "should handle chat requests with tools using $name ($id)",
  async ({ id: modelId }) => {
    ensureModelRegistered(client, modelId);

    const messages = createTestMessages(
      "Use the e2e_echo_tool to echo the message 'Hello from tool test'",
    );

    const response = await withTimeout(
      client.chat({
        messages,
        model: modelId,
      }),
      25000,
    );

    // Should receive a valid response
    expect(response).toBeDefined();
    validateMessageSchema(response);
    expect(response.role).toBe("assistant");
    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
  },
  30000,
);
```

#### Tool Registration Tests

```typescript
test("should register tools successfully", () => {
  const toolDef = createTestTool();
  const testClient = createTestClient();

  // Should not throw when registering valid tool
  expect(() => {
    testClient.registerTool(
      toolDef,
      testToolHandler as (params: Record<string, unknown>) => Promise<unknown>,
    );
  }).not.toThrow();
});

test("should validate tool definitions", () => {
  const testClient = createTestClient();
  const toolDef = createTestTool();

  // Register tool and verify it's available
  testClient.registerTool(
    toolDef,
    testToolHandler as (params: Record<string, unknown>) => Promise<unknown>,
  );

  // Tool should be registered (this is tested implicitly through successful execution)
  expect(toolDef.name).toBe("e2e_echo_tool");
  expect(toolDef.description).toBeTruthy();
  expect(toolDef.inputSchema).toBeDefined();
  expect(toolDef.outputSchema).toBeDefined();
});
```

#### Tool System Integration Tests

```typescript
test("should handle tool execution through BridgeClient", async () => {
  // Create a separate client to test tool integration
  const testClient = createTestClient();
  ensureModelRegistered(testClient, testModel);

  const toolDef = createTestTool();
  testClient.registerTool(
    toolDef,
    testToolHandler as (params: Record<string, unknown>) => Promise<unknown>,
  );

  const messages = createTestMessages(
    "Please use the e2e_echo_tool to echo back the message 'Integration test'",
  );

  const response = await withTimeout(
    testClient.chat({
      messages,
      model: testModel,
    }),
    25000,
  );

  // Tool execution should result in valid response
  validateMessageSchema(response);
  expect(response.role).toBe("assistant");
  expect(response.content).toBeDefined();
});

test("should handle requests when tools are available but not used", async () => {
  const messages = createTestMessages("Just say hello, don't use any tools");

  const response = await withTimeout(
    client.chat({
      messages,
      model: testModel,
    }),
    25000,
  );

  // Should work normally even when tools are registered but not used
  validateMessageSchema(response);
  expect(response.role).toBe("assistant");
  expect(response.content).toBeDefined();

  if (response.content.length > 0 && response.content[0].type === "text") {
    expect(response.content[0].text.toLowerCase()).toContain("hello");
  }
});
```

#### Error Handling Tests

```typescript
test("should handle tool registration errors gracefully", () => {
  const testClient = createTestClient();

  // Test with invalid tool definition
  const invalidToolDef = {
    name: "", // Invalid empty name
    description: "Invalid tool",
    inputSchema: createTestTool().inputSchema,
    outputSchema: createTestTool().outputSchema,
  };

  // Should handle invalid tool registration
  expect(() => {
    testClient.registerTool(
      invalidToolDef,
      testToolHandler as (params: Record<string, unknown>) => Promise<unknown>,
    );
  }).toThrow();
});

test("should handle tool execution failures gracefully", async () => {
  const testClient = createTestClient();
  ensureModelRegistered(testClient, testModel);

  // Register a tool that will fail
  const errorToolDef = {
    name: "error_test_tool",
    description: "Tool that causes errors for testing",
    inputSchema: createTestTool().inputSchema,
    outputSchema: createTestTool().outputSchema,
  };

  const errorHandler = () => {
    throw new Error("Intentional test error");
  };

  testClient.registerTool(errorToolDef, errorHandler);

  const messages = createTestMessages(
    "Use the error_test_tool to cause an error",
  );

  // Should not throw, but handle error gracefully
  const response = await withTimeout(
    testClient.chat({
      messages,
      model: testModel,
    }),
    25000,
  );

  // Should receive a valid response even with tool errors
  validateMessageSchema(response);
  expect(response.role).toBe("assistant");
});
```

### 5. Test Structure

Follow the exact describe block structure from OpenAI tools tests:

- **"xAI Tool Execution E2E"** - Main test suite
  - **"Tool Registration"** - Tool setup and validation
  - **"Function Calling with Tools"** - Core tool functionality
  - **"Tool System Integration"** - BridgeClient workflow testing
  - **"Tool Error Handling"** - Failure scenarios and recovery
  - **"Tool Behavior Validation"** - Advanced scenarios and consistency

## Technical Approach

1. **Mirror OpenAI patterns exactly**: Use identical tool test patterns and validation
2. **xAI-specific adaptations**: Use xAI models and provider configuration
3. **Real tool integration**: Execute actual tool calls through xAI API
4. **Current system compatibility**: Work with existing tool execution architecture
5. **Comprehensive validation**: Test registration, execution, error handling

## Acceptance Criteria

### Functional Requirements

- ✅ All tool-capable Grok models tested with parameterized tests
- ✅ Tool registration succeeds with valid tool definitions
- ✅ Tool execution works through BridgeClient chat requests
- ✅ Responses maintain unified message schema with tool processing
- ✅ Tools available but not used scenarios work properly
- ✅ Current tool system integration preserved (single-turn behavior)

### Tool Registration

- ✅ Valid tool definitions register without errors
- ✅ Tool validation prevents invalid registrations (empty names, etc.)
- ✅ Echo tool registration works correctly with test handler
- ✅ Multiple tool registration supported

### Tool Execution

- ✅ Tool calls extracted from xAI responses using current metadata paths
- ✅ Tool execution workflow completes successfully
- ✅ Tool results properly formatted in responses
- ✅ Tool call processing maintains message format consistency

### Error Handling

- ✅ Invalid tool registration throws appropriate errors
- ✅ Tool execution failures handled gracefully without breaking chat
- ✅ Tool system disabled scenarios work normally
- ✅ Network and API errors don't cause tool system failures

### Integration Requirements

- ✅ BridgeClient integration works with existing tool architecture
- ✅ Metadata preservation includes tool-related information
- ✅ Complex tool requests (multiple tools) handled appropriately
- ✅ Tool system behaves consistently with current implementation

## Dependencies

- Previous task: T-create-xai-bridgeclient (for xAI BridgeClient factory)
- Existing shared E2E helpers (createTestTool, testToolHandler, validateMessageSchema)
- xAI provider tool execution implementation
- Current tool system architecture and metadata paths
- Valid XAI_API_KEY for real tool execution testing

## Files to Create

**New Files:**

- `src/__tests__/e2e/xai/tools.e2e.test.ts`

## Testing Strategy

### Test Scenarios

1. **Registration**: Valid/invalid tool definitions, echo tool setup
2. **Execution**: Tool calls through chat, parameterized model testing
3. **Integration**: BridgeClient workflow, tool system compatibility
4. **Error Handling**: Registration failures, execution errors, system disabled
5. **Behavior**: Message consistency, complex requests, metadata preservation

### Tool System Integration

- Work with current tool execution paths (metadata.tool_calls)
- Test with existing echo tool implementation
- Validate current single-turn tool execution behavior
- Ensure compatibility with existing tool handler signatures

## Technical Notes

### Tool Capability Filtering

- Filter models by `toolCalls === true` capability
- All current Grok models support tool calls by default
- Validate tool capability before test execution

### Tool Execution Path

- Use current tool call extraction implementation
- Work with existing metadata.tool_calls path
- Test actual tool execution through xAI provider
- Validate tool result formatting matches expectations

### Error Recovery

- Tool execution errors should not break chat functionality
- Invalid tool registrations should fail fast with clear errors
- Network errors should be handled gracefully
- Tool system disabled scenarios should work normally

## Out of Scope

- Chat completion without tools (handled by chat task)
- Streaming with tools (basic streaming handled by streaming task)
- Tool execution performance optimization
- Multi-provider tool compatibility testing
