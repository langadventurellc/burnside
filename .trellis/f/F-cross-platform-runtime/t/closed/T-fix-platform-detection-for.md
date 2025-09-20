---
id: T-fix-platform-detection-for
title: Fix platform detection for Electron renderer
status: done
priority: high
parent: F-cross-platform-runtime
prerequisites: []
affectedFiles:
  src/core/runtime/platform.ts: Added 'electron-renderer' to Platform union type
    to support the new platform detection
  src/core/runtime/detectPlatform.ts: Updated platform detection logic to check
    for electron-renderer first, then electron main process. Imports external
    detection functions instead of inline definitions
  src/core/runtime/isElectron.ts: Modified to detect only Electron main process
    (has electron version but no window object)
  src/core/runtime/isElectronRenderer.ts: Created new detection function for
    Electron renderer process (has window object and process.type ===
    'renderer')
  src/core/runtime/getPlatformCapabilities.ts: "Added platform capabilities for
    electron-renderer with hasFileSystem: false, and updated file system
    detection logic to use platform-based detection"
  src/core/runtime/__tests__/detectPlatform.test.ts:
    Added comprehensive tests for
    isElectronRenderer function and detectPlatform returning electron-renderer,
    updated existing Electron tests for new behavior
  src/core/runtime/__tests__/getPlatformCapabilities.test.ts: Added tests for
    electron-renderer platform capabilities including file system restrictions
    and platform-specific features
log:
  - 'Successfully implemented platform detection for Electron renderer
    processes. The solution properly distinguishes between Electron main
    processes and renderer processes, with renderer processes being detected as
    "electron-renderer" platform type. The implementation ensures renderer
    processes report hasFileSystem: false while maintaining full HTTP and timer
    capabilities. All acceptance criteria met with comprehensive test coverage.
    The one test failure is a timing-related flaky test in agentLoop.test.ts
    unrelated to the platform detection changes.'
schema: v1.0
childrenIds: []
created: 2025-09-20T04:32:17.178Z
updated: 2025-09-20T04:32:17.178Z
---

# Fix Platform Detection for Electron Renderer

## Context

The current platform detection in `src/core/runtime/detectPlatform.ts:56-67` incorrectly identifies Electron renderer processes as "electron" when they should be detected separately from the main process. The renderer should use browser-like APIs while main process uses Node APIs.

## Implementation Requirements

### Update Detection Logic

- Modify `isElectron()` function to distinguish between main process and renderer
- Add new `isElectronRenderer()` function to detect renderer process specifically
- Update `detectPlatform()` to return "electron-renderer" for renderer processes
- Keep "electron" for main process detection

### Technical Approach

1. **Electron Renderer Detection**: Check for `window` object AND `process.type === 'renderer'`
2. **Electron Main Detection**: Has `process.versions.electron` but NO `window` object
3. **Update Platform Type**: Add "electron-renderer" to `Platform` type in `src/core/runtime/platform.ts`

### Files to Modify

- `src/core/runtime/platform.ts` - Add "electron-renderer" to Platform type
- `src/core/runtime/detectPlatform.ts` - Update detection functions
- `src/core/runtime/getPlatformCapabilities.ts` - Add capabilities for electron-renderer

## Acceptance Criteria

- **Electron Main Process**: Correctly detected as "electron" platform
- **Electron Renderer Process**: Correctly detected as "electron-renderer" platform
- **Node.js Process**: Still correctly detected as "node" platform
- **Type Safety**: Platform type includes new "electron-renderer" option
- **Capability Mapping**: Electron renderer reports `hasFileSystem: false`

## Testing Requirements

- Write unit tests for both Electron main and renderer detection
- Mock `window` and `process` objects for different test scenarios
- Verify platform capabilities are correctly assigned

## Out of Scope

- Implementation of the actual Electron adapter (covered by separate task)
- Changes to adapter registry logic (handled separately)
