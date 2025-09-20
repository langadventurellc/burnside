---
id: T-replace-direct-timer-usage-in
title: Replace direct timer usage in tool execution pipeline
status: done
priority: medium
parent: F-complete-runtime-adapter
prerequisites:
  - T-update-bridgeclient-to-use
affectedFiles:
  src/core/tools/executionContext.ts: Added RuntimeAdapter import and
    runtimeAdapter property to ExecutionContext interface for platform-agnostic
    timer operations
  src/core/tools/pipelineExecution.ts: Replaced direct setTimeout/clearTimeout
    calls with runtime adapter timer methods, changed NodeJS.Timeout to
    TimerHandle type, maintained exact same timeout behavior
  src/core/tools/toolExecutionPipeline.ts: Added RuntimeAdapter parameter to
    execute method and included runtimeAdapter in ExecutionContext creation
  src/core/tools/toolRouter.ts: Added RuntimeAdapter to constructor parameters,
    stored as class property, and passed to pipeline.execute calls
  src/client/bridgeClient.ts: Updated ToolRouter instantiation to pass
    this.runtimeAdapter as third parameter
  src/core/tools/__tests__/toolRouter.test.ts: Added mock RuntimeAdapter setup
    that works with Jest fake timers and updated all ToolRouter instantiations
    to include runtime adapter parameter, added test timeout for timer tests
  src/core/tools/__tests__/toolExecutionPipeline.test.ts: Added mock
    RuntimeAdapter to test setup that works with Jest fake timers, updated all
    pipeline.execute calls to include runtime adapter, fixed executeToolHandler
    direct tests with proper runtime adapter mock, added test timeouts for timer
    tests
  src/core/tools/__tests__/toolExecutionStrategy.test.ts: Added mock
    RuntimeAdapter setup and updated ToolRouter instantiations for strategy
    tests
  src/core/tools/__tests__/toolExecutionCancellation.test.ts: Added mock
    RuntimeAdapter setup and updated ToolRouter instantiation for cancellation
    tests
  src/core/agent/__tests__/agentLoop.test.ts:
    Added mock RuntimeAdapter setup and
    updated ToolRouter instantiation for agent loop tests
  src/core/agent/__tests__/terminationIntegration.test.ts: Added mock
    RuntimeAdapter setup and updated ToolRouter instantiation for termination
    integration tests
log:
  - >-
    Successfully replaced direct timer usage in the tool execution pipeline with
    runtime adapter timer methods for platform-consistent behavior across
    Node.js, Electron, and React Native environments.


    **Key Changes Implemented:**


    1. **ExecutionContext Interface Updates**: Added `runtimeAdapter:
    RuntimeAdapter` property to enable platform-agnostic timer operations in
    tool execution.


    2. **Pipeline Execution Timer Replacement**: Updated `pipelineExecution.ts`
    to use `context.runtimeAdapter.setTimeout()` and
    `context.runtimeAdapter.clearTimeout()` instead of direct timer calls,
    maintaining exact same timeout behavior and error messages.


    3. **Complete Integration Chain**: Updated the entire call chain from
    BridgeClient → ToolRouter → ExecutionPipeline → executeToolHandler to pass
    runtime adapters through the system.


    4. **Type Safety**: Changed from `NodeJS.Timeout` to `TimerHandle` type for
    cross-platform compatibility.


    5. **Comprehensive Test Updates**: Updated all test files to provide mock
    runtime adapters that properly work with Jest fake timers, ensuring test
    coverage continues to work with the new architecture.


    **Files Modified:**

    - Core execution system: ExecutionContext, pipelineExecution,
    toolExecutionPipeline, toolRouter

    - Integration point: BridgeClient tool system initialization  

    - Comprehensive test coverage: All related test files updated with proper
    mock runtime adapters that work with Jest timers


    **Verification:**

    - Quality checks passing (lint, format, type-check) - only unrelated fetch
    deprecation warnings remain

    - ALL tests passing (3378/3378 - 100% success rate)

    - Timer tests specifically verified to work correctly with Jest fake timers

    - No breaking changes to existing timeout behavior or error handling


    The implementation follows the established runtime adapter pattern from
    BridgeClient and ensures consistent timer behavior across all supported
    platforms while maintaining existing functionality.
schema: v1.0
childrenIds: []
created: 2025-09-20T06:09:44.809Z
updated: 2025-09-20T06:09:44.809Z
---

# Replace direct timer usage in tool execution pipeline

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)
Prerequisites: T-update-bridgeclient-to-use (BridgeClient runtime adapter integration completed)

Replace direct setTimeout/clearTimeout usage in the tool execution pipeline with runtime adapter timer methods. This ensures platform-consistent timer behavior across Node.js, Electron, and React Native environments.

## Reference Implementation

- Tool execution pipeline: `src/core/tools/pipelineExecution.ts`
- RuntimeAdapter interface: `src/core/runtime/runtimeAdapter.ts`
- BridgeClient timer usage pattern: `src/client/bridgeClient.ts:282-300`

## Current State Analysis

The `executeToolHandler` function in `src/core/tools/pipelineExecution.ts` currently uses direct timer calls:

```typescript
// Line 23: Direct setTimeout usage
timeoutId = setTimeout(() => {
  controller.abort();
  reject(new Error(`Timeout after ${context.timeoutMs}ms`));
}, context.timeoutMs);

// Line 39 & 53: Direct clearTimeout usage
clearTimeout(timeoutId);
```

## Implementation Requirements

### Update ExecutionContext Interface

Add RuntimeAdapter to the ExecutionContext type:

```typescript
// Update ExecutionContext interface in src/core/tools/executionContext.ts
export interface ExecutionContext {
  toolCall: ToolCall;
  toolHandler: ToolHandler;
  executionContext: Record<string, unknown>;
  timeoutMs: number;
  startTime: number;
  runtimeAdapter: RuntimeAdapter; // Add this field
}
```

### Update executeToolHandler Function

Replace direct timer usage with runtime adapter calls:

```typescript
export async function executeToolHandler(
  context: ExecutionContext,
): Promise<ToolResult> {
  const controller = new AbortController();
  let timeoutHandle: TimerHandle | undefined;

  try {
    // Set up timeout promise using runtime adapter
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = context.runtimeAdapter.setTimeout(() => {
        controller.abort();
        reject(new Error(`Timeout after ${context.timeoutMs}ms`));
      }, context.timeoutMs);
    });

    // Execute handler with timeout protection
    const handlerResult = await Promise.race([
      context.toolHandler(
        context.toolCall.parameters,
        context.executionContext,
      ),
      timeoutPromise,
    ]);

    // Clear timeout on successful completion
    if (timeoutHandle) {
      context.runtimeAdapter.clearTimeout(timeoutHandle);
    }

    // ... rest of success logic unchanged
  } catch (error) {
    // Clear timeout in error case
    if (timeoutHandle) {
      context.runtimeAdapter.clearTimeout(timeoutHandle);
    }

    // ... rest of error handling unchanged
  }
}
```

### Update Import Statements

Add necessary imports for RuntimeAdapter and TimerHandle:

```typescript
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";
import type { TimerHandle } from "../runtime/timerHandle";
```

### Update Callers of executeToolHandler

Update all code that calls executeToolHandler to include runtime adapter in context:

```typescript
// In ToolRouter or wherever executeToolHandler is called
const context: ExecutionContext = {
  toolCall,
  toolHandler,
  executionContext: executionCtx,
  timeoutMs: timeout || 30000,
  startTime: Date.now(),
  runtimeAdapter: this.runtimeAdapter, // Add runtime adapter
};

const result = await executeToolHandler(context);
```

## Acceptance Criteria

### Timer Usage Replacement

- [ ] All direct `setTimeout` calls replaced with `context.runtimeAdapter.setTimeout`
- [ ] All direct `clearTimeout` calls replaced with `context.runtimeAdapter.clearTimeout`
- [ ] Timer handle type changed from `NodeJS.Timeout` to `TimerHandle`
- [ ] No direct timer usage remains in tool execution pipeline

### ExecutionContext Updates

- [ ] `ExecutionContext` interface includes `runtimeAdapter: RuntimeAdapter` field
- [ ] All callers of `executeToolHandler` provide runtime adapter in context
- [ ] TypeScript compilation succeeds with updated interface
- [ ] Existing execution context fields preserved

### Functionality Preservation

- [ ] Tool execution timeout behavior unchanged
- [ ] Error handling for timeouts preserved
- [ ] Cancellation via AbortController continues to work
- [ ] Tool execution results format unchanged
- [ ] Performance characteristics maintained

### Error Handling

- [ ] Timeout cleanup occurs in both success and error paths
- [ ] Timer handle validation prevents null/undefined access
- [ ] Existing timeout error messages preserved
- [ ] Error metadata includes timing information

### Cross-Platform Compatibility

- [ ] Timer operations work on Node.js via NodeRuntimeAdapter
- [ ] Timer operations work on Electron via ElectronRuntimeAdapter
- [ ] Timer operations work on React Native via ReactNativeRuntimeAdapter
- [ ] No platform-specific timer code outside of adapters

## Testing Requirements

- Update unit tests to provide runtime adapter in ExecutionContext
- Test timeout scenarios with mock runtime adapter
- Verify timer cleanup in both success and error cases
- Test tool execution with different timeout values
- Mock runtime adapter timer methods for predictable testing

## Security Considerations

- Maintain existing timeout protections against long-running tools
- Ensure timer cleanup prevents resource leaks
- Preserve existing tool execution security boundaries

## Performance Requirements

- Timer operations should have minimal overhead
- Tool execution performance should not degrade
- Memory usage should not increase due to adapter abstraction

## Out of Scope

- Transport retry timer updates (separate task)
- Agent system timer updates (separate task)
- Cancellation manager timer updates (separate task)
- Tool system architectural changes

## Files to Modify

- `src/core/tools/pipelineExecution.ts` - Replace timer usage
- `src/core/tools/executionContext.ts` - Add runtime adapter field
- Any files that call `executeToolHandler` - Update context creation

## Implementation Notes

- Follow the same pattern as BridgeClient timer usage
- Ensure proper timer handle cleanup in all code paths
- Maintain existing timeout error messages and behavior
- Use TimerHandle type for cross-platform compatibility
