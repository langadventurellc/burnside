---
id: T-replace-direct-timer-usage-in-2
title: Replace direct timer usage in agent cancellation managers
status: done
priority: medium
parent: F-complete-runtime-adapter
prerequisites:
  - T-replace-direct-timer-usage-in-1
affectedFiles:
  src/core/tools/toolRouter.ts:
    Added getRuntimeAdapter() public method to expose
    runtime adapter to consumers like AgentLoop
  src/core/agent/cancellation/cancellationManager.ts: Updated constructor to
    accept RuntimeAdapter as first parameter, replaced all direct timer calls
    (setTimeout, clearTimeout, setInterval, clearInterval) with runtime adapter
    methods, changed timer handle types from platform-specific to TimerHandle
  src/core/agent/cancellation/streamCancellationHandler.ts:
    Updated constructor to
    accept RuntimeAdapter as second parameter, replaced all direct timer calls
    with runtime adapter methods, changed timer handle types to TimerHandle
  src/core/agent/agentLoop.ts: Updated CancellationManager instantiation to pass
    this.toolRouter.getRuntimeAdapter() as first parameter
  src/core/agent/cancellation/__tests__/cancellationManager.test.ts:
    Added createMockRuntimeAdapter helper function, updated all
    CancellationManager constructor calls to include mock runtime adapter as
    first parameter
  src/core/agent/cancellation/__tests__/streamCancellationHandler.test.ts:
    Added createMockRuntimeAdapter helper function, updated all
    CancellationManager and StreamCancellationHandler constructor calls to
    include mock runtime adapter parameters in correct positions
log:
  - Successfully replaced all direct timer usage in agent cancellation managers
    with runtime adapter timer methods. Updated CancellationManager and
    StreamCancellationHandler constructors to accept RuntimeAdapter as
    dependency, ensuring platform-consistent timer behavior across Node.js,
    Electron, and React Native environments. All timer operations (setTimeout,
    clearTimeout, setInterval, clearInterval) now use runtime adapter methods.
    Updated AgentLoop to provide RuntimeAdapter to CancellationManager via
    ToolRouter.getRuntimeAdapter(). All tests updated with mock RuntimeAdapter
    instances. Implementation maintains exact same timing behavior and
    functionality while providing true platform abstraction.
schema: v1.0
childrenIds: []
created: 2025-09-20T06:10:48.201Z
updated: 2025-09-20T06:10:48.201Z
---

# Replace direct timer usage in agent cancellation managers

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)
Prerequisites: T-replace-direct-timer-usage-in-1 (Transport retry timer updates completed)

Replace direct setTimeout/setInterval/clearTimeout/clearInterval usage in the agent cancellation system with runtime adapter timer methods. This ensures platform-consistent timer behavior for cancellation monitoring across all supported environments.

## Reference Implementation

- Cancellation manager: `src/core/agent/cancellation/cancellationManager.ts`
- Stream cancellation handler: `src/core/agent/cancellation/streamCancellationHandler.ts`
- RuntimeAdapter interface: `src/core/runtime/runtimeAdapter.ts`
- Previous timer update patterns: T-replace-direct-timer-usage-in

## Current State Analysis

The cancellation system currently uses direct timer calls in multiple locations:

**CancellationManager (`src/core/agent/cancellation/cancellationManager.ts`):**

```typescript
// Line 195: Direct setInterval usage
this.checkInterval = setInterval(() => {
  this.performCancellationCheck();
}, this.checkIntervalMs);

// Line 217: Direct clearInterval usage
clearInterval(this.checkInterval);

// Line 275: Direct setTimeout usage
timeoutHandle = setTimeout(() => {
  controller.abort("Timeout exceeded");
}, timeoutMs);

// Line 301: Direct clearTimeout usage
clearTimeout(timeoutHandle);
```

**StreamCancellationHandler (`src/core/agent/cancellation/streamCancellationHandler.ts`):**

```typescript
// Line 344: Direct setInterval usage
this.cancellationCheckInterval = setInterval(
  this.handlePeriodicCancellationCheck.bind(this),
  this.checkIntervalMs,
);

// Line 355: Direct clearInterval usage
clearInterval(this.cancellationCheckInterval);
```

## Implementation Requirements

### Update CancellationManager Class

Add RuntimeAdapter dependency and update timer usage:

```typescript
export class CancellationManager {
  private checkInterval?: TimerHandle;
  private readonly runtimeAdapter: RuntimeAdapter;

  constructor(
    runtimeAdapter: RuntimeAdapter,
    options: CancellationManagerOptions = {},
  ) {
    this.runtimeAdapter = runtimeAdapter;
    this.checkIntervalMs = options.checkIntervalMs ?? 100;
    this.maxCancellationTime = options.maxCancellationTime ?? 10000;
  }

  startPeriodicChecks(): void {
    if (this.checkInterval) {
      return; // Already started
    }

    this.checkInterval = this.runtimeAdapter.setInterval(() => {
      this.performCancellationCheck();
    }, this.checkIntervalMs);
  }

  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      this.runtimeAdapter.clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  // Update withTimeout method
  withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<T> {
    // ... existing logic with runtime adapter timers
    let timeoutHandle: TimerHandle | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = this.runtimeAdapter.setTimeout(() => {
        controller.abort("Timeout exceeded");
        reject(createTimeoutError(timeoutMs));
      }, timeoutMs);
    });

    // ... rest with proper cleanup using this.runtimeAdapter.clearTimeout
  }
}
```

### Update StreamCancellationHandler Class

Add RuntimeAdapter dependency and update timer usage:

```typescript
export class StreamCancellationHandler {
  private cancellationCheckInterval?: TimerHandle;
  private readonly runtimeAdapter: RuntimeAdapter;

  constructor(
    cancellationManager: CancellationManager,
    runtimeAdapter: RuntimeAdapter,
    checkIntervalMs: number = 100,
  ) {
    this.cancellationManager = cancellationManager;
    this.runtimeAdapter = runtimeAdapter;
    this.checkIntervalMs = checkIntervalMs;
  }

  private startCancellationChecks(): void {
    if (this.cancellationCheckInterval) {
      return; // Already started
    }

    this.cancellationCheckInterval = this.runtimeAdapter.setInterval(
      this.handlePeriodicCancellationCheck.bind(this),
      this.checkIntervalMs,
    );
  }

  private stopCancellationChecks(): void {
    if (this.cancellationCheckInterval) {
      this.runtimeAdapter.clearInterval(this.cancellationCheckInterval);
      this.cancellationCheckInterval = undefined;
    }
  }
}
```

### Update Import Statements

Add necessary imports:

```typescript
import type { RuntimeAdapter } from "../runtimeAdapter";
import type { TimerHandle } from "../timerHandle";
```

### Update Constructor Callers

Update all code that creates CancellationManager and StreamCancellationHandler instances:

```typescript
// In AgentLoop or wherever cancellation managers are created
const cancellationManager = new CancellationManager(this.runtimeAdapter, {
  checkIntervalMs: 100,
  maxCancellationTime: 10000,
});

const streamHandler = new StreamCancellationHandler(
  cancellationManager,
  this.runtimeAdapter,
  100,
);
```

## Acceptance Criteria

### CancellationManager Updates

- [ ] Constructor accepts `RuntimeAdapter` as first parameter
- [ ] All `setInterval/clearInterval` calls use `runtimeAdapter.setInterval/clearInterval`
- [ ] All `setTimeout/clearTimeout` calls use `runtimeAdapter.setTimeout/clearTimeout`
- [ ] Timer handle types changed from platform-specific to `TimerHandle`
- [ ] No direct timer usage remains in CancellationManager

### StreamCancellationHandler Updates

- [ ] Constructor accepts `RuntimeAdapter` parameter
- [ ] All `setInterval/clearInterval` calls use `runtimeAdapter.setInterval/clearInterval`
- [ ] Timer handle types changed to `TimerHandle`
- [ ] No direct timer usage remains in StreamCancellationHandler

### Functionality Preservation

- [ ] Cancellation check intervals maintain same timing behavior
- [ ] Timeout functionality preserved in withTimeout methods
- [ ] Stream cancellation monitoring continues to work
- [ ] Performance characteristics maintained

### Constructor Updates

- [ ] All callers of CancellationManager updated to provide runtime adapter
- [ ] All callers of StreamCancellationHandler updated to provide runtime adapter
- [ ] AgentLoop integration updated with runtime adapter
- [ ] TypeScript compilation succeeds with updated constructors

### Error Handling

- [ ] Timer cleanup occurs in all cleanup paths
- [ ] Exception handling preserved for timer operations
- [ ] Cancellation error messages unchanged
- [ ] Resource leak prevention maintained

### Cross-Platform Compatibility

- [ ] Cancellation timing works on Node.js via NodeRuntimeAdapter
- [ ] Cancellation timing works on Electron via ElectronRuntimeAdapter
- [ ] Cancellation timing works on React Native via ReactNativeRuntimeAdapter
- [ ] No platform-specific timer code outside of adapters

## Testing Requirements

- Update unit tests to provide runtime adapter to cancellation managers
- Test cancellation timing with mock runtime adapter
- Verify interval-based checking continues to work
- Test timeout scenarios with different timing values
- Mock runtime adapter timer methods for predictable testing

## Security Considerations

- Maintain existing cancellation protections
- Ensure timer cleanup prevents resource leaks
- Preserve existing timeout security boundaries

## Performance Requirements

- Cancellation check intervals should maintain timing accuracy
- Timer operations should have minimal overhead
- Memory usage should not increase due to adapter abstraction

## Out of Scope

- Agent loop timer updates (separate task if needed)
- Other agent system components
- Tool system timer updates (already completed)
- Transport timer updates (already completed)

## Files to Modify

- `src/core/agent/cancellation/cancellationManager.ts` - Update timer usage
- `src/core/agent/cancellation/streamCancellationHandler.ts` - Update timer usage
- Any files that create cancellation manager instances - Update constructor calls

## Implementation Notes

- Follow the same pattern as previous timer replacement tasks
- Ensure proper timer handle cleanup in all code paths
- Maintain existing cancellation timing behavior
- Update constructor signatures to accept runtime adapter as dependency
