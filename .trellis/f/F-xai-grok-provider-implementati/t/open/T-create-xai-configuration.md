---
id: T-create-xai-configuration
title: Create xAI configuration schema with validation
status: open
priority: high
parent: F-xai-grok-provider-implementati
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T19:55:39.211Z
updated: 2025-09-17T19:55:39.211Z
---

# Create xAI Configuration Schema with Validation

## Context

This task implements the foundational configuration schema for the xAI provider plugin, establishing the validation and type safety foundation that all other components will depend on. This follows the established pattern from existing providers like OpenAI and Google.

## Reference Implementation

Use `src/providers/openai-responses-v1/configSchema.ts` and `src/providers/google-gemini-v1/configSchema.ts` as reference patterns for structure and validation approach.

## Implementation Requirements

Create `src/providers/xai-v1/configSchema.ts` with the following components:

### Zod Configuration Schema

```typescript
export const XAIV1ConfigSchema = z.object({
  // API key validation with xAI-specific format
  apiKey: z
    .string()
    .min(1, "API key is required")
    .startsWith("xai-", "API key must start with 'xai-'"),

  // Base URL with HTTPS enforcement
  baseUrl: z
    .string()
    .url("Invalid base URL format")
    .refine(
      (url) => url.startsWith("https://"),
      "Base URL must use HTTPS protocol",
    )
    .default("https://api.x.ai/v1"),

  // Optional timeout with reasonable limits
  timeout: z
    .number()
    .int("Timeout must be an integer")
    .positive("Timeout must be positive")
    .max(300000, "Timeout cannot exceed 300000ms")
    .optional(),

  // Optional organization/project settings
  organization: z.string().optional(),
  project: z.string().optional(),

  // Custom headers for advanced usage
  headers: z.record(z.string(), z.string()).optional(),

  // Max retries with safe bounds
  maxRetries: z
    .number()
    .int("Max retries must be an integer")
    .min(0, "Max retries cannot be negative")
    .max(5, "Max retries cannot exceed 5")
    .default(3),
});
```

### TypeScript Type Export

```typescript
export type XAIV1Config = z.infer<typeof XAIV1ConfigSchema>;
```

### Security Considerations

- Validate API key format to prevent invalid authentication
- Enforce HTTPS to prevent insecure connections
- Set reasonable timeout limits to prevent resource exhaustion
- Limit retry attempts to prevent abuse

## Acceptance Criteria

### Functional Requirements

✅ **Schema Validation**: Configuration schema validates all required and optional fields correctly
✅ **API Key Format**: API key validation enforces "xai-" prefix requirement
✅ **HTTPS Enforcement**: Base URL validation requires HTTPS protocol
✅ **Type Safety**: Complete TypeScript type inference from Zod schema
✅ **Default Values**: Appropriate defaults for baseUrl, timeout, and maxRetries
✅ **Error Messages**: Clear, specific validation error messages for all fields

### Security Requirements

✅ **Format Validation**: API key format prevents invalid authentication attempts
✅ **Protocol Security**: HTTPS enforcement prevents insecure connections
✅ **Resource Limits**: Timeout and retry limits prevent resource exhaustion
✅ **Input Sanitization**: All configuration inputs validated through schema

### Code Quality Requirements

✅ **Documentation**: Comprehensive JSDoc comments for schema and type exports
✅ **Type Safety**: No `any` types, full TypeScript coverage
✅ **Error Handling**: Clear validation error messages with context
✅ **Consistency**: Follows established patterns from existing providers

## Testing Requirements

Include comprehensive unit tests in the same file covering:

### Valid Configuration Tests

- Valid xAI API key with proper prefix
- Custom base URL with HTTPS
- Timeout and retry configuration
- Optional headers and organization settings

### Validation Error Tests

- Invalid API key format (missing prefix, empty string)
- Invalid base URL format (HTTP instead of HTTPS, malformed URL)
- Invalid timeout values (negative, zero, too large)
- Invalid retry values (negative, too large)

### Default Value Tests

- Default base URL assignment
- Default timeout and retry values
- Optional field handling

## Implementation Steps

1. **Create Schema File**: Set up `src/providers/xai-v1/configSchema.ts`
2. **Import Dependencies**: Add Zod import and error types
3. **Define Schema**: Implement complete configuration validation schema
4. **Export Types**: Add TypeScript type inference export
5. **Add Documentation**: Include comprehensive JSDoc comments
6. **Write Unit Tests**: Create test coverage for all validation scenarios
7. **Verify Integration**: Ensure schema works with Zod validation patterns

## Dependencies

- **Prerequisites**: None (foundational component)
- **Blocks**: All other xAI provider components depend on this configuration schema

## Out of Scope

- Provider initialization logic (handled in main provider class)
- HTTP request configuration (handled in translator)
- Runtime configuration validation (handled during provider initialization)

## Technical Notes

- Follow the established Zod validation patterns from existing providers
- Ensure API key validation is strict enough to catch common mistakes
- Use HTTPS enforcement to maintain security standards
- Set conservative defaults for timeout and retry values
