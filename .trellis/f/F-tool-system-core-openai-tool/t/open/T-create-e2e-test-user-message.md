---
id: T-create-e2e-test-user-message
title: "Create E2E test: user message → tool call → tool execution → assistant
  response"
status: open
priority: medium
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-integrate-tool-system-with
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T00:32:31.255Z
updated: 2025-09-16T00:32:31.255Z
---

# Create E2E Test: User Message → Tool Call → Tool Execution → Assistant Response

## Context

Implement the comprehensive end-to-end test specified in the feature acceptance criteria that validates the complete tool execution flow from user input through tool execution to final assistant response.

Creates integration tests that verify the entire tool system works correctly across all components using the Echo tool as the test case.

Reference feature F-tool-system-core-openai-tool for complete context and E2E testing requirements.

## Implementation Requirements

### Files to Create

```
src/__tests__/integration/
  toolSystemE2E.test.ts              # Main E2E test suite
  toolStreamingE2E.test.ts           # Streaming interruption E2E tests
  fixtures/
    toolE2EFixtures.ts               # Test fixtures and mock data
    openAIToolResponses.ts           # Mock OpenAI responses with tool calls
```

### Specific Test Implementation

1. **Complete E2E Flow Test** (`src/__tests__/integration/toolSystemE2E.test.ts`):

```typescript
describe("Tool System E2E Integration", () => {
  it("completes full flow: user message → tool call → execution → response", async () => {
    // 1. Setup: Create client with tool system enabled
    const client = createClient({
      tools: { enabled: true, builtinTools: ["echo"] },
      providers: [
        /* OpenAI config */
      ],
    });

    // 2. User message requesting tool use
    const userMessage = {
      role: "user",
      content: [{ type: "text", text: 'Echo back the message "Hello World"' }],
    };

    // 3. Chat request with echo tool available
    const response = await client.chat({
      messages: [userMessage],
      tools: ["echo"],
      model: "gpt-4o-mini",
    });

    // 4. Verify complete flow executed correctly
    expect(response.toolCalls).toHaveLength(1);
    expect(response.toolCalls[0].name).toBe("echo");
    expect(response.toolResults).toHaveLength(1);
    expect(response.toolResults[0].success).toBe(true);
    expect(response.content).toContain("Hello World");
  });
});
```

2. **Streaming Interruption E2E Test** (`src/__tests__/integration/toolStreamingE2E.test.ts`):

```typescript
describe("Streaming Tool Call Interruption E2E", () => {
  it("handles mid-stream tool call interruption correctly", async () => {
    // Setup streaming with tool capability
    const client = createClient({
      tools: { enabled: true, builtinTools: ["echo"] },
    });

    // Create stream with tool available
    const stream = client.stream({
      messages: [userMessage],
      tools: ["echo"],
      model: "gpt-4o-mini",
    });

    const events: StreamEvent[] = [];

    // Collect all stream events
    await new Promise((resolve) => {
      stream.on("delta", (delta) =>
        events.push({ type: "delta", data: delta }),
      );
      stream.on("tool", (tool) => events.push({ type: "tool", data: tool }));
      stream.on("done", () => resolve(undefined));
    });

    // Verify interruption flow
    const toolEvents = events.filter((e) => e.type === "tool");
    expect(toolEvents).toHaveLength(1);

    // Verify tool execution completed
    const toolResult = toolEvents[0].data;
    expect(toolResult.success).toBe(true);
    expect(toolResult.callId).toBeDefined();
  });
});
```

3. **Mock Provider Integration**:
   - Mock OpenAI provider responses that include tool calls
   - Simulate streaming responses with tool call chunks
   - Include both successful and error scenarios
   - Test with various tool call parameter formats

4. **Error Scenario Testing**:
   - Tool execution timeout scenarios
   - Invalid tool call parameters
   - Tool not found scenarios
   - Provider errors during tool calls

## Technical Approach

- **Real Integration**: Use actual component integration, not just unit test mocks
- **Mock External APIs**: Mock OpenAI API responses to avoid external dependencies
- **Comprehensive Coverage**: Test both happy path and error scenarios
- **Performance Validation**: Verify timing requirements for streaming interruption

## Acceptance Criteria

### E2E Flow Validation

- [ ] **EXPLICIT REQUIREMENT**: Complete user → tool call → execution → response flow
- [ ] User message triggers appropriate tool call from provider
- [ ] Tool call parsed correctly from provider response
- [ ] Tool execution through ToolRouter succeeds with correct parameters
- [ ] Tool result converted to proper message format
- [ ] Final assistant response includes tool execution results

### Streaming Interruption Validation

- [ ] **EXPLICIT REQUIREMENT**: Mid-stream tool call interruption works end-to-end
- [ ] Stream pauses when tool call detected in streaming response
- [ ] Tool execution completes during stream pause
- [ ] Stream resumes with tool result integrated into conversation
- [ ] Complete flow timing under 100ms overhead requirement

### Error Scenario Validation

- [ ] Tool execution timeouts handled gracefully in E2E flow
- [ ] Invalid tool parameters result in appropriate error handling
- [ ] Tool not found scenarios complete flow with error state
- [ ] Provider errors during tool calls don't break E2E flow

### Integration Validation

- [ ] All major components integrate correctly (Client, Router, Agent, Provider)
- [ ] Configuration system enables tool functionality properly
- [ ] Feature flags control tool system activation correctly
- [ ] Error handling works consistently across all components

## Testing Requirements

Create comprehensive integration tests covering:

1. **Happy Path Tests**:
   - Simple tool call with basic parameters
   - Complex tool call with nested parameters
   - Multiple tool calls in single conversation
   - Tool calls mixed with regular text responses

2. **Streaming Tests**:
   - Basic streaming interruption for tool calls
   - Multiple tool calls in streaming response
   - Tool calls interleaved with text content
   - Streaming performance validation

3. **Error Handling Tests**:
   - Tool execution timeout scenarios
   - Invalid tool call parameter handling
   - Provider errors during tool execution
   - Tool system disabled but tools requested

4. **Configuration Tests**:
   - Tool system enabled/disabled via configuration
   - Feature flag integration works correctly
   - Built-in tool enablement through configuration
   - Provider tool capability detection

## Security Considerations

- **Test Isolation**: E2E tests don't affect system state or other tests
- **Mock Security**: Mock providers don't expose real API credentials
- **Data Validation**: Test data validated before use in integration scenarios
- **Error Testing**: Security errors tested without exposing sensitive information

## Out of Scope

- Load testing or performance benchmarking beyond timing requirements
- Testing with real external APIs (mocked providers only)
- Complex multi-turn agent scenarios (single-turn focus for Phase 5)
- Tool marketplace or dynamic tool discovery testing
