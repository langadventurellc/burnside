---
id: T-integrate-enhanced-transport
title: Integrate Enhanced Transport with Client and Add Configuration Support
status: open
priority: high
parent: F-rate-limiting-retries-and
prerequisites:
  - T-create-enhanced-http
  - T-implement-anthropic-provider
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:06:07.140Z
updated: 2025-09-19T03:06:07.140Z
---

# Integrate Enhanced Transport with Client and Add Configuration Support

## Context

This task integrates the enhanced HTTP transport with rate limiting, retry, and caching capabilities into the main BridgeClient, using the existing constructor pattern and configuration schema. It serves as the final integration point that makes all Phase 10 features available to end users while maintaining backward compatibility.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Prerequisites**:
  - T-create-enhanced-http - Enhanced transport implementation
  - T-implement-anthropic-provider - Provider caching implementation
- **Integration Target**: `src/client/bridgeClient.ts` - main client at line 35
- **Client Factory**: `src/createClient.ts` - client factory at line 65
- **Existing Config**: `src/core/config/bridgeConfigSchema.ts` - update existing schema at line 24

## Implementation Requirements

### Update Existing BridgeConfigSchema

Update `src/core/config/bridgeConfigSchema.ts` in place (extend the existing schema, don't create a separate one):

```typescript
export const BridgeConfigSchema = z
  .object({
    // ... existing fields unchanged ...

    /** Rate limiting policy configuration */
    rateLimitPolicy: z
      .object({
        enabled: z
          .boolean()
          .default(false)
          .describe("Enable rate limiting functionality"),
        maxRps: z
          .number()
          .positive("Max RPS must be positive")
          .max(1000, "Max RPS cannot exceed 1000")
          .optional()
          .describe("Maximum requests per second"),
        burst: z
          .number()
          .positive("Burst capacity must be positive")
          .max(10000, "Burst capacity cannot exceed 10000")
          .optional()
          .describe("Burst capacity for rate limiting"),
        scope: z
          .enum(["global", "provider", "provider:model", "provider:model:key"])
          .default("provider:model:key")
          .describe("Rate limiting scope granularity"),
      })
      .optional()
      .describe("Rate limiting policy configuration"),

    /** Retry policy configuration */
    retryPolicy: z
      .object({
        attempts: z
          .number()
          .int("Attempts must be an integer")
          .min(0, "Attempts cannot be negative")
          .max(10, "Attempts cannot exceed 10")
          .default(2)
          .describe("Number of retry attempts"),
        backoff: z
          .enum(["exponential", "linear"])
          .default("exponential")
          .describe("Backoff strategy type"),
        baseDelayMs: z
          .number()
          .positive("Base delay must be positive")
          .max(60000, "Base delay cannot exceed 60 seconds")
          .default(1000)
          .describe("Base delay in milliseconds"),
        maxDelayMs: z
          .number()
          .positive("Max delay must be positive")
          .max(300000, "Max delay cannot exceed 5 minutes")
          .default(30000)
          .describe("Maximum delay in milliseconds"),
        jitter: z
          .boolean()
          .default(true)
          .describe("Enable jitter to prevent thundering herd"),
        retryableStatusCodes: z
          .array(z.number().int().min(100).max(599))
          .default([429, 500, 502, 503, 504])
          .describe("HTTP status codes that trigger retries"),
      })
      .optional()
      .describe("Retry policy configuration"),

    /** Prompt caching configuration */
    cachingPolicy: z
      .object({
        enabled: z
          .boolean()
          .default(false)
          .describe("Enable prompt caching functionality"),
        defaultTtlMs: z
          .number()
          .positive("Default TTL must be positive")
          .default(1800000) // 30 minutes
          .describe("Default cache TTL in milliseconds"),
        maxEntries: z
          .number()
          .int("Max entries must be an integer")
          .positive("Max entries must be positive")
          .max(10000, "Max entries cannot exceed 10000")
          .default(1000)
          .describe("Maximum cache entries"),
        enabledProviders: z
          .array(z.string().min(1))
          .default(["anthropic"])
          .describe("Providers that support caching"),
      })
      .optional()
      .describe("Prompt caching configuration"),

    // Add validation for policy interactions
  })
  .refine(
    (config) => {
      // Rate limiting validation
      if (config.rateLimitPolicy?.enabled && !config.rateLimitPolicy.maxRps) {
        return false;
      }
      // Retry delay validation
      if (
        config.retryPolicy &&
        config.retryPolicy.baseDelayMs > config.retryPolicy.maxDelayMs
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Invalid policy configuration: check rate limiting and retry settings",
    },
  );
```

### Update Client Factory with Existing Pattern

Modify `src/createClient.ts` to use the existing BridgeClient constructor pattern (line 65):

```typescript
export function createClient(config: BridgeConfig): BridgeClient {
  // ... existing validation and setup unchanged ...

  const validatedConfig = BridgeConfigSchema.parse(config);

  // Create enhanced transport if any Phase 10 features are enabled
  const transport = createTransportWithEnhancements(
    baseHttpConfig,
    validatedConfig.rateLimitPolicy,
    validatedConfig.retryPolicy,
  );

  // Initialize prompt cache if enabled
  const promptCache = createPromptCacheIfEnabled(validatedConfig.cachingPolicy);

  // Use existing constructor pattern: new BridgeClient(validatedConfig, dependencies)
  return new BridgeClient(validatedConfig, {
    transport,
    promptCache,
    // ... other existing dependencies unchanged ...
    modelRegistry,
    providerRegistry,
    toolRegistry,
  });
}

function createTransportWithEnhancements(
  baseConfig: HttpClientConfig,
  rateLimitPolicy?: RateLimitConfig,
  retryPolicy?: RetryConfig,
): Transport {
  const baseTransport = new HttpTransport(
    baseConfig,
    interceptors,
    errorNormalizer,
  );

  // Return enhanced transport if any policies are enabled
  if (rateLimitPolicy?.enabled || retryPolicy?.attempts) {
    return new EnhancedHttpTransport({
      baseTransport,
      rateLimitConfig: rateLimitPolicy,
      retryConfig: retryPolicy,
    });
  }

  return baseTransport;
}

function createPromptCacheIfEnabled(
  cachingPolicy?: CachingPolicyConfig,
): PromptCache | undefined {
  if (cachingPolicy?.enabled) {
    return new PromptCache({
      defaultTtlMs: cachingPolicy.defaultTtlMs,
      maxEntries: cachingPolicy.maxEntries,
    });
  }
  return undefined;
}
```

### Update BridgeClient with Dependencies Object

Modify `src/client/bridgeClient.ts` to accept prompt cache through the existing dependencies object pattern:

```typescript
interface BridgeClientDependencies {
  // ... existing dependencies unchanged ...
  transport: Transport;
  promptCache?: PromptCache; // Add as optional dependency
  modelRegistry: ModelRegistry;
  providerRegistry: ProviderRegistry;
  toolRegistry: ToolRegistry;
}

export class BridgeClient {
  constructor(
    private readonly config: ValidatedBridgeConfig,
    private readonly dependencies: BridgeClientDependencies,
  ) {
    // ... existing initialization unchanged ...
    this.transport = dependencies.transport;
    this.promptCache = dependencies.promptCache;
  }

  // Integrate caching into request flow
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Check for cached response if caching enabled
    const cachedResponse = await this.checkPromptCache(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Execute request with enhanced transport (existing flow with caching)
    const response = await this.executeWithCaching(request);

    // Store cache IDs if provider supports caching
    await this.storeCacheIds(request, response);

    return response;
  }

  private async checkPromptCache(
    request: ChatRequest,
  ): Promise<ChatResponse | null> {
    if (!this.promptCache) return null;

    // Check cache eligibility and retrieve cached response
    // Implementation depends on caching policy and provider support
    return null; // Placeholder implementation
  }

  private async storeCacheIds(
    request: ChatRequest,
    response: ChatResponse,
  ): Promise<void> {
    if (!this.promptCache) return;

    // Extract and store cache IDs from provider response
    // Implementation depends on provider caching support
  }
}
```

## Acceptance Criteria

### Configuration Integration

- ✅ Rate limiting configuration passed to enhanced transport
- ✅ Retry configuration passed to enhanced transport
- ✅ Caching configuration creates prompt cache instance
- ✅ Disabled features create standard transport (backward compatibility)
- ✅ Configuration validation includes all Phase 10 options in existing schema
- ✅ Default values applied when configurations omitted

### Client Integration

- ✅ Enhanced transport used when rate limiting or retry enabled
- ✅ Prompt cache integration works with supported providers
- ✅ Cache check performed before making requests
- ✅ Cache IDs stored after successful responses
- ✅ Standard client behavior when features disabled
- ✅ Error handling preserves existing behavior
- ✅ Existing constructor pattern maintained (no breaking changes)

### End-to-End Functionality

- ✅ Rate limiting works through complete client request flow
- ✅ Retry logic works through complete client request flow
- ✅ Prompt caching works with Anthropic provider
- ✅ All features can be enabled simultaneously
- ✅ Features can be enabled/disabled independently
- ✅ Backward compatibility maintained for existing clients

### Unit Tests Required

Create comprehensive tests in `src/client/__tests__/phase10Integration.test.ts`:

1. **Configuration Integration**
   - Rate limiting config creates enhanced transport
   - Retry config creates enhanced transport
   - Caching config creates prompt cache
   - Mixed configurations work together
   - Disabled features use standard components

2. **Client Factory Tests**
   - createClient with Phase 10 configs works
   - createClient without Phase 10 configs works (backward compatibility)
   - Invalid configurations are rejected
   - Default values applied correctly
   - Existing constructor pattern preserved

3. **Client Integration Tests**
   - Rate limited requests work through client
   - Retry logic works through client
   - Cached requests work through client
   - Error handling preserves original behavior
   - All features work together

4. **Backward Compatibility Tests**
   - Existing client creation patterns work unchanged
   - Configuration without Phase 10 options validates
   - No breaking changes to public API
   - Dependencies object pattern maintained

### Test Scenarios

```typescript
// Configuration test cases using existing schema
const configTests = [
  {
    name: "rate limiting only",
    config: {
      providers: { anthropic: { apiKey: "test" } },
      rateLimitPolicy: { enabled: true, maxRps: 5 },
    },
  },
  {
    name: "backward compatibility",
    config: {
      providers: { anthropic: { apiKey: "test" } },
      // No Phase 10 configs - should work exactly as before
    },
  },
];
```

## Security Considerations

- **Configuration Validation**: Strict validation prevents malicious configs
- **Feature Isolation**: Features fail safely without affecting core functionality
- **Backward Compatibility**: No security regressions from new features
- **Default Security**: Conservative defaults protect against misconfiguration

## Dependencies

- **Enhanced Transport**: EnhancedHttpTransport from prerequisite
- **Provider Caching**: Anthropic caching implementation
- **Configuration**: Existing BridgeConfigSchema (updated in place)
- **Existing Client**: Current BridgeClient constructor pattern

## Out of Scope

- Other provider caching implementations (separate tasks if needed)
- Advanced caching strategies (LRU, etc.)
- Metrics and monitoring integration (future enhancement)
- Configuration hot-reloading (future enhancement)

## Files to Create/Modify

- **Update**: `src/core/config/bridgeConfigSchema.ts` - Add Phase 10 options to existing schema
- **Update**: `src/createClient.ts` - Integrate enhanced transport using existing pattern
- **Update**: `src/client/bridgeClient.ts` - Add caching integration via dependencies object
- **Create**: `src/client/__tests__/phase10Integration.test.ts` - Integration tests
- **Update**: `src/core/config/bridgeConfig.ts` - Add interface types for new options

Estimated effort: 2 hours
