---
id: T-extend-agentexecutionoptions-1
title: Extend AgentExecutionOptions with cancellation parameters
status: open
priority: high
parent: F-cancellation-infrastructure
prerequisites: []
affectedFiles: {}
log: []
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
