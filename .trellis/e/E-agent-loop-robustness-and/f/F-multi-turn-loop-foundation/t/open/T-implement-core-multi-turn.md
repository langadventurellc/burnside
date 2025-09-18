---
id: T-implement-core-multi-turn
title: Implement core multi-turn orchestration in AgentLoop.executeMultiTurn()
status: open
priority: high
parent: F-multi-turn-loop-foundation
prerequisites:
  - T-create-multiturnstate
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T02:45:08.536Z
updated: 2025-09-18T02:45:08.536Z
---

# Implement Core Multi-Turn Orchestration in AgentLoop.executeMultiTurn()

## Context

This task implements the core `executeMultiTurn()` method in the existing `AgentLoop` class. This method orchestrates multiple conversation iterations, manages state transitions, and coordinates with the existing `executeSingleTurn()` method to build multi-turn conversations.

## Related Files

- `src/core/agent/agentLoop.ts` - Main AgentLoop class requiring extension
- `src/core/agent/multiTurnState.ts` - MultiTurnState interface (from previous task)
- `src/core/agent/agentExecutionOptions.ts` - Extended options interface

## Implementation Requirements

Add the `executeMultiTurn()` method to the existing `AgentLoop` class:

```typescript
async executeMultiTurn(
  initialMessages: Message[],
  options?: AgentExecutionOptions
): Promise<{
  finalMessages: Message[];
  state: MultiTurnState;
  executionMetrics: {
    totalIterations: number;
    totalExecutionTime: number;
    averageIterationTime: number;
    totalToolCalls: number;
  }
}>;
```

## Technical Approach

1. **Extend existing AgentLoop class** with new multi-turn method
2. **Reuse existing single-turn logic** through `executeSingleTurn()` calls
3. **Implement iteration loop** with proper termination detection
4. **Manage state transitions** using MultiTurnState interface
5. **Handle timeouts** at both iteration and overall levels
6. **Provide comprehensive metrics** for performance monitoring

## Detailed Acceptance Criteria

✅ **Multi-Turn Orchestration**

- Method conducts conversations with 2+ iterations successfully
- Maintains conversation state across all iterations
- Supports configurable maximum iterations (default: 10)
- Enforces per-iteration and overall timeout limits
- Backward compatible with existing single-turn usage patterns

✅ **State Management**

- Initializes MultiTurnState with proper starting values
- Updates iteration counters and timing information correctly
- Tracks tool calls across all conversation turns
- Maintains conversation history integrity throughout execution

✅ **Termination Detection**

- Detects natural completion when no more tool calls are requested
- Enforces maximum iteration limits with appropriate error handling
- Handles timeout scenarios gracefully with partial results
- Provides clear termination reasons in final state

✅ **Integration with Existing Code**

- Reuses `executeSingleTurn()` method for individual turn processing
- Maintains compatibility with existing tool routing and execution
- Preserves existing error handling patterns and extension points
- No breaking changes to current AgentLoop API

✅ **Error Handling**

- Handles individual turn failures based on `continueOnToolError` option
- Provides graceful degradation on partial failures
- Maintains conversation state even during error conditions
- Returns partial results with clear error context

## Testing Requirements

**Unit Tests** (include in this task):

- Multi-turn conversation execution with 2-5 iterations
- Maximum iteration limit enforcement and error handling
- Timeout handling at iteration and overall levels
- Natural termination detection with various tool call patterns
- Error scenarios with proper state preservation
- Integration with existing single-turn execution patterns
- Performance metrics accuracy and completeness

## Out of Scope

- Streaming interruption handling (separate task)
- Parallel tool execution strategies (separate task)
- Advanced termination detection logic (separate task)
- Observability and event emission (separate task)

## Dependencies

- T-create-multiturnstate (MultiTurnState interface)
- T-extend-agentexecutionoptions (extended options interface)

## Security Considerations

- Validate iteration and timeout limits to prevent resource exhaustion
- Ensure sensitive data is properly cleaned up on early termination
- Prevent injection attacks through conversation state manipulation
- Maintain existing security constraints from single-turn execution

## Performance Requirements

- Multi-turn coordination overhead < 50ms per iteration
- Memory usage growth linear with conversation length
- Timeout enforcement accurate within 100ms
- State management overhead minimal compared to tool execution time

## Implementation Notes

- Build incrementally on existing single-turn foundation
- Use composition pattern to orchestrate multiple single turns
- Maintain clear separation between orchestration and individual turn logic
- Provide comprehensive debugging information in state and metrics
