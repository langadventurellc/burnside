---
id: T-fix-detectplatform-test
title: Fix detectPlatform test process mocking to prevent TTYWRAP handles
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/runtime/__tests__/detectPlatform.test.ts: Updated isElectron test to
    use mockGlobalThis helper instead of direct globalThis.process manipulation,
    preventing TTYWRAP handles and ensuring consistent test cleanup pattern
log:
  - Fixed process mocking in detectPlatform test to prevent TTYWRAP handles.
    Updated the isElectron test to use the existing mockGlobalThis helper
    consistently with other tests in the file. This eliminates manual process
    object manipulation that was creating open handles preventing Jest from
    exiting cleanly. All 19 tests pass and quality checks are clean.
schema: v1.0
childrenIds: []
created: 2025-09-19T23:54:54.868Z
updated: 2025-09-19T23:54:54.868Z
---

# Fix Process Mocking in detectPlatform Tests

## Context

The `detectPlatform.test.ts` file has a test that directly modifies `globalThis.process` instead of using the existing `mockGlobalThis` helper function. This inconsistent approach creates TTYWRAP handles that prevent Jest from exiting cleanly.

## Problem

- One test directly modifies `globalThis.process` instead of using the `mockGlobalThis` helper
- This creates TTYWRAP handles that Jest detects as open handles
- Inconsistent mocking pattern compared to other tests in the same file
- Test cleanup is manual rather than using the established helper pattern

## Solution

Update the problematic test to use the existing `mockGlobalThis` helper consistently with other tests.

## Implementation Requirements

### Fix Test in `src/core/runtime/__tests__/detectPlatform.test.ts`

The test "should return true when Electron process.versions.electron is available" needs to be updated:

**Current problematic code:**

```typescript
it("should return true when Electron process.versions.electron is available", () => {
  const originalProcess = globalThis.process;
  (globalThis as unknown as { process: unknown }).process = {
    ...originalProcess,
    versions: {
      ...originalProcess.versions,
      electron: "13.0.0",
    },
  };

  expect(isElectron()).toBe(true);

  (globalThis as unknown as { process: unknown }).process = originalProcess;
});
```

**Should be updated to:**

```typescript
it("should return true when Electron process.versions.electron is available", () => {
  const cleanup = mockGlobalThis({
    process: {
      ...globalThis.process,
      versions: {
        ...globalThis.process.versions,
        electron: "13.0.0",
      },
    },
  });

  expect(isElectron()).toBe(true);
  cleanup();
});
```

### Verification

1. **Ensure consistent pattern**:
   - All tests in the file should use `mockGlobalThis` helper
   - No direct `globalThis` manipulation should remain
   - Cleanup should be handled by the helper function

2. **Test the fix**:
   - Run the specific test file to ensure it passes
   - Verify no TTYWRAP handles are created
   - Confirm Jest exits cleanly after test completion

## Acceptance Criteria

- [ ] Test uses `mockGlobalThis` helper consistently with other tests
- [ ] No direct manipulation of `globalThis.process` remains
- [ ] Test passes with the new implementation
- [ ] No TTYWRAP handles detected during test execution
- [ ] Jest exits cleanly after running detectPlatform tests
- [ ] All other tests in the file continue to work correctly

## Testing Requirements

1. **Run the specific test file**:

   ```bash
   npm test -- src/core/runtime/__tests__/detectPlatform.test.ts
   ```

2. **Verify no open handles**:
   - Ensure Jest completes without open handle warnings
   - Test should not contribute to Jest hanging

3. **Verify test functionality**:
   - Test should still properly validate Electron detection
   - Mock should properly simulate process.versions.electron

## Dependencies

None - this is an independent test fix.

## Out of Scope

- Changes to other test files
- Changes to the mockGlobalThis helper function
- Changes to the actual platform detection logic
- Performance testing
- Integration tests
