---
id: T-implement-exponential-backoff
title: Implement Exponential Backoff Strategy with Jitter and Unit Tests
status: open
priority: high
parent: F-rate-limiting-retries-and
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:01:18.091Z
updated: 2025-09-19T03:01:18.091Z
---

# Implement Exponential Backoff Strategy with Jitter and Unit Tests

## Context

This task implements the exponential backoff algorithm with jitter to prevent thundering herd problems during retry scenarios. It provides the core timing logic for the retry system with configurable parameters and robust edge case handling.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Architecture Reference**: `docs/library-architecture.md` retry policy requirements
- **Integration Target**: Will be used by retry transport wrapper (next task)

## Implementation Requirements

Create `src/core/transport/retry/backoffStrategy.ts` with the following specifications:

### Core Backoff Strategy Interface

```typescript
export interface BackoffConfig {
  strategy: "exponential" | "linear";
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
  multiplier?: number; // Default: 2 for exponential
}

export interface BackoffCalculator {
  // Calculate delay for given attempt number (0-based)
  calculateDelay(attempt: number): number;

  // Reset internal state if needed
  reset(): void;
}

export class ExponentialBackoffStrategy implements BackoffCalculator {
  constructor(config: BackoffConfig);
  calculateDelay(attempt: number): number;
  reset(): void;
}

export class LinearBackoffStrategy implements BackoffCalculator {
  constructor(config: BackoffConfig);
  calculateDelay(attempt: number): number;
  reset(): void;
}
```

### Exponential Backoff Implementation

- **Formula**: `baseDelay * (multiplier ^ attempt)`
- **Jitter**: `delay * (0.5 + Math.random() * 0.5)` when enabled
- **Capping**: Never exceed `maxDelayMs`
- **Attempt Numbering**: 0-based (first retry is attempt 0)

### Linear Backoff Implementation

- **Formula**: `baseDelay * (attempt + 1)`
- **Jitter**: Same jitter formula as exponential
- **Capping**: Never exceed `maxDelayMs`

### Utility Functions

```typescript
// Factory function for creating strategies
export function createBackoffStrategy(config: BackoffConfig): BackoffCalculator;

// Helper for common delay patterns
export function delayPromise(ms: number, signal?: AbortSignal): Promise<void>;
```

## Acceptance Criteria

### Functional Requirements

- ✅ Exponential backoff follows 2^attempt growth (configurable multiplier)
- ✅ Linear backoff increases linearly with attempt number
- ✅ Jitter applies 50-150% randomization when enabled
- ✅ Maximum delay cap enforced for all strategies
- ✅ AbortSignal cancellation works during delays
- ✅ Negative or zero delays handled gracefully

### Unit Tests Required

Create comprehensive tests in `src/core/transport/retry/__tests__/backoffStrategy.test.ts`:

1. **Exponential Backoff**
   - Base delay calculation (attempt 0 = baseDelay)
   - Exponential growth validation (attempt 1 = baseDelay \* 2)
   - Multiplier configuration works
   - Maximum delay capping

2. **Linear Backoff**
   - Linear growth validation (attempt N = baseDelay \* (N+1))
   - Maximum delay capping
   - Base delay accuracy

3. **Jitter Implementation**
   - Jitter disabled returns exact calculated delay
   - Jitter enabled returns value in 50-150% range
   - Multiple calls with jitter produce different values
   - Jitter still respects maximum delay cap

4. **Edge Cases**
   - Very high attempt numbers (overflow protection)
   - Zero base delay handling
   - Maximum delay smaller than base delay
   - Invalid configuration parameters

5. **AbortSignal Integration**
   - Delay promise resolves normally without signal
   - Delay promise rejects when signal is aborted
   - Cancellation works mid-delay

### Test Data Examples

```typescript
// Exponential scenarios
const expConfigs = [
  {
    strategy: "exponential",
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitter: false,
  },
  {
    strategy: "exponential",
    baseDelayMs: 500,
    maxDelayMs: 10000,
    jitter: true,
    multiplier: 3,
  },
];

// Linear scenarios
const linearConfigs = [
  { strategy: "linear", baseDelayMs: 2000, maxDelayMs: 20000, jitter: false },
  { strategy: "linear", baseDelayMs: 1000, maxDelayMs: 15000, jitter: true },
];

// Expected delays for exponential (base=1000, multiplier=2, no jitter)
// Attempt 0: 1000ms, Attempt 1: 2000ms, Attempt 2: 4000ms, Attempt 3: 8000ms
```

## Security Considerations

- **Resource Protection**: Maximum delay prevents excessive wait times
- **DoS Prevention**: Jitter prevents synchronized retry storms
- **Input Validation**: Validate configuration to prevent malicious delays

## Dependencies

- **Node.js**: Built-in `setTimeout`, `Math.random()`
- **AbortSignal**: For cancellation support
- **Jest**: Testing framework (existing)

## Out of Scope

- Retry policy management (separate task)
- HTTP transport integration (separate task)
- Retry-After header parsing (separate task)
- Retry attempt counting/limits (separate task)

## Files to Create/Modify

- **Create**: `src/core/transport/retry/backoffStrategy.ts`
- **Create**: `src/core/transport/retry/__tests__/backoffStrategy.test.ts`
- **Create**: `src/core/transport/retry/index.ts` (export)

Estimated effort: 1.5 hours
