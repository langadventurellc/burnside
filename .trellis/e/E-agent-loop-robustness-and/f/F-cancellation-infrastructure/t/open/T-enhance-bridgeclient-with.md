---
id: T-enhance-bridgeclient-with
title: Enhance BridgeClient with external cancellation support
status: open
priority: high
parent: F-cancellation-infrastructure
prerequisites:
  - T-implement-cancellationmanager
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T23:30:35.998Z
updated: 2025-09-18T23:30:35.998Z
---

# Enhance BridgeClient with external cancellation support

## Context

Integrate cancellation support into BridgeClient to enable chat applications to pass AbortSignal for cancelling running agent conversations. This is the main entry point for external cancellation.

## Implementation Requirements

### 1. Extend Request Interfaces

Update `src/client/chatRequest.ts` and `src/client/streamRequest.ts`:

```typescript
interface ChatRequest {
  // ... existing properties
  signal?: AbortSignal; // External cancellation signal
}

interface StreamRequest extends ChatRequest {
  // Inherits signal from ChatRequest
}
```

### 2. Enhance createTimeoutSignal Method

Update `src/client/bridgeClient.ts` createTimeoutSignal method (lines 219-229):

```typescript
private createTimeoutSignal(
  timeoutMs: number,
  externalSignal?: AbortSignal
): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Combine with external signal if provided
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
}
```

### 3. Update chat() and stream() Methods

- Pass external signal through to multi-turn execution
- Combine external signal with timeout signal
- Maintain backward compatibility for requests without signals
- Ensure cancellation propagates through entire execution chain

### 4. Error Handling Integration

- Convert AbortSignal cancellation to CancellationError
- Preserve cancellation reason in error context
- Ensure proper cleanup when external cancellation occurs

## Acceptance Criteria

### Functional Requirements

- ✅ ChatRequest and StreamRequest accept optional `signal?: AbortSignal`
- ✅ createTimeoutSignal method combines external signal with timeout signal
- ✅ Pre-cancelled external signals are handled immediately
- ✅ chat() method propagates external signal to multi-turn execution
- ✅ stream() method propagates external signal to streaming with interruption

### Integration Requirements

- ✅ External signal cancellation triggers proper CancellationError creation
- ✅ Cancellation propagates through AgentLoop and tool execution
- ✅ Cleanup handlers are executed when external cancellation occurs
- ✅ Backward compatibility maintained for requests without signals

### Error Handling Requirements

- ✅ AbortSignal.aborted triggers CancellationError with appropriate context
- ✅ Cancellation reason preservation from external sources
- ✅ Proper error propagation to calling application
- ✅ Resource cleanup completion before error throwing

### Testing Requirements

- ✅ Unit tests for createTimeoutSignal with external signal combination
- ✅ Pre-cancelled signal handling tests
- ✅ Integration tests for chat() method with external cancellation
- ✅ Integration tests for stream() method with external cancellation
- ✅ Backward compatibility tests without external signals
- ✅ Error handling and cleanup validation tests

## Dependencies

- Requires CancellationManager implementation (T-implement-cancellationmanager)
- Integrates with existing multi-turn execution infrastructure

## Out of Scope

- AgentLoop cancellation integration (separate task)
- Stream interruption handling (separate task)
- Tool execution cancellation (separate task)
