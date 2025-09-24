---
id: T-update-configuration
title: Update configuration validation for nested provider structure
status: done
priority: high
parent: F-multiple-named-provider
prerequisites:
  - T-update-bridgeconfig-interface
affectedFiles:
  src/client/bridgeClient.ts:
    Updated validateAndTransformConfig method to handle
    3-level nested provider structure, transform to flattened keys, support both
    old/new default provider formats, and updated getProviderConfigOrThrow for
    providerConfig parameter support
  src/client/bridgeClientConfig.ts: Added defaultProvider field to
    BridgeClientConfig interface for tracking resolved default provider with
    flattened key format
  src/client/__tests__/bridgeClient.nestedConfig.test.ts: Created comprehensive
    test suite with 18 test cases covering nested configuration validation,
    provider resolution, error handling, and backward compatibility scenarios
  src/client/__tests__/bridgeClientConfig.test.ts: Updated existing tests to use
    flattened provider keys (openai.default) and added defaultProvider field to
    all BridgeClientConfig test instances
  src/client/__tests__/bridgeClient.test.ts: Updated provider key expectations
    from openai to openai.default to match new flattened key format
  src/__tests__/createClient.test.ts:
    Updated all provider resolution tests to use
    flattened keys (openai.default, anthropic.default) instead of direct
    provider names
log:
  - >-
    Successfully updated configuration validation for the new three-level nested
    provider structure. The validateAndTransformConfig method now handles nested
    provider configurations (providerType → configName → config object) and
    transforms them into flattened keys for internal tracking. Key
    accomplishments:


    **Core Implementation:**

    - Updated validateAndTransformConfig method to process 3-level nested
    provider structure

    - Implemented flattened key generation (e.g., "openai.prod",
    "anthropic.main") for internal tracking

    - Enhanced default provider resolution to support both old format ("openai")
    and new format ("openai.prod")

    - Updated getProviderConfigOrThrow method to handle providerConfig parameter
    and flattened keys


    **Configuration Validation:**

    - Added comprehensive validation for nested configuration structure

    - Enhanced error messages to provide clear guidance about expected formats

    - Implemented backward compatibility for single configurations per provider

    - Added validation for malformed nested structures and empty configurations


    **Interface Updates:**

    - Added defaultProvider field to BridgeClientConfig interface for proper
    tracking

    - Updated provider resolution logic throughout chat() and stream() methods

    - Maintained type safety with concrete types (no "any" usage)


    **Comprehensive Testing:**

    - Created 18 new test cases covering all aspects of nested configuration
    validation

    - Updated existing tests to use flattened key format (openai.default vs
    openai)

    - Added tests for error handling, backward compatibility, and edge cases

    - All 3,765 tests passing with comprehensive coverage


    **Quality Assurance:**

    - All lint, format, and type-check validations pass

    - No breaking changes to external API (internal transformation handles
    compatibility)

    - Enhanced error messages provide clear guidance for developers

    - Maintains security best practices with input validation
schema: v1.0
childrenIds: []
created: 2025-09-24T19:22:56.018Z
updated: 2025-09-24T19:22:56.018Z
---

# Update Configuration Validation for Nested Provider Structure

## Context

The `validateAndTransformConfig` method in `BridgeClient` currently expects a flat provider configuration structure. This task updates the validation logic to handle the new three-level nested structure and transforms it for internal use.

**Related Files:**

- `src/client/bridgeClient.ts` - Main client implementation (validateAndTransformConfig method)
- **Reference**: Feature F-multiple-named-provider for requirements

## Specific Implementation Requirements

### 1. Update Configuration Transformation Logic

Modify `validateAndTransformConfig` method around line 1150-1215 to:

- Handle the new nested provider structure: `Record<string, Record<string, Record<string, unknown>>>`
- Transform nested configs into internal format for the `providersMap`
- Generate flattened keys like `"openai.prod"`, `"openai.dev"` for internal tracking

### 2. Update Provider Map Construction

Transform the providers object construction (around line 1161-1167):

```typescript
// Current logic transforms: providers: { openai: {...} }
// New logic should transform: providers: { openai: { prod: {...}, dev: {...} } }
const providersMap = new Map<string, Record<string, unknown>>();
if (config.providers) {
  for (const [providerType, configs] of Object.entries(config.providers)) {
    for (const [configName, providerConfig] of Object.entries(configs)) {
      const flattenedKey = `${providerType}.${configName}`;
      providersMap.set(flattenedKey, providerConfig);
    }
  }
}
```

### 3. Update Default Provider Logic

Modify default provider resolution (around line 1169-1191) to work with flattened keys:

- When `defaultProvider` is specified, ensure it maps to an actual configuration
- Handle both old format ("openai") and new format ("openai.prod") for `defaultProvider`
- Update error messages to reflect the new structure

### 4. Update Validation Error Messages

Enhance error messages to provide clear guidance about the nested structure:

- Show available provider configurations when validation fails
- Explain the new format requirements
- Provide examples of correct configuration structure

## Technical Approach

1. Analyze current `validateAndTransformConfig` method implementation
2. Update provider map construction to handle nested structure
3. Modify default provider resolution logic
4. Update validation error messages with nested structure context
5. Ensure backward compatibility handling where possible
6. Add comprehensive error handling for malformed nested structures

## Acceptance Criteria

### Configuration Processing

- **GIVEN** a nested provider configuration
- **WHEN** `validateAndTransformConfig` is called
- **THEN** the method successfully transforms it to internal format
- **AND** flattened provider keys are created correctly

### Default Provider Handling

- **GIVEN** a `defaultProvider` is specified as "openai.prod"
- **WHEN** validation runs
- **THEN** the system correctly resolves to the nested configuration
- **AND** validates the configuration exists

### Error Handling

- **GIVEN** an invalid nested configuration structure
- **WHEN** validation runs
- **THEN** clear error messages explain the expected format
- **AND** available configurations are listed in error messages

### Configuration Map Construction

- **GIVEN** multiple configurations per provider
- **WHEN** the internal providers map is built
- **THEN** each configuration is accessible via flattened key
- **AND** configurations are properly isolated

## Testing Requirements

### Unit Tests (include in this task)

- Test nested configuration validation with valid structures
- Test error handling for malformed nested configurations
- Test default provider resolution with new format
- Test flattened key generation for various provider/config combinations
- Test backwards compatibility scenarios
- Verify error message clarity and helpfulness

## Dependencies

- Requires T-update-bridgeconfig-interface for the updated type definitions
- Must be completed before provider resolution tasks

## Out of Scope

- Runtime provider resolution using the transformed configuration (separate task)
- Request-time configuration selection logic (separate task)
- Model registry integration with new configuration structure (separate task)
