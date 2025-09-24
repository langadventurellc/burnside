---
id: T-add-request-validation-for
title: Add request validation for providerConfig parameter
status: done
priority: medium
parent: F-multiple-named-provider
prerequisites:
  - T-update-provider-resolution-to
affectedFiles:
  src/client/bridgeClient.ts: Added validateProviderConfigRequirement() and
    getConfigurationsForProvider() private methods. Updated error code in
    getProviderConfigOrThrow from MULTIPLE_PROVIDER_CONFIGS to
    PROVIDER_CONFIG_REQUIRED. Added validation calls in both chat() and stream()
    methods after ensureModelRegistered() call.
  src/client/__tests__/bridgeClient.nestedConfig.test.ts:
    Updated test expectation
    to match new PROVIDER_CONFIG_REQUIRED error message instead of old Multiple
    configurations found message.
  src/client/__tests__/bridgeClient.validation.test.ts:
    Created comprehensive test
    suite with 10 unit tests covering validateProviderConfigRequirement and
    getConfigurationsForProvider methods, testing single/multiple
    configurations, invalid configs, error messages, and edge cases.
log:
  - "Successfully implemented comprehensive request validation for the
    providerConfig parameter. Added two new private methods to BridgeClient:
    validateProviderConfigRequirement() for early validation and
    getConfigurationsForProvider() for configuration discovery. Updated both
    chat() and stream() methods to validate providerConfig early in the request
    cycle. Updated error codes from MULTIPLE_PROVIDER_CONFIGS to
    PROVIDER_CONFIG_REQUIRED for consistency. Added comprehensive unit test
    coverage with 10 test cases covering all validation scenarios including
    multiple configs, invalid configs, and edge cases. All 145 existing tests
    continue to pass, ensuring no regressions."
schema: v1.0
childrenIds: []
created: 2025-09-24T19:24:25.983Z
updated: 2025-09-24T19:24:25.983Z
---

# Add Request Validation for providerConfig Parameter

## Context

With the new `providerConfig` parameter in requests, validation logic is needed to ensure users provide the required configuration name when multiple configurations exist for a provider, and to provide clear error messages when invalid configuration names are specified.

**Related Files:**

- `src/client/bridgeClient.ts` - Request validation in chat/stream methods
- **Reference**: Feature F-multiple-named-provider for requirements

## Specific Implementation Requirements

### 1. Add Configuration Requirement Validation

Create validation method to check if `providerConfig` is required:

```typescript
private validateProviderConfigRequirement(
  providerId: string,
  providerConfigName?: string
): void {
  // Get all configurations for this provider type
  const providerConfigs = this.getConfigurationsForProvider(providerId);

  if (providerConfigs.length > 1 && !providerConfigName) {
    throw new BridgeError(
      `Provider configuration name required. Provider '${providerId}' has multiple configurations: ${providerConfigs.join(', ')}`,
      "PROVIDER_CONFIG_REQUIRED",
      { providerId, availableConfigs: providerConfigs }
    );
  }

  if (providerConfigName && !providerConfigs.includes(providerConfigName)) {
    throw new BridgeError(
      `Invalid provider configuration '${providerConfigName}' for provider '${providerId}'. Available configurations: ${providerConfigs.join(', ')}`,
      "INVALID_PROVIDER_CONFIG",
      { providerId, requestedConfig: providerConfigName, availableConfigs: providerConfigs }
    );
  }
}
```

### 2. Add Helper Method for Configuration Discovery

Create utility to find all configurations for a provider type:

```typescript
private getConfigurationsForProvider(providerId: string): string[] {
  const configurations: string[] = [];
  for (const key of this.config.providers.keys()) {
    if (key.startsWith(`${providerId}.`)) {
      const configName = key.split('.')[1];
      configurations.push(configName);
    } else if (key === providerId) {
      // Handle legacy single configuration format if needed
      configurations.push('default');
    }
  }
  return configurations;
}
```

### 3. Integrate Validation into Chat Method

Add validation call in `chat` method before provider resolution (around line 337):

```typescript
async chat(request: ChatRequest): Promise<Message> {
  // ... existing code ...

  const modelId = this.qualifyModelId(request.model);
  this.ensureModelRegistered(modelId);

  // Resolve provider and validate configuration requirement
  const { id, version } = this.getProviderKeyFromModel(modelId);
  this.validateProviderConfigRequirement(id, request.providerConfig);

  // ... rest of existing logic ...
}
```

### 4. Integrate Validation into Stream Method

Add identical validation call in `stream` method before provider resolution (around line 486):

```typescript
async stream(request: StreamRequest): Promise<AsyncIterable<StreamDelta>> {
  // ... existing code ...

  const modelId = this.qualifyModelId(request.model);
  this.ensureModelRegistered(modelId);

  // Resolve provider and validate configuration requirement
  const { id, version } = this.getProviderKeyFromModel(modelId);
  this.validateProviderConfigRequirement(id, request.providerConfig);

  // ... rest of existing logic ...
}
```

## Technical Approach

1. Create configuration discovery utility to find available configs per provider
2. Implement validation logic for required vs optional `providerConfig` parameter
3. Add clear, actionable error messages with available options
4. Integrate validation into both chat and stream request flows
5. Ensure validation happens early in the request cycle for fast feedback
6. Handle edge cases like single configurations and legacy format

## Acceptance Criteria

### Multiple Configuration Validation

- **GIVEN** multiple configurations exist for "openai" provider
- **WHEN** a request omits `providerConfig` parameter
- **THEN** system throws "PROVIDER_CONFIG_REQUIRED" error
- **AND** error message lists all available configuration names

### Invalid Configuration Validation

- **GIVEN** a request specifies `providerConfig: "invalid"`
- **WHEN** validation runs
- **THEN** system throws "INVALID_PROVIDER_CONFIG" error
- **AND** error message shows the invalid name and lists valid options

### Single Configuration Bypass

- **GIVEN** only one configuration exists for a provider
- **WHEN** `providerConfig` is omitted from request
- **THEN** validation passes without error
- **AND** request continues processing normally

### Error Message Clarity

- **GIVEN** any configuration validation error
- **WHEN** error is thrown
- **THEN** error message clearly explains the problem
- **AND** error context includes available configuration options

## Testing Requirements

### Unit Tests (include in this task)

- Test validation with multiple configurations requiring providerConfig
- Test validation with invalid configuration names
- Test single configuration scenarios that don't require providerConfig
- Test error message content and structure
- Test integration with both chat and stream methods
- Mock provider configurations to test various scenarios

## Dependencies

- Requires T-update-provider-resolution-to for the provider resolution infrastructure
- Should be completed before end-to-end testing

## Out of Scope

- Advanced configuration selection algorithms (only basic name matching)
- Configuration auto-discovery or suggestion features
- Integration with external configuration management systems
