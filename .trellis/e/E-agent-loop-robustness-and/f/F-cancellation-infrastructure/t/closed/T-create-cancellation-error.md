---
id: T-create-cancellation-error
title: Create cancellation error types
status: done
priority: high
parent: F-cancellation-infrastructure
prerequisites: []
affectedFiles:
  src/core/agent/cancellation/cancellationPhase.ts:
    Created CancellationPhase type
    definition with 5 specialized execution phases for cancellation contexts
  src/core/agent/cancellation/cancellationError.ts:
    Created core CancellationError
    class extending Error with detailed context properties (code, reason, phase,
    cleanupCompleted, timestamp) and custom JSON serialization
  src/core/agent/cancellation/gracefulCancellationTimeoutError.ts:
    Created GracefulCancellationTimeoutError class extending CancellationError
    with timeout-specific properties (timeoutMs, cleanupAttempted) and enhanced
    JSON serialization
  src/core/agent/cancellation/createCancellationError.ts: Created factory method
    for standard cancellation error creation with configurable reason, phase,
    and cleanup status
  src/core/agent/cancellation/createTimeoutError.ts: Created factory method for
    timeout-specific cancellation error creation with timeout context and phase
    defaulting
  src/core/agent/cancellation/fromAbortSignal.ts: Created factory method for
    creating cancellation errors from AbortSignal with safe reason extraction
    and proper type checking
  src/core/agent/cancellation/isCancellationError.ts: Created type guard function for CancellationError instance detection
  src/core/agent/cancellation/isGracefulTimeoutError.ts: Created type guard
    function for GracefulCancellationTimeoutError instance detection
  src/core/agent/cancellation/index.ts: Created barrel export file with
    comprehensive module documentation and organized exports by category (Types,
    Classes, Factory Methods, Type Guards)
  src/core/agent/cancellation/__tests__/cancellationErrors.test.ts:
    Created comprehensive test suite with 32 tests covering all error classes,
    factory methods, type guards, serialization, and integration scenarios
  src/core/agent/index.ts: Updated main agent module to export cancellation
    infrastructure and enhanced module documentation to mention cancellation
    capabilities
log:
  - Successfully implemented comprehensive cancellation error types for the LLM
    Bridge Library. Created specialized error classes (CancellationError and
    GracefulCancellationTimeoutError) with rich context including execution
    phase tracking, cleanup status, and timestamp information. Implemented
    factory methods for easy error creation from different scenarios (standard
    cancellation, timeout scenarios, and AbortSignal integration). Added type
    guards for error detection and comprehensive test coverage with 32 passing
    tests. All quality checks pass with no linting, formatting, or type errors.
schema: v1.0
childrenIds: []
created: 2025-09-18T23:29:56.432Z
updated: 2025-09-18T23:29:56.432Z
---

# Create cancellation error types

## Context

Define specialized error types for cancellation scenarios to provide clear error reporting and debugging context when agent execution is cancelled externally.

## Implementation Requirements

### 1. Create Core Cancellation Error

Create `src/core/agent/cancellation/cancellationErrors.ts`:

```typescript
class CancellationError extends Error {
  readonly code = "CANCELLATION_ERROR";
  readonly reason?: string;
  readonly phase:
    | "initialization"
    | "execution"
    | "tool_calls"
    | "streaming"
    | "cleanup";
  readonly cleanupCompleted: boolean;
  readonly timestamp: number;
}
```

### 2. Create Timeout-Specific Error

```typescript
class GracefulCancellationTimeoutError extends CancellationError {
  readonly code = "GRACEFUL_CANCELLATION_TIMEOUT";
  readonly timeoutMs: number;
  readonly cleanupAttempted: boolean;
}
```

### 3. Error Factory Methods

- `createCancellationError(reason?: string, phase: string)`: Standard cancellation
- `createTimeoutError(timeoutMs: number, cleanupAttempted: boolean)`: Timeout scenarios
- `fromAbortSignal(signal: AbortSignal, phase: string)`: Create from AbortSignal

### 4. Type Guards

- `isCancellationError(error: unknown): error is CancellationError`
- `isGracefulTimeoutError(error: unknown): error is GracefulCancellationTimeoutError`

## Acceptance Criteria

### Functional Requirements

- ✅ CancellationError class with required properties (code, reason, phase, cleanupCompleted, timestamp)
- ✅ GracefulCancellationTimeoutError extends CancellationError with timeout context
- ✅ Factory methods for easy error creation from different scenarios
- ✅ Type guards for error type detection and handling
- ✅ Proper error inheritance chain with Error base class

### Error Context Requirements

- ✅ Execution phase tracking (where cancellation occurred)
- ✅ Cleanup completion status for debugging
- ✅ Cancellation reason preservation from external sources
- ✅ Timestamp for cancellation timing analysis

### Testing Requirements

- ✅ Unit tests for error creation and inheritance
- ✅ Factory method validation tests
- ✅ Type guard functionality tests
- ✅ Error serialization and message formatting tests
- ✅ instanceof checks and error chain validation

## File Structure

```
src/core/agent/cancellation/
├── cancellationErrors.ts
└── __tests__/
    └── cancellationErrors.test.ts
```

## Dependencies

- Must complete before cancellation manager implementation
- Required by all other cancellation infrastructure tasks

## Out of Scope

- Error handling logic implementation (separate task)
- Integration with agent loop (separate task)
- Observability and logging integration (separate task)
