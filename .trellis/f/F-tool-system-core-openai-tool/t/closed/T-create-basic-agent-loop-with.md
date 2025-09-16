---
id: T-create-basic-agent-loop-with
title: Create basic agent loop with single-turn execution
status: done
priority: high
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-implement-openai-tool-call
affectedFiles:
  src/core/agent/agentExecutionState.ts: Created AgentExecutionState interface
    defining execution state with messages, tool calls, results, and
    continuation status
  src/core/agent/agentExecutionOptions.ts:
    Created AgentExecutionOptions interface
    for execution configuration with timeouts and error handling policies
  src/core/agent/agentExecutionContext.ts: Implemented createExecutionContext
    utility function to generate ToolExecutionContext from message history with
    metadata extraction
  src/core/agent/agentLoop.ts: Implemented main AgentLoop class with
    executeSingleTurn method, tool result message formatting, error handling,
    and conversation continuation logic
  src/core/agent/__tests__/agentLoop.test.ts: Created comprehensive test suite
    with 18 test cases covering successful execution, error handling, message
    formatting, and edge cases
  src/core/agent/index.ts:
    Updated module exports to include all agent loop types
    and functionality following project patterns
log:
  - Implemented complete basic agent loop infrastructure with single-turn
    execution capability. Created AgentLoop class that orchestrates tool
    execution and conversation flow, converting tool results to proper Message
    format and determining continuation status. Implementation includes
    comprehensive error handling, message formatting, and execution context
    creation. All 18 unit tests passing with 100% success rate.
schema: v1.0
childrenIds: []
created: 2025-09-16T00:30:42.887Z
updated: 2025-09-16T00:30:42.887Z
---

# Create Basic Agent Loop with Single-Turn Execution

## Context

Implement the foundation for agent loop functionality that can execute a single tool call turn and resume conversation flow. This provides the orchestration between tool calls and conversation continuation.

Creates new agent loop infrastructure in `src/core/agent/` following the API specified in feature F-tool-system-core-openai-tool.

## Implementation Requirements

### Files to Create

```
src/core/agent/
  agentLoop.ts                        # Main agent loop implementation
  agentExecutionContext.ts            # Execution context for agent
  agentLoopTypes.ts                   # Types and interfaces
  __tests__/agentLoop.test.ts         # Unit tests
  index.ts                            # Module exports
```

### Specific Implementation Details

1. **Agent Loop Types** (`src/core/agent/agentLoopTypes.ts`):

```typescript
export interface AgentExecutionState {
  messages: Message[];
  toolCalls: ToolCall[];
  results: ToolResult[];
  shouldContinue: boolean;
  lastResponse?: string;
}

export interface AgentExecutionOptions {
  maxToolCalls?: number; // Default: 1 for single-turn
  timeoutMs?: number; // Overall execution timeout
  toolTimeoutMs?: number; // Individual tool timeout
  continueOnToolError?: boolean; // Whether to continue if tool fails
}
```

2. **Agent Loop Implementation** (`src/core/agent/agentLoop.ts`):

```typescript
export class AgentLoop {
  constructor(
    private toolRouter: ToolRouter,
    private defaultOptions: AgentExecutionOptions = {},
  ) {}

  // Single tool execution turn as specified in requirements
  async executeSingleTurn(
    messages: Message[],
    toolCall: ToolCall,
    router: ToolRouter,
  ): Promise<{ updatedMessages: Message[]; shouldContinue: boolean }> {
    // 1. Execute tool call through router
    const result = await router.execute(toolCall, this.createContext(messages));

    // 2. Convert tool result to message format
    const toolResultMessage = this.formatToolResultAsMessage(toolCall, result);

    // 3. Append to conversation
    const updatedMessages = [...messages, toolResultMessage];

    // 4. Determine if conversation should continue
    const shouldContinue =
      result.success && !this.isConversationComplete(result);

    return { updatedMessages, shouldContinue };
  }

  // Internal methods for message formatting and context creation
  private createContext(messages: Message[]): ToolExecutionContext;
  private formatToolResultAsMessage(
    call: ToolCall,
    result: ToolResult,
  ): Message;
  private isConversationComplete(result: ToolResult): boolean;
}
```

3. **Tool Result Message Formatting**:
   - Convert ToolResult to Message with role="tool"
   - Include tool call ID for linking back to original call
   - Format successful results as text content
   - Format error results with error information
   - Preserve metadata in message properties

4. **Context Creation**:
   - Extract conversation context from message history
   - Generate unique context ID for tool execution
   - Include relevant metadata (timestamp, session info)
   - Pass security constraints and execution limits

## Technical Approach

- **Single Responsibility**: Focus only on single-turn execution for Phase 5
- **Message Integration**: Tool results converted to proper Message format
- **Error Resilience**: Handle tool failures gracefully without breaking flow
- **State Management**: Track execution state without persistence requirements

## Acceptance Criteria

### Functional Requirements

- [ ] Execute single tool call and resume conversation flow
- [ ] Convert tool results to proper Message format for conversation
- [ ] Determine continuation status based on tool execution outcome
- [ ] Integrate tool execution with existing message history
- [ ] Handle both successful and failed tool executions appropriately

### Message Integration

- [ ] Tool result messages have correct role ("tool") and content format
- [ ] Tool call ID properly linked between call and result messages
- [ ] Message metadata includes tool execution context
- [ ] Updated message array maintains proper conversation flow

### Error Handling

- [ ] Tool execution failures don't break agent loop
- [ ] Failed tool calls converted to appropriate error messages
- [ ] Conversation can continue even after tool failures
- [ ] Error context preserved in tool result messages

### State Management

- [ ] Execution state tracked correctly during single turn
- [ ] shouldContinue flag determined accurately based on results
- [ ] No persistent state required (stateless operation)
- [ ] Context properly created and passed to tool execution

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Single Turn Execution Tests**:
   - Execute successful tool call and format result message
   - Handle tool execution errors gracefully
   - Determine continuation status correctly
   - Maintain message history integrity

2. **Message Formatting Tests**:
   - Tool results converted to proper Message format
   - Tool call IDs linked correctly between calls and results
   - Both success and error states formatted appropriately
   - Message metadata includes execution context

3. **Integration Tests**:
   - Agent loop integrates with ToolRouter correctly
   - Context creation provides proper execution environment
   - State management works across execution cycle
   - Error handling preserves conversation flow

4. **Edge Case Tests**:
   - Empty message history handled correctly
   - Invalid tool calls processed appropriately
   - Timeout scenarios handled gracefully
   - Large tool results formatted properly

## Security Considerations

- **Context Isolation**: Tool execution context isolated from agent state
- **Error Sanitization**: Tool errors sanitized before adding to conversation
- **State Protection**: Agent state protected from tool execution side effects
- **Input Validation**: All inputs validated before processing

## Out of Scope

- Multi-turn tool execution (future enhancement)
- Advanced agent features (memory, planning, reflection)
- Tool result caching or persistence
- Complex conversation flow control
- Integration with BridgeClient (handled by separate integration task)
