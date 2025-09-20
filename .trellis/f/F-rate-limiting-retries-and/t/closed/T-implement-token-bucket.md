---
id: T-implement-token-bucket
title: Implement Token Bucket Algorithm with Unit Tests
status: done
priority: high
parent: F-rate-limiting-retries-and
prerequisites: []
affectedFiles:
  src/core/transport/rateLimiting/tokenBucket.ts: Created TokenBucket class with
    high-precision timing using recursive setTimeout and performance.now(),
    thread-safe token consumption, configurable burst capacity, and proper
    memory management
  src/core/transport/rateLimiting/tokenBucketConfig.ts:
    Created TokenBucketConfig
    interface defining configuration options for token bucket initialization
    including burst capacity, refill rate, and timing parameters
  src/core/transport/rateLimiting/index.ts: Created barrel export file providing
    clean public API for rate limiting functionality with comprehensive
    documentation and usage examples
  src/core/transport/rateLimiting/__tests__/tokenBucket.test.ts:
    Created comprehensive unit test suite with 28 tests covering constructor
    validation, basic functionality, refill mechanics, burst capacity, edge
    cases, memory management, performance characteristics, and real-world
    scenarios
log:
  - Successfully implemented Token Bucket Algorithm with comprehensive unit
    tests. The implementation provides high-precision rate limiting with burst
    capacity support using recursive setTimeout and performance.now() for
    drift-corrected timing. Key features include thread-safe token consumption,
    configurable burst capacity and refill rates, proper memory management with
    timer cleanup, and extensive validation. All 28 unit tests pass, covering
    functional requirements, edge cases, performance characteristics, and
    real-world scenarios. The implementation enforces RPS limits with ±5%
    accuracy, handles concurrent access safely, and prevents memory leaks
    through proper cleanup.
schema: v1.0
childrenIds: []
created: 2025-09-19T02:59:44.465Z
updated: 2025-09-19T02:59:44.465Z
---

# Implement Token Bucket Algorithm with Unit Tests

## Context

This task implements the core token bucket algorithm for rate limiting in the LLM Bridge Library. The token bucket will enforce requests-per-second (RPS) limits with burst capacity support, following the sliding window approach specified in the feature requirements.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Architecture Reference**: `docs/library-architecture.md` sections on Rate Limiting (lines 317-322)
- **Existing Error Handling**: `src/core/errors/rateLimitError.ts` - reuse this class

## Implementation Requirements

Create `src/core/transport/rateLimiting/tokenBucket.ts` with the following specifications:

### Core Token Bucket Class

```typescript
export interface TokenBucketConfig {
  maxTokens: number; // burst capacity
  refillRate: number; // tokens per second
  refillInterval?: number; // milliseconds between refills (default: 100ms)
}

export class TokenBucket {
  constructor(config: TokenBucketConfig);

  // Attempt to consume tokens, returns true if successful
  consume(tokens: number = 1): boolean;

  // Get current token count (for testing/monitoring)
  getAvailableTokens(): number;

  // Reset bucket to full capacity
  reset(): void;

  // Cleanup timer (important for testing)
  destroy(): void;
}
```

### Implementation Approach

1. **Sliding Window Refill**: Use `setInterval` to add tokens at regular intervals
2. **Burst Handling**: Allow consuming up to `maxTokens` when bucket is full
3. **Thread Safety**: Handle concurrent access properly (tokens can't go negative)
4. **Memory Efficiency**: Clean up intervals when bucket is destroyed

### Technical Implementation Details

- Use `performance.now()` for high-precision timing
- Implement efficient refill logic that adds `(refillRate * interval) / 1000` tokens per interval
- Cap tokens at `maxTokens` (burst capacity)
- Prevent negative token counts in concurrent scenarios
- Auto-cleanup intervals on destruction

## Acceptance Criteria

### Functional Requirements

- ✅ Token bucket correctly enforces RPS limits (refill rate accuracy ±5%)
- ✅ Burst capacity allows consuming up to `maxTokens` immediately
- ✅ Concurrent token consumption works safely (no race conditions)
- ✅ Token count never exceeds `maxTokens` or goes below 0
- ✅ Bucket can be reset to full capacity
- ✅ Cleanup properly destroys timers and prevents memory leaks

### Unit Tests Required

Create comprehensive tests in `src/core/transport/rateLimiting/__tests__/tokenBucket.test.ts`:

1. **Basic Functionality**
   - Token consumption succeeds when tokens available
   - Token consumption fails when insufficient tokens
   - Available token count reports correctly

2. **Refill Mechanics**
   - Tokens refill at correct rate over time
   - Refill stops at maximum capacity
   - High-frequency consumption vs refill rate

3. **Burst Capacity**
   - Can consume full burst immediately when bucket is full
   - Burst exhaustion prevents further consumption until refill
   - Partial burst consumption works correctly

4. **Edge Cases**
   - Concurrent token consumption from multiple calls
   - Zero refill rate (bucket never refills)
   - Consuming more tokens than burst capacity
   - Destruction cleans up timers properly

5. **Performance Characteristics**
   - Token operations complete in <1ms
   - Memory usage remains stable over time
   - No timer leaks after destruction

### Test Data Examples

```typescript
// High RPS scenario
const highRps = new TokenBucket({ maxTokens: 10, refillRate: 5 });

// Low RPS with burst
const lowRps = new TokenBucket({ maxTokens: 100, refillRate: 1 });

// No burst (classic rate limiting)
const noBurst = new TokenBucket({ maxTokens: 1, refillRate: 2 });
```

## Security Considerations

- **Resource Protection**: Prevent excessive token consumption that could bypass limits
- **Memory Safety**: Ensure cleanup prevents memory leaks from abandoned buckets
- **Input Validation**: Validate configuration parameters to prevent invalid states

## Dependencies

- Node.js built-in `setInterval` and `clearInterval`
- `performance.now()` for high-precision timing
- Jest testing framework (existing)

## Out of Scope

- Rate limiter coordination (separate task)
- Integration with HTTP transport (separate task)
- Scope key generation (separate task)
- Configuration schema updates (separate task)

## Files to Create/Modify

- **Create**: `src/core/transport/rateLimiting/tokenBucket.ts`
- **Create**: `src/core/transport/rateLimiting/__tests__/tokenBucket.test.ts`
- **Create**: `src/core/transport/rateLimiting/index.ts` (export)

Estimated effort: 1.5-2 hours
