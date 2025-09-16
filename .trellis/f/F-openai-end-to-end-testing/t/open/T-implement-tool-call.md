---
id: T-implement-tool-call
title: Implement tool call reconciliation helpers
status: open
priority: high
parent: F-openai-end-to-end-testing
prerequisites:
  - T-implement-model-registry
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T06:23:01.500Z
updated: 2025-09-16T06:23:01.500Z
---

# Implement Tool Call Reconciliation Helpers

## Context

Create helpers to handle the tool call extraction path alignment between OpenAI response format and the current BridgeClient tool execution system. This addresses the mismatch between `message.toolCalls` (from OpenAI responses) and `message.metadata.tool_calls` (expected by extractToolCallsFromMessage).

Related to feature: F-openai-end-to-end-testing

## Specific Implementation Requirements

### 1. Create Tool Helpers

Implement `src/__tests__/e2e/shared/toolHelpers.ts` with:

- `prepareToolCallMessage()`: Converts unified tool calls to OpenAI raw format for extraction
- `createTestTool()`: Creates a simple test tool for E2E testing
- `validateToolExecution()`: Validates tool execution results
- `formatToolCallForExtraction()`: Utility to format tool calls for extraction

### 2. Tool Call Path Reconciliation

Handle the current implementation where:

- OpenAI response parser sets `message.toolCalls` (unified format)
- `extractToolCallsFromMessage` looks for `message.metadata.tool_calls` (OpenAI raw format)
- Convert between formats to enable proper tool extraction

### 3. Test Tool Implementation

Create a simple echo tool that can be used consistently across E2E tests for predictable results.

## Technical Approach

### Tool Helpers Implementation

```typescript
// toolHelpers.ts - Tool call path reconciliation helpers
import type { Message } from "../../../core/messages/message.js";
import type { ToolDefinition } from "../../../core/tools/toolDefinition.js";
import type { ToolCall } from "../../../core/tools/toolCall.js";
import { z } from "zod";

export function prepareToolCallMessage(message: Message): Message {
  // Convert unified message.toolCalls to OpenAI raw format expected by extractToolCallsFromMessage
  if (message.toolCalls && message.toolCalls.length > 0) {
    const formattedToolCalls = formatToolCallForExtraction(message.toolCalls);
    return {
      ...message,
      metadata: {
        ...message.metadata,
        tool_calls: formattedToolCalls,
      },
    };
  }
  return message;
}

export function formatToolCallForExtraction(toolCalls: ToolCall[]): Array<{
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}> {
  // Format tool calls in the structure expected by extractToolCallsFromMessage
  return toolCalls.map((call) => ({
    id: call.id,
    function: {
      name: call.name,
      arguments: JSON.stringify(call.parameters),
    },
  }));
}

export function createTestTool(): ToolDefinition {
  return {
    name: "e2e_echo_tool",
    description: "Echo tool for E2E testing - returns input data",
    inputSchema: z.object({
      message: z.string().describe("Message to echo back"),
    }),
  };
}

export async function testToolHandler(
  params: Record<string, unknown>,
): Promise<unknown> {
  return {
    echoed: params.message,
    timestamp: new Date().toISOString(),
    testSuccess: true,
  };
}

export function validateToolExecution(result: unknown): boolean {
  // Validate that tool execution result has expected structure
  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    return obj.testSuccess === true && typeof obj.echoed === "string";
  }
  return false;
}

export function createToolCall(message: string): ToolCall {
  return {
    id: `test_call_${Date.now()}`,
    name: "e2e_echo_tool",
    parameters: { message },
  };
}
```

### Conversion Logic Details

The key conversion happens in `prepareToolCallMessage`:

1. Takes `message.toolCalls` (unified ToolCall[] format)
2. Converts to OpenAI raw format using `formatToolCallForExtraction`
3. Places result in `message.metadata.tool_calls` where `extractToolCallsFromMessage` expects it
4. Preserves existing metadata while adding tool calls

## Detailed Acceptance Criteria

### Functional Requirements

1. **Tool Call Path Reconciliation**
   - ✅ `prepareToolCallMessage()` converts unified tool calls to OpenAI raw format
   - ✅ Converted tool calls placed in `message.metadata.tool_calls`
   - ✅ Function handles messages that already have tool calls in metadata
   - ✅ Function preserves existing metadata while adding tool calls
   - ✅ Handles edge cases (empty tool calls, no metadata, etc.)

2. **Format Conversion**
   - ✅ `formatToolCallForExtraction()` creates proper OpenAI raw format
   - ✅ Each tool call has `id` and `function` with `name` and `arguments`
   - ✅ Parameters are JSON stringified in `arguments` field
   - ✅ Format matches what `extractToolCallsFromMessage` expects

3. **Test Tool Implementation**
   - ✅ `createTestTool()` returns valid ToolDefinition with Zod schema
   - ✅ `testToolHandler()` returns predictable, testable results
   - ✅ Tool definition works with BridgeClient tool registration
   - ✅ Tool execution produces results that can be validated

4. **Validation Utilities**
   - ✅ `validateToolExecution()` correctly identifies successful tool results
   - ✅ `createToolCall()` generates valid ToolCall objects
   - ✅ Helper functions work with current tool system implementation

### Technical Requirements

1. **Integration Compatibility**
   - ✅ Works with current `extractToolCallsFromMessage` implementation
   - ✅ Compatible with existing tool registration and execution flow
   - ✅ Handles tool call format expected by agent loop
   - ✅ Proper TypeScript types for all functions

2. **Error Handling**
   - ✅ Graceful handling of malformed tool calls
   - ✅ Validation functions return clear boolean results
   - ✅ Edge cases handled without throwing exceptions
   - ✅ Returns original message if conversion not possible

3. **Testing Support**
   - ✅ Predictable tool behavior for consistent E2E test results
   - ✅ Easy integration with test scenarios
   - ✅ Clear validation of tool execution success/failure

## Dependencies

- T-implement-model-registry must complete first (shared directory structure)
- Existing tool system implementation in `src/core/tools/`
- Current `extractToolCallsFromMessage` implementation

## Security Considerations

1. **Input Validation**
   - Test tool validates input parameters safely
   - No execution of arbitrary code or dangerous operations
   - Predictable, safe test data only

2. **Tool Registration Safety**
   - Test tools clearly identified as test-only
   - No conflicts with production tool definitions
   - Safe cleanup of test tool registrations

## Testing Requirements

1. **Unit Tests for Tool Helpers**
   - Test `prepareToolCallMessage()` with various message formats
   - Test `formatToolCallForExtraction()` with different tool call structures
   - Test tool call extraction alignment works correctly
   - Test test tool creation and execution
   - Test validation functions with various result formats

2. **Integration Testing**
   - Verify tool call flow works end-to-end with real BridgeClient
   - Test tool registration and execution through agent loop
   - Validate tool result formatting and message generation
   - Test conversion between unified and OpenAI raw formats

## Out of Scope

- Actual OpenAI E2E test implementations (handled by other tasks)
- Complex tool definitions (keep test tools simple)
- Production tool implementations (test tools only)

## Files to Create

- `src/__tests__/e2e/shared/toolHelpers.ts`

## References

- Current tool call extraction: `src/client/extractToolCallsFromMessage.ts`
- OpenAI response parser: `src/providers/openai-responses-v1/responseParser.ts`
- Tool system architecture: `src/core/tools/`
