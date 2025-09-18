---
id: T-create-comprehensive-multi
title: Create comprehensive multi-turn error types and handling
status: open
priority: low
parent: F-multi-turn-loop-foundation
prerequisites:
  - T-create-multiturnstate
  - T-create-iteration-manager-for
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T02:47:14.458Z
updated: 2025-09-18T02:47:14.458Z
---

# Create Comprehensive Multi-Turn Error Types and Handling

## Context

This task implements new error types specific to multi-turn conversation scenarios and enhances error handling throughout the multi-turn system. These errors provide clear context for debugging multi-turn issues and enable proper error recovery strategies.

## Related Files

- New file: `src/core/agent/multiTurnErrors.ts` - Multi-turn specific error types
- `src/core/agent/agentLoop.ts` - Enhanced error handling in multi-turn methods

## Implementation Requirements

Create comprehensive error types for multi-turn scenarios:

```typescript
export class MaxIterationsExceededError extends Error {
  constructor(
    currentIteration: number,
    maxIterations: number,
    context?: MultiTurnContext,
  );
}

export class IterationTimeoutError extends Error {
  constructor(iteration: number, timeoutMs: number, context?: MultiTurnContext);
}

export class StreamingInterruptionError extends Error {
  constructor(
    streamingState: StreamingState,
    cause?: Error,
    context?: MultiTurnContext,
  );
}

export class MultiTurnExecutionError extends Error {
  constructor(
    phase: ExecutionPhase,
    originalError: Error,
    context?: MultiTurnContext,
  );
}
```

## Technical Approach

1. **Define error hierarchy** extending base Error with multi-turn context
2. **Include comprehensive context** for debugging and error analysis
3. **Implement error recovery strategies** for different error scenarios
4. **Enhance existing error handling** in AgentLoop with new error types
5. **Provide error serialization** for logging and observability

## Detailed Acceptance Criteria

✅ **Error Type Definitions**

- `MaxIterationsExceededError` includes iteration context and limits
- `IterationTimeoutError` provides timing information and iteration details
- `StreamingInterruptionError` includes streaming state and causation chain
- `MultiTurnExecutionError` wraps other errors with execution phase context
- All errors extend base Error class with proper inheritance

✅ **Error Context**

- Each error includes relevant MultiTurnState snapshot
- Execution timing and performance context included where relevant
- Tool execution context preserved for tool-related errors
- Conversation history size and iteration details included

✅ **Error Recovery**

- Enhanced error handling in `executeMultiTurn()` method
- Graceful degradation strategies for recoverable errors
- Proper cleanup of resources on unrecoverable errors
- Clear error propagation with preserved context

✅ **Integration with Existing Code**

- Extends existing error handling patterns in AgentLoop
- Maintains compatibility with current error handling code
- Provides migration path for existing error scenarios
- Integrates with IterationManager timeout detection

✅ **Debugging Support**

- Comprehensive error messages with actionable information
- Structured error data for programmatic analysis
- Error serialization for logging and monitoring systems
- Stack trace preservation with clear error boundaries

## Testing Requirements

**Unit Tests** (include in this task):

- Error creation with various context scenarios
- Error inheritance and instanceof behavior
- Error serialization and deserialization accuracy
- Integration with existing error handling patterns
- Error recovery scenarios in multi-turn execution
- Error context preservation through call stacks

## Out of Scope

- Logging and observability integration (separate task)
- Provider-specific error handling (separate feature)
- Advanced error recovery strategies (future enhancement)
- Error notification and alerting (separate concern)

## Dependencies

- T-create-multiturnstate (for MultiTurnState context)
- T-create-iteration-manager-for (for timeout error integration)

## Security Considerations

- Ensure error messages don't leak sensitive conversation data
- Redact tool parameters and API keys from error context
- Prevent error injection through malformed input
- Maintain security boundaries in error propagation

## Performance Requirements

- Error object creation overhead < 5ms under normal conditions
- Error context serialization efficient for logging
- Memory usage of error objects bounded and reasonable
- Error handling doesn't significantly impact normal execution performance

## Implementation Notes

- Use Error.cause for proper error chaining where available
- Implement proper stack trace preservation across async boundaries
- Design error hierarchy for future extensibility
- Provide both human-readable and machine-readable error information
