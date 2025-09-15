---
id: F-provider-plugin-framework
title: Provider Plugin Framework
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/providers/providerPlugin.ts:
    Extended existing ProviderPlugin interface
    with four core contract methods (translateRequest, parseResponse,
    isTerminal, normalizeError) and capabilities property. Added comprehensive
    JSDoc documentation for each method with usage examples. Used inline types
    for method signatures to avoid multiple export linting issues. Made all new
    methods optional to maintain backward compatibility with existing test code.
log: []
schema: v1.0
childrenIds:
  - T-create-node-only-file-loader
  - T-create-provider-configuration
  - T-extend-providerplugin
  - T-implement-json-to-modelinfo
created: 2025-09-15T16:34:06.471Z
updated: 2025-09-15T16:34:06.471Z
---

# Provider Plugin Framework

Implement the missing core components of the provider plugin architecture to complete Phase 3 requirements. The registries are already implemented but need the plugin contract, model seeding, and configuration validation.

## Purpose and Functionality

This feature completes the provider plugin foundation by:

- Extending the existing `ProviderPlugin` interface with required contract methods
- Implementing JSON-to-ModelInfo mapping to seed the existing ModelRegistry
- Adding provider configuration schemas with Zod validation
- Adding debug logging for registry operations

## Key Components to Implement

### 1. ProviderPlugin Contract Extension (`src/core/providers/providerPlugin.ts`)

**Current State**: Minimal placeholder interface exists
**Required Additions**:

- `translateRequest(unified) → ProviderHttpRequest` - Convert unified format to provider-specific request
- `parseResponse(stream, ProviderHttpResponse) → UnifiedResponse | AsyncIterable<UnifiedDelta>` - Parse provider response to unified format
- `isTerminal(deltaOrFinal): boolean` - Detect streaming termination
- `normalizeError(error) → BridgeError` - Convert provider errors to unified error types
- Capability descriptors in plugin metadata

### 2. JSON-to-ModelInfo Mapping Layer (`src/core/models/modelLoader.ts`)

**Current State**: Missing - ModelRegistry exists but no seeding mechanism
**Required Implementation**:

- Platform-agnostic mapping function: `mapJsonToModelInfo(parsed: DefaultLlmModelsJson) → ModelInfo[]`
- Infer `provider` from JSON structure (parent object)
- Map `id`, `name`, `contextLength` from JSON to ModelInfo
- Set default capabilities: `{ streaming: false, toolCalls: false, images: false, documents: false, supportedContentTypes: [] }`
- Store `contextLength` in metadata or optional field

### 3. Node-only File Loader (`src/runtime/node/modelLoader.ts`)

**Current State**: Missing
**Required Implementation**:

- `loadDefaultModels(filePath: string) → ModelInfo[]` for tooling/tests
- Uses Node.js `readFileSync` to load `docs/defaultLlmModels.json`
- Calls platform-agnostic mapping function
- Isolated from core runtime to maintain cross-platform compatibility

### 4. Provider Configuration Schemas (`src/core/validation/providerSchemas.ts`)

**Current State**: Missing - provider validation is inline
**Required Implementation**:

- Zod schemas for common provider configs (baseUrl, apiKey, headers, timeout)
- Provider-specific configuration schemas
- Type inference for validated configurations
- Integration with existing validation patterns

### 5. Debug Logging Enhancement (`src/core/providers/inMemoryProviderRegistry.ts`)

**Current State**: Registry overwrites silently via Map.set
**Required Addition**:

- Debug log when duplicate provider registration overwrites existing entry
- Use existing logging infrastructure if available

## Detailed Acceptance Criteria

### ProviderPlugin Contract

- ✅ `translateRequest` method signature defined for converting unified requests to provider format
- ✅ `parseResponse` method signature defined for streaming and non-streaming responses
- ✅ `isTerminal` method signature defined for detecting stream completion
- ✅ `normalizeError` method signature defined for unified error handling
- ✅ Plugin capability descriptors included in interface
- ✅ Contract allows provider-specific implementations in vertical slices (Phases 4-8)

### Model Mapping & Loading

- ✅ `mapJsonToModelInfo` function converts parsed JSON to ModelInfo array
- ✅ Provider ID correctly inferred from parent provider object in nested JSON
- ✅ Required JSON fields (`id`, `name`, `contextLength`) mapped to ModelInfo structure
- ✅ Default capabilities set: `{ streaming: false, toolCalls: false, images: false, documents: false, supportedContentTypes: [] }`
- ✅ `contextLength` stored in metadata or dedicated optional field to work with existing ModelInfo structure
- ✅ Invalid JSON structure results in clear validation errors
- ✅ Node-only `loadDefaultModels` utility available for file system access
- ✅ Core mapping function has no file system dependencies (cross-platform compatible)

### Configuration Validation

- ✅ Provider configuration schemas defined using Zod in dedicated file
- ✅ Common configuration patterns (baseUrl, apiKey, headers, timeout) covered
- ✅ Configuration validation occurs before provider registration
- ✅ Uses existing `ValidationError` patterns for error handling
- ✅ Schemas prevent `any` types and enforce explicit typing

### Registry Enhancements

- ✅ Debug logging added for duplicate provider registrations (overwrite behavior)
- ✅ Logging integrates with existing codebase logging patterns
- ✅ Registry behavior unchanged (Map.set overwrite semantics maintained)
- ✅ Existing registry functionality preserved (ID:version composite keys, latest resolution)

### Integration Requirements

- ✅ ProviderPlugin contract enables vertical slice implementations (OpenAI, Anthropic, etc.)
- ✅ ModelRegistry can be seeded with default models for testing and development
- ✅ Provider configurations validated consistently across all providers
- ✅ Error types remain consistent with existing error taxonomy
- ✅ Cross-platform compatibility maintained (no core FS dependencies)

## Implementation Guidance

### Technical Approach

- **Extend existing interface**: Build on current `ProviderPlugin` placeholder in `src/core/providers/providerPlugin.ts`
- **Leverage existing registries**: Use current `InMemoryProviderRegistry` and `InMemoryModelRegistry` implementations
- **Reuse validation patterns**: Follow existing `ValidationError` and Zod validation approaches
- **Maintain cross-platform design**: Keep core mapping logic platform-agnostic
- **Integrate with existing comparator**: Use current tokenized version comparator for "latest" resolution

### File Structure (Based on Current Codebase)

```
src/core/
├── providers/
│   ├── providerPlugin.ts         # Extend with contract methods
│   ├── inMemoryProviderRegistry.ts  # Add debug logging
│   └── index.ts
├── models/
│   ├── inMemoryModelRegistry.ts  # Already implemented
│   ├── modelLoader.ts           # NEW: JSON mapping
│   └── index.ts
├── validation/
│   ├── providerSchemas.ts       # NEW: Provider config schemas
│   └── index.ts
├── runtime/
│   └── node/
│       └── modelLoader.ts       # NEW: Node-only FS utility
```

### ModelInfo Mapping Strategy

Address `ModelCapabilities.supportedContentTypes: string[]` requirement:

```typescript
function mapJsonToModelInfo(jsonData: DefaultLlmModelsJson): ModelInfo[] {
  return providers.flatMap((provider) =>
    provider.models.map((model) => ({
      id: model.id,
      name: model.name,
      provider: provider.id, // Inferred from parent
      capabilities: {
        streaming: false,
        toolCalls: false,
        images: false,
        documents: false,
        supportedContentTypes: [], // Required field
      },
      metadata: { contextLength: model.contextLength },
    })),
  );
}
```

### Testing Requirements

- Unit tests for ProviderPlugin interface contract compliance
- Model mapping tests with various JSON structures from `docs/defaultLlmModels.json`
- Provider configuration schema validation tests
- Cross-platform mapping function tests (no FS dependencies)
- Debug logging verification tests
- Integration tests with existing registry operations

## Dependencies & Integration

### Builds On Existing Code

- `InMemoryProviderRegistry` - already implements registration, resolution, validation
- `InMemoryModelRegistry` - already implements model storage and lookup
- Version comparator - already handles "latest" resolution with tokenized comparison
- `ValidationError` - already used for typed error handling
- Zod validation patterns - already established in codebase

### Enables Future Phases

- **Phase 4 (OpenAI)**: ProviderPlugin contract allows OpenAI-specific request translation and response parsing
- **Phase 5 (Tools)**: Plugin capability descriptors inform tool routing decisions
- **Phase 6+ (Other Providers)**: Standard plugin contract enables consistent provider implementations

### Cross-Platform Constraints

- Core mapping logic must work in React Native, Electron, and Web environments
- Node-specific file loading isolated to `src/runtime/node/`
- Registry operations remain memory-based and platform-agnostic

## Phase 3 Completion Criteria

This feature completes Phase 3 by delivering:

1. **ProviderPlugin interface** with request translate/response parse/termination detection
2. **ProviderRegistry** with Zod-validated provider configs (already implemented + schemas)
3. **ModelRegistry seeding** from `docs/defaultLlmModels.json` (mapping layer)
4. **Contract tests** for registry behavior and config validation

Upon completion, Phase 4 (OpenAI vertical slice) can begin implementation using the established plugin contract and model registry.
