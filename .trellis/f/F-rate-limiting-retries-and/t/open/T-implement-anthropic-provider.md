---
id: T-implement-anthropic-provider
title: Implement Anthropic Provider Caching Support with Unit Tests
status: open
priority: medium
parent: F-rate-limiting-retries-and
prerequisites:
  - T-extend-provider-plugin
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:05:24.374Z
updated: 2025-09-19T03:05:24.374Z
---

# Implement Anthropic Provider Caching Support with Unit Tests

## Context

This task implements the optional caching methods in the Anthropic provider to support provider-native prompt caching. It demonstrates the caching interface usage and provides a concrete implementation of Anthropic's cache point system while maintaining backward compatibility with the existing provider signature.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Prerequisite**: T-extend-provider-plugin - Provider plugin interface with caching hooks
- **Target Provider**: `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts`
- **Existing Provider Pattern**: Follow current implementation in `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts:36`
- **Architecture Reference**: `docs/library-architecture.md` Anthropic cache points

## Implementation Requirements

### Extend Anthropic Provider with Caching

Update `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts` to implement optional caching methods while maintaining the existing signature (implements ProviderPlugin with no generic):

```typescript
export class AnthropicMessagesV1Provider implements ProviderPlugin {
  // ... existing methods unchanged ...

  // Implement optional caching methods
  supportsCaching(modelId: string): boolean {
    // Check if model supports caching using cache policy or model registry
    // Replace proposed modelHasCapability with actual mechanism
    return this.checkModelCachingSupport(modelId);
  }

  createCacheRequest(
    input: CacheableInput,
    existingCacheIds?: string[],
  ): CacheRequest | null {
    // Convert unified input to Anthropic cache control format
    return this.buildAnthropicCacheRequest(input, existingCacheIds);
  }

  extractCacheIds(response: ProviderHttpResponse): string[] {
    // Parse Anthropic response for cache IDs
    return this.parseAnthropicCacheIds(response);
  }

  reuseCacheIds(cacheIds: string[], input: CacheableInput): CacheableInput {
    // Apply cache IDs to new request input
    return this.applyCacheIdsToInput(cacheIds, input);
  }

  getCacheHeaders(cacheIds: string[]): Record<string, string> {
    // Generate Anthropic-specific cache headers
    return this.buildCacheHeaders(cacheIds);
  }

  // Helper method to check caching support (replaces non-existent modelHasCapability)
  private checkModelCachingSupport(modelId: string): boolean {
    // Use cache policy or model registry to determine support
    // This method needs to actually exist unlike modelHasCapability
    const cachePolicy = this.getCachePolicy(); // Get from constructor or config
    return (
      cachePolicy?.isEligible({
        provider: "anthropic",
        model: modelId,
        messages: [],
      }) ?? false
    );
  }
}
```

### Anthropic Cache Point Implementation

Create helper module `src/providers/anthropic-2023-06-01/cachePointMapper.ts`:

```typescript
export interface AnthropicCachePoint {
  type: "ephemeral";
  // Add other Anthropic-specific cache point properties based on actual API
}

export interface AnthropicCacheControl {
  cache_control?: AnthropicCachePoint;
}

export class AnthropicCacheMapper {
  // Convert unified messages to Anthropic cache points
  static createCachePoints(
    messages: Message[],
    existingCacheIds?: string[],
  ): AnthropicCacheControl[];

  // Extract cache IDs from Anthropic response
  static extractCacheIds(anthropicResponse: any): string[];

  // Apply cache IDs to message structure
  static applyCacheIds(messages: Message[], cacheIds: string[]): Message[];

  // Determine cache eligibility for message content
  static isCacheEligible(message: Message): boolean;
}
```

### Cache Integration Logic

Implement the caching logic following Anthropic's patterns:

1. **Cache Point Creation**: Identify system and long user messages for caching
2. **Cache Control Headers**: Add appropriate cache control to requests
3. **Cache ID Extraction**: Parse cache IDs from response headers/body
4. **Cache Reuse**: Apply cache IDs to subsequent requests

### Model Capability Check Integration

Instead of the non-existent `modelHasCapability`, use actual mechanisms:

```typescript
// Option 1: Inject cache policy through constructor
constructor(
  config: AnthropicConfig,
  private readonly cachePolicy?: CachePolicy
) {
  // existing constructor logic
}

// Option 2: Use model registry lookup
private checkModelCachingSupport(modelId: string): boolean {
  // Query model registry for promptCaching capability
  const modelInfo = this.getModelInfo(modelId); // If this exists
  return modelInfo?.capabilities?.promptCaching ?? false;
}

// Option 3: Use simple provider-level check
private checkModelCachingSupport(modelId: string): boolean {
  // All Anthropic models support caching for now
  return true;
}
```

## Acceptance Criteria

### Provider Interface Compliance

- ✅ Provider implements ProviderPlugin interface without generics
- ✅ Existing required methods unchanged and working
- ✅ Optional caching methods properly implemented
- ✅ Provider compiles and works with existing code
- ✅ No breaking changes to provider registration

### Caching Method Implementation

- ✅ supportsCaching uses actual capability checking mechanism
- ✅ createCacheRequest generates valid Anthropic cache control
- ✅ extractCacheIds parses Anthropic response format correctly
- ✅ reuseCacheIds applies cache correctly to input
- ✅ getCacheHeaders generates proper Anthropic headers
- ✅ All caching methods handle edge cases gracefully

### Anthropic Integration

- ✅ Cache points follow Anthropic's ephemeral cache format
- ✅ System messages marked for caching when eligible
- ✅ Long user messages identified for cache points
- ✅ Cache control applied to appropriate message positions
- ✅ Cache IDs extracted from response metadata
- ✅ Subsequent requests reuse cache IDs correctly

### Unit Tests Required

Create comprehensive tests in `src/providers/anthropic-2023-06-01/__tests__/cachingImplementation.test.ts`:

1. **Provider Interface Compliance**
   - Provider implements ProviderPlugin without generics
   - Existing methods continue working as before
   - Optional caching methods can be called safely
   - Provider registration works unchanged

2. **Caching Support Detection**
   - Models with caching capability return supportsCaching: true
   - Models without caching capability return supportsCaching: false
   - Model capability checking uses real mechanisms
   - Invalid models handled gracefully

3. **Cache Request Creation**
   - System messages get cache control when eligible
   - Long user messages get cache control
   - Short messages skip cache control
   - Existing cache IDs applied correctly
   - Invalid input returns null

4. **Cache ID Extraction**
   - Valid Anthropic responses return cache IDs
   - Responses without cache data return empty array
   - Malformed responses handled gracefully
   - Multiple cache IDs extracted correctly

5. **Cache Reuse Logic**
   - Cache IDs applied to appropriate messages
   - Message structure preserved during cache application
   - Invalid cache IDs handled gracefully
   - Cache reuse maintains message order

### Test Data Examples

```typescript
// Cache-eligible input
const cacheEligibleInput = {
  provider: 'anthropic',
  model: 'claude-3-haiku',
  messages: [
    { role: 'system', content: [{ type: 'text', text: 'Long system prompt...' }] },
    { role: 'user', content: [{ type: 'text', text: 'Long user message...' }] }
  ]
};

// Anthropic response with cache IDs (based on actual API format)
const anthropicCacheResponse = {
  content: [...],
  cache_creation_input_tokens: 150,
  cache_read_input_tokens: 0,
  // Include actual Anthropic cache response format when available
};

// Expected cache points
const expectedCachePoints = [
  { type: 'ephemeral' } // Anthropic cache control format
];
```

## Security Considerations

- **Cache Isolation**: Ensure cache IDs don't leak between sessions
- **Content Validation**: Validate cache-eligible content appropriately
- **Error Handling**: Graceful fallback when caching fails
- **Backward Compatibility**: No security regressions from caching addition

## Dependencies

- **Anthropic Provider**: Existing provider implementation (non-generic)
- **Cache Types**: CacheableInput, CacheRequest from caching interface
- **Message Types**: Existing Message and content types
- **Cache Policy**: Actual cache policy mechanism for capability checking

## Out of Scope

- Other provider caching implementations (separate tasks if needed)
- Cache performance optimization (future enhancement)
- Cross-provider cache sharing (not supported)
- Persistent cache storage (memory-only for this phase)

## Files to Create/Modify

- **Update**: `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts` - Add caching methods
- **Create**: `src/providers/anthropic-2023-06-01/cachePointMapper.ts` - Cache mapping logic
- **Create**: `src/providers/anthropic-2023-06-01/__tests__/cachingImplementation.test.ts` - Unit tests
- **Update**: `src/providers/anthropic-2023-06-01/index.ts` - Export cache mapper if needed

Estimated effort: 2 hours
