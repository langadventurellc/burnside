---
id: T-update-adapter-registry-for
title: Update adapter registry for new platforms
status: done
priority: medium
parent: F-cross-platform-runtime
prerequisites:
  - T-implement-electron-renderer
  - T-implement-react-native
affectedFiles:
  src/core/runtime/adapterRegistry.ts:
    Updated initializeDefaultAdapters() method
    to register ElectronRuntimeAdapter for electron-renderer platform and
    ReactNativeRuntimeAdapter for react-native platform. Modified
    getFallbackAdapter() to remove electron→node fallback and added proper
    fallback handling for new platforms. Added imports for new adapter classes.
  src/core/runtime/__tests__/adapterRegistry.test.ts: Added comprehensive test
    suite for new adapter registration including tests for
    ElectronRuntimeAdapter and ReactNativeRuntimeAdapter auto-registration,
    updated fallback logic tests to reflect removal of electron→node fallback,
    added mock implementations for new adapters, and verified proper adapter
    selection for each platform.
log:
  - Updated AdapterRegistry to support new platform adapters including
    ElectronRuntimeAdapter for electron-renderer and ReactNativeRuntimeAdapter
    for react-native platforms. Removed electron→node fallback strategy and
    implemented proper auto-selection logic for each platform. Added
    comprehensive test coverage for all new functionality.
schema: v1.0
childrenIds: []
created: 2025-09-20T04:33:19.790Z
updated: 2025-09-20T04:33:19.790Z
---

# Update Adapter Registry for New Platforms

## Context

Update the `AdapterRegistry` class in `src/core/runtime/adapterRegistry.ts` to register and auto-select the new Electron renderer and React Native adapters. The registry currently only handles Node adapter initialization.

## Implementation Requirements

### Update Registry Initialization

- Modify `initializeDefaultAdapters()` method to register new adapters
- Add registration for `ElectronRuntimeAdapter` when platform is "electron-renderer"
- Add registration for `ReactNativeRuntimeAdapter` when platform is "react-native"
- Maintain backward compatibility with existing Node adapter

### Update Fallback Logic

- Modify `getFallbackAdapter()` method for new platform combinations
- Remove Electron → Node fallback (since renderer should use electron-specific adapter)
- Update React Native fallback strategy if needed

### Technical Approach

#### Registration Logic

```typescript
private initializeDefaultAdapters(): void {
  try {
    const currentPlatform = detectPlatform();

    switch (currentPlatform) {
      case "node":
        this.registerAdapter("node", new NodeRuntimeAdapter());
        break;
      case "electron": // main process
        this.registerAdapter("electron", new NodeRuntimeAdapter()); // electron main uses node
        break;
      case "electron-renderer":
        this.registerAdapter("electron-renderer", new ElectronRuntimeAdapter());
        break;
      case "react-native":
        this.registerAdapter("react-native", new ReactNativeRuntimeAdapter());
        break;
    }
  } catch {
    // Silently fail to allow manual registration
  }
}
```

#### Fallback Strategy Updates

- Remove electron → node fallback since we now have specific adapters
- Keep fallbacks simple and explicit

### Files to Modify

- `src/core/runtime/adapterRegistry.ts` - Update initialization and fallback logic
- `src/core/runtime/adapters/index.ts` - Ensure all adapters are exported

### Import Updates

```typescript
import { NodeRuntimeAdapter } from "./adapters/nodeRuntimeAdapter";
import { ElectronRuntimeAdapter } from "./adapters/electronRuntimeAdapter";
import { ReactNativeRuntimeAdapter } from "./adapters/reactNativeRuntimeAdapter";
```

## Acceptance Criteria

- **Auto-Selection**: Correct adapter automatically selected for each platform
- **Node Platform**: NodeRuntimeAdapter used for pure Node environments
- **Electron Main**: NodeRuntimeAdapter used for Electron main process
- **Electron Renderer**: ElectronRuntimeAdapter used for Electron renderer
- **React Native**: ReactNativeRuntimeAdapter used for React Native
- **Fallback Behavior**: Reasonable fallback strategy when preferred adapter unavailable
- **Manual Override**: `setDefaultAdapter()` still works for manual adapter selection
- **Backward Compatibility**: Existing code continues to work without changes

## Testing Requirements

- **Unit Tests**: Verify adapter registration for each platform
- **Auto-Selection Tests**: Mock platform detection and verify correct adapter returned
- **Fallback Tests**: Verify fallback behavior when adapters are missing
- **Manual Override Tests**: Verify manual adapter selection still works
- **Integration Tests**: Test full adapter lifecycle from detection to usage

## Error Handling

- Maintain existing error patterns when no adapter is available
- Provide clear error messages indicating missing platform adapters
- Include available platforms in error context for debugging

## Out of Scope

- Changes to individual adapter implementations (covered by other tasks)
- Platform detection logic (handled by separate tasks)
