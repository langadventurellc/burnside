---
id: F-multiple-named-provider
title: Multiple Named Provider Configurations
status: in-progress
priority: medium
parent: none
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
    parameter support is added; Updated validateAndTransformConfig method to
    handle 3-level nested provider structure, transform to flattened keys,
    support both old/new default provider formats, and updated
    getProviderConfigOrThrow for providerConfig parameter support; Updated
    initializeProviderIfNeeded method to accept optional configName parameter
    and include it in provider tracking key format
    (providerId:version:configName). Updated both chat and stream methods to
    pass request.providerConfig to provider initialization.; Added
    validateProviderConfigRequirement() and getConfigurationsForProvider()
    private methods. Updated error code in getProviderConfigOrThrow from
    MULTIPLE_PROVIDER_CONFIGS to PROVIDER_CONFIG_REQUIRED. Added validation
    calls in both chat() and stream() methods after ensureModelRegistered()
    call.
  src/__tests__/createClient.test.ts: Updated all test configurations to use the
    new 3-level nested structure and corrected expected error paths and test
    assertions; Updated all provider resolution tests to use flattened keys
    (openai.default, anthropic.default) instead of direct provider names
  src/__tests__/e2e/shared/createMcpTestConfig.ts: Fixed malformed configuration
    structure to properly use the new nested provider format
  src/client/chatRequest.ts: Added optional providerConfig parameter to
    ChatRequest interface and updated JSDoc documentation with comprehensive
    examples showing usage with named provider configurations
  src/client/streamRequest.ts: Updated JSDoc examples to include providerConfig
    usage in streaming scenarios, demonstrating inheritance from ChatRequest
    interface
  src/client/__tests__/chatRequest.test.ts:
    Added comprehensive test coverage for
    providerConfig parameter including interface structure tests, TypeScript
    compilation tests, and type safety validation
  src/client/__tests__/streamRequest.test.ts:
    Added inheritance verification tests
    for providerConfig parameter to ensure proper type compatibility between
    StreamRequest and ChatRequest interfaces
  src/client/bridgeClientConfig.ts: Added defaultProvider field to
    BridgeClientConfig interface for tracking resolved default provider with
    flattened key format
  src/client/__tests__/bridgeClient.nestedConfig.test.ts: Created comprehensive
    test suite with 18 test cases covering nested configuration validation,
    provider resolution, error handling, and backward compatibility scenarios;
    Updated test expectation to match new PROVIDER_CONFIG_REQUIRED error message
    instead of old Multiple configurations found message.
  src/client/__tests__/bridgeClientConfig.test.ts: Updated existing tests to use
    flattened provider keys (openai.default) and added defaultProvider field to
    all BridgeClientConfig test instances
  src/client/__tests__/bridgeClient.test.ts: Updated provider key expectations
    from openai to openai.default to match new flattened key format
  src/client/__tests__/bridgeClient.providerInitialization.test.ts:
    Added comprehensive unit tests covering provider initialization tracking
    with configuration names, ensuring proper isolation between multiple
    configs, verifying no reinitialize on subsequent requests, testing stream
    method integration, and maintaining backward compatibility for single
    configurations.
  src/client/__tests__/bridgeClient.validation.test.ts:
    Created comprehensive test
    suite with 10 unit tests covering validateProviderConfigRequirement and
    getConfigurationsForProvider methods, testing single/multiple
    configurations, invalid configs, error messages, and edge cases.
log: []
schema: v1.0
childrenIds:
  - T-add-request-validation-for
  - T-update-model-seeding-to-work
  - T-add-providerconfig-parameter
  - T-update-bridgeconfig-interface
  - T-update-configuration
  - T-update-provider-resolution-to
created: 2025-09-24T19:08:11.414Z
updated: 2025-09-24T19:08:11.414Z
---

# Multiple Named Provider Configurations

## Purpose and Functionality

Enable the LLM Bridge library to support multiple named configurations per provider instead of the current single configuration per provider. This allows users to configure multiple instances of the same provider with different settings (e.g., "openai-prod", "openai-dev", "anthropic-main", "anthropic-backup").

## Key Components to Implement

### 1. Configuration Schema Changes

- Transform `BridgeConfig.providers` from `Record<string, Record<string, unknown>>` to `Record<string, Record<string, Record<string, unknown>>>`
- First key: provider type (e.g., "openai", "anthropic")
- Second key: configuration name (e.g., "prod", "dev")
- Third level: actual configuration object

### 2. Request Interface Updates

- Add required `providerConfig` parameter to `ChatRequest` and `StreamRequest`
- Users must specify which named configuration to use per request
- No default selection - configuration name is mandatory when multiple configs exist

### 3. Provider Resolution System

- Update provider lookup to handle both provider ID and configuration name
- Modify provider initialization tracking to support multiple configs per provider
- Change provider key generation to include configuration name

### 4. Model Registry Integration

- Update built-in model seeding to only activate for configured providers
- Ensure models are properly associated with available provider configurations

## Detailed Acceptance Criteria

### Configuration Interface

- **GIVEN** a user configures multiple OpenAI instances
- **WHEN** they provide a config like:
  ```typescript
  providers: {
    openai: {
      prod: { apiKey: "sk-prod...", timeout: 30000 },
      dev: { apiKey: "sk-dev...", timeout: 10000 }
    }
  }
  ```
- **THEN** the system accepts and validates the nested structure

### Request Routing

- **GIVEN** multiple configurations exist for a provider
- **WHEN** a request specifies `{ model: "openai:gpt-4", providerConfig: "prod" }`
- **THEN** the system uses the "prod" configuration for that provider
- **WHEN** a `providerConfig` is not specified and multiple configs exist
- **THEN** the system throws a validation error requiring the user to specify which configuration to use

### Provider Initialization

- **GIVEN** multiple configurations for the same provider
- **WHEN** requests use different configurations
- **THEN** each configuration is initialized independently with its own settings
- **AND** provider instances are properly isolated

### Model Seeding with Built-in

- **GIVEN** `modelSeed: "builtin"` is configured
- **WHEN** named configurations exist for specific providers
- **THEN** built-in models are only registered for those configured providers
- **WHEN** no named configurations exist for any provider
- **THEN** no built-in models are registered

### Error Handling

- **GIVEN** a request specifies an invalid provider configuration name
- **WHEN** the system attempts to resolve the provider
- **THEN** a clear error message indicates the missing configuration name and lists available options
- **GIVEN** multiple configurations exist for a provider
- **WHEN** no `providerConfig` is specified in the request
- **THEN** the system returns an error requiring configuration selection

### Backward Compatibility

- **GIVEN** this is a greenfield project with no existing users
- **WHEN** implementing the changes
- **THEN** breaking changes are acceptable without migration paths

## Implementation Guidance

### Technical Approach

1. **Configuration Schema**: Use three-level nesting for clean separation
2. **Provider Keys**: Use format `${providerId}:${version}:${configName}` for internal tracking
3. **Mandatory Selection**: Require `providerConfig` when multiple configurations exist
4. **Validation**: Ensure all referenced configurations exist during initialization

### Code Patterns

- Extend existing validation logic in `validateAndTransformConfig`
- Update `getProviderConfigOrThrow` to accept configuration name parameter
- Modify provider initialization tracking in `BridgeClient`
- Update model seeding logic to check for named configurations

## Testing Requirements

### Unit Tests

- Configuration validation with nested provider structures
- Provider resolution with configuration names
- Model seeding behavior with various configuration scenarios
- Error handling for missing configurations and missing configuration selection

### Integration Tests

- End-to-end request flow with named configurations
- Provider initialization with multiple configurations
- Built-in model seeding integration

## Dependencies

This feature has no dependencies on other features and can be implemented as a standalone enhancement to the existing codebase.

## Files to Modify

### Core Files

- `src/core/config/bridgeConfig.ts` - Configuration interface
- `src/client/bridgeClient.ts` - Main client implementation
- `src/client/chatRequest.ts` - Chat request interface
- `src/client/streamRequest.ts` - Stream request interface

### Support Files

- Configuration validation logic
- Provider resolution utilities
- Model seeding functionality
- Error message templates
