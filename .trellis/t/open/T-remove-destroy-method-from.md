---
id: T-remove-destroy-method-from
title: Remove destroy method from EnhancedHttpTransport and fix test cleanup
status: open
priority: medium
parent: none
prerequisites:
  - T-remove-cleanup-timers-from
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T23:54:36.292Z
updated: 2025-09-19T23:54:36.292Z
---

# Remove Unnecessary Destroy Method from EnhancedHttpTransport

## Context

With the removal of perpetual timers from TokenBucket and RateLimiter, the `destroy()` method added to EnhancedHttpTransport is no longer needed. The transport should not require manual lifecycle management.

## Problem

- EnhancedHttpTransport currently has a `destroy()` method that was added to clean up timers
- Tests have been updated to call this method, creating unnecessary complexity
- With timer-free design, manual cleanup should not be required
- The destroy pattern suggests manual memory management where none should be needed

## Solution

Remove the destroy method and related test cleanup, making the transport truly fire-and-forget.

## Implementation Requirements

### Remove Destroy Method from EnhancedHttpTransport

1. **Remove destroy method** from `src/core/transport/enhancedHttpTransport.ts`:
   - Delete the entire `destroy()` method
   - Remove any destroy-related documentation

2. **Verify no cleanup needed**:
   - Confirm RateLimiter now manages itself without timers
   - Ensure no other persistent resources need cleanup

### Update Tests

1. **Remove test cleanup** in `src/core/transport/__tests__/enhancedHttpTransport.test.ts`:
   - Remove the `afterEach()` hook that calls `enhancedTransport.destroy()`
   - Tests should work without any manual cleanup

2. **Verify test stability**:
   - Ensure all tests pass without destroy calls
   - Confirm no open handles remain after test completion
   - Test that multiple EnhancedHttpTransport instances can be created without issues

### Update Documentation

1. **Remove lifecycle management docs**:
   - Remove any mentions of destroy() method from class documentation
   - Update examples to not show destroy patterns
   - Emphasize that transport is self-managing

## Acceptance Criteria

- [ ] EnhancedHttpTransport no longer has a destroy() method
- [ ] All tests pass without calling destroy()
- [ ] No open handles detected in Jest test runs
- [ ] Transport instances can be created and used without manual lifecycle management
- [ ] Documentation reflects self-managing nature of transport
- [ ] Multiple transport instances work correctly without interference
- [ ] Memory usage remains stable without manual cleanup

## Testing Requirements

1. **Verify timer-free operation**:
   - Run existing test suite to ensure no open handles
   - Test creating multiple transport instances
   - Test rapid creation/use of transport instances

2. **Add test for fire-and-forget usage**:

   ```typescript
   test("should work without manual lifecycle management", async () => {
     // Create multiple instances
     const transport1 = new EnhancedHttpTransport({
       baseTransport: mockTransport,
     });
     const transport2 = new EnhancedHttpTransport({
       baseTransport: mockTransport,
       rateLimitConfig: { enabled: true, maxRps: 10, scope: "global" },
     });

     // Use them without cleanup
     await transport1.fetch(mockRequest);
     await transport2.fetch(mockRequest);

     // No cleanup needed - should not leak resources
   });
   ```

## Dependencies

- Must complete RateLimiter cleanup timer removal (T-remove-cleanup-timers-from)

## Out of Scope

- Changes to base Transport interface
- Changes to other transport implementations
- Performance testing
- Integration tests
