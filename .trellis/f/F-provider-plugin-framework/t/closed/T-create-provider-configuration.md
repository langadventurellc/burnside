---
id: T-create-provider-configuration
title: Create provider configuration schemas
status: done
priority: medium
parent: F-provider-plugin-framework
prerequisites:
  - T-extend-providerplugin
affectedFiles:
  src/core/validation/providerSchemas.ts: Created comprehensive Zod schemas for
    provider configurations with base schema containing common fields and
    provider-specific extensions for OpenAI, Anthropic, Google, and xAI
  src/core/validation/providerSchemaTypes.ts: Created TypeScript types inferred
    from provider schemas for type-safe configuration handling
  src/core/validation/providerValidation.ts: Created validation utilities using
    existing validateOrThrow patterns with contextual error messages for
    provider configurations
  src/core/validation/index.ts: Updated exports to include new provider schemas,
    validation utilities, and types
  src/core/validation/__tests__/providerSchemas.test.ts: Created comprehensive
    test suite covering all schemas, validation utilities, error cases, and edge
    cases with 25 passing tests
  src/core/validation/__tests__/index.test.ts: Updated export completeness test to include new provider-related exports
log:
  - Successfully implemented comprehensive provider configuration schemas using
    Zod for all supported LLM providers (OpenAI, Anthropic, Google, xAI).
    Created base schema with common fields (baseUrl, apiKey, headers, timeout,
    rateLimiting, retry) and provider-specific extensions with appropriate
    defaults and validation rules. Implemented validation utilities that
    leverage existing validateOrThrow patterns with contextual error messages.
    All schemas follow the project's one-export-per-file rule and include
    comprehensive test coverage with 100% pass rate. Integration with existing
    validation infrastructure maintains consistency across the library.
schema: v1.0
childrenIds: []
created: 2025-09-15T17:05:30.221Z
updated: 2025-09-15T17:05:30.221Z
---

# Create Provider Configuration Schemas

## Context

Provider validation is currently inline within the registry. This task creates dedicated Zod schemas for provider configurations, enabling consistent validation across all providers and supporting the plugin registration process with type-safe configuration handling.

**Related Feature**: F-provider-plugin-framework - Provider Plugin Framework  
**Current State**: Provider configuration validation is scattered and inline  
**Target**: Centralized, reusable Zod schemas for provider configuration validation

## Specific Implementation Requirements

### 1. Create Provider Configuration Schemas (`src/core/validation/providerSchemas.ts`)

```typescript
import { z } from "zod";

/**
 * Base provider configuration schema with common fields
 */
export const BaseProviderConfigSchema = z.object({
  /** Base URL for the provider API */
  baseUrl: z.string().url().optional(),

  /** API key for authentication */
  apiKey: z.string().min(1).optional(),

  /** Custom headers to include in requests */
  headers: z.record(z.string(), z.string()).optional(),

  /** Request timeout in milliseconds */
  timeout: z.number().int().positive().max(60000).optional(),

  /** Rate limiting configuration */
  rateLimiting: z
    .object({
      requestsPerMinute: z.number().int().positive().optional(),
      tokensPerMinute: z.number().int().positive().optional(),
    })
    .optional(),

  /** Retry configuration */
  retry: z
    .object({
      maxAttempts: z.number().int().min(1).max(5).default(3),
      backoffMs: z.number().int().positive().default(1000),
      jitterMs: z.number().int().positive().default(100),
    })
    .optional(),
});

/**
 * OpenAI-specific provider configuration
 */
export const OpenAIProviderConfigSchema = BaseProviderConfigSchema.extend({
  baseUrl: z.string().url().default("https://api.openai.com/v1"),
  apiKey: z.string().min(1), // Required for OpenAI
  organization: z.string().optional(),
  project: z.string().optional(),
});

/**
 * Anthropic-specific provider configuration
 */
export const AnthropicProviderConfigSchema = BaseProviderConfigSchema.extend({
  baseUrl: z.string().url().default("https://api.anthropic.com"),
  apiKey: z.string().min(1), // Required for Anthropic
  version: z.string().default("2023-06-01"),
});

/**
 * Google-specific provider configuration
 */
export const GoogleProviderConfigSchema = BaseProviderConfigSchema.extend({
  baseUrl: z
    .string()
    .url()
    .default("https://generativelanguage.googleapis.com/v1beta"),
  apiKey: z.string().min(1), // Required for Google
  region: z.string().optional(),
});

/**
 * xAI-specific provider configuration
 */
export const XAIProviderConfigSchema = BaseProviderConfigSchema.extend({
  baseUrl: z.string().url().default("https://api.x.ai/v1"),
  apiKey: z.string().min(1), // Required for xAI
});

/**
 * Union type for all provider configurations
 */
export const ProviderConfigSchema = z.union([
  OpenAIProviderConfigSchema,
  AnthropicProviderConfigSchema,
  GoogleProviderConfigSchema,
  XAIProviderConfigSchema,
]);

/**
 * Provider registration schema with metadata
 */
export const ProviderRegistrationSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  config: ProviderConfigSchema,
  plugin: z.object({
    // Basic plugin shape validation - actual implementation validated at runtime
    id: z.string(),
    name: z.string(),
    version: z.string(),
    translateRequest: z.function(),
    parseResponse: z.function(),
    isTerminal: z.function(),
    normalizeError: z.function(),
  }),
});

// Type exports for TypeScript usage
export type BaseProviderConfig = z.infer<typeof BaseProviderConfigSchema>;
export type OpenAIProviderConfig = z.infer<typeof OpenAIProviderConfigSchema>;
export type AnthropicProviderConfig = z.infer<
  typeof AnthropicProviderConfigSchema
>;
export type GoogleProviderConfig = z.infer<typeof GoogleProviderConfigSchema>;
export type XAIProviderConfig = z.infer<typeof XAIProviderConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type ProviderRegistration = z.infer<typeof ProviderRegistrationSchema>;
```

### 2. Configuration Validation Utilities

```typescript
/**
 * Validate provider configuration with specific schema
 */
export function validateProviderConfig<T>(
  providerId: string,
  config: unknown,
  schema: z.ZodSchema<T>,
): T {
  return validateOrThrow(schema, config, {
    message: `Invalid configuration for provider '${providerId}'`,
  });
}

/**
 * Validate provider registration data
 */
export function validateProviderRegistration(
  registrationData: unknown,
): ProviderRegistration {
  return validateOrThrow(ProviderRegistrationSchema, registrationData, {
    message: "Invalid provider registration data",
  });
}
```

### 3. Integration with Existing Registry

Update provider registry to use these schemas during registration validation.

## Detailed Acceptance Criteria

### Base Schema Structure

- ✅ `BaseProviderConfigSchema` includes common fields: baseUrl, apiKey, headers, timeout
- ✅ Rate limiting configuration with requestsPerMinute and tokensPerMinute options
- ✅ Retry configuration with maxAttempts, backoffMs, and jitterMs
- ✅ All optional fields properly marked as optional in schema
- ✅ URL validation for baseUrl fields using Zod URL validation

### Provider-Specific Schemas

- ✅ OpenAI schema extends base with required apiKey, optional organization/project
- ✅ Anthropic schema extends base with required apiKey, version defaulting to "2023-06-01"
- ✅ Google schema extends base with required apiKey, optional region
- ✅ xAI schema extends base with required apiKey
- ✅ Each schema includes appropriate default baseUrl for the provider

### Validation Functions

- ✅ `validateProviderConfig` function accepts provider ID, config, and schema
- ✅ Uses existing `validateOrThrow` utility with contextual error messages
- ✅ `validateProviderRegistration` function validates complete registration data
- ✅ Error messages include provider identification for debugging
- ✅ Functions throw `ValidationError` on invalid configurations

### Type Safety

- ✅ All schemas use strict Zod typing (no `any` types)
- ✅ Type exports provided for all schemas and configurations
- ✅ TypeScript inference works correctly for all exported types
- ✅ Schema validation prevents invalid configurations at compile and runtime

### Integration Requirements

- ✅ Uses existing `validateOrThrow` utility from validation module
- ✅ Follows established patterns in `src/core/validation/`
- ✅ Compatible with current provider registry validation workflow
- ✅ Schemas support the enhanced ProviderPlugin interface

### Testing Requirements

- ✅ Unit tests for each provider-specific schema with valid configurations
- ✅ Validation error tests with invalid configurations (missing required fields, wrong types)
- ✅ Base schema inheritance tests to ensure proper extension behavior
- ✅ Type inference tests to verify TypeScript compatibility
- ✅ Integration tests with provider registration workflow

## Technical Approach

### File Organization

- **New File**: `src/core/validation/providerSchemas.ts`
- **Update**: `src/core/validation/index.ts` (add exports)
- **Imports**: Zod, existing `validateOrThrow` utility

### Schema Design Philosophy

- **Inheritance**: Base schema extended by provider-specific schemas
- **Validation**: Strict validation with meaningful error messages
- **Defaults**: Appropriate defaults for provider-specific fields
- **Extensibility**: Easy to add new providers by extending base schema

### Integration Strategy

- Provider registry will use these schemas during registration
- Configuration validation occurs before plugin initialization
- Error handling follows existing `ValidationError` patterns
- Type exports enable type-safe provider configuration

### Provider Configuration Examples

```typescript
// Valid OpenAI configuration
const openaiConfig: OpenAIProviderConfig = {
  apiKey: "sk-...",
  organization: "org-...",
  timeout: 30000,
};

// Valid Anthropic configuration
const anthropicConfig: AnthropicProviderConfig = {
  apiKey: "ant-...",
  version: "2023-06-01",
  rateLimiting: {
    requestsPerMinute: 60,
  },
};
```

## Dependencies

- **Prerequisite**: T-extend-providerplugin (needs ProviderPlugin interface)
- **Uses**: Existing `validateOrThrow` utility, Zod library
- **Blocks**: Provider registry enhancement task (needs these schemas)

## Out of Scope

- Provider-specific business logic or API communication
- Configuration file loading or management (handled by consuming applications)
- Runtime configuration updates or hot reloading
- Complex configuration inheritance beyond base schema extension

## Security Considerations

- API key validation ensures non-empty strings but doesn't validate actual keys
- URL validation prevents malformed URLs but allows any valid URL
- Header validation prevents injection by requiring string values
- Timeout limits prevent excessively long timeouts that could cause resource issues
- Retry limits prevent infinite retry loops
- Configuration validation should not log or expose sensitive values like API keys
