---
id: T-update-bridgeclient-to-use
title: Update BridgeClient to use RuntimeAdapter throughout
status: done
priority: high
parent: F-complete-runtime-adapter
prerequisites:
  - T-update-httptransport-to-use
affectedFiles:
  src/client/bridgeClient.ts: "Complete RuntimeAdapter integration: Updated
    imports to add RuntimeAdapter and AdapterRegistry while removing unused
    HttpClientConfig and FetchFunction imports. Added optional runtimeAdapter
    parameter to constructor dependencies interface. Added private readonly
    runtimeAdapter property. Implemented adapter resolution logic with
    comprehensive error handling including platform detection for debugging
    context. Updated transport creation to pass RuntimeAdapter directly instead
    of creating HttpClientConfig with globalThis.fetch. Replaced setTimeout and
    clearTimeout calls in createTimeoutSignal method with RuntimeAdapter timer
    methods for true platform abstraction."
log:
  - Successfully completed RuntimeAdapter integration in BridgeClient by
    eliminating all direct platform API usage (globalThis.fetch, setTimeout,
    clearTimeout) and replacing HttpClientConfig-based transport creation with
    direct RuntimeAdapter passing. BridgeClient now resolves RuntimeAdapter
    automatically via AdapterRegistry when not provided through dependency
    injection, with comprehensive error handling that provides clear platform
    context when adapter resolution fails. Transport creation has been
    simplified to pass RuntimeAdapter directly to HttpTransport, and all timer
    operations use platform-appropriate implementations through the adapter. All
    quality checks pass and tests confirm functionality is preserved.
schema: v1.0
childrenIds: []
created: 2025-09-20T06:09:16.138Z
updated: 2025-09-20T06:09:16.138Z
---

# Update BridgeClient to use RuntimeAdapter throughout

## Context

Feature: Complete Runtime Adapter Integration (F-complete-runtime-adapter)
Prerequisites: T-update-httptransport-to-use (HttpTransport updated to use RuntimeAdapter)

Complete the integration of RuntimeAdapter in BridgeClient by updating the constructor to resolve runtime adapters via AdapterRegistry, pass adapters to transport, and use adapters for timer operations. This removes the remaining direct usage of globalThis.fetch and setTimeout.

## Reference Implementation

- Current BridgeClient: `src/client/bridgeClient.ts` (already partially updated)
- AdapterRegistry: `src/core/runtime/adapterRegistry.ts`
- RuntimeAdapter interface: `src/core/runtime/runtimeAdapter.ts`
- HttpTransport updated constructor from previous task

## Current State Analysis

BridgeClient already has some runtime adapter integration:

- Line 24-25: Imports RuntimeAdapter and AdapterRegistry
- Line 82-87: Updated dependencies type to include runtimeAdapter
- Line 95: Has runtimeAdapter property
- Line 123-124: Resolves adapter via AdapterRegistry
- Line 139-141: Uses adapter for fetch in HttpClientConfig
- Line 282-284: Uses adapter for setTimeout in createTimeoutSignal
- Line 300: Uses adapter for clearTimeout

## Implementation Requirements

### Complete HttpTransport Integration

Update the transport creation to pass RuntimeAdapter directly instead of creating HttpClientConfig:

```typescript
// Replace lines 139-144 in BridgeClient constructor:
const fetchFn: FetchFunction = this.runtimeAdapter.fetch.bind(
  this.runtimeAdapter,
);
const httpClientConfig: HttpClientConfig = {
  fetch: fetchFn,
};

// With direct adapter passing:
const baseTransport = new HttpTransport(
  this.runtimeAdapter, // Pass adapter directly
  interceptors,
  errorNormalizer,
);
```

### Remove Unused Imports

Clean up imports that are no longer needed:

```typescript
// Remove FetchFunction import from transport imports
import {
  HttpTransport,
  EnhancedHttpTransport,
  InterceptorChain,
  type Transport,
  // Remove: type FetchFunction,
  type StreamResponse,
} from "../core/transport/index";

// Remove HttpClientConfig if no longer used
// type HttpClientConfig,
```

### Verify Timer Operations

Ensure all timer operations use runtime adapter (already implemented but verify):

```typescript
// In createTimeoutSignal method (already correct):
const timer = this.runtimeAdapter.setTimeout(
  () => controller.abort(),
  timeoutMs,
);

// And cleanup:
cancel: () => this.runtimeAdapter.clearTimeout(timer),
```

### Add Adapter Validation

Add validation for adapter resolution:

```typescript
// In constructor, enhance adapter resolution:
try {
  this.runtimeAdapter =
    deps?.runtimeAdapter ?? AdapterRegistry.getInstance().getAdapter();
} catch (error) {
  throw new BridgeError(
    "Failed to resolve runtime adapter",
    "RUNTIME_ADAPTER_UNAVAILABLE",
    {
      platform:
        typeof window !== "undefined"
          ? "browser"
          : typeof process !== "undefined"
            ? "node"
            : "unknown",
      originalError: error,
    },
  );
}
```

## Acceptance Criteria

### HttpTransport Integration

- [ ] HttpTransport constructor receives RuntimeAdapter directly instead of HttpClientConfig
- [ ] `fetchFn` and `httpClientConfig` variables removed from BridgeClient constructor
- [ ] Transport creation simplified to pass adapter directly
- [ ] Both HttpTransport and EnhancedHttpTransport work with RuntimeAdapter

### Import Cleanup

- [ ] Unused `FetchFunction` import removed
- [ ] Unused `HttpClientConfig` import removed if not needed elsewhere
- [ ] All necessary imports preserved for functionality
- [ ] TypeScript compilation succeeds without unused import warnings

### Runtime Adapter Resolution

- [ ] BridgeClient resolves adapter via `AdapterRegistry.getInstance().getAdapter()`
- [ ] Dependency injection works via `deps?.runtimeAdapter`
- [ ] Graceful error handling when adapter resolution fails
- [ ] Clear error messages include platform context for debugging

### Timer Operations Verification

- [ ] All timer operations use `this.runtimeAdapter.setTimeout/clearTimeout`
- [ ] No direct `setTimeout/clearTimeout` usage remains in BridgeClient
- [ ] Existing timeout functionality preserved
- [ ] Timer handles properly managed across platform boundaries

### Error Handling

- [ ] BridgeError thrown with appropriate code when adapter resolution fails
- [ ] Platform detection included in error context
- [ ] Original error preserved for debugging
- [ ] Error messages provide clear guidance for resolution

### Backward Compatibility

- [ ] Existing BridgeClient instantiation patterns continue to work
- [ ] No breaking changes to public APIs
- [ ] Dependency injection via BridgeClientDependencies.runtimeAdapter functional
- [ ] All existing tests pass without modification

## Testing Requirements

- Update unit tests to verify RuntimeAdapter is properly resolved
- Test dependency injection of custom runtime adapters
- Test error scenarios when adapter resolution fails
- Verify transport creation with RuntimeAdapter works correctly
- Test that timer operations use the runtime adapter

## Security Considerations

- Maintain existing authentication and authorization flows
- Ensure adapter validation doesn't expose sensitive platform information
- Preserve existing error handling security practices

## Performance Requirements

- No performance degradation from adapter usage
- Adapter resolution should be fast
- Timer operations should have minimal overhead

## Out of Scope

- Tool system timer updates (separate task)
- Agent system timer updates (separate task)
- Transport retry logic updates (separate task)
- Provider plugin updates

## Files to Modify

- `src/client/bridgeClient.ts` - Complete runtime adapter integration

## Implementation Notes

- BridgeClient already has significant runtime adapter integration
- This task completes the integration by removing HttpClientConfig dependency
- Focus on simplifying transport creation and cleaning up unused imports
- Maintain all existing functionality while removing direct platform API usage
- The adapter resolution and timer operations are already correctly implemented
