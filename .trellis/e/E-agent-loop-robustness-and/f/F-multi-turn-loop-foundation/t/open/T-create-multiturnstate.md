---
id: T-create-multiturnstate
title: Create MultiTurnState interface for conversation state tracking
status: open
priority: high
parent: F-multi-turn-loop-foundation
prerequisites:
  - T-extend-agentexecutionoptions
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T02:44:43.785Z
updated: 2025-09-18T02:44:43.785Z
---

# Create MultiTurnState Interface for Conversation State Tracking

## Context

This task creates a new `MultiTurnState` interface that extends the existing `AgentExecutionState` to track multi-turn conversation state. This interface will manage iteration counts, streaming states, tool execution tracking, and termination reasons across multiple conversation turns.

## Related Files

- `src/core/agent/agentExecutionState.ts` - Current single-turn state interface
- New file: `src/core/agent/multiTurnState.ts` - Multi-turn state interface

## Implementation Requirements

Create a new `MultiTurnState` interface that extends `AgentExecutionState`:

```typescript
interface MultiTurnState extends AgentExecutionState {
  iteration: number;
  totalIterations: number;
  startTime: number;
  lastIterationTime: number;
  streamingState:
    | "idle"
    | "streaming"
    | "paused"
    | "tool_execution"
    | "resuming";
  pendingToolCalls: ToolCall[];
  completedToolCalls: ToolCall[];
  terminationReason?:
    | "natural_completion"
    | "max_iterations"
    | "timeout"
    | "cancelled"
    | "error";
}
```

## Technical Approach

1. **Create new interface file** `src/core/agent/multiTurnState.ts`
2. **Extend existing AgentExecutionState** to maintain compatibility
3. **Add streaming state machine support** with well-defined state transitions
4. **Include comprehensive tool tracking** for both pending and completed calls
5. **Provide termination reason tracking** for debugging and observability

## Detailed Acceptance Criteria

✅ **Interface Definition**

- `MultiTurnState` properly extends `AgentExecutionState`
- `iteration` tracks current iteration number (1-based)
- `totalIterations` tracks maximum allowed iterations
- `startTime` records conversation start timestamp
- `lastIterationTime` tracks timing of most recent iteration
- `streamingState` manages streaming interruption state machine
- `pendingToolCalls` tracks tool calls awaiting execution
- `completedToolCalls` tracks all executed tool calls across turns
- `terminationReason` provides clear termination context

✅ **Type Safety**

- All properties have appropriate TypeScript types
- Streaming state uses union type with specific allowed values
- Termination reason enum covers all possible completion scenarios
- Tool call arrays maintain proper ToolCall type consistency

✅ **State Machine Design**

- Streaming states support the flow: idle → streaming → paused → tool_execution → resuming → streaming
- State transitions are logically consistent
- Error states are properly represented

✅ **Documentation**

- Comprehensive JSDoc comments for interface and all properties
- Examples showing typical state progression through multi-turn conversation
- Clear explanation of state machine transitions

## Testing Requirements

**Unit Tests** (include in this task):

- Verify interface compilation and type checking
- Test that interface properly extends AgentExecutionState
- Validate streaming state union type constraints
- Test termination reason completeness
- Verify tool call array type safety

## Out of Scope

- Implementation of state management logic (separate task)
- State transition validation logic (separate task)
- Integration with AgentLoop class (separate task)

## Dependencies

- T-extend-agentexecutionoptions (for consistency in types)

## Security Considerations

- No sensitive data stored in state interface
- Tool call arrays may contain sensitive parameters (handled at usage level)
- Timestamps don't expose sensitive timing information

## Performance Impact

- Interface definition has no runtime performance impact
- State object size should be reasonable for typical conversations
- Tool call tracking scales linearly with conversation length
