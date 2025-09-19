---
id: T-implement-anthropic-provider
title: Add Simple Anthropic Prompt Caching Support
status: done
priority: medium
parent: F-rate-limiting-retries-and
prerequisites:
  - T-extend-provider-plugin
affectedFiles:
  src/providers/anthropic-2023-06-01/cacheUtils.ts: Created constants file with
    ANTHROPIC_CACHE_HEADER and MINIMUM_CACHE_SIZE (4000 chars) for prompt
    caching configuration
  src/providers/anthropic-2023-06-01/createCacheControlObject.ts:
    Created utility function that returns ephemeral cache control object for
    Anthropic requests
  src/providers/anthropic-2023-06-01/shouldCacheContent.ts: Created function to
    determine if content meets minimum size requirement (4000+ chars) for
    effective caching
  src/providers/anthropic-2023-06-01/addCacheControlField.ts:
    Created function to
    add cache_control field to content items, handling both objects and
    primitive types
  src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts:
    "Added three optional caching methods: supportsCaching() checks model
    promptCaching capability, getCacheHeaders() returns anthropic-beta header,
    markForCaching() adds cache control to eligible content. Includes private
    helper findModelInDefaultModels() for capability lookup"
  src/providers/anthropic-2023-06-01/index.ts: Updated barrel export to include
    all new cache utility functions for external use
  src/providers/anthropic-2023-06-01/__tests__/simpleCaching.test.ts:
    Created comprehensive test suite with 25 test cases covering capability
    detection, header generation, cache marking, error handling, integration
    scenarios, and utility functions. Tests verify all Anthropic models support
    caching and content eligibility logic
log:
  - Successfully implemented simple Anthropic prompt caching support by adding
    three optional caching methods to the AnthropicMessagesV1Provider. The
    implementation includes supportsCaching() which checks model capability
    flags, getCacheHeaders() which returns the required anthropic-beta header,
    and markForCaching() which adds cache_control fields to eligible content
    (4000+ characters). Created modular cache utilities following the
    one-export-per-file rule, comprehensive unit tests with 25 test cases, and
    maintained full backward compatibility. All quality checks and tests pass.
schema: v1.0
childrenIds: []
created: 2025-09-19T03:05:24.374Z
updated: 2025-09-19T03:05:24.374Z
---

# Add Simple Anthropic Prompt Caching Support

## Context

This task implements the simple caching methods in the Anthropic provider to support server-side prompt caching. Based on research, this only requires adding the `anthropic-beta: prompt-caching-2024-07-31` header and `cache_control: {"type": "ephemeral"}` JSON fields - no complex client-side management.

## Implementation Requirements

### Extend Anthropic Provider with Simple Caching

Update `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts` to implement optional caching methods:

```typescript
export class AnthropicMessagesV1Provider implements ProviderPlugin {
  // ... existing methods unchanged ...

  // Implement simple caching methods
  supportsCaching(modelId: string): boolean {
    // Check if model supports caching via capability flag
    const model = this.getModelInfo(modelId);
    return model?.promptCaching ?? false;
  }

  getCacheHeaders(): Record<string, string> {
    return {
      "anthropic-beta": "prompt-caching-2024-07-31",
    };
  }

  markForCaching(content: any): any {
    // Add cache_control field to system messages or tools
    if (this.shouldCache(content)) {
      return {
        ...content,
        cache_control: { type: "ephemeral" },
      };
    }
    return content;
  }

  private shouldCache(content: any): boolean {
    // Cache system messages and long content (1024+ tokens)
    if (content.type === "text" && content.text?.length > 4000) {
      // ~1024 tokens
      return true;
    }
    return false;
  }
}
```

### Simple Cache Utility

Create helper file `src/providers/anthropic-2023-06-01/cacheUtils.ts`:

```typescript
export const ANTHROPIC_CACHE_HEADER =
  "anthropic-beta: prompt-caching-2024-07-31";

export function addCacheControl(item: any): any {
  return {
    ...item,
    cache_control: { type: "ephemeral" },
  };
}

export function shouldCacheContent(content: string): boolean {
  // Anthropic recommends 1024+ tokens for effective caching
  return content.length > 4000; // ~1024 tokens
}
```

## Acceptance Criteria

### Provider Interface Compliance

- ✅ Provider implements ProviderPlugin interface without breaking changes
- ✅ Existing required methods unchanged and working
- ✅ Optional caching methods properly implemented
- ✅ Provider compiles and works with existing code

### Simple Caching Implementation

- ✅ supportsCaching checks model capability flag correctly
- ✅ getCacheHeaders returns Anthropic beta header
- ✅ markForCaching adds cache_control field appropriately
- ✅ Only caches content that meets minimum size requirements
- ✅ All methods handle edge cases gracefully

### Unit Tests Required

Create tests in `src/providers/anthropic-2023-06-01/__tests__/simpleCaching.test.ts`:

1. **Caching Support Detection**
   - Models with promptCaching: true return supportsCaching: true
   - Models without capability return supportsCaching: false

2. **Cache Headers**
   - getCacheHeaders returns correct Anthropic beta header
   - Headers can be merged with existing request headers

3. **Cache Marking**
   - Long content gets cache_control field added
   - Short content remains unchanged
   - Invalid input handled gracefully

4. **Integration**
   - Caching methods work with existing provider flow
   - No impact on non-caching requests

## Files to Create/Modify

- **Update**: `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts` - Add caching methods
- **Create**: `src/providers/anthropic-2023-06-01/cacheUtils.ts` - Simple utilities
- **Create**: `src/providers/anthropic-2023-06-01/__tests__/simpleCaching.test.ts` - Unit tests

Estimated effort: 1 hour (simplified from 2 hours)
