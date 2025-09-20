---
id: T-replace-direct-timer-usage-in-1
title: Replace direct timer usage in transport retry logic
status: done
priority: medium
parent: F-complete-runtime-adapter
prerequisites:
  - T-replace-direct-timer-usage-in
affectedFiles:
  src/core/transport/retry/delayPromise.ts: Updated function signature to accept
    RuntimeAdapter parameter, replaced setTimeout/clearTimeout with runtime
    adapter methods, updated JSDoc documentation
  src/core/transport/enhancedHttpTransport.ts: Added RuntimeAdapter support to
    EnhancedTransportConfig, updated constructor and delayPromise calls to use
    runtime adapter, added validation for runtime adapter requirement
  src/core/transport/retry/__tests__/backoffStrategy.test.ts: Added mock
    RuntimeAdapter setup and updated all delayPromise calls to include runtime
    adapter parameter
  src/core/transport/__tests__/enhancedHttpTransport.test.ts: Added mock
    RuntimeAdapter setup, updated all EnhancedHttpTransport instantiations with
    runtime adapter, fixed test expectations for new delayPromise signature
log:
  - Successfully replaced direct timer usage in transport retry logic with
    runtime adapter timer methods. Updated delayPromise function signature to
    accept RuntimeAdapter parameter, modified EnhancedHttpTransport to support
    runtime adapter configuration, and updated all test files to work with the
    new signature. All functionality preserved including AbortSignal
    cancellation while achieving true platform abstraction for timer operations.
schema: v1.0
childrenIds: []
created: 2025-09-20T06:10:15.477Z
updated: 2025-09-20T06:10:15.477Z
---

# Replace direct timer usage in transport retry logic

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)
Prerequisites: T-replace-direct-timer-usage-in (Tool execution pipeline timer updates completed)

Replace direct setTimeout/clearTimeout usage in the transport retry logic with runtime adapter timer methods. This ensures platform-consistent timer behavior for retry delays across all supported environments.

## Reference Implementation

- Transport retry logic: `src/core/transport/retry/delayPromise.ts`
- RuntimeAdapter interface: `src/core/runtime/runtimeAdapter.ts`
- Tool execution timer pattern: T-replace-direct-timer-usage-in

## Current State Analysis

The `delayPromise` function in `src/core/transport/retry/delayPromise.ts` currently uses direct timer calls:

```typescript
// Line 14: Direct setTimeout usage
const timeoutId = setTimeout(() => {
  if (signal) {
    signal.removeEventListener("abort", abortHandler);
  }
  resolve();
}, ms);

// Line 22: Direct clearTimeout usage
const abortHandler = () => {
  clearTimeout(timeoutId);
  reject(new Error("Delay was aborted"));
};
```

## Implementation Requirements

### Update delayPromise Function Signature

Add RuntimeAdapter parameter to delayPromise function:

```typescript
/**
 * Promise-based delay utility with AbortSignal support using runtime adapter
 * @param ms - Delay in milliseconds
 * @param runtimeAdapter - Runtime adapter for timer operations
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves after the delay or rejects if aborted
 */
export function delayPromise(
  ms: number,
  runtimeAdapter: RuntimeAdapter,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Delay was aborted"));
      return;
    }

    const timeoutHandle = runtimeAdapter.setTimeout(() => {
      if (signal) {
        signal.removeEventListener("abort", abortHandler);
      }
      resolve();
    }, ms);

    const abortHandler = () => {
      runtimeAdapter.clearTimeout(timeoutHandle);
      reject(new Error("Delay was aborted"));
    };

    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }
  });
}
```

### Update Import Statements

Add necessary imports for RuntimeAdapter and TimerHandle:

```typescript
import type { RuntimeAdapter } from "../runtimeAdapter";
import type { TimerHandle } from "../timerHandle";
```

### Update All Callers of delayPromise

Find and update all locations that call delayPromise to include runtime adapter:

1. **Enhanced HTTP Transport retry logic**
2. **Backoff strategy implementations**
3. **Rate limiting delay mechanisms**

Example update pattern:

```typescript
// Before
await delayPromise(retryDelay, abortSignal);

// After
await delayPromise(retryDelay, this.runtimeAdapter, abortSignal);
```

### Update Function Documentation

Update JSDoc comments to reflect the new signature:

````typescript
/**
 * Promise-based delay utility with AbortSignal support using runtime adapter
 *
 * Provides platform-agnostic delay functionality using the runtime adapter's
 * timer methods. Supports cancellation via AbortSignal.
 *
 * @param ms - Delay in milliseconds
 * @param runtimeAdapter - Runtime adapter for cross-platform timer operations
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves after the delay or rejects if aborted
 *
 * @example
 * ```typescript
 * // Basic delay
 * await delayPromise(1000, runtimeAdapter);
 *
 * // Delay with cancellation
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 500);
 * await delayPromise(1000, runtimeAdapter, controller.signal);
 * ```
 */
````

## Acceptance Criteria

### Timer Usage Replacement

- [ ] Direct `setTimeout` call replaced with `runtimeAdapter.setTimeout`
- [ ] Direct `clearTimeout` call replaced with `runtimeAdapter.clearTimeout`
- [ ] Timer handle type changed to use `TimerHandle` interface
- [ ] No direct timer usage remains in delayPromise function

### Function Signature Updates

- [ ] `delayPromise` function accepts `RuntimeAdapter` as second parameter
- [ ] Parameter order is logical: `(ms, runtimeAdapter, signal?)`
- [ ] Function signature is backward compatible where possible
- [ ] TypeScript compilation succeeds with updated signature

### Caller Updates

- [ ] All callers of `delayPromise` updated to provide runtime adapter
- [ ] Enhanced HTTP Transport retry logic updated
- [ ] Backoff strategy implementations updated
- [ ] Rate limiting mechanisms updated if applicable

### Functionality Preservation

- [ ] Delay behavior unchanged (same timing characteristics)
- [ ] AbortSignal cancellation continues to work
- [ ] Promise resolution/rejection behavior preserved
- [ ] Error handling for aborted delays unchanged

### Cross-Platform Compatibility

- [ ] Delay operations work on Node.js via NodeRuntimeAdapter
- [ ] Delay operations work on Electron via ElectronRuntimeAdapter
- [ ] Delay operations work on React Native via ReactNativeRuntimeAdapter
- [ ] No platform-specific timer code outside of adapters

### Documentation Updates

- [ ] JSDoc comments updated to reflect new signature
- [ ] Parameter descriptions accurate and helpful
- [ ] Usage examples updated for new signature
- [ ] Migration guidance provided for breaking changes

## Testing Requirements

- Update unit tests to provide runtime adapter to delayPromise
- Test delay functionality with mock runtime adapter
- Verify AbortSignal cancellation works with adapter timers
- Test error scenarios (immediate abort, mid-delay abort)
- Mock runtime adapter timer methods for predictable testing

## Security Considerations

- Maintain existing cancellation behavior to prevent resource leaks
- Ensure proper timer cleanup in all code paths
- Preserve existing delay validation and bounds checking

## Performance Requirements

- Delay timing accuracy should be maintained
- Timer operations should have minimal overhead
- Memory usage should not increase due to adapter abstraction

## Breaking Changes

This is a breaking change to the delayPromise function signature. Consider:

- Deprecation strategy for old signature
- Migration documentation for consumers
- Version bump considerations

## Out of Scope

- Agent system timer updates (separate task)
- Cancellation manager timer updates (separate task)
- Tool system timer updates (already completed)
- HTTP client timer usage outside retry logic

## Files to Modify

- `src/core/transport/retry/delayPromise.ts` - Update function signature and implementation
- All files that import and use `delayPromise` - Update function calls

## Implementation Notes

- Follow the same pattern as tool execution pipeline timer updates
- Ensure proper timer handle cleanup in all code paths
- Maintain existing delay error messages and behavior
- Consider providing adapter-aware wrapper functions if many callers need updates
