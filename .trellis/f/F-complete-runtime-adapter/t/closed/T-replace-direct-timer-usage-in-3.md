---
id: T-replace-direct-timer-usage-in-3
title: Replace direct timer usage in agent loop timeouts
status: done
priority: medium
parent: F-complete-runtime-adapter
prerequisites:
  - T-replace-direct-timer-usage-in-2
affectedFiles:
  src/core/agent/agentLoop.ts: Updated constructor to accept RuntimeAdapter
    parameter, replaced direct setTimeout calls with
    this.runtimeAdapter.setTimeout, added proper timer cleanup in finally
    blocks, imported RuntimeAdapter and TimerHandle types
  src/client/bridgeClient.ts: Updated AgentLoop instantiation to pass
    this.runtimeAdapter as second parameter
  src/core/agent/__tests__/agentLoop.test.ts: Updated all AgentLoop constructor
    calls to include mockRuntimeAdapter parameter, fixed parameter order
    throughout test file
  src/core/agent/__tests__/terminationIntegration.test.ts: Updated AgentLoop constructor call to include mockRuntimeAdapter parameter
log:
  - Successfully replaced direct timer usage in AgentLoop with runtime adapter
    timer methods. Updated AgentLoop constructor to accept RuntimeAdapter as
    second parameter, replaced direct setTimeout calls with runtime adapter
    methods, and updated all callers including BridgeClient and test files.
    Timer operations now use TimerHandle type and proper cleanup in finally
    blocks. Implementation maintains exact same timeout behavior while providing
    true platform abstraction across Node.js, Electron, and React Native
    environments.
schema: v1.0
childrenIds: []
created: 2025-09-20T06:11:15.560Z
updated: 2025-09-20T06:11:15.560Z
---

# Replace direct timer usage in agent loop timeouts

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)
Prerequisites: T-replace-direct-timer-usage-in-2 (Agent cancellation manager timer updates completed)

Replace direct setTimeout usage in the agent loop with runtime adapter timer methods. This ensures platform-consistent timer behavior for agent execution timeouts across all supported environments.

## Reference Implementation

- Agent loop: `src/core/agent/agentLoop.ts`
- RuntimeAdapter interface: `src/core/runtime/runtimeAdapter.ts`
- Previous timer update patterns: T-replace-direct-timer-usage-in-2

## Current State Analysis

The `agentLoop.ts` file currently uses direct timer calls:

```typescript
// Line 460: Direct setTimeout usage
setTimeout(() => {
  signal.postMessage({ type: "timeout" });
}, options.timeoutMs || 30000);

// Line 858: Direct setTimeout usage (in debug/test code)
await new Promise((resolve) => setTimeout(resolve, 10));
```

## Implementation Requirements

### Add RuntimeAdapter to AgentLoop Constructor

Update AgentLoop class to accept and store RuntimeAdapter:

```typescript
export class AgentLoop {
  private readonly toolRouter: ToolRouter;
  private readonly runtimeAdapter: RuntimeAdapter;

  constructor(toolRouter: ToolRouter, runtimeAdapter: RuntimeAdapter) {
    this.toolRouter = toolRouter;
    this.runtimeAdapter = runtimeAdapter;
  }
}
```

### Update executeMultiTurn Method

Replace direct setTimeout with runtime adapter:

```typescript
async executeMultiTurn(
  initialMessages: Message[],
  options: MultiTurnExecutionOptions = {},
): Promise<MultiTurnResult> {
  // ... existing setup code

  let timeoutHandle: TimerHandle | undefined;

  try {
    // Setup timeout using runtime adapter
    if (options.timeoutMs) {
      timeoutHandle = this.runtimeAdapter.setTimeout(() => {
        signal.postMessage({ type: "timeout" });
      }, options.timeoutMs);
    }

    // ... rest of execution logic

    return result;
  } finally {
    // Clean up timeout
    if (timeoutHandle) {
      this.runtimeAdapter.clearTimeout(timeoutHandle);
    }
  }
}
```

### Update Debug/Test Delay

Replace direct setTimeout in debug delay with runtime adapter:

```typescript
// Replace this line:
await new Promise((resolve) => setTimeout(resolve, 10));

// With:
await new Promise((resolve) => {
  this.runtimeAdapter.setTimeout(resolve, 10);
});
```

### Update Import Statements

Add necessary imports:

```typescript
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";
import type { TimerHandle } from "../runtime/timerHandle";
```

### Update AgentLoop Creation

Update all locations where AgentLoop is instantiated:

```typescript
// In BridgeClient.initializeToolSystem() method
this.agentLoop = new AgentLoop(
  this.toolRouter,
  this.runtimeAdapter, // Add runtime adapter
);

// In other locations that create AgentLoop instances
const agentLoop = new AgentLoop(toolRouter, runtimeAdapter);
```

## Acceptance Criteria

### Constructor Updates

- [ ] AgentLoop constructor accepts `RuntimeAdapter` as second parameter
- [ ] Runtime adapter stored as private readonly property
- [ ] All callers of AgentLoop constructor updated to provide runtime adapter

### Timer Usage Replacement

- [ ] Direct `setTimeout` calls replaced with `this.runtimeAdapter.setTimeout`
- [ ] Timer handle type changed to `TimerHandle`
- [ ] Timeout cleanup using `this.runtimeAdapter.clearTimeout`
- [ ] No direct timer usage remains in AgentLoop

### Timeout Handling

- [ ] Multi-turn execution timeout behavior preserved
- [ ] Timeout messages posted to signal correctly
- [ ] Timer cleanup occurs in finally blocks
- [ ] Debug delay functionality preserved

### Integration Updates

- [ ] BridgeClient.initializeToolSystem() updated to pass runtime adapter
- [ ] All other AgentLoop instantiation points updated
- [ ] TypeScript compilation succeeds with updated constructor

### Functionality Preservation

- [ ] Agent execution timeout behavior unchanged
- [ ] Multi-turn conversation handling preserved
- [ ] Debug and test functionality maintained
- [ ] Performance characteristics maintained

### Error Handling

- [ ] Timer cleanup occurs in all execution paths
- [ ] Exception handling preserved for timer operations
- [ ] Timeout error handling unchanged
- [ ] Resource leak prevention maintained

## Testing Requirements

- Update unit tests to provide runtime adapter to AgentLoop
- Test timeout functionality with mock runtime adapter
- Verify multi-turn execution timeouts work correctly
- Test debug delay with adapter timers
- Mock runtime adapter timer methods for predictable testing

## Security Considerations

- Maintain existing timeout protections for agent execution
- Ensure timer cleanup prevents resource leaks
- Preserve existing agent execution security boundaries

## Performance Requirements

- Agent execution timing should be maintained
- Timer operations should have minimal overhead
- Memory usage should not increase due to adapter abstraction

## Out of Scope

- Tool router timer usage (already completed in T-replace-direct-timer-usage-in)
- Cancellation manager updates (already completed)
- Other agent system components not using direct timers

## Files to Modify

- `src/core/agent/agentLoop.ts` - Update timer usage and constructor
- `src/client/bridgeClient.ts` - Update AgentLoop instantiation
- Any other files that create AgentLoop instances - Update constructor calls

## Implementation Notes

- Follow the same pattern as previous timer replacement tasks
- Ensure proper timer handle cleanup in all code paths
- Maintain existing timeout behavior and error handling
- AgentLoop should receive runtime adapter from its consumers (like BridgeClient)
