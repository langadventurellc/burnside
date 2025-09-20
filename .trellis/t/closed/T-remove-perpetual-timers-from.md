---
id: T-remove-perpetual-timers-from
title: Remove perpetual timers from TokenBucket and implement on-demand token
  calculation
status: done
priority: high
parent: none
prerequisites: []
affectedFiles:
  src/core/transport/rateLimiting/tokenBucket.ts: Removed timer infrastructure
    (refillTimer property, scheduleNextRefill method) and implemented on-demand
    token calculation via refillToCurrentTime() method. Updated consume() and
    getAvailableTokens() to trigger refill calculation before token operations.
  src/core/transport/rateLimiting/__tests__/tokenBucket.test.ts:
    Replaced real timer delays with mocked performance.now() for deterministic
    testing. Removed waitMs helper and updated all timing-based tests to use
    Jest mocks for time advancement, eliminating open handles and improving test
    performance.
log:
  - Successfully removed perpetual timers from TokenBucket implementation and
    replaced with on-demand token calculation. The refactoring eliminates memory
    leaks, fixes Jest open handles issue, and significantly improves test
    performance (1.2s vs 2.4s). Token refill is now calculated when needed using
    elapsed time since last operation, maintaining identical functionality while
    removing all background timer overhead. All 28 unit tests pass with
    deterministic mocked timing.
schema: v1.0
childrenIds: []
created: 2025-09-19T23:53:52.177Z
updated: 2025-09-19T23:53:52.177Z
---

# Remove Perpetual Timers from TokenBucket

## Context

The current TokenBucket implementation uses a perpetual `setTimeout` loop (every 100ms) to continuously refill tokens, causing memory leaks and preventing Jest from exiting cleanly. This is unnecessary since token refill can be calculated on-demand when tokens are consumed.

## Problem

- `scheduleNextRefill()` creates infinite recursive setTimeout calls
- Timers continue running even when bucket is unused
- Jest detects open handles preventing test completion
- CPU cycles wasted on unnecessary timer operations
- Memory leaks when buckets aren't properly destroyed

## Solution

Replace timer-based refill with on-demand calculation using elapsed time since last operation.

## Implementation Requirements

### Core Changes to TokenBucket class (`src/core/transport/rateLimiting/tokenBucket.ts`):

1. **Remove timer-related code**:
   - Remove `refillTimer` property
   - Remove `scheduleNextRefill()` method
   - Remove timer logic from constructor
   - Update `destroy()` to only clear timer if exists

2. **Implement on-demand refill**:

   ```typescript
   private refillToCurrentTime(): void {
     const now = performance.now();
     const elapsedMs = now - this.lastRefillTime;

     if (elapsedMs > 0 && this.config.refillRate > 0) {
       const tokensToAdd = Math.floor((this.config.refillRate * elapsedMs) / 1000);

       if (tokensToAdd > 0) {
         this.currentTokens = Math.min(
           this.config.maxTokens,
           this.currentTokens + tokensToAdd
         );
         this.lastRefillTime = now;
       }
     }
   }
   ```

3. **Update consume() method**:
   - Call `refillToCurrentTime()` at the beginning of `consume()`
   - Keep existing validation logic unchanged

4. **Update getAvailableTokens() method**:
   - Call `refillToCurrentTime()` before returning token count
   - Ensures accurate token count without timer dependency

### Testing Requirements

Update existing unit tests in `src/core/transport/rateLimiting/__tests__/tokenBucket.test.ts`:

1. **Remove timer-dependent tests**:
   - Remove tests that rely on `waitMs()` helper
   - Remove tests that verify timer behavior

2. **Add tests for on-demand calculation**:
   - Test that `consume()` triggers refill calculation
   - Test that `getAvailableTokens()` returns accurate count after time passes
   - Test edge cases with zero refill rate
   - Test that multiple rapid consume calls work correctly

3. **Mock performance.now() for deterministic testing**:

   ```typescript
   beforeEach(() => {
     jest.spyOn(performance, "now").mockReturnValue(1000);
   });

   afterEach(() => {
     jest.restoreAllMocks();
   });
   ```

4. **Test time-based refill logic**:
   - Simulate time passage by updating performance.now() mock
   - Verify correct token calculations for various time intervals
   - Test fractional token calculations are handled correctly

## Acceptance Criteria

- [ ] TokenBucket no longer creates any timers
- [ ] All existing functionality preserved (consume, getAvailableTokens, reset)
- [ ] Token refill calculation works accurately based on elapsed time
- [ ] Zero refill rate configurations work correctly (no refill)
- [ ] All unit tests pass with new implementation
- [ ] No more open handles detected in Jest test runs
- [ ] Performance equivalent or better than timer-based approach
- [ ] Memory usage reduced (no persistent timers)

## Dependencies

None - this is a standalone refactoring of TokenBucket internals.

## Out of Scope

- Changes to RateLimiter (handled in separate task)
- Changes to EnhancedHttpTransport (handled in separate task)
- Performance testing or benchmarking
- Integration tests
