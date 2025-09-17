---
id: T-build-xai-tool-translator-for
title: Build xAI tool translator for function calling
status: open
priority: medium
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-implement-xai-request-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T19:59:45.387Z
updated: 2025-09-17T19:59:45.387Z
---

# Build xAI Tool Translator for Function Calling

## Context

This task implements the tool translator that converts between unified tool definitions and xAI's function calling format. The translator handles tool definition conversion, tool call parsing from responses, and tool result formatting for subsequent requests.

## Reference Implementation

Use these files as reference patterns:

- `src/providers/openai-responses-v1/toolTranslator.ts` (primary template)
- `src/providers/openai-responses-v1/toolsTranslator.ts` (additional patterns)
- `src/providers/google-gemini-v1/toolTranslator.ts` (alternative approach)
- `src/core/tools/toolDefinition.ts` (unified tool format)

## Implementation Requirements

Create `src/providers/xai-v1/toolTranslator.ts` with the following components:

### Tool Definition Translation

```typescript
export function translateToolDefinitions(tools: ToolDefinition[]): any[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || `Execute ${tool.name} function`,
    parameters: {
      type: "object",
      properties: tool.parameters?.properties || {},
      required: tool.parameters?.required || [],
      ...tool.parameters,
    },
  }));
}
```

### Tool Call Parsing from Responses

```typescript
export function parseToolCalls(xaiMessage: any): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  // Handle legacy function_call format
  if (xaiMessage.function_call) {
    toolCalls.push({
      id: generateToolCallId(),
      type: "function",
      function: {
        name: xaiMessage.function_call.name,
        arguments: xaiMessage.function_call.arguments,
      },
    });
  }

  // Handle newer tool_calls format (if xAI adopts it)
  if (xaiMessage.tool_calls && Array.isArray(xaiMessage.tool_calls)) {
    toolCalls.push(
      ...xaiMessage.tool_calls.map((call) => ({
        id: call.id || generateToolCallId(),
        type: call.type || "function",
        function: call.function,
      })),
    );
  }

  return toolCalls;
}
```

### Streaming Tool Call Accumulation

```typescript
export class StreamingToolCallAccumulator {
  private partialCalls = new Map<
    string,
    {
      id: string;
      name?: string;
      arguments: string;
      completed: boolean;
    }
  >();

  accumulate(delta: any): ToolCall[] {
    const completedCalls: ToolCall[] = [];

    if (delta.function_call) {
      const callId = this.getOrCreateCallId();
      const existing = this.partialCalls.get(callId) || {
        id: callId,
        arguments: "",
        completed: false,
      };

      // Accumulate function name
      if (delta.function_call.name) {
        existing.name = delta.function_call.name;
      }

      // Accumulate arguments
      if (delta.function_call.arguments) {
        existing.arguments += delta.function_call.arguments;
      }

      this.partialCalls.set(callId, existing);

      // Check if call is complete (has both name and valid JSON arguments)
      if (
        existing.name &&
        this.isValidJson(existing.arguments) &&
        !existing.completed
      ) {
        existing.completed = true;
        completedCalls.push({
          id: existing.id,
          type: "function",
          function: {
            name: existing.name,
            arguments: existing.arguments,
          },
        });
      }
    }

    return completedCalls;
  }

  private getOrCreateCallId(): string {
    // Use the first (and typically only) partial call, or create new one
    const existingIds = Array.from(this.partialCalls.keys());
    return existingIds[0] || generateToolCallId();
  }

  private isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  getPartialCalls(): Array<{ id: string; name?: string; arguments: string }> {
    return Array.from(this.partialCalls.values());
  }
}
```

### Tool Result Formatting

```typescript
export function formatToolResults(toolResults: ToolResult[]): any[] {
  return toolResults.map((result) => ({
    role: "function",
    name: result.toolName,
    content: JSON.stringify(result.result),
  }));
}
```

### Unified Tool Call Conversion

```typescript
export function convertToUnifiedToolCall(xaiToolCall: any): ToolCall {
  return {
    id: xaiToolCall.id || generateToolCallId(),
    toolName: xaiToolCall.function?.name || xaiToolCall.name,
    toolArguments: xaiToolCall.function?.arguments
      ? JSON.parse(xaiToolCall.function.arguments)
      : xaiToolCall.arguments,
    metadata: {
      provider: "xai",
      type: xaiToolCall.type || "function",
    },
  };
}
```

### Utility Functions

```typescript
function generateToolCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateToolDefinition(tool: ToolDefinition): void {
  if (!tool.name || typeof tool.name !== "string") {
    throw new ValidationError("Tool name is required and must be a string");
  }

  if (tool.name.length > 64) {
    throw new ValidationError("Tool name must be 64 characters or less");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(tool.name)) {
    throw new ValidationError(
      "Tool name must contain only alphanumeric characters, underscores, and hyphens",
    );
  }

  if (tool.parameters && typeof tool.parameters !== "object") {
    throw new ValidationError("Tool parameters must be an object");
  }
}

export function validateToolArguments(toolCall: ToolCall): any {
  try {
    if (typeof toolCall.toolArguments === "string") {
      return JSON.parse(toolCall.toolArguments);
    }
    return toolCall.toolArguments;
  } catch (error) {
    throw new ValidationError(`Invalid tool arguments JSON: ${error.message}`);
  }
}
```

### Tool Capability Detection

```typescript
export function detectToolCapabilities(tools: ToolDefinition[]): {
  hasRequiredParameters: boolean;
  hasOptionalParameters: boolean;
  maxComplexity: "simple" | "moderate" | "complex";
} {
  let hasRequired = false;
  let hasOptional = false;
  let maxComplexity: "simple" | "moderate" | "complex" = "simple";

  for (const tool of tools) {
    if (tool.parameters?.required?.length > 0) {
      hasRequired = true;
    }

    const allProps = Object.keys(tool.parameters?.properties || {});
    const requiredProps = tool.parameters?.required || [];
    if (allProps.length > requiredProps.length) {
      hasOptional = true;
    }

    // Determine complexity based on parameter count and nesting
    const paramCount = allProps.length;
    if (paramCount > 10) {
      maxComplexity = "complex";
    } else if (paramCount > 3) {
      maxComplexity = "moderate";
    }
  }

  return {
    hasRequiredParameters: hasRequired,
    hasOptionalParameters: hasOptional,
    maxComplexity,
  };
}
```

## Acceptance Criteria

### Functional Requirements

✅ **Tool Definition Translation**: Unified tools convert to xAI function format
✅ **Tool Call Parsing**: Function calls from responses parse correctly
✅ **Streaming Tool Calls**: Streaming function calls accumulate properly
✅ **Tool Result Formatting**: Tool results format correctly for follow-up requests
✅ **Argument Validation**: Tool arguments validate and parse correctly
✅ **ID Generation**: Unique tool call IDs generated consistently

### Data Transformation Requirements

✅ **Schema Conversion**: Tool parameter schemas convert correctly
✅ **Argument Parsing**: JSON argument strings parse to objects
✅ **Result Serialization**: Tool results serialize for API consumption
✅ **Type Preservation**: Data types preserved through conversion
✅ **Error Handling**: Invalid tool definitions and calls handled gracefully

### Streaming Requirements

✅ **Partial Call Accumulation**: Streaming function calls accumulate correctly
✅ **Completion Detection**: Tool call completion detected accurately
✅ **Memory Management**: No memory leaks from long streaming sessions
✅ **Concurrent Calls**: Multiple simultaneous tool calls handled

## Testing Requirements

Include comprehensive unit tests covering:

### Tool Definition Tests

- Basic tool definition conversion
- Complex parameter schema conversion
- Tool validation (name format, parameter structure)
- Edge cases (empty tools array, missing parameters)

### Tool Call Parsing Tests

- Function call parsing from responses
- Streaming function call accumulation
- Tool call ID generation and uniqueness
- Invalid function call handling

### Tool Result Tests

- Tool result formatting for API requests
- JSON serialization of complex results
- Error result handling
- Multiple tool result formatting

### Streaming Tests

- Partial argument accumulation
- Function call completion detection
- Multiple concurrent tool calls
- Memory efficiency during long streams

### Validation Tests

- Tool name validation rules
- Parameter schema validation
- Argument JSON parsing
- Error handling for invalid data

## Implementation Steps

1. **Create Tool Translator File**: Set up main translation functions
2. **Tool Definition Translation**: Convert unified tools to xAI format
3. **Tool Call Parsing**: Parse function calls from responses
4. **Streaming Accumulation**: Implement streaming tool call accumulation
5. **Tool Result Formatting**: Format results for follow-up requests
6. **Validation Logic**: Add comprehensive validation for tools and calls
7. **Utility Functions**: ID generation and helper functions
8. **Write Unit Tests**: Comprehensive test coverage for all scenarios
9. **Integration Testing**: Verify with real tool calling scenarios

## Dependencies

- **Prerequisites**: T-implement-xai-request-and (request/response schemas)
- **Works with**: T-build-xai-request-translator, T-create-xai-response-parser
- **Blocks**: Main provider class tool calling integration

## Out of Scope

- Tool execution logic (handled by tool router)
- Tool registration and discovery (handled by tool registry)
- Tool security and sandboxing (handled by tool execution layer)
- Tool result caching (handled by caching layer)

## Technical Notes

- Follow OpenAI's function calling format which xAI uses
- Handle both legacy function_call and newer tool_calls formats
- Ensure proper JSON parsing and validation for tool arguments
- Implement efficient streaming accumulation for large tool arguments
- Validate tool names according to xAI's naming constraints
