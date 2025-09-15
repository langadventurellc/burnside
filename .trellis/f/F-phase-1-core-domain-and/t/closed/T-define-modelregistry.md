---
id: T-define-modelregistry
title: Define ModelRegistry interface and basic implementation
status: done
priority: medium
parent: F-phase-1-core-domain-and
prerequisites:
  - T-add-zod-dependency-and
affectedFiles:
  src/core/providers/modelCapabilities.ts: "Updated interface property names for
    consistency: supportsStreaming → streaming, supportsTools → toolCalls,
    supportsImages → images, added documents field, updated JSDoc examples"
  src/core/providers/modelInfo.ts: Added required capabilities field of type
    ModelCapabilities, updated JSDoc example to include capabilities object,
    added ModelCapabilities import
  src/core/models/modelId.ts: Created branded ModelId type for type-safe model
    identifiers with provider:model format
  src/core/models/createModelId.ts: Created utility function with Zod validation
    to create type-safe ModelId from provider and model name components
  src/core/models/parseModelId.ts:
    Created utility function to parse ModelId back
    into provider and model components with validation
  src/core/models/modelQuery.ts:
    Created ModelQuery interface for filtering models
    by provider and capabilities
  src/core/models/modelRegistry.ts: Created ModelRegistry interface defining
    contract for model registration, retrieval, listing, capability queries, and
    unregistration
  src/core/models/inMemoryModelRegistry.ts: Implemented InMemoryModelRegistry
    class with Map-based storage, Zod validation, and efficient capability-based
    querying
  src/core/models/__tests__/createModelId.test.ts: Comprehensive test suite for
    createModelId utility with validation scenarios and edge cases
  src/core/models/__tests__/parseModelId.test.ts: Complete test suite for
    parseModelId utility covering valid inputs and error cases
  src/core/models/__tests__/inMemoryModelRegistry.test.ts: Extensive test suite
    for ModelRegistry implementation with 39 test cases covering registration,
    retrieval, listing, capability queries, and unregistration
  src/core/models/index.ts: Module export barrel file aggregating all model
    management functionality with comprehensive documentation
  src/core/index.ts: Added models module export to core module exports, updated
    module documentation
log:
  - >-
    Successfully implemented ModelRegistry interface and InMemoryModelRegistry
    class with comprehensive type-safe model management capabilities. The
    implementation provides a unified interface for registering, querying, and
    managing LLM models with their capabilities and metadata.


    Key Features Implemented:

    - ModelRegistry interface with full CRUD operations (register, get, list,
    has, getByCapability, unregister)  

    - InMemoryModelRegistry class with Map-based storage and efficient querying

    - Type-safe ModelId with provider:model format validation using Zod schemas

    - Capability-based model queries supporting boolean and optional field
    filtering

    - Comprehensive validation using existing library validation infrastructure

    - Provider-specific model filtering and management

    - Updated ModelCapabilities interface with consistent property naming
    (streaming, toolCalls, images, documents)

    - Enhanced ModelInfo interface with required capabilities field


    The implementation follows all project standards including
    one-export-per-file rule, comprehensive Jest testing (47 test cases with
    100% coverage), strong typing with no 'any' types, and proper error handling
    with ValidationError. All quality checks pass including linting, formatting,
    and TypeScript compilation.


    This establishes the foundation for model management that will be populated
    with data from defaultLlmModels.json in future phases and enables
    intelligent model selection based on capabilities throughout the library.
schema: v1.0
childrenIds: []
created: 2025-09-15T05:38:47.560Z
updated: 2025-09-15T05:38:47.560Z
---

## Context

This task implements the ModelRegistry interface and basic implementation for managing model capability and configuration metadata. This establishes the foundation for model management that will be populated with data from `docs/defaultLlmModels.json` in future phases.

**Related Specifications:**

- Feature: `F-phase-1-core-domain-and` - Phase 1: Core Domain and Public API Skeleton
- Architecture: `/docs/library-architecture.md` - ModelInfo and ModelCapabilities (lines 132-146)
- Implementation Plan: `/docs/implementation-plan.md` - Phase 3 will load defaultLlmModels.json (line 49)

## Specific Implementation Requirements

### 1. Create ModelRegistry Interface

- Create `src/core/models/` directory for model management
- Create `src/core/models/modelRegistry.ts` with interface and implementation
- Define interface for model registration, capability queries, and metadata management
- Support provider-specific model configurations

### 2. ModelRegistry Interface Definition

```typescript
interface ModelRegistry {
  // Register model with capabilities
  register(modelId: string, info: ModelInfo): void;

  // Get model information by ID
  get(modelId: string): ModelInfo | undefined;

  // List all registered models, optionally filtered by provider
  list(providerId?: string): ModelInfo[];

  // Check if model is registered
  has(modelId: string): boolean;

  // Get models by capability
  getByCapability(capability: keyof ModelCapabilities): ModelInfo[];

  // Remove model registration
  unregister(modelId: string): boolean;
}
```

### 3. Basic In-Memory Implementation

- Create `InMemoryModelRegistry` class implementing the interface
- Use Map-based storage with model ID keys
- Support for capability-based queries and filtering
- Validation of model information during registration

### 4. Model Management Types

- `ModelId`: Type-safe model identifier (provider:model format)
- `ModelQuery`: Query parameters for filtering models
- Integration with existing ModelInfo and ModelCapabilities interfaces

## Technical Approach

### File Structure

```
src/core/models/
├── modelRegistry.ts           # Interface and implementation (this task)
├── types.ts                   # Model-related types
├── __tests__/
│   └── modelRegistry.test.ts
└── index.ts                   # Module exports
```

Also update:

```
src/core/providers/
├── modelInfo.ts               # Existing ModelInfo interface
├── modelCapabilities.ts       # Existing ModelCapabilities interface
```

### Implementation Steps

1. Create models directory and module structure
2. Define ModelRegistry interface with comprehensive method signatures
3. Create supporting types for model management
4. Implement InMemoryModelRegistry class with Map-based storage
5. Add validation for model information during registration
6. Implement capability-based query functionality
7. Create comprehensive unit tests
8. Add JSDoc documentation with usage examples
9. Update core module exports to include models

### Registry Implementation Structure

```typescript
export class InMemoryModelRegistry implements ModelRegistry {
  private models = new Map<string, ModelInfo>();

  register(modelId: string, info: ModelInfo): void {
    this.validateModelInfo(modelId, info);
    this.models.set(modelId, { ...info, id: modelId });
  }

  get(modelId: string): ModelInfo | undefined {
    return this.models.get(modelId);
  }

  getByCapability(capability: keyof ModelCapabilities): ModelInfo[] {
    return Array.from(this.models.values()).filter(
      (model) => model.capabilities[capability] === true,
    );
  }
}
```

## Detailed Acceptance Criteria

### Interface Design

- ✅ ModelRegistry interface supports all required model operations
- ✅ Method signatures are type-safe and well-documented
- ✅ Interface supports capability-based queries efficiently
- ✅ Provider filtering works correctly for model listing

### Registration Functionality

- ✅ Models can be registered with unique IDs and capabilities
- ✅ Duplicate registrations for same model ID update existing entry
- ✅ Invalid model information rejected during registration
- ✅ Model capability validation ensures required fields are present

### Query Functionality

- ✅ Models can be retrieved by exact ID match
- ✅ Capability-based queries return correct model subsets
- ✅ Provider filtering returns only models for specified provider
- ✅ Non-existent models return undefined rather than throwing

### Capability Management

- ✅ All ModelCapabilities fields queryable (toolCalls, streaming, images, etc.)
- ✅ Boolean capability queries work correctly
- ✅ Optional capabilities (promptCaching, token limits) handled properly
- ✅ Capability updates reflected immediately in queries

### Implementation Quality

- ✅ Efficient storage and retrieval for typical model counts (100+)
- ✅ Memory usage reasonable for model metadata
- ✅ Query performance acceptable for capability-based filtering
- ✅ Clear error messages for validation failures

## Dependencies

**Prerequisites:**

- `T-add-zod-dependency-and` - Zod validation infrastructure
- Existing ModelInfo and ModelCapabilities interfaces

**Blocks:**

- BridgeClient model capability resolution
- Future model configuration loading from defaultLlmModels.json (Phase 3)

## Security Considerations

### Registration Security

- Validation of model information to prevent malicious model metadata
- Safe handling of model capabilities without exposing system internals
- Prevention of model ID collisions that could cause confusion

### Query Security

- Safe capability queries that don't expose sensitive model data
- Proper handling of optional capabilities to prevent information leakage
- No exposure of provider-specific configuration during queries

## Testing Requirements

### Unit Tests (Include in this task)

- **Registration Tests**: Valid/invalid models, duplicate handling, validation
- **Retrieval Tests**: Exact matches, case sensitivity, non-existent models
- **Listing Tests**: Empty registry, provider filtering, complete model list
- **Capability Query Tests**: Each capability type, boolean logic, edge cases
- **Validation Tests**: Model info validation during registration
- **Edge Case Tests**: Empty strings, null values, malformed model data

### Test File: `src/core/models/__tests__/modelRegistry.test.ts`

### Example Test Cases

```typescript
describe("ModelRegistry", () => {
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new InMemoryModelRegistry();
  });

  describe("registration", () => {
    it("registers valid model successfully", () => {
      const modelInfo = {
        id: "openai:gpt-4",
        family: "gpt-4",
        capabilities: {
          toolCalls: true,
          streaming: true,
          images: false,
          documents: false,
        },
      };

      expect(() => registry.register("openai:gpt-4", modelInfo)).not.toThrow();
      expect(registry.has("openai:gpt-4")).toBe(true);
    });

    it("updates existing model on duplicate registration", () => {
      const modelInfo1 = createModelInfo({ toolCalls: false });
      const modelInfo2 = createModelInfo({ toolCalls: true });

      registry.register("test:model", modelInfo1);
      registry.register("test:model", modelInfo2);

      const retrieved = registry.get("test:model");
      expect(retrieved?.capabilities.toolCalls).toBe(true);
    });
  });

  describe("capability queries", () => {
    it("returns models with tool call capability", () => {
      const modelWithTools = createModelInfo({ toolCalls: true });
      const modelWithoutTools = createModelInfo({ toolCalls: false });

      registry.register("model:with-tools", modelWithTools);
      registry.register("model:without-tools", modelWithoutTools);

      const toolCapableModels = registry.getByCapability("toolCalls");
      expect(toolCapableModels).toHaveLength(1);
      expect(toolCapableModels[0].id).toBe("model:with-tools");
    });

    it("returns models with streaming capability", () => {
      const streamingModel = createModelInfo({ streaming: true });
      registry.register("streaming:model", streamingModel);

      const streamingModels = registry.getByCapability("streaming");
      expect(streamingModels).toHaveLength(1);
      expect(streamingModels[0].capabilities.streaming).toBe(true);
    });
  });
});
```

## Out of Scope

- Loading models from defaultLlmModels.json (Phase 3)
- Provider-specific model discovery (future phases)
- Model capability validation against actual provider APIs (future phases)
- Advanced model features like cost tracking or rate limits (future phases)
