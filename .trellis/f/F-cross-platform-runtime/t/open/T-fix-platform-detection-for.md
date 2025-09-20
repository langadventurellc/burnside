---
id: T-fix-platform-detection-for
title: Fix platform detection for Electron renderer
status: open
priority: high
parent: F-cross-platform-runtime
prerequisites: []
affectedFiles: {}
log: []
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
