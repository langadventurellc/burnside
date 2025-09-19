---
id: T-create-prompt-cache
title: Create Prompt Cache Management System with Unit Tests
status: open
priority: medium
parent: F-rate-limiting-retries-and
prerequisites:
  - T-add-prompt-caching-capability
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:03:27.396Z
updated: 2025-09-19T03:03:27.396Z
---

# Create Prompt Cache Management System with Unit Tests

## Context

This task implements the core prompt cache management system that handles session-based cache ID storage, cache eligibility policies, and cache reuse logic. It provides the foundation for provider-native prompt caching without being tied to specific provider implementations.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Prerequisite**: T-add-prompt-caching-capability - Model schema with promptCaching capability
- **Architecture Reference**: `docs/library-architecture.md` prompt caching section
- **Integration Target**: Will be used by provider plugins and transport layer

## Implementation Requirements

Create the performance module structure with cache management:

### Core Cache Management (`src/core/performance/promptCache.ts`)

```typescript
export interface CacheEntry {
  id: string;
  timestamp: Date;
  ttlMs: number;
  scope: string; // provider:model combination
  metadata?: Record<string, unknown>;
}

export interface CacheKey {
  provider: string;
  model: string;
  contentHash: string; // Hash of cacheable content
}

export class PromptCache {
  constructor(config?: { defaultTtlMs?: number; maxEntries?: number });

  // Store cache ID with metadata
  store(key: CacheKey, cacheId: string, ttlMs?: number): void;

  // Retrieve cache ID if valid and not expired
  get(key: CacheKey): string | null;

  // Check if content is cacheable
  has(key: CacheKey): boolean;

  // Remove expired entries
  cleanup(): number; // Returns number of removed entries

  // Clear all cache entries
  clear(): void;

  // Get cache statistics
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    hitRate: number;
  };
}
```

### Cache Policy Management (`src/core/performance/cachePolicy.ts`)

```typescript
export interface CachePolicyConfig {
  defaultTtlMs: number; // Default: 30 minutes
  maxEntries: number; // Default: 1000
  minContentLength: number; // Default: 100 chars
  enabledProviders: string[]; // Default: ['anthropic']
}

export interface CacheableInput {
  provider: string;
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
}

export class CachePolicy {
  constructor(config: CachePolicyConfig);

  // Determine if input is eligible for caching
  isEligible(input: CacheableInput): boolean;

  // Generate cache key for input
  generateKey(input: CacheableInput): CacheKey;

  // Calculate TTL based on content and policy
  calculateTtl(input: CacheableInput): number;

  // Update policy configuration
  updateConfig(config: Partial<CachePolicyConfig>): void;
}
```

### Cache Key Generation (`src/core/performance/cacheableInput.ts`)

```typescript
export interface CacheableInput {
  provider: string;
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
}

// Utility functions for cache key generation
export function generateContentHash(input: CacheableInput): string;
export function extractCacheableContent(messages: Message[]): string;
export function shouldCacheContent(content: string, minLength: number): boolean;
```

## Acceptance Criteria

### Cache Management

- ✅ Cache entries stored with proper TTL and metadata
- ✅ Expired entries automatically excluded from retrieval
- ✅ Cache size bounded by maxEntries configuration
- ✅ Cleanup removes expired entries and returns count
- ✅ Cache statistics provide hit rate and entry counts
- ✅ Session-scoped storage (memory-based, not persistent)

### Cache Policy

- ✅ Eligibility checks provider support and content length
- ✅ Cache keys generated deterministically from input
- ✅ TTL calculation respects configuration and content
- ✅ Policy configuration can be updated at runtime
- ✅ Only enabled providers participate in caching

### Unit Tests Required

Create comprehensive tests in `src/core/performance/__tests__/`:

1. **PromptCache Tests** (`promptCache.test.ts`)
   - Store and retrieve cache entries successfully
   - Expired entries not returned by get()
   - Cache size limits enforced (LRU or similar)
   - Cleanup removes only expired entries
   - Statistics calculation accuracy
   - Clear operation removes all entries

2. **CachePolicy Tests** (`cachePolicy.test.ts`)
   - Eligibility checks for supported/unsupported providers
   - Content length requirements enforced
   - Cache key generation is deterministic
   - Same input generates same key
   - TTL calculation follows policy rules
   - Configuration updates apply immediately

3. **Cache Key Generation Tests** (`cacheableInput.test.ts`)
   - Content hash generation is deterministic
   - Same content produces same hash
   - Different content produces different hashes
   - Hash handles special characters and encoding
   - Content extraction from messages works correctly

4. **Integration Tests** (`cacheIntegration.test.ts`)
   - End-to-end cache workflow (store -> retrieve -> expire)
   - Policy and cache work together correctly
   - Multiple cache entries with different TTLs
   - Cache cleanup during normal operation

### Test Scenarios

```typescript
// Cache eligibility scenarios
const eligibleInputs = [
  {
    provider: "anthropic",
    model: "claude-3-haiku",
    messages: [
      { role: "user", content: [{ type: "text", text: "Long content..." }] },
    ],
  },
];

const ineligibleInputs = [
  {
    provider: "openai", // Not in enabled providers
    model: "gpt-4",
    messages: [{ role: "user", content: [{ type: "text", text: "Short" }] }], // Too short
  },
];

// TTL scenarios
const ttlTestCases = [
  { contentLength: 100, expectedTtl: 30 * 60 * 1000 }, // 30 minutes
  { contentLength: 10000, expectedTtl: 60 * 60 * 1000 }, // 60 minutes for long content
];
```

## Security Considerations

- **Memory Management**: Bounded cache prevents memory exhaustion
- **Data Isolation**: Cache keys prevent cross-user cache pollution
- **Content Hashing**: Secure hash function prevents key manipulation
- **TTL Enforcement**: Automatic expiration prevents stale data issues

## Dependencies

- **Node.js**: Built-in crypto for hashing, Map for storage
- **Existing Types**: Message, ToolDefinition from core/messages
- **Jest**: Testing framework

## Out of Scope

- Provider-specific cache implementation (separate task)
- Persistent cache storage (memory-only for this phase)
- Cache warming or preloading (future enhancement)
- Cross-session cache sharing (security concern)

## Files to Create/Modify

- **Create**: `src/core/performance/promptCache.ts`
- **Create**: `src/core/performance/cachePolicy.ts`
- **Create**: `src/core/performance/cacheableInput.ts`
- **Create**: `src/core/performance/index.ts` (exports)
- **Create**: `src/core/performance/__tests__/promptCache.test.ts`
- **Create**: `src/core/performance/__tests__/cachePolicy.test.ts`
- **Create**: `src/core/performance/__tests__/cacheableInput.test.ts`
- **Create**: `src/core/performance/__tests__/cacheIntegration.test.ts`

Estimated effort: 2 hours
