---
id: T-extend-agentexecutionoptions-1
title: Extend AgentExecutionOptions with cancellation parameters
status: done
priority: high
parent: F-cancellation-infrastructure
prerequisites: []
affectedFiles:
  src/core/agent/agentExecutionOptions.ts: "Extended interface with 4 new
    cancellation properties: signal (AbortSignal), cancellationCheckIntervalMs
    (number, default 100), gracefulCancellationTimeoutMs (number, default 5000),
    cleanupOnCancel (boolean, default true). Added comprehensive JSDoc
    documentation with external cancellation examples showing AbortController
    usage patterns for chat applications."
  src/core/agent/agentLoop.ts:
    "Updated constructor to provide default values for
    new cancellation properties. Modified all internal method type signatures to
    exclude 'signal' from required properties (alongside existing
    'iterationTimeoutMs' exclusion). Updated 5 private method signatures:
    initializeMultiTurnState, executeIterationWithTimeout, executeIteration,
    handleStreamingTurn, coordinateToolExecutionDuringStreaming."
  src/core/agent/__tests__/agentExecutionOptions.test.ts: "Added comprehensive
    test coverage for cancellation options including: new 'Cancellation Options'
    test suite with 4 tests, updated 'Type Safety' section with cancellation
    property validation, enhanced 'Optional Properties' and 'Combined Options'
    tests, added cancellation example documentation validation, updated backward
    compatibility tests, and added edge cases for zero values. Total of 8 new
    test cases added, bringing total to 26 tests."
log:
  - Successfully extended AgentExecutionOptions interface with comprehensive
    cancellation support. Added four new optional properties (signal,
    cancellationCheckIntervalMs, gracefulCancellationTimeoutMs, cleanupOnCancel)
    with detailed JSDoc documentation and usage examples. Updated AgentLoop
    class to handle new cancellation properties with proper default values.
    Implemented comprehensive test suite with 26 test cases covering type
    safety, backward compatibility, edge cases, and documentation examples. All
    quality checks pass and full test suite (2810 tests) passes without
    regressions.
schema: v1.0
childrenIds: []
created: 2025-09-18T23:29:40.800Z
updated: 2025-09-18T23:29:40.800Z
---

# Extend AgentExecutionOptions with cancellation parameters

## Context

Enable external cancellation of agent execution by adding AbortSignal support to the agent execution options. This allows chat applications to pass cancellation signals when users hit escape or cancel buttons.

## Implementation Requirements

### 1. Extend AgentExecutionOptions Interface

Add new optional cancellation properties to `src/core/agent/agentExecutionOptions.ts`:

```typescript
interface AgentExecutionOptions {
  // ... existing options

  // Cancellation options
  signal?: AbortSignal;
  cancellationCheckIntervalMs?: number; // Default: 100ms
  gracefulCancellationTimeoutMs?: number; // Default: 5000ms
  cleanupOnCancel?: boolean; // Default: true
}
```

### 2. Update Documentation

- Add comprehensive JSDoc with examples showing external cancellation usage
- Include examples of AbortController creation in chat applications
- Document default values and timeout behavior

### 3. Maintain Backward Compatibility

- All new options must be optional
- Existing AgentExecutionOptions usage must continue working unchanged
- Default behavior when no signal provided should match current behavior

## Acceptance Criteria

### Functional Requirements

- ✅ AgentExecutionOptions accepts optional `signal?: AbortSignal` parameter
- ✅ Cancellation check interval is configurable (default 100ms)
- ✅ Graceful cancellation timeout is configurable (default 5000ms)
- ✅ Cleanup on cancel behavior is configurable (default true)
- ✅ All existing AgentExecutionOptions usage continues working without changes

### Documentation Requirements

- ✅ Comprehensive JSDoc with external cancellation examples
- ✅ Example showing AbortController creation and signal passing
- ✅ Clear documentation of timeout behavior and defaults
- ✅ Integration examples with chat application patterns

### Testing Requirements

- ✅ Unit tests for interface extension and type safety
- ✅ Tests for default value behavior
- ✅ Backward compatibility tests with existing code
- ✅ Documentation example validation tests

## Dependencies

- Must complete before cancellation manager implementation
- Requires understanding of existing multi-turn AgentExecutionOptions structure

## Out of Scope

- Implementation of cancellation logic (separate task)
- Integration with BridgeClient (separate task)
- Error handling for cancellation scenarios (separate task)
