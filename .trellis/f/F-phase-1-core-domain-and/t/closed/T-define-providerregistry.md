---
id: T-define-providerregistry
title: Define ProviderRegistry interface and basic implementation
status: done
priority: medium
parent: F-phase-1-core-domain-and
prerequisites:
  - T-add-zod-dependency-and
affectedFiles:
  src/core/providers/providerRegistry.ts:
    Created main ProviderRegistry interface
    with comprehensive JSDoc documentation and method signatures for provider
    plugin management
  src/core/providers/providerInfo.ts:
    Created ProviderInfo interface for registry
    listing operations with provider metadata
  src/core/providers/providerKey.ts: Created ProviderKey type for composite
    id:version identification in registry storage
  src/core/providers/inMemoryProviderRegistry.ts: Implemented
    InMemoryProviderRegistry class with Map-based storage, Zod validation,
    semantic version sorting, and thread-safe operations for all registry
    methods
  src/core/providers/index.ts: Updated module exports to include new registry
    types (ProviderRegistry, ProviderInfo, ProviderKey) and
    InMemoryProviderRegistry implementation
  src/core/providers/__tests__/providerRegistry.test.ts: Created comprehensive
    test suite with 42 test cases covering registration, resolution, validation,
    edge cases, and concurrent operations for the ProviderRegistry
    implementation
log:
  - Created ProviderRegistry interface and basic implementation for managing
    provider plugin registration and resolution. This establishes the foundation
    for provider plugin management that will be used in future phases when
    actual provider implementations are added.
schema: v1.0
childrenIds: []
created: 2025-09-15T05:38:08.460Z
updated: 2025-09-15T05:38:08.460Z
---

## Context

This task implements the ProviderRegistry interface and basic implementation for managing provider plugin registration and resolution. This establishes the foundation for provider plugin management that will be used in future phases when actual provider implementations are added.

**Related Specifications:**

- Feature: `F-phase-1-core-domain-and` - Phase 1: Core Domain and Public API Skeleton
- Architecture: `/docs/library-architecture.md` - Provider Plugin Contract (lines 148-166)
- Implementation Plan: `/docs/implementation-plan.md` - Phase 1 requirements (line 29)

## Specific Implementation Requirements

### 1. Create ProviderRegistry Interface

- Create `src/core/providers/providerRegistry.ts`
- Define interface for provider plugin registration and resolution
- Support provider versioning with concurrent multiple versions
- Provide methods for listing, registering, and resolving providers

### 2. ProviderRegistry Interface Definition

```typescript
interface ProviderRegistry {
  // Register a provider plugin with version
  register<TConfig extends z.ZodTypeAny>(plugin: ProviderPlugin<TConfig>): void;

  // Resolve provider by id and version
  resolve(id: string, version: string): ProviderPlugin<any> | undefined;

  // List all registered providers
  list(): ProviderInfo[];

  // Check if provider version is registered
  has(id: string, version: string): boolean;

  // Remove provider registration
  unregister(id: string, version: string): boolean;
}
```

### 3. Basic In-Memory Implementation

- Create `InMemoryProviderRegistry` class implementing the interface
- Use Map-based storage with composite keys (id:version)
- Thread-safe operations for concurrent access
- Validation of provider plugin structure during registration

### 4. Provider Information Types

- `ProviderInfo`: Summary information about registered providers
- `ProviderKey`: Type-safe key structure for provider identification
- Integration with existing ProviderPlugin interface

## Technical Approach

### File Structure

```
src/core/providers/
├── providerRegistry.ts        # Interface and implementation (this task)
├── providerPlugin.ts          # Existing ProviderPlugin interface
├── types.ts                   # Provider-related types
├── __tests__/
│   └── providerRegistry.test.ts
└── index.ts                   # Updated exports
```

### Implementation Steps

1. Define ProviderRegistry interface with comprehensive method signatures
2. Create supporting types (ProviderInfo, ProviderKey)
3. Implement InMemoryProviderRegistry class
4. Add validation for provider plugin registration
5. Implement thread-safe storage and retrieval
6. Create comprehensive unit tests
7. Add JSDoc documentation with usage examples
8. Update providers module exports

### Registry Implementation Structure

```typescript
export class InMemoryProviderRegistry implements ProviderRegistry {
  private providers = new Map<string, ProviderPlugin<any>>();

  register<TConfig extends z.ZodTypeAny>(
    plugin: ProviderPlugin<TConfig>,
  ): void {
    const key = this.createKey(plugin.id, plugin.version);
    this.validatePlugin(plugin);
    this.providers.set(key, plugin);
  }

  resolve(id: string, version: string): ProviderPlugin<any> | undefined {
    const key = this.createKey(id, version);
    return this.providers.get(key);
  }

  private createKey(id: string, version: string): string {
    return `${id}:${version}`;
  }
}
```

## Detailed Acceptance Criteria

### Interface Design

- ✅ ProviderRegistry interface supports all required operations
- ✅ Method signatures are type-safe and well-documented
- ✅ Generic constraints work correctly for provider configurations
- ✅ Interface supports concurrent provider versions

### Registration Functionality

- ✅ Providers can be registered with unique id/version combinations
- ✅ Duplicate registrations for same id/version are handled appropriately
- ✅ Invalid provider plugins rejected during registration
- ✅ Provider plugin validation ensures required fields are present

### Resolution Functionality

- ✅ Providers can be resolved by exact id/version match
- ✅ Non-existent providers return undefined rather than throwing
- ✅ Resolution is case-sensitive for both id and version
- ✅ Registry listing returns accurate provider information

### Implementation Quality

- ✅ Thread-safe operations for concurrent access
- ✅ Efficient storage and retrieval performance
- ✅ Memory usage reasonable for typical provider counts
- ✅ Clear error messages for validation failures

### Type Safety

- ✅ Full TypeScript compilation without errors
- ✅ Generic type constraints work correctly
- ✅ Provider plugin types preserved through registry operations
- ✅ Interface compatibility with expected usage patterns

## Dependencies

**Prerequisites:**

- `T-add-zod-dependency-and` - Zod validation infrastructure
- Existing ProviderPlugin interface in core/providers module

**Blocks:**

- BridgeClient provider resolution functionality
- Future provider plugin implementations (Phase 3+)

## Security Considerations

### Registration Security

- Validation of provider plugin structure to prevent malicious plugins
- Safe handling of provider configurations without exposing secrets
- Prevention of provider name collisions that could cause confusion

### Access Control

- Registry operations safe for concurrent access
- No exposure of sensitive provider configuration during listing
- Proper isolation between different provider versions

## Testing Requirements

### Unit Tests (Include in this task)

- **Registration Tests**: Valid/invalid providers, duplicate handling
- **Resolution Tests**: Exact matches, case sensitivity, non-existent providers
- **Listing Tests**: Empty registry, multiple providers, provider information accuracy
- **Validation Tests**: Provider plugin validation during registration
- **Concurrency Tests**: Thread-safety with concurrent operations
- **Edge Case Tests**: Empty strings, null values, malformed provider data

### Test File: `src/core/providers/__tests__/providerRegistry.test.ts`

### Example Test Cases

```typescript
describe("ProviderRegistry", () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new InMemoryProviderRegistry();
  });

  describe("registration", () => {
    it("registers valid provider successfully", () => {
      const mockProvider = createMockProvider("openai", "v1");
      expect(() => registry.register(mockProvider)).not.toThrow();
      expect(registry.has("openai", "v1")).toBe(true);
    });

    it("allows multiple versions of same provider", () => {
      const providerV1 = createMockProvider("openai", "v1");
      const providerV2 = createMockProvider("openai", "v2");

      registry.register(providerV1);
      registry.register(providerV2);

      expect(registry.has("openai", "v1")).toBe(true);
      expect(registry.has("openai", "v2")).toBe(true);
    });
  });

  describe("resolution", () => {
    it("resolves registered providers correctly", () => {
      const provider = createMockProvider("openai", "v1");
      registry.register(provider);

      const resolved = registry.resolve("openai", "v1");
      expect(resolved).toBe(provider);
    });

    it("returns undefined for non-existent providers", () => {
      const resolved = registry.resolve("nonexistent", "v1");
      expect(resolved).toBeUndefined();
    });
  });
});
```

## Out of Scope

- Actual provider plugin implementations (Phase 3+)
- Provider discovery from external sources (future phases)
- Provider configuration validation (done by individual plugins)
- Advanced registry features like versioning or dependencies (future phases)
