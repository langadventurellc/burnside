---
id: T-integrate-registries-with
title: Integrate registries with BridgeClient configuration
status: open
priority: medium
parent: F-phase-1-core-domain-and
prerequisites:
  - T-create-bridgeclient-class
  - T-define-providerregistry
  - T-define-modelregistry
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T05:39:26.737Z
updated: 2025-09-15T05:39:26.737Z
---

## Context

This task integrates the ProviderRegistry and ModelRegistry with the BridgeClient configuration system, enabling the client to access and utilize registered providers and models. This completes the registry infrastructure for Phase 1 by connecting all the components together.

**Related Specifications:**

- Feature: `F-phase-1-core-domain-and` - Phase 1: Core Domain and Public API Skeleton
- Architecture: `/docs/library-architecture.md` - Configuration and Registry (lines 212-219)
- Implementation Plan: `/docs/implementation-plan.md` - Phase 1 requirements

## Specific Implementation Requirements

### 1. Update BridgeClient Configuration

- Add registry instances to BridgeClient internal configuration
- Initialize registries during client construction
- Provide access methods for registry operations
- Ensure registries are properly configured with default data

### 2. Registry Integration Methods

- Add `getProviderRegistry()` method to BridgeClient
- Add `getModelRegistry()` method to BridgeClient
- Add `listAvailableProviders()` convenience method
- Add `listAvailableModels()` convenience method
- Add `getModelCapabilities(modelId: string)` convenience method

### 3. Configuration Enhancement

- Update BridgeConfig to include registry initialization options
- Add optional registry instances for dependency injection
- Support for registry pre-population from configuration
- Validate provider and model references in configuration

### 4. Default Registry Population

- Initialize registries with empty state for Phase 1
- Prepare structure for future population from defaultLlmModels.json
- Add validation that referenced providers/models exist in registries
- Provide clear error messages when providers/models not found

## Technical Approach

### Files to Modify

```
src/client/
├── bridgeClient.ts          # Add registry integration
├── types.ts                 # Add registry-related types

src/core/config/
├── bridgeConfig.ts          # Add registry configuration options

src/createClient.ts          # Initialize registries during client creation
```

### Implementation Steps

1. Update BridgeClient to include registry instances as private fields
2. Add registry accessor methods to BridgeClient
3. Update BridgeClient constructor to initialize registries
4. Enhance BridgeConfig to support registry configuration
5. Update createClient function to set up registries properly
6. Add convenience methods for common registry operations
7. Create comprehensive unit tests for registry integration
8. Add JSDoc documentation for new methods

### BridgeClient Integration

```typescript
export class BridgeClient {
  private config: BridgeClientConfig;
  private featureFlags: FeatureFlags;
  private providerRegistry: ProviderRegistry;
  private modelRegistry: ModelRegistry;

  constructor(config: BridgeConfig) {
    this.config = this.validateAndTransformConfig(config);
    this.featureFlags = this.initializeFeatureFlags();
    this.providerRegistry =
      config.providerRegistry || new InMemoryProviderRegistry();
    this.modelRegistry = config.modelRegistry || new InMemoryModelRegistry();

    this.initializeRegistries();
  }

  getProviderRegistry(): ProviderRegistry {
    return this.providerRegistry;
  }

  getModelRegistry(): ModelRegistry {
    return this.modelRegistry;
  }

  listAvailableProviders(): ProviderInfo[] {
    return this.providerRegistry.list();
  }

  listAvailableModels(providerId?: string): ModelInfo[] {
    return this.modelRegistry.list(providerId);
  }

  getModelCapabilities(modelId: string): ModelCapabilities | undefined {
    const model = this.modelRegistry.get(modelId);
    return model?.capabilities;
  }
}
```

## Detailed Acceptance Criteria

### Registry Integration

- ✅ BridgeClient properly initializes both registries during construction
- ✅ Registry instances accessible through getter methods
- ✅ Registry operations work correctly through BridgeClient
- ✅ Registry state isolated between different BridgeClient instances

### Configuration Integration

- ✅ BridgeConfig accepts optional registry instances for dependency injection
- ✅ Default registries created when not provided in configuration
- ✅ Registry configuration options properly validated
- ✅ Configuration errors include registry-related validation

### Convenience Methods

- ✅ `listAvailableProviders()` returns current provider registrations
- ✅ `listAvailableModels()` supports optional provider filtering
- ✅ `getModelCapabilities()` returns capabilities for valid model IDs
- ✅ Convenience methods handle empty registries gracefully

### Error Handling

- ✅ Clear error messages when accessing non-existent providers/models
- ✅ Registry initialization errors properly propagated
- ✅ Configuration validation includes registry reference checks
- ✅ Method calls handle registry operation failures appropriately

### Type Safety

- ✅ All registry integration maintains full type safety
- ✅ Generic constraints work correctly across registry operations
- ✅ Method return types properly inferred
- ✅ Configuration types include registry options

## Dependencies

**Prerequisites:**

- `T-create-bridgeclient-class` - Need BridgeClient class to integrate with
- `T-define-providerregistry` - Need ProviderRegistry implementation
- `T-define-modelregistry` - Need ModelRegistry implementation

**Blocks:**

- Complete Phase 1 API surface
- Future provider and model registration (Phase 3+)

## Security Considerations

### Registry Access Control

- Registry access through BridgeClient methods only (no direct exposure)
- Safe handling of registry operations without exposing internal state
- Proper isolation of registry state between client instances

### Configuration Security

- Validation of registry references without exposing sensitive data
- Safe handling of registry configuration options
- No exposure of internal registry implementation details

## Testing Requirements

### Unit Tests (Include in this task)

- **Registry Initialization Tests**: Proper setup during client construction
- **Registry Access Tests**: Getter methods return correct registry instances
- **Convenience Method Tests**: All convenience methods work correctly
- **Configuration Tests**: Registry options properly handled in configuration
- **Error Handling Tests**: Registry-related errors properly handled
- **Integration Tests**: Registries work together correctly within client
- **Isolation Tests**: Registry state isolated between client instances

### Test Files to Update/Create

```
src/client/__tests__/
├── bridgeClient.test.ts      # Update with registry integration tests

src/__tests__/
├── createClient.test.ts      # Update with registry initialization tests
└── registryIntegration.test.ts  # New integration tests
```

### Example Test Cases

```typescript
describe("BridgeClient Registry Integration", () => {
  describe("registry initialization", () => {
    it("initializes default registries when not provided", () => {
      const config = {
        /* minimal config */
      };
      const client = new BridgeClient(config);

      expect(client.getProviderRegistry()).toBeInstanceOf(
        InMemoryProviderRegistry,
      );
      expect(client.getModelRegistry()).toBeInstanceOf(InMemoryModelRegistry);
    });

    it("uses provided registries from configuration", () => {
      const customProviderRegistry = new InMemoryProviderRegistry();
      const customModelRegistry = new InMemoryModelRegistry();

      const config = {
        providerRegistry: customProviderRegistry,
        modelRegistry: customModelRegistry,
      };

      const client = new BridgeClient(config);
      expect(client.getProviderRegistry()).toBe(customProviderRegistry);
      expect(client.getModelRegistry()).toBe(customModelRegistry);
    });
  });

  describe("convenience methods", () => {
    it("lists available providers correctly", () => {
      const client = new BridgeClient({});
      const providers = client.listAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
    });

    it("gets model capabilities for registered models", () => {
      const client = new BridgeClient({});
      const modelRegistry = client.getModelRegistry();

      const testModel = {
        id: "test:model",
        capabilities: { toolCalls: true, streaming: false },
      };
      modelRegistry.register("test:model", testModel);

      const capabilities = client.getModelCapabilities("test:model");
      expect(capabilities?.toolCalls).toBe(true);
      expect(capabilities?.streaming).toBe(false);
    });
  });
});
```

## Out of Scope

- Actual provider or model registration (Phase 3+)
- Registry persistence or serialization (future phases)
- Advanced registry features like dependencies or versioning (future phases)
- Registry synchronization across multiple client instances (future requirement)
