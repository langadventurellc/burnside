---
id: T-create-multiturnstate
title: Create MultiTurnState interface for conversation state tracking
status: done
priority: high
parent: F-multi-turn-loop-foundation
prerequisites:
  - T-extend-agentexecutionoptions
affectedFiles:
  src/core/agent/multiTurnState.ts:
    Created new MultiTurnState interface extending
    AgentExecutionState with comprehensive multi-turn conversation state
    tracking including iteration counts, streaming state, tool call management,
    and termination reasons
  src/core/agent/streamingState.ts: Created StreamingState union type with 5
    literal values for streaming state machine transitions during multi-turn
    conversations
  src/core/agent/terminationReason.ts:
    Created TerminationReason union type with 5
    literal values defining possible conversation termination scenarios
  src/core/agent/__tests__/multiTurnState.test.ts: Created comprehensive test
    suite with 17 tests covering interface extension, type safety, union type
    constraints, documentation examples, and edge cases
  src/core/agent/index.ts: Updated module exports to include MultiTurnState,
    StreamingState, and TerminationReason types, and updated module
    documentation to mention multi-turn capabilities
log:
  - Successfully implemented MultiTurnState interface for conversation state
    tracking with comprehensive type safety, streaming state machine support,
    and robust tool execution tracking. Created separate files for each exported
    type to comply with the one-export-per-file rule. All 17 unit tests pass and
    full test suite (2393 tests) validates no regressions. Interface extends
    AgentExecutionState with 8 new properties for iteration management, timing
    tracking, streaming interruption handling, and termination context. Includes
    comprehensive JSDoc documentation with examples and proper TypeScript union
    types for streaming states and termination reasons.
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
