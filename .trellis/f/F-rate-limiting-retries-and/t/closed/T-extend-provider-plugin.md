---
id: T-extend-provider-plugin
title: Add Simple Cache Marker Methods to Provider Plugin Interface
status: done
priority: medium
parent: F-rate-limiting-retries-and
prerequisites: []
affectedFiles:
  src/core/providers/providerPlugin.ts: Added three optional caching methods
    (supportsCaching, getCacheHeaders, markForCaching) to the ProviderPlugin
    interface with comprehensive JSDoc documentation and proper TypeScript
    typing using unknown instead of any
  src/core/providers/hasProviderCaching.ts:
    Created utility function to detect if
    a provider plugin supports caching by checking for presence of optional
    caching methods
  src/core/providers/addCacheHeaders.ts: Created utility function to merge
    cache-specific headers from provider plugins with existing request headers,
    with error handling
  src/core/providers/applyCacheMarkers.ts:
    Created utility function to apply cache
    control markers to request content using provider plugin's markForCaching
    method, with error handling
  src/core/providers/index.ts: Added exports for the three new cache helper
    functions (addCacheHeaders, applyCacheMarkers, hasProviderCaching) in
    alphabetical order
  src/core/providers/__tests__/simpleCaching.test.ts: Created comprehensive unit
    test suite with 17 tests covering all caching functionality, error handling,
    backward compatibility, and edge cases including primitive content types
log:
  - 'Successfully implemented simple cache marker methods for the ProviderPlugin
    interface to support Anthropic''s server-side prompt caching. Added three
    optional methods (supportsCaching, getCacheHeaders, markForCaching) with
    comprehensive JSDoc documentation. Created separate helper functions
    following the "one export per file" rule: hasProviderCaching,
    addCacheHeaders, and applyCacheMarkers. All methods are backward compatible
    - existing providers continue working without modification. Implemented
    comprehensive unit tests covering all functionality including error
    handling, backward compatibility, and edge cases. All 17 tests pass and
    quality checks (lint, format, type-check) are clean.'
schema: v1.0
childrenIds: []
created: 2025-09-19T03:04:04.266Z
updated: 2025-09-19T03:04:04.266Z
---

# Add Simple Cache Marker Methods to Provider Plugin Interface

## Context

This task adds minimal optional caching methods to the ProviderPlugin interface to support Anthropic's prompt caching. Based on research, Anthropic's caching is server-side only and requires just headers and JSON field markers - no complex client-side cache management.

## Implementation Requirements

### Extend ProviderPlugin Interface

Update `src/core/providers/providerPlugin.ts` to add simple optional caching methods:

```typescript
export interface ProviderPlugin {
  // ... existing required methods unchanged ...

  // Optional simple caching hooks - backward compatible
  supportsCaching?(modelId: string): boolean;

  // Add cache headers to HTTP request
  getCacheHeaders?(): Record<string, string>;

  // Mark messages/tools for caching (add cache_control field)
  markForCaching?(content: any): any;
}
```

### Helper Functions

Create utility functions in `src/core/providers/cacheHelpers.ts`:

```typescript
export function hasProviderCaching(plugin: ProviderPlugin): boolean;

export function addCacheHeaders(
  plugin: ProviderPlugin,
  headers: Record<string, string>,
): Record<string, string>;

export function applyCacheMarkers(plugin: ProviderPlugin, content: any): any;
```

## Acceptance Criteria

### Backward Compatibility

- ✅ Existing provider plugins compile without modification
- ✅ Providers without caching methods work exactly as before
- ✅ No breaking changes to required interface methods
- ✅ All existing tests continue to pass

### Simple Caching Interface

- ✅ Optional methods are properly typed and documented
- ✅ Cache-enabled providers can be detected
- ✅ Helper functions provide clean integration
- ✅ Methods support provider-specific implementations

## Files to Create/Modify

- **Update**: `src/core/providers/providerPlugin.ts` - Add optional caching methods
- **Create**: `src/core/providers/cacheHelpers.ts` - Helper functions
- **Create**: `src/core/providers/__tests__/simpleCaching.test.ts` - Unit tests
- **Update**: `src/core/providers/index.ts` - Export new helpers

Estimated effort: 1 hour (simplified from 1.5 hours)
