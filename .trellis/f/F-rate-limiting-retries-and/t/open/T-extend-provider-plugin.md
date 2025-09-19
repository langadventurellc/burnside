---
id: T-extend-provider-plugin
title: Extend Provider Plugin Interface with Optional Caching Hooks
status: open
priority: medium
parent: F-rate-limiting-retries-and
prerequisites:
  - T-create-prompt-cache
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:04:04.266Z
updated: 2025-09-19T03:04:04.266Z
---

# Extend Provider Plugin Interface with Optional Caching Hooks

## Context

This task extends the existing ProviderPlugin interface with optional caching methods to maintain backward compatibility while enabling provider-native prompt caching. The implementation ensures that existing providers continue working without modification while allowing new caching capabilities.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Prerequisite**: T-create-prompt-cache - Cache management system
- **Target Interface**: `src/core/providers/providerPlugin.ts` - extend this interface
- **Existing Providers**: `src/providers/*/` - ensure compatibility
- **Architecture Reference**: `docs/library-architecture.md` provider plugin patterns

## Implementation Requirements

### Extend ProviderPlugin Interface

Update `src/core/providers/providerPlugin.ts` to add optional caching methods:

```typescript
// Add new types for caching support
export interface CacheRequest {
  cachePoints: CachePoint[];
  request: ProviderHttpRequest;
}

export interface CachePoint {
  type: "system" | "user" | "assistant";
  content: string;
  cacheControl?: Record<string, unknown>; // Provider-specific cache metadata
}

export interface CacheResponse {
  cacheIds: string[];
  metadata?: Record<string, unknown>;
}

// Extend existing ProviderPlugin interface with optional methods (NO GENERICS)
export interface ProviderPlugin {
  // ... existing required methods unchanged ...
  id: string;
  version: string;
  configSchema: z.ZodTypeAny;
  supportsModel(modelId: string): boolean;
  translateRequest(input: TranslateRequestInput): ProviderHttpRequest;
  parseResponse(
    stream: boolean,
    res: ProviderHttpResponse,
  ): UnifiedResponse | AsyncIterable<UnifiedDelta>;
  isTerminal(deltaOrFinal: UnifiedDelta | UnifiedResponse): boolean;

  // Optional caching hooks - backward compatible
  supportsCaching?(modelId: string): boolean;

  createCacheRequest?(
    input: CacheableInput,
    existingCacheIds?: string[],
  ): CacheRequest | null;

  extractCacheIds?(response: ProviderHttpResponse): string[];

  reuseCacheIds?(cacheIds: string[], input: CacheableInput): CacheableInput;

  // Optional hook to get cache control headers
  getCacheHeaders?(cacheIds: string[]): Record<string, string>;
}
```

### Helper Functions for Cache Integration

Create utility functions in `src/core/providers/cacheHelpers.ts`:

```typescript
// Helper functions for provider cache integration
export function hasProviderCaching(plugin: ProviderPlugin): boolean;

export function createCacheableRequest(
  plugin: ProviderPlugin,
  input: CacheableInput,
  existingCacheIds?: string[],
): { request: ProviderHttpRequest; cacheRequest?: CacheRequest };

export function extractProviderCacheIds(
  plugin: ProviderPlugin,
  response: ProviderHttpResponse,
): string[];

export function applyCacheReuse(
  plugin: ProviderPlugin,
  cacheIds: string[],
  input: CacheableInput,
): CacheableInput;
```

### Type Safety and Validation

Ensure type safety for the optional methods:

```typescript
// Type guard for caching-enabled providers
export function isProviderCachingEnabled(
  plugin: ProviderPlugin,
): plugin is ProviderPlugin & {
  supportsCaching: NonNullable<ProviderPlugin["supportsCaching"]>;
  createCacheRequest: NonNullable<ProviderPlugin["createCacheRequest"]>;
  extractCacheIds: NonNullable<ProviderPlugin["extractCacheIds"]>;
  reuseCacheIds: NonNullable<ProviderPlugin["reuseCacheIds"]>;
};
```

## Acceptance Criteria

### Backward Compatibility

- ✅ Existing provider plugins compile without modification
- ✅ Providers without caching methods work exactly as before
- ✅ No breaking changes to required interface methods
- ✅ All existing tests continue to pass
- ✅ Provider registration works with both old and new providers
- ✅ No generic type parameters added to maintain existing signatures

### Caching Interface

- ✅ Optional methods are properly typed and documented
- ✅ Cache-enabled providers can be detected via type guards
- ✅ Helper functions provide clean integration points
- ✅ Provider-specific cache metadata supported
- ✅ Cache request/response flow properly defined

### Unit Tests Required

Create comprehensive tests in `src/core/providers/__tests__/cachingInterface.test.ts`:

1. **Interface Compatibility**
   - Existing providers implement interface without caching methods
   - New providers can implement caching methods optionally
   - Type guards correctly identify caching-enabled providers
   - Helper functions work with both provider types

2. **Caching Method Signatures**
   - supportsCaching returns boolean for model IDs
   - createCacheRequest handles cache points correctly
   - extractCacheIds parses provider responses
   - reuseCacheIds applies cache to input properly

3. **Helper Function Tests**
   - hasProviderCaching detects caching support correctly
   - createCacheableRequest works with and without caching
   - extractProviderCacheIds handles missing methods gracefully
   - applyCacheReuse skips non-caching providers safely

4. **Type Safety Tests**
   - Type guards provide correct type narrowing
   - Optional method calls are safe and don't throw
   - Cache types validate provider-specific metadata
   - Interface evolution maintains compatibility

### Test Implementation Examples

```typescript
// Mock provider without caching (matches existing pattern)
const basicProvider: ProviderPlugin = {
  id: "test-basic",
  version: "v1",
  configSchema: z.object({}),
  supportsModel: () => true,
  translateRequest: () => ({ url: "test", method: "POST" }),
  parseResponse: () => ({ content: [], finished: true }),
  isTerminal: () => true,
  // No caching methods - should still work
};

// Mock provider with caching (extends existing pattern)
const cachingProvider: ProviderPlugin = {
  ...basicProvider,
  supportsCaching: (modelId) => modelId.includes("cache"),
  createCacheRequest: (input) => ({
    cachePoints: [],
    request: { url: "test", method: "POST" },
  }),
  extractCacheIds: (response) => ["cache-id-123"],
  reuseCacheIds: (cacheIds, input) => input,
};
```

## Security Considerations

- **Backward Compatibility**: No security implications from optional methods
- **Type Safety**: Strong typing prevents method call errors
- **Input Validation**: Cache inputs validated before provider calls
- **Interface Stability**: Changes are additive only, no removals

## Dependencies

- **Existing Interface**: Current ProviderPlugin definition (non-generic)
- **Cache Types**: CacheableInput from cache management task
- **TypeScript**: Optional method syntax and type guards
- **Zod**: For any cache-related schema validation

## Out of Scope

- Specific provider implementations (separate tasks)
- Cache policy enforcement (handled by cache management)
- Transport layer integration (separate task)
- Runtime provider discovery of caching capabilities

## Files to Create/Modify

- **Update**: `src/core/providers/providerPlugin.ts` - Add optional caching methods (no generics)
- **Create**: `src/core/providers/cacheHelpers.ts` - Helper functions
- **Create**: `src/core/providers/__tests__/cachingInterface.test.ts` - Unit tests
- **Update**: `src/core/providers/index.ts` - Export new helper functions

Estimated effort: 1.5 hours
