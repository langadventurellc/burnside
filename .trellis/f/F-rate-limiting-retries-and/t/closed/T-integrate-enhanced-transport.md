---
id: T-integrate-enhanced-transport
title: Integrate Enhanced Transport with Rate Limiting and Retry Support
status: done
priority: high
parent: F-rate-limiting-retries-and
prerequisites:
  - T-create-enhanced-http
  - T-extend-provider-plugin
affectedFiles:
  src/client/bridgeClient.ts: Updated transport creation logic to conditionally
    use EnhancedHttpTransport when rate limiting or retry policies are enabled.
    Added Transport interface import and changed httpTransport field type from
    HttpTransport to Transport. Updated constructor parameter to accept
    Transport interface. The client now checks for rateLimitPolicy.enabled and
    retryPolicy.attempts to determine when to create enhanced transport vs
    standard transport.
  src/client/bridgeClientConfig.ts: Added imports for RateLimitConfig and
    RetryConfig interfaces. Extended BridgeClientConfig interface to include
    optional rateLimitPolicy and retryPolicy fields that store the validated
    transport policy configuration passed from the public BridgeConfig.
log:
  - Successfully integrated Enhanced HTTP Transport with rate limiting and retry
    support into the main BridgeClient. The implementation provides conditional
    enhanced transport creation when rate limiting or retry policies are
    enabled, while maintaining full backward compatibility. When rate limiting
    is enabled (rateLimitPolicy.enabled = true) or retry attempts are configured
    (retryPolicy.attempts > 0), the client automatically creates an
    EnhancedHttpTransport that wraps the base HttpTransport with the enhanced
    capabilities. When these features are disabled, the client uses the standard
    HttpTransport, ensuring no performance impact for users who don't need these
    features.
schema: v1.0
childrenIds: []
created: 2025-09-19T03:06:07.140Z
updated: 2025-09-19T03:06:07.140Z
---

# Integrate Enhanced Transport with Rate Limiting and Retry Support

## Context

This task integrates the enhanced HTTP transport with rate limiting and retry capabilities into the main BridgeClient. Simple caching support is handled automatically by providers through optional methods - no complex client-side cache management needed.

## Implementation Requirements

### Update BridgeConfigSchema for Rate Limiting and Retry Only

Update `src/core/config/bridgeConfigSchema.ts` (NO caching config needed):

```typescript
export const BridgeConfigSchema = z
  .object({
    // ... existing fields unchanged ...

    /** Rate limiting policy configuration */
    rateLimitPolicy: z
      .object({
        enabled: z.boolean().default(false),
        maxRps: z.number().positive().max(1000).optional(),
        burst: z.number().positive().max(10000).optional(),
        scope: z
          .enum(["global", "provider", "provider:model", "provider:model:key"])
          .default("provider:model:key"),
      })
      .optional(),

    /** Retry policy configuration */
    retryPolicy: z
      .object({
        attempts: z.number().int().min(0).max(10).default(2),
        backoff: z.enum(["exponential", "linear"]).default("exponential"),
        baseDelayMs: z.number().positive().max(60000).default(1000),
        maxDelayMs: z.number().positive().max(300000).default(30000),
        jitter: z.boolean().default(true),
        retryableStatusCodes: z
          .array(z.number().int().min(100).max(599))
          .default([429, 500, 502, 503, 504]),
      })
      .optional(),
  })
  .refine((config) => {
    // Validation logic for rate limiting and retry settings
    if (config.rateLimitPolicy?.enabled && !config.rateLimitPolicy.maxRps) {
      return false;
    }
    if (
      config.retryPolicy &&
      config.retryPolicy.baseDelayMs > config.retryPolicy.maxDelayMs
    ) {
      return false;
    }
    return true;
  });
```

### Update Client Factory (Simplified)

Modify `src/createClient.ts`:

```typescript
export function createClient(config: BridgeConfig): BridgeClient {
  const validatedConfig = BridgeConfigSchema.parse(config);

  // Create enhanced transport if rate limiting or retry enabled
  const transport = createTransportWithEnhancements(
    baseHttpConfig,
    validatedConfig.rateLimitPolicy,
    validatedConfig.retryPolicy,
  );

  // Use existing constructor pattern
  return new BridgeClient(validatedConfig, {
    transport,
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
```

### Simple Provider Caching Integration

Caching happens automatically when providers implement optional methods:

```typescript
// In the transport layer, when making requests:
function enhanceRequestWithCaching(
  request: ProviderHttpRequest,
  provider: ProviderPlugin,
  input: any,
): ProviderHttpRequest {
  // Add cache headers if provider supports caching
  if (provider.getCacheHeaders) {
    request.headers = {
      ...request.headers,
      ...provider.getCacheHeaders(),
    };
  }

  // Mark content for caching if provider supports it
  if (provider.markForCaching) {
    // Apply cache markers to system messages, tools, etc.
    input.system = input.system?.map(provider.markForCaching);
    input.tools = input.tools?.map(provider.markForCaching);
  }

  return request;
}
```

## Acceptance Criteria

### Configuration Integration

- ✅ Rate limiting configuration passed to enhanced transport
- ✅ Retry configuration passed to enhanced transport
- ✅ Disabled features create standard transport (backward compatibility)
- ✅ Configuration validation includes rate limiting and retry options
- ✅ Default values applied when configurations omitted
- ✅ No caching configuration needed (handled by provider capabilities)

### Client Integration

- ✅ Enhanced transport used when rate limiting or retry enabled
- ✅ Simple caching works automatically when providers support it
- ✅ Standard client behavior when features disabled
- ✅ Error handling preserves existing behavior
- ✅ Existing constructor pattern maintained

### End-to-End Functionality

- ✅ Rate limiting works through complete client request flow
- ✅ Retry logic works through complete client request flow
- ✅ Simple caching works with providers that implement optional methods
- ✅ All features can be enabled/disabled independently
- ✅ Backward compatibility maintained

## Files to Create/Modify

- **Update**: `src/core/config/bridgeConfigSchema.ts` - Add rate limiting and retry options only
- **Update**: `src/createClient.ts` - Integrate enhanced transport
- **Update**: `src/client/bridgeClient.ts` - Simple caching integration (if needed)
- **Create**: `src/client/__tests__/enhancedTransportIntegration.test.ts` - Integration tests
- **Update**: `src/core/config/bridgeConfig.ts` - Add interface types for new options

Estimated effort: 1.5 hours (simplified from 2 hours)
