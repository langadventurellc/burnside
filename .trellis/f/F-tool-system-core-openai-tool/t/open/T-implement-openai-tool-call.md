---
id: T-implement-openai-tool-call
title: Implement OpenAI tool call response parser
status: open
priority: high
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-add-openai-tool-format
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T00:30:08.808Z
updated: 2025-09-16T00:30:08.808Z
---

# Implement OpenAI Tool Call Response Parser

## Context

Parse OpenAI tool calls from both streaming and non-streaming responses, converting them to unified ToolCall format. This completes the OpenAI integration by handling responses that contain tool calls.

Extends existing response parsing in `src/providers/openai-responses-v1/responseParser.ts` and `streamingParser.ts` following established patterns.

Reference feature F-tool-system-core-openai-tool for complete context.

## Implementation Requirements

### Files to Create/Modify

```
src/providers/openai-responses-v1/
  toolCallParser.ts                     # Tool call parsing logic
  __tests__/toolCallParser.test.ts      # Unit tests
  __tests__/fixtures/toolCallResponses.ts # OpenAI response fixtures
```

### Files to Modify

```
src/providers/openai-responses-v1/
  responseParser.ts         # Add tool call parsing to non-streaming
  streamingParser.ts        # Add tool call parsing to streaming
```

### Specific Implementation Details

1. **Tool Call Parser** (`src/providers/openai-responses-v1/toolCallParser.ts`):

```typescript
// Parse tool calls from OpenAI response format
export function parseOpenAIToolCalls(
  openAIResponse: OpenAIResponse,
): ToolCall[] {
  const toolCalls = openAIResponse.choices?.[0]?.message?.tool_calls || [];

  return toolCalls.map((call) => ({
    id: call.id,
    name: call.function.name,
    parameters: JSON.parse(call.function.arguments),
    metadata: {
      providerId: "openai",
      timestamp: new Date().toISOString(),
      rawCall: call, // Store original for debugging
    },
  }));
}

// Parse streaming tool call deltas
export function parseOpenAIToolCallDelta(
  delta: OpenAIStreamDelta,
  accumulator: Map<string, Partial<ToolCall>>,
): ToolCall[] {
  // Handle incremental tool call building from streaming chunks
  // Return completed tool calls when function.arguments is complete
}
```

2. **Streaming Integration** (modify `streamingParser.ts`):
   - Add tool call accumulator state to streaming parser
   - Handle partial tool call chunks (function name, arguments)
   - Emit completed tool calls when arguments parsing finishes
   - Validate JSON parsing for tool call arguments

3. **Non-Streaming Integration** (modify `responseParser.ts`):
   - Add tool call parsing to response processing
   - Include tool calls in unified response format
   - Handle cases where response contains both content and tool calls

4. **Error Handling**:
   - Handle malformed tool call JSON gracefully
   - Validate tool call structure against expected format
   - Include parsing errors in response metadata
   - Use ToolError for tool call parsing failures

## Technical Approach

- **Incremental Parsing**: Handle streaming tool calls that arrive in chunks
- **JSON Validation**: Robust parsing of tool call arguments JSON
- **State Management**: Track partial tool calls during streaming
- **Error Resilience**: Continue processing when individual tool calls fail

## Acceptance Criteria

### Functional Requirements

- [ ] Parse tool calls from OpenAI non-streaming responses correctly
- [ ] Handle streaming tool call chunks and emit complete calls
- [ ] Convert OpenAI format to unified ToolCall interface
- [ ] Extract tool call ID, name, and parameters accurately
- [ ] Include metadata about parsing context and source

### Response Integration

- [ ] Tool calls included in unified response format alongside content
- [ ] Streaming parser emits tool call events when complete
- [ ] Non-streaming parser includes tool calls in final response
- [ ] Handle responses with both text content and tool calls

### Error Handling

- [ ] Malformed JSON in tool call arguments handled gracefully
- [ ] Invalid tool call structure doesn't break response parsing
- [ ] Parsing errors included in response metadata
- [ ] Continue processing when individual tool calls fail to parse

### Streaming Support

- [ ] Partial tool calls accumulated correctly during streaming
- [ ] Complete tool calls emitted when arguments JSON is complete
- [ ] Multiple concurrent tool calls handled in streaming mode
- [ ] Streaming state cleaned up after tool call completion

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Non-Streaming Tests**:
   - Parse single tool call from response correctly
   - Parse multiple tool calls in single response
   - Handle responses with both content and tool calls
   - Extract all tool call components (id, name, parameters)

2. **Streaming Tests**:
   - Accumulate tool call chunks correctly
   - Emit complete tool calls at right moment
   - Handle multiple concurrent tool calls in stream
   - Clean up state after tool call completion

3. **Error Handling Tests**:
   - Malformed JSON in arguments handled gracefully
   - Invalid tool call structure doesn't break parsing
   - Missing required fields handled appropriately
   - Parsing errors included in response metadata

4. **Integration Tests**:
   - Tool call parsing integrates with existing response parsing
   - Unified response format includes both content and tool calls
   - Metadata correctly populated with parsing context

## Test Fixtures

Create comprehensive test fixtures in `toolCallResponses.ts`:

1. **Non-Streaming Fixtures**:
   - Single tool call response
   - Multiple tool calls response
   - Response with content and tool calls
   - Error cases (malformed JSON, missing fields)

2. **Streaming Fixtures**:
   - Tool call chunks sequence
   - Multiple tool calls streaming
   - Interleaved content and tool call chunks
   - Error scenarios in streaming

## Security Considerations

- **JSON Parsing**: Safe parsing of tool call arguments without eval
- **Input Validation**: Validate tool call structure before processing
- **Error Information**: Parsing errors don't expose sensitive response data
- **State Management**: Streaming state doesn't leak between requests

## Out of Scope

- Tool execution (handled by ToolRouter integration task)
- Advanced tool call features (parallel execution, dependencies)
- Performance optimization for large tool calls
- Tool call result formatting (handled by agent loop task)
