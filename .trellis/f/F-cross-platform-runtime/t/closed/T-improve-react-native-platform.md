---
id: T-improve-react-native-platform
title: Improve React Native platform detection
status: done
priority: high
parent: F-cross-platform-runtime
prerequisites: []
affectedFiles:
  src/core/runtime/isReactNative.ts: "Enhanced React Native detection with
    multiple strategies: primary detection via __fbBatchedBridge, secondary
    detection via __DEV__ and HermesInternal globals, and fallback to
    navigator.userAgent. Added comprehensive JSDoc documentation and proper
    TypeScript typing."
  src/core/runtime/__tests__/detectPlatform.test.ts: Added comprehensive test
    suite for enhanced React Native detection with 17 new test cases covering
    primary/secondary/fallback detection strategies, priority handling, false
    positive prevention, and edge cases. Organized tests into logical describe
    blocks for better maintainability.
log:
  - >-
    Improved React Native platform detection with multiple detection strategies
    for enhanced reliability across different React Native versions and
    platforms. Replaced unreliable `navigator.userAgent` check with React
    Native-specific globals and maintained backward compatibility through
    fallback detection.


    Implementation Details:

    - **Primary Detection**: Added React Native bridge detection using
    `global.__fbBatchedBridge` (most reliable across all RN versions)

    - **Secondary Detection**: Added development flag detection using
    `global.__DEV__` and Hermes engine detection using `global.HermesInternal`

    - **Fallback Detection**: Maintained original `navigator.userAgent` check
    for backward compatibility

    - **Type Safety**: Used proper TypeScript typing with `Record<string,
    unknown>` to avoid `any` types


    All detection methods are prioritized to ensure the most reliable methods
    are checked first, with comprehensive error handling to prevent false
    positives in other environments. The implementation includes extensive test
    coverage with 17 new test cases covering all detection strategies, edge
    cases, and false positive prevention.
schema: v1.0
childrenIds: []
created: 2025-09-20T04:32:29.477Z
updated: 2025-09-20T04:32:29.477Z
---

# Improve React Native Platform Detection

## Context

The current React Native detection in `src/core/runtime/detectPlatform.ts:72-82` relies on `navigator.userAgent` which may not be reliable across all React Native versions and platforms. Need more robust detection using React Native-specific globals.

## Implementation Requirements

### Enhanced Detection Logic

- Add detection for `__DEV__` global (React Native development flag)
- Check for React Native-specific globals like `global.HermesInternal` or `global.__fbBatchedBridge`
- Fall back to navigator.userAgent check as secondary method
- Update `isReactNative()` function with multiple detection strategies

### Technical Approach

1. **Primary Detection**: Check for React Native-specific globals (`__DEV__`, `global.HermesInternal`, `global.__fbBatchedBridge`)
2. **Secondary Detection**: Existing navigator.userAgent check
3. **Capability Mapping**: Ensure React Native reports correct capabilities

### Files to Modify

- `src/core/runtime/detectPlatform.ts` - Update `isReactNative()` function
- `src/core/runtime/getPlatformCapabilities.ts` - Verify React Native capabilities

## Acceptance Criteria

- **React Native Environment**: Reliably detected across different RN versions and platforms
- **Development Mode**: Correctly detected when `__DEV__` is true
- **Production Mode**: Correctly detected using alternative globals
- **Non-RN Environments**: No false positives in Node/Browser/Electron
- **Capability Reporting**: React Native reports `hasFileSystem: false`, `hasHttp: true`, `hasTimers: true`

## Testing Requirements

- Write unit tests for React Native detection with different global combinations
- Mock React Native-specific globals (`__DEV__`, `HermesInternal`, etc.)
- Test fallback to navigator.userAgent detection
- Verify no false positives in other environments

## Out of Scope

- Implementation of the actual React Native adapter (covered by separate task)
- Changes to adapter registry logic (handled separately)
