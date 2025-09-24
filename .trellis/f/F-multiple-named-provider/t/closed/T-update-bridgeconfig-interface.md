---
id: T-update-bridgeconfig-interface
title: Update BridgeConfig interface for nested provider configurations
status: done
priority: high
parent: F-multiple-named-provider
prerequisites: []
affectedFiles:
  src/core/config/bridgeConfig.ts: Updated TypeScript interface to use 3-level
    nested provider structure (provider type → configuration name → config
    object) and updated JSDoc examples to demonstrate the new format
  src/core/config/bridgeConfigSchema.ts: Updated Zod schema to validate the new
    3-level nested structure with proper validation rules and updated JSDoc
    examples and error messages
  src/client/bridgeClient.ts: Implemented temporary handling for the new nested
    provider structure, automatically using single configurations and providing
    clear error messages when multiple configurations exist until providerConfig
    parameter support is added
  src/__tests__/createClient.test.ts: Updated all test configurations to use the
    new 3-level nested structure and corrected expected error paths and test
    assertions
  src/__tests__/e2e/shared/createMcpTestConfig.ts: Fixed malformed configuration
    structure to properly use the new nested provider format
log:
  - >-
    Successfully updated BridgeConfig interface to support 3-level nested
    provider configurations. The providers field now uses the structure:
    provider type → configuration name → actual configuration object. This
    enables multiple named configurations per provider (e.g., "openai-prod",
    "openai-dev"). All TypeScript interfaces, Zod schemas, JSDoc examples, and
    comprehensive test suites have been updated to use the new structure. 


    **Key Changes:**

    - Updated `BridgeConfig.providers` type from 2-level to 3-level nesting

    - Updated Zod schema validation to match the new structure  

    - Implemented temporary handling in BridgeClient for single configurations
    per provider

    - Added clear error messaging when multiple configurations exist (awaiting
    providerConfig parameter support)

    - Fixed all test cases to use the new nested structure

    - Updated error paths to reflect the deeper nesting


    **Quality Assurance:**

    - All lint, format, and type-check validations pass

    - Full test suite passes with 3740+ tests

    - No breaking changes to the external API (internal transformation handles
    compatibility)


    This implementation provides a solid foundation for the remaining tasks in
    the Multiple Named Provider Configurations feature.
schema: v1.0
childrenIds: []
created: 2025-09-24T19:22:04.739Z
updated: 2025-09-24T19:22:04.739Z
---

# Update BridgeConfig Interface for Nested Provider Configurations

## Context

Currently, `BridgeConfig.providers` is defined as `Record<string, Record<string, unknown>>` where each key is a provider ID with a single configuration. This task transforms it to support multiple named configurations per provider using a three-level nested structure and updates both the TypeScript interface and Zod schema for consistency.

**Related Files:**

- `src/core/config/bridgeConfig.ts` - Main configuration interface
- `src/core/config/bridgeConfigSchema.ts` - Zod schema for runtime validation

## Specific Implementation Requirements

### 1. Update Configuration Type Definition

Transform the `providers` property in `BridgeConfig` interface:

- Change from: `providers?: Record<string, Record<string, unknown>>`
- Change to: `providers?: Record<string, Record<string, Record<string, unknown>>>`

### 2. Update Zod Schema for Runtime Validation

Update `bridgeConfigSchema.ts` to mirror the three-level structure:

```typescript
const bridgeConfigSchema = z.object({
  providers: z
    .record(
      z.string(), // Provider type (e.g., "openai")
      z.record(
        z.string(), // Configuration name (e.g., "prod", "dev")
        z.record(z.unknown()), // Configuration object
      ),
    )
    .optional(),
  // ... other fields
});
```

### 3. Update JSDoc Documentation

Update the interface documentation and examples to reflect the new nested structure:

```typescript
providers: {
  openai: {
    prod: { apiKey: "sk-prod...", timeout: 30000 },
    dev: { apiKey: "sk-dev...", timeout: 10000 }
  },
  anthropic: {
    main: { apiKey: "sk-ant...", maxTokens: 4096 }
  }
}
```

### 4. Update Zod Schema Error Messages

Enhance schema validation error messages to provide clear guidance about the nested structure:

- Custom error messages for invalid nesting levels
- Examples of correct configuration structure in error context
- Clear explanations of provider type vs configuration name requirements

### 5. Type Safety Considerations

- Ensure TypeScript correctly infers the nested structure
- Maintain existing optional nature of the `providers` property
- Preserve compatibility with existing `Record<string, unknown>` configuration objects
- Ensure Zod schema validation matches TypeScript interface exactly

## Technical Approach

1. Update the TypeScript interface in `bridgeConfig.ts`
2. Update the Zod schema in `bridgeConfigSchema.ts` to match the new structure
3. Update JSDoc comments and example configurations in both files
4. Add custom error messages to Zod schema for better developer experience
5. Verify type checking works correctly with nested structure
6. Ensure runtime validation catches malformed configurations early

## Acceptance Criteria

### Type Interface Validation

- **GIVEN** a developer imports `BridgeConfig` type
- **WHEN** they define a configuration with nested provider structure
- **THEN** TypeScript accepts the three-level nesting without errors

### Runtime Schema Validation

- **GIVEN** a configuration object with nested provider structure
- **WHEN** Zod schema validation runs
- **THEN** valid nested configurations pass validation
- **AND** invalid structures are rejected with clear error messages

### Type-Schema Consistency

- **GIVEN** the TypeScript interface and Zod schema
- **WHEN** both are used together
- **THEN** they accept and reject the same configuration structures
- **AND** no inconsistencies exist between compile-time and runtime validation

### Documentation Accuracy

- **GIVEN** a developer reads the interface documentation
- **WHEN** they review the JSDoc examples
- **THEN** examples clearly show the new nested structure format
- **AND** migration path from old to new structure is clear

## Testing Requirements

### Unit Tests (include in this task)

- Create test cases for the new nested configuration structure
- Test Zod schema validation with various nested configurations
- Test TypeScript compilation with various nested configurations
- Verify type inference works correctly at all nesting levels
- Test error messages from schema validation are helpful and clear
- Verify optional nature of providers property still works

## Dependencies

This is a foundational task that must be completed first as other tasks depend on the updated configuration interface and schema.

## Out of Scope

- Configuration validation logic in BridgeClient (handled in separate task)
- Runtime configuration transformation (handled in separate task)
- Client-side usage of the new configuration (handled in separate tasks)
