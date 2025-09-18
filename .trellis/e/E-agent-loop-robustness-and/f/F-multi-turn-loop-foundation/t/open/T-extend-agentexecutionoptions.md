---
id: T-extend-agentexecutionoptions
title: Extend AgentExecutionOptions interface with multi-turn configuration
status: open
priority: high
parent: F-multi-turn-loop-foundation
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T02:44:20.582Z
updated: 2025-09-18T02:44:20.582Z
---

# Extend AgentExecutionOptions Interface with Multi-Turn Configuration

## Context

This task extends the existing `AgentExecutionOptions` interface to support multi-turn conversation configuration. The current interface only supports single-turn execution options. We need to add new options for multi-turn orchestration while maintaining backward compatibility.

## Related Files

- `src/core/agent/agentExecutionOptions.ts` - Current single-turn options interface

## Implementation Requirements

Extend the `AgentExecutionOptions` interface with the following new optional properties:

```typescript
interface AgentExecutionOptions {
  // Existing single-turn options (keep unchanged)
  maxToolCalls?: number;
  timeoutMs?: number;
  toolTimeoutMs?: number;
  continueOnToolError?: boolean;

  // New multi-turn options
  maxIterations?: number; // Default: 10
  iterationTimeoutMs?: number; // Per-iteration timeout
  enableStreaming?: boolean; // Default: true
  toolExecutionStrategy?: "sequential" | "parallel"; // Default: 'sequential'
  maxConcurrentTools?: number; // For parallel execution, default: 3
}
```

## Technical Approach

1. **Add new optional properties** to the existing interface without breaking changes
2. **Document each new property** with clear JSDoc comments explaining purpose and defaults
3. **Update type exports** to ensure proper TypeScript support
4. **Add comprehensive examples** showing both single-turn and multi-turn configurations

## Detailed Acceptance Criteria

✅ **Interface Extension**

- All new properties are optional (no breaking changes)
- `maxIterations` controls maximum conversation turns (default: 10)
- `iterationTimeoutMs` sets timeout per iteration (independent of overall timeout)
- `enableStreaming` enables/disables streaming interruption handling (default: true)
- `toolExecutionStrategy` selects sequential vs parallel tool execution (default: 'sequential')
- `maxConcurrentTools` limits parallel tool execution concurrency (default: 3)

✅ **Type Safety**

- All new properties have proper TypeScript types
- Union types for `toolExecutionStrategy` are properly constrained
- Numeric properties validate sensible ranges in usage

✅ **Documentation**

- JSDoc comments explain purpose and behavior of each new option
- Code examples show both simple and complex multi-turn configurations
- Migration guide explains how existing code remains unchanged

✅ **Backward Compatibility**

- All existing code continues to work without modifications
- Default values maintain existing single-turn behavior
- No runtime changes to existing option processing

## Testing Requirements

**Unit Tests** (include in this task):

- Verify interface compilation with TypeScript
- Test that existing option patterns still work
- Validate new option combinations compile correctly
- Test default value documentation accuracy

## Out of Scope

- Implementation of the multi-turn logic itself (handled by other tasks)
- Changes to AgentLoop class (separate task)
- Runtime option validation logic (separate task)

## Dependencies

- None (foundational interface change)

## Security Considerations

- No sensitive data in new configuration options
- Ensure timeout values can't be set to dangerous extremes
- Validate concurrency limits are reasonable

## Performance Impact

- No runtime performance impact (interface-only change)
- No memory overhead from this change alone
