---
id: T-implement-cancellationmanager
title: Implement CancellationManager core class
status: open
priority: high
parent: F-cancellation-infrastructure
prerequisites:
  - T-extend-agentexecutionoptions-1
  - T-create-cancellation-error
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T23:30:15.845Z
updated: 2025-09-18T23:30:15.845Z
---

# Implement CancellationManager core class

## Context

Create the central cancellation orchestration class that manages AbortSignal propagation, cleanup handlers, and cancellation detection throughout agent execution.

## Implementation Requirements

### 1. Core CancellationManager Class

Create `src/core/agent/cancellation/cancellationManager.ts`:

```typescript
class CancellationManager {
  private abortController: AbortController;
  private externalSignal?: AbortSignal;
  private checkInterval?: ReturnType<typeof setInterval>;
  private cleanupHandlers: Array<() => Promise<void>> = [];
  private options: Required<CancellationOptions>;

  constructor(options: CancellationOptions = {}) {
    // Initialize with external signal if provided
    // Set up periodic cancellation checks
    // Configure timeout behavior
  }

  // Core cancellation methods
  createCancellableContext(): CancellableExecutionContext;
  cancel(reason?: string): void;
  schedulePeriodicChecks(): void;
  stopPeriodicChecks(): void;

  // Cleanup management
  addCleanupHandler(handler: () => Promise<void>): void;
  performCleanup(): Promise<void>;

  // Status checking
  isCancelled(): boolean;
  throwIfCancelled(): void;
  getCancellationReason(): string | undefined;
}
```

### 2. CancellableExecutionContext Interface

```typescript
interface CancellableExecutionContext {
  signal: AbortSignal;
  onCancel?: (reason?: string) => void;
  checkCancellation(): void;
  throwIfCancelled(): void;
  isCancelled(): boolean;
  cancellationReason?: string;
}
```

### 3. Signal Composition Logic

- Combine external AbortSignal with internal AbortController
- Handle pre-cancelled signals gracefully
- Propagate cancellation reasons through signal chain
- Support signal cleanup when manager is disposed

### 4. Cleanup Handler Management

- LIFO (Last In, First Out) execution order
- Timeout enforcement for individual cleanup handlers
- Continue cleanup execution even if individual handlers fail
- Comprehensive error logging for failed cleanup operations

## Acceptance Criteria

### Functional Requirements

- ✅ CancellationManager accepts external AbortSignal in constructor
- ✅ Creates composed signals that respond to both external and internal cancellation
- ✅ Provides CancellableExecutionContext for agent loop integration
- ✅ Manages cleanup handler registration and execution with LIFO ordering
- ✅ Supports periodic cancellation checks with configurable interval

### Signal Handling Requirements

- ✅ Correctly handles pre-cancelled external signals
- ✅ Propagates cancellation reasons through execution context
- ✅ Cleans up internal resources when manager is disposed
- ✅ Provides immediate cancellation detection methods

### Cleanup Requirements

- ✅ Executes cleanup handlers in reverse registration order (LIFO)
- ✅ Continues cleanup execution even when individual handlers fail
- ✅ Enforces timeout for overall cleanup process
- ✅ Logs cleanup failures without throwing exceptions

### Testing Requirements

- ✅ Unit tests for signal composition with external AbortSignal
- ✅ Pre-cancelled signal handling tests
- ✅ Cleanup handler registration and execution order tests
- ✅ Periodic check scheduling and cleanup tests
- ✅ Error handling during cleanup execution tests
- ✅ Resource disposal and memory leak prevention tests

## Dependencies

- Requires AgentExecutionOptions extension (T-extend-agentexecutionoptions-1)
- Requires cancellation error types (T-create-cancellation-error)

## Out of Scope

- Integration with AgentLoop (separate task)
- Stream cancellation handling (separate task)
- Tool execution cancellation (separate task)
