---
id: F-cross-platform-runtime
title: Cross-Platform Runtime Adapters
status: in-progress
priority: medium
parent: none
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
    updated existing Electron tests for new behavior; Added comprehensive test
    suite for enhanced React Native detection with 17 new test cases covering
    primary/secondary/fallback detection strategies, priority handling, false
    positive prevention, and edge cases. Organized tests into logical describe
    blocks for better maintainability.
  src/core/runtime/__tests__/getPlatformCapabilities.test.ts: Added tests for
    electron-renderer platform capabilities including file system restrictions
    and platform-specific features
  src/core/runtime/isReactNative.ts: "Enhanced React Native detection with
    multiple strategies: primary detection via __fbBatchedBridge, secondary
    detection via __DEV__ and HermesInternal globals, and fallback to
    navigator.userAgent. Added comprehensive JSDoc documentation and proper
    TypeScript typing."
log: []
schema: v1.0
childrenIds:
  - T-add-package-dependencies-for
  - T-implement-electron-renderer
  - T-implement-react-native
  - T-improve-react-native-platform
  - T-update-adapter-registry-for
  - T-fix-platform-detection-for
created: 2025-09-20T04:17:17.477Z
updated: 2025-09-20T04:17:17.477Z
---

# Cross-Platform Runtime Adapters

## Purpose

Implement runtime adapters for React Native and Electron renderer environments to enable the LLM Bridge library to work seamlessly across all target platforms with HTTP and timer functionality. File operations are explicitly out of scope for non-Node platforms.

## Scope

This feature implements Phase 11 of the implementation plan, creating platform-specific adapters that abstract away environment differences for HTTP and timer operations only.

## Key Components to Implement

### 1. Electron Renderer Runtime Adapter

- Implement `ElectronRuntimeAdapter` class following the `RuntimeAdapter` interface
- HTTP operations using standard browser `fetch` API (available in Electron renderer)
- Timer operations using browser-native timers with proper handle types
- File operations throw `RuntimeError` with clear "unsupported platform" message
- Platform detection reports `hasFileSystem: false`

### 2. React Native Runtime Adapter

- Implement `ReactNativeRuntimeAdapter` class following the `RuntimeAdapter` interface
- HTTP operations using React Native's fetch implementation
- Streaming support via `react-native-sse` library for SSE parsing
- Timer operations using React Native timer APIs with proper handle management
- File operations throw `RuntimeError` with clear "unsupported platform" message
- Platform detection reports `hasFileSystem: false`

### 3. Enhanced Platform Detection

- Fix platform detection to distinguish Electron renderer from main process
- Add React Native environment detection (check for `__DEV__` and React Native globals)
- Update `getPlatformCapabilities` for new platforms

### 4. Adapter Registry Integration

- Register new adapters in the adapter registry
- Implement auto-selection logic for platform-appropriate adapters
- Ensure backward compatibility with existing Node.js adapter

## Detailed Acceptance Criteria

### HTTP Operations

- **All Platforms**: Successfully make HTTP requests to LLM provider APIs
- **React Native**: Streaming responses work using `react-native-sse` or equivalent
- **Electron Renderer**: Standard fetch API works for all HTTP operations
- **Error Handling**: Network errors normalized to consistent `RuntimeError` types

### Timer Operations

- **All Platforms**: setTimeout/setInterval/clear functions work with proper handle cleanup
- **Type Safety**: Timer handles properly typed for each platform's implementation
- **Memory Management**: No timer handle leaks on any platform

### Platform Detection

- **Electron Renderer**: Correctly identified (not confused with Node main process)
- **React Native**: Properly detected using RN-specific globals
- **Capability Reporting**: `hasFileSystem: false` for non-Node platforms

### File Operations (Non-Node Platforms)

- **React Native/Electron**: All file methods throw `RuntimeError` with message "File operations not supported on this platform"
- **No Implementation Required**: No actual file operation logic needed for these platforms

## Implementation Guidance

### Technical Approach

1. **Follow Existing Patterns**: Use `NodeRuntimeAdapter` structure and error handling
2. **Platform APIs**:
   - Electron: `globalThis.fetch`, standard browser timers
   - React Native: React Native fetch, `react-native-sse` for streaming
3. **File Operations**: Simple throw statements, no complex gating logic needed
4. **Streaming**: Document any React Native streaming limitations vs Node capabilities

### Dependencies

- `react-native-sse` package for React Native streaming support
- Platform detection utilities updates
- No dependencies on other features

### File Structure

```
src/core/runtime/adapters/
├── electronRuntimeAdapter.ts    # Electron renderer adapter
├── reactNativeRuntimeAdapter.ts # React Native adapter
└── index.ts                     # Export all adapters
```

## Testing Requirements

- **Unit Tests**: HTTP and timer functionality for each adapter
- **Error Tests**: Verify file operation errors on non-Node platforms
- **Platform Mocking**: Mock platform-specific APIs for testing
- **Integration**: Verify correct adapter auto-selection

## Success Metrics

- HTTP requests work on all platforms
- Timer operations work reliably with proper cleanup
- File operations properly rejected on non-Node platforms
- Existing E2E tests pass when adapters are available
