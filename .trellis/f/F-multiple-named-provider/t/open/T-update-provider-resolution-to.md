---
id: T-update-provider-resolution-to
title: Update provider resolution to support configuration names
status: open
priority: high
parent: F-multiple-named-provider
prerequisites:
  - T-add-providerconfig-parameter
  - T-update-configuration
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-24T19:23:22.276Z
updated: 2025-09-24T19:23:22.276Z
---

# Update Provider Resolution to Support Configuration Names

## Context

The provider resolution system in `BridgeClient` needs to be updated to handle named configurations. This includes updating `getProviderConfigOrThrow`, provider initialization tracking, and provider key generation to work with the new nested configuration structure.

**Related Files:**

- `src/client/bridgeClient.ts` - Provider resolution methods (getProviderConfigOrThrow, initializeProviderIfNeeded)
- **Reference**: Feature F-multiple-named-provider for requirements

## Specific Implementation Requirements

### 1. Update getProviderConfigOrThrow Method

Modify the method signature and implementation (around line 232-244):

```typescript
private getProviderConfigOrThrow(
  providerId: string,
  configName?: string
): Record<string, unknown> {
  // Generate flattened key based on whether configName is provided
  const key = configName ? `${providerId}.${configName}` : providerId;
  const config = this.config.providers.get(key);
  if (!config) {
    // Enhanced error with available configurations
    throw new BridgeError(
      `Provider configuration not found: ${key}`,
      "PROVIDER_CONFIG_MISSING",
      { providerId, configName, availableConfigs: Array.from(this.config.providers.keys()) }
    );
  }
  return config;
}
```

### 2. Update Provider Initialization Tracking

Modify `initializeProviderIfNeeded` method (around line 249-258) to include configuration name in tracking:

```typescript
private async initializeProviderIfNeeded(
  plugin: ProviderPlugin,
  providerConfig: Record<string, unknown>,
  configName?: string
): Promise<void> {
  const key = configName
    ? `${plugin.id}:${plugin.version}:${configName}`
    : `${plugin.id}:${plugin.version}`;

  if (!this.initializedProviders.has(key)) {
    await plugin.initialize?.(providerConfig);
    this.initializedProviders.add(key);
  }
}
```

### 3. Add Configuration Name Resolution

Create new method to extract configuration name from request and resolve provider configuration:

```typescript
private resolveProviderConfiguration(
  providerId: string,
  providerConfigName?: string
): { config: Record<string, unknown>; resolvedConfigName?: string } {
  // Logic to determine which configuration to use
  // Handle cases where multiple configs exist vs single config
  // Throw appropriate errors for ambiguous cases
}
```

### 4. Update Chat and Stream Methods

Modify both `chat` and `stream` methods (around lines 316-468, 485-629) to:

- Extract `providerConfig` from request
- Pass configuration name to provider resolution
- Handle validation errors for missing configuration names

## Technical Approach

1. Analyze current provider resolution flow in chat/stream methods
2. Update `getProviderConfigOrThrow` signature and implementation
3. Modify provider initialization tracking to include config names
4. Create configuration name resolution logic
5. Update error messages to be specific about configuration requirements
6. Integrate new resolution logic into chat/stream request processing

## Acceptance Criteria

### Provider Configuration Resolution

- **GIVEN** a request with `providerConfig: "prod"`
- **WHEN** provider resolution runs
- **THEN** the correct named configuration is selected and used
- **AND** provider initialization uses the specific config name

### Multiple Configuration Handling

- **GIVEN** multiple configurations exist for a provider
- **WHEN** no `providerConfig` is specified in request
- **THEN** system throws validation error requiring configuration selection
- **AND** error message lists available configuration names

### Single Configuration Compatibility

- **GIVEN** only one configuration exists for a provider
- **WHEN** `providerConfig` is omitted from request
- **THEN** system uses the single available configuration
- **AND** no error is thrown

### Provider Isolation

- **GIVEN** multiple configurations for same provider
- **WHEN** requests use different configurations
- **THEN** each configuration is initialized independently
- **AND** configurations don't interfere with each other

## Testing Requirements

### Unit Tests (include in this task)

- Test provider resolution with named configurations
- Test error handling for missing configuration names
- Test provider initialization tracking with config names
- Test single vs multiple configuration scenarios
- Test error message clarity and available options listing
- Mock provider plugins to test initialization isolation

## Dependencies

- Requires T-add-providerconfig-parameter for request interface
- Requires T-update-configuration for configuration validation
- Blocks provider-related functionality until completed

## Out of Scope

- Model registry integration (separate task)
- Built-in model seeding logic (separate task)
- Advanced configuration selection algorithms beyond basic name matching
