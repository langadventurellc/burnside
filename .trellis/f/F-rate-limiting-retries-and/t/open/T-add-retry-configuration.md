---
id: T-add-retry-configuration
title: Add Retry Configuration Schema and Validation
status: open
priority: medium
parent: F-rate-limiting-retries-and
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:02:18.458Z
updated: 2025-09-19T03:02:18.458Z
---

# Add Retry Configuration Schema and Validation

## Context

This task extends the existing BridgeConfig schema to include optional retry policy configuration with proper Zod validation. It follows the established configuration pattern while ensuring backward compatibility and proper validation rules.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Pattern Reference**: T-add-rate-limiting-configuratio - Follow same approach
- **Existing Schema**: `src/core/config/bridgeConfigSchema.ts` - extend this file
- **Interface**: `src/core/config/bridgeConfig.ts` - extend this interface

## Implementation Requirements

### Extend BridgeConfig Interface

Update `src/core/config/bridgeConfig.ts` to add:

```typescript
export interface BridgeConfig {
  // ... existing fields unchanged ...

  /** Retry policy configuration */
  retryPolicy?: {
    /** Number of retry attempts (default: 2) */
    attempts?: number;
    /** Backoff strategy type */
    backoff?: "exponential" | "linear";
    /** Base delay in milliseconds */
    baseDelayMs?: number;
    /** Maximum delay in milliseconds */
    maxDelayMs?: number;
    /** Enable jitter to prevent thundering herd */
    jitter?: boolean;
    /** HTTP status codes that trigger retries */
    retryableStatusCodes?: number[];
  };
}
```

### Extend BridgeConfigSchema Validation

Update `src/core/config/bridgeConfigSchema.ts` to add Zod validation:

```typescript
export const BridgeConfigSchema = z.object({
  // ... existing schema fields unchanged ...

  /** Retry policy configuration */
  retryPolicy: z
    .object({
      /** Number of retry attempts */
      attempts: z
        .number()
        .int("Attempts must be an integer")
        .min(0, "Attempts cannot be negative")
        .max(10, "Attempts cannot exceed 10")
        .default(2)
        .describe("Number of retry attempts"),

      /** Backoff strategy */
      backoff: z
        .enum(["exponential", "linear"])
        .default("exponential")
        .describe("Backoff strategy type"),

      /** Base delay in milliseconds */
      baseDelayMs: z
        .number()
        .positive("Base delay must be positive")
        .max(60000, "Base delay cannot exceed 60 seconds")
        .default(1000)
        .describe("Base delay in milliseconds"),

      /** Maximum delay in milliseconds */
      maxDelayMs: z
        .number()
        .positive("Max delay must be positive")
        .max(300000, "Max delay cannot exceed 5 minutes")
        .default(30000)
        .describe("Maximum delay in milliseconds"),

      /** Enable jitter */
      jitter: z
        .boolean()
        .default(true)
        .describe("Enable jitter to prevent thundering herd"),

      /** Retryable status codes */
      retryableStatusCodes: z
        .array(z.number().int().min(100).max(599))
        .default([429, 500, 502, 503, 504])
        .describe("HTTP status codes that trigger retries"),
    })
    .optional()
    .describe("Retry policy configuration")
    .refine(
      (policy) => {
        // Base delay must be less than or equal to max delay
        if (policy && policy.baseDelayMs > policy.maxDelayMs) {
          return false;
        }
        return true;
      },
      {
        message: "baseDelayMs must be less than or equal to maxDelayMs",
      },
    ),
});
```

## Acceptance Criteria

### Schema Validation

- ✅ Optional retry configuration validates correctly
- ✅ Attempt limits enforced (0-10 range)
- ✅ Delay validation ensures baseDelayMs ≤ maxDelayMs
- ✅ Status codes validated as HTTP range (100-599)
- ✅ Backoff strategy enum validates correctly
- ✅ Sensible defaults applied when fields omitted
- ✅ Backward compatibility maintained

### Unit Tests Required

Create comprehensive tests in `src/core/config/__tests__/retryConfig.test.ts`:

1. **Valid Configurations**
   - Default configuration (empty object)
   - Minimal configuration (just attempts)
   - Full configuration with all fields
   - Custom status codes array

2. **Validation Rules**
   - Negative attempts should fail
   - Excessive attempts (>10) should fail
   - Negative delays should fail
   - baseDelayMs > maxDelayMs should fail
   - Invalid status codes (<100 or >599) should fail
   - Invalid backoff strategy should fail

3. **Default Values**
   - Default attempts: 2
   - Default backoff: 'exponential'
   - Default baseDelayMs: 1000
   - Default maxDelayMs: 30000
   - Default jitter: true
   - Default status codes: [429, 500, 502, 503, 504]

4. **Backward Compatibility**
   - Configs without retryPolicy validate
   - All fields optional
   - No breaking changes to existing validation

### Test Data Examples

```typescript
// Valid configurations
const validConfigs = [
  {}, // Default configuration
  { retryPolicy: { attempts: 3 } },
  { retryPolicy: { attempts: 5, backoff: "linear", baseDelayMs: 2000 } },
  { retryPolicy: { retryableStatusCodes: [429, 500] } },
];

// Invalid configurations
const invalidConfigs = [
  { retryPolicy: { attempts: -1 } }, // Negative attempts
  { retryPolicy: { attempts: 15 } }, // Excessive attempts
  { retryPolicy: { baseDelayMs: 5000, maxDelayMs: 1000 } }, // Base > max
  { retryPolicy: { retryableStatusCodes: [99, 600] } }, // Invalid status codes
];
```

## Security Considerations

- **Resource Protection**: Maximum values prevent resource exhaustion
- **DoS Prevention**: Attempt limits prevent infinite retry loops
- **Input Validation**: Strict validation prevents configuration injection

## Dependencies

- **Zod**: Existing validation library
- **Existing Config**: Current BridgeConfig structure

## Out of Scope

- Runtime configuration updates (handled by retry policy manager)
- Provider-specific retry overrides (future enhancement)
- Retry metrics configuration (future enhancement)
- Integration with retry implementation (separate task)

## Files to Create/Modify

- **Update**: `src/core/config/bridgeConfig.ts` - Add interface fields
- **Update**: `src/core/config/bridgeConfigSchema.ts` - Add Zod validation
- **Create**: `src/core/config/__tests__/retryConfig.test.ts` - Unit tests
- **Update**: `src/core/config/__tests__/bridgeConfigSchema.test.ts` - Add test cases

Estimated effort: 1 hour
