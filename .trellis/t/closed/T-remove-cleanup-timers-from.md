---
id: T-remove-cleanup-timers-from
title: Remove cleanup timers from RateLimiter and implement efficient memory
  management
status: done
priority: high
parent: none
prerequisites:
  - T-remove-perpetual-timers-from
affectedFiles:
  src/core/transport/rateLimiting/rateLimiter.ts: Removed timer infrastructure
    (cleanupTimer property, scheduleCleanup/cleanupBucket timer logic) and
    implemented periodic cleanup triggered every 100 method calls. Added
    performPeriodicCleanup() for age-based bucket cleanup and simplified
    destroy() method to only destroy buckets.
  src/core/transport/rateLimiting/__tests__/rateLimiter.test.ts:
    Updated tests to reflect timer removal. Replaced timer-dependent test with
    periodic cleanup test using mocked performance.now(). Added tests for
    cleanup frequency behavior and getStatus cleanup triggering. Removed timer
    interference comment from afterEach cleanup.
log:
  - >-
    Successfully removed cleanup timers from RateLimiter and implemented
    efficient memory management using on-demand periodic cleanup. The
    implementation eliminates hundreds of persistent timers while maintaining
    memory efficiency through enhanced cleanup mechanisms.


    Key improvements:

    - Removed timer-based cleanup infrastructure (cleanupTimer property,
    scheduleCleanup method)

    - Implemented periodic cleanup triggered every 100 checkLimit/getStatus
    calls

    - Added performPeriodicCleanup method for age-based bucket cleanup (5-minute
    threshold)

    - Simplified BucketEntry interface by removing cleanupTimer property

    - Updated destroy method to only destroy buckets without timer cleanup

    - Maintained all existing functionality including LRU eviction and memory
    bounds


    The solution resolves Jest open handles issue, prevents memory leaks, and
    reduces CPU overhead from timer management while preserving identical rate
    limiting behavior. All 39 existing unit tests pass plus 3 new tests for
    periodic cleanup functionality.
schema: v1.0
childrenIds: []
created: 2025-09-19T23:54:15.414Z
updated: 2025-09-19T23:54:15.414Z
---

# Remove Cleanup Timers from RateLimiter

## Context

The current RateLimiter implementation creates a 5-minute cleanup timer for every bucket created, leading to hundreds of persistent timers when many API keys/models are used. This causes memory leaks and prevents Jest from exiting cleanly.

## Problem

- `scheduleCleanup()` creates persistent timers for each scope key
- Each API key/model combination creates its own timer
- Timers persist even when buckets become unused
- Jest detects these as open handles preventing test completion
- Unnecessary CPU usage for timer management

## Solution

Replace timer-based cleanup with on-demand cleanup using bucket access patterns and LRU eviction.

## Implementation Requirements

### Core Changes to RateLimiter class (`src/core/transport/rateLimiting/rateLimiter.ts`):

1. **Remove timer-related code**:
   - Remove `cleanupTimer` from `BucketEntry` interface
   - Remove `scheduleCleanup()` method
   - Remove `updateBucketUsage()` timer reset logic
   - Update `destroy()` to only destroy buckets (no timer cleanup)

2. **Implement periodic cleanup in existing methods**:

   ```typescript
   private cleanupStaleEntries(): void {
     const now = performance.now();
     const staleCutoff = now - this.CLEANUP_DELAY_MS;

     for (const [key, entry] of this.buckets) {
       if (entry.lastUsed < staleCutoff) {
         entry.bucket.destroy();
         this.buckets.delete(key);
       }
     }
   }
   ```

3. **Update bucket access methods**:
   - Call `cleanupStaleEntries()` periodically in `checkLimit()` (e.g., every 100th call)
   - Update `lastUsed` timestamp in `updateBucketUsage()` without timer logic
   - Keep existing LRU eviction logic in `evictLeastRecentlyUsedBucket()`

4. **Simplify BucketEntry interface**:
   ```typescript
   interface BucketEntry {
     bucket: TokenBucket;
     lastUsed: number;
     // Remove cleanupTimer property
   }
   ```

### Testing Requirements

Update existing unit tests in `src/core/transport/rateLimiting/__tests__/rateLimiter.test.ts`:

1. **Remove timer-dependent tests**:
   - Remove tests that verify cleanup timer behavior
   - Remove tests that check timer scheduling

2. **Add tests for on-demand cleanup**:
   - Test that stale buckets are cleaned up during regular operations
   - Test that cleanup frequency is reasonable (not every call)
   - Test that cleanup preserves recently used buckets
   - Test that `destroy()` method works without timers

3. **Update bucket lifecycle tests**:
   - Test that buckets are created and accessed correctly
   - Test that `lastUsed` timestamps are updated appropriately
   - Test LRU eviction logic still works correctly

### Enhanced Memory Management

1. **Add cleanup call frequency control**:

   ```typescript
   private cleanupCallCount = 0;
   private readonly CLEANUP_FREQUENCY = 100; // Every 100 checkLimit calls
   ```

2. **Integrate cleanup into checkLimit()**:

   ```typescript
   checkLimit(context: RateLimitContext): boolean {
     // Periodic cleanup
     if (++this.cleanupCallCount >= this.CLEANUP_FREQUENCY) {
       this.cleanupStaleEntries();
       this.cleanupCallCount = 0;
     }

     // Existing logic...
   }
   ```

## Acceptance Criteria

- [ ] RateLimiter no longer creates any cleanup timers
- [ ] Stale bucket cleanup still works effectively
- [ ] Memory usage is bounded and controlled
- [ ] All existing rate limiting functionality preserved
- [ ] LRU eviction continues to work when bucket limit reached
- [ ] All unit tests pass with new implementation
- [ ] No more cleanup timer handles detected in Jest
- [ ] Performance equivalent or better (fewer timer operations)
- [ ] Cleanup frequency is configurable and reasonable

## Dependencies

- Must complete TokenBucket timer removal first (T-remove-perpetual-timers-from)

## Out of Scope

- Changes to EnhancedHttpTransport (handled in separate task)
- Performance testing or benchmarking
- Integration tests
- Changes to rate limiting algorithms or logic
