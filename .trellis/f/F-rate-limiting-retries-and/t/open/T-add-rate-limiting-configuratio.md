---
id: T-add-rate-limiting-configuratio
title: Add Rate Limiting Configuration Schema and Validation
status: open
priority: medium
parent: F-rate-limiting-retries-and
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:00:45.860Z
updated: 2025-09-19T03:00:45.860Z
---

# Add Rate Limiting Configuration Schema and Validation

## Context

This task extends the existing BridgeConfig schema to include optional rate limiting configuration with proper Zod validation. It follows the established pattern in the codebase for configuration management while maintaining backward compatibility.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Existing Pattern**: `src/core/config/bridgeConfigSchema.ts` - follow this structure
- **Interface Definition**: `src/core/config/bridgeConfig.ts` - extend this interface
- **Architecture Reference**: `docs/library-architecture.md` Rate Limiting config examples

## Implementation Requirements

### Extend BridgeConfig Interface

Update `src/core/config/bridgeConfig.ts` to add:

```typescript
export interface BridgeConfig {
  // ... existing fields unchanged ...

  /** Rate limiting policy configuration */
  rateLimitPolicy?: {
    /** Enable/disable rate limiting (default: false) */
    enabled?: boolean;
    /** Maximum requests per second */
    maxRps?: number;
    /** Burst capacity (default: maxRps * 2) */
    burst?: number;
    /** Rate limiting scope granularity */
    scope?: "global" | "provider" | "provider:model" | "provider:model:key";
  };
}
```

### Extend BridgeConfigSchema Validation

Update `src/core/config/bridgeConfigSchema.ts` to add Zod validation:

```typescript
export const BridgeConfigSchema = z.object({
  // ... existing schema fields unchanged ...

  /** Rate limiting policy configuration */
  rateLimitPolicy: z
    .object({
      /** Enable/disable rate limiting */
      enabled: z
        .boolean()
        .default(false)
        .describe("Enable rate limiting functionality"),

      /** Maximum requests per second */
      maxRps: z
        .number()
        .positive("Max RPS must be positive")
        .max(1000, "Max RPS cannot exceed 1000")
        .optional()
        .describe("Maximum requests per second"),

      /** Burst capacity */
      burst: z
        .number()
        .positive("Burst capacity must be positive")
        .max(10000, "Burst capacity cannot exceed 10000")
        .optional()
        .describe("Burst capacity for rate limiting"),

      /** Rate limiting scope */
      scope: z
        .enum(["global", "provider", "provider:model", "provider:model:key"])
        .default("provider:model:key")
        .describe("Rate limiting scope granularity"),
    })
    .optional()
    .describe("Rate limiting policy configuration")
    .refine(
      (policy) => {
        // If enabled, maxRps is required
        if (policy?.enabled && !policy.maxRps) {
          return false;
        }
        return true;
      },
      {
        message: "maxRps is required when rate limiting is enabled",
      },
    )
    .transform((policy) => {
      // Set default burst to maxRps * 2 if not specified
      if (policy?.enabled && policy.maxRps && !policy.burst) {
        return {
          ...policy,
          burst: policy.maxRps * 2,
        };
      }
      return policy;
    }),
});
```

## Acceptance Criteria

### Schema Validation

- ✅ Optional rate limiting configuration validates correctly
- ✅ Enabled rate limiting requires maxRps to be specified
- ✅ Default burst capacity is maxRps \* 2 when not specified
- ✅ Scope enum validates against allowed values
- ✅ Reasonable limits enforced (maxRps ≤ 1000, burst ≤ 10000)
- ✅ Backward compatibility maintained (all fields optional)

### Unit Tests Required

Create comprehensive tests in `src/core/config/__tests__/rateLimitingConfig.test.ts`:

1. **Valid Configurations**
   - Minimal enabled configuration (just enabled + maxRps)
   - Full configuration with all fields specified
   - Disabled configuration (enabled: false)
   - Missing rateLimitPolicy (should be valid)

2. **Validation Rules**
   - Enabled without maxRps should fail
   - Negative maxRps should fail
   - Excessive maxRps (>1000) should fail
   - Negative burst should fail
   - Invalid scope enum should fail

3. **Default Value Behavior**
   - Default enabled: false
   - Default scope: 'provider:model:key'
   - Auto-calculated burst when not specified
   - Preserved burst when explicitly specified

4. **Backward Compatibility**
   - Existing configs without rateLimitPolicy validate
   - All new fields are optional
   - No breaking changes to existing validation

### Test Data Examples

```typescript
// Valid configurations
const validConfigs = [
  { rateLimitPolicy: { enabled: true, maxRps: 10 } },
  {
    rateLimitPolicy: { enabled: true, maxRps: 5, burst: 20, scope: "provider" },
  },
  { rateLimitPolicy: { enabled: false } },
  {}, // No rate limiting config
];

// Invalid configurations
const invalidConfigs = [
  { rateLimitPolicy: { enabled: true } }, // Missing maxRps
  { rateLimitPolicy: { enabled: true, maxRps: -1 } }, // Negative maxRps
  { rateLimitPolicy: { enabled: true, maxRps: 2000 } }, // Excessive maxRps
  { rateLimitPolicy: { enabled: true, maxRps: 10, scope: "invalid" } }, // Bad scope
];
```

## Security Considerations

- **Input Validation**: Strict validation prevents configuration injection
- **Resource Limits**: Maximum values prevent resource exhaustion
- **Safe Defaults**: Conservative defaults protect against misconfiguration

## Dependencies

- **Zod**: Existing validation library (already in package.json)
- **Existing Config**: Build on current BridgeConfig structure

## Out of Scope

- Runtime configuration updates (separate concern)
- Rate limiter implementation integration (separate task)
- Provider-specific configuration overrides (future enhancement)
- Configuration file loading/parsing (existing functionality)

## Files to Create/Modify

- **Update**: `src/core/config/bridgeConfig.ts` - Add interface fields
- **Update**: `src/core/config/bridgeConfigSchema.ts` - Add Zod validation
- **Create**: `src/core/config/__tests__/rateLimitingConfig.test.ts` - Unit tests
- **Update**: `src/core/config/__tests__/bridgeConfigSchema.test.ts` - Add test cases

Estimated effort: 1 hour
