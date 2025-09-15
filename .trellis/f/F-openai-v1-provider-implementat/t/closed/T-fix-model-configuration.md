---
id: T-fix-model-configuration
title: Fix Model Configuration Architecture and Remove Hardcoded Provider Models
status: done
priority: high
parent: F-openai-v1-provider-implementat
prerequisites: []
affectedFiles:
  src/core/models/defaultLlmModelsSchema.ts:
    Enhanced schema validation to include
    providerPlugin and other missing fields (streaming, toolCalls, images,
    documents) as optional fields, updated JSDoc example
  src/core/models/modelLoader.ts:
    Modified mapJsonToModelInfo function to preserve
    providerPlugin field in model metadata using conditional spread operator for
    backward compatibility
  src/providers/openai-responses-v1/openAIResponsesV1Provider.ts:
    Removed import of hardcoded getModelCapabilities function, simplified
    supportsModel method to return true for all models since support is now
    determined by model registry
  src/client/bridgeClient.ts: Added resolveProviderPlugin method to resolve
    provider plugin from model configuration, added
    getProviderKeyFromPluginString method with canonical mapping from
    providerPlugin strings to provider registry keys
  src/providers/openai-responses-v1/__tests__/openAIResponsesV1Provider.test.ts:
    Updated test expectations to reflect new behavior where supportsModel
    returns true for all models
  src/providers/openai-responses-v1/__tests__/registration.test.ts:
    Updated test expectations to reflect that model support is determined by
    registry, not hardcoded capabilities
  src/providers/openai-responses-v1/__tests__/integration.test.ts: Updated test expectations for new supportsModel behavior
log:
  - Fixed model configuration architecture by removing hardcoded provider models
    and implementing centralized model-to-provider routing. Enhanced schema
    validation to include providerPlugin field, updated model loader to preserve
    providerPlugin in metadata, removed hardcoded models file, simplified
    provider supportsModel method, and added provider plugin resolution methods
    to BridgeClient. All quality checks and tests pass with no breaking changes.
schema: v1.0
childrenIds: []
created: 2025-09-15T23:14:57.767Z
updated: 2025-09-15T23:14:57.767Z
---

## Context

The LLM Bridge library has a critical architectural inconsistency in its model configuration system. There are two separate, conflicting sources of model definitions:

1. **Centralized Configuration**: `/src/data/defaultLlmModels.ts` contains comprehensive model definitions with `providerPlugin` fields specifying which provider implementation to use (e.g., "openai-responses-v1")
2. **Hardcoded Provider Models**: `/src/providers/openai-responses-v1/models.ts` contains duplicate, conflicting model capabilities that bypass the centralized system

Currently, the OpenAI provider ignores the centralized model registry and uses its own hardcoded models, defeating the purpose of the unified configuration approach and creating maintenance issues.

## Problem Details

### Issues Identified:

- `DefaultLlmModelsSchema` does not validate the `providerPlugin` field that exists in the data
- `mapJsonToModelInfo` ignores the `providerPlugin` field and creates default capabilities
- Provider plugins use hardcoded model definitions instead of consulting the model registry
- No mechanism exists to select provider plugins based on model configuration
- Duplicate model definitions create maintenance burden and potential inconsistencies

### Current Data Flow Issues:

1. Models load from `defaultLlmModels.ts` but `providerPlugin` field is ignored
2. OpenAI provider calls `getModelCapabilities()` from hardcoded `models.ts` instead of model registry
3. No connection between model configuration and provider plugin selection

## Implementation Requirements

### 1. Update Schema Validation (`src/core/models/defaultLlmModelsSchema.ts`)

- Add `providerPlugin` field validation to the schema
- Make it optional to maintain backward compatibility
- Ensure the schema matches the actual data structure in `defaultLlmModels.ts`

**Current Schema Missing:**

```typescript
providerPlugin: z.string().optional();
```

### 2. Enhance Model Loading (`src/core/models/modelLoader.ts`)

- Modify `mapJsonToModelInfo` to preserve and use the `providerPlugin` field
- Store `providerPlugin` in the `ModelInfo` metadata for provider selection
- Ensure the loader preserves all configuration data for provider routing

**Example Storage:**

```typescript
metadata: {
  contextLength: model.contextLength,
  originalProviderId: provider.id,
  providerPlugin: model.providerPlugin, // Add this
}
```

### 3. Remove Hardcoded Models (`src/providers/openai-responses-v1/models.ts`)

- **DELETE** the entire file `/src/providers/openai-responses-v1/models.ts`
- Remove import of `getModelCapabilities` from `openAIResponsesV1Provider.ts:22`

### 4. Update Provider Implementation (`src/providers/openai-responses-v1/openAIResponsesV1Provider.ts`)

- Simplify `supportsModel()` method (line 77-79) to return `true` for all models (or remove complexity)
- Remove dependency on hardcoded `getModelCapabilities` function
- **Rationale**: Model support checking will be moved to the BridgeClient routing layer

### 5. Provider Plugin Selection and Routing (`src/client/bridgeClient.ts`)

- Add method to resolve provider plugin from model configuration: `resolveProviderPlugin(modelId: string): ProviderPlugin | undefined`
- Create canonical mapping between `providerPlugin` string and actual provider instances
- Implement provider plugin selection based on model's `providerPlugin` field
- Move model support validation to the routing layer before calling provider methods

**Implementation Strategy:**

```typescript
// Add to BridgeClient class
private resolveProviderPlugin(modelId: string): ProviderPlugin | undefined {
  // 1. Look up model in model registry
  const model = this.modelRegistry.get(modelId);
  if (!model?.metadata?.providerPlugin) return undefined;

  // 2. Map providerPlugin string to (id, version)
  const { id, version } = this.parseProviderPlugin(model.metadata.providerPlugin);

  // 3. Get provider from provider registry
  return this.providerRegistry.get(id, version);
}

private parseProviderPlugin(providerPlugin: string): { id: string; version: string } {
  // Example: "openai-responses-v1" → { id: "openai", version: "responses-v1" }
  // Define canonical mapping logic here
}
```

### 6. Provider Plugin String Mapping

Define canonical mapping from `providerPlugin` strings to provider registry keys:

- `"openai-responses-v1"` → `{ id: "openai", version: "responses-v1" }`
- Add validation that fails fast when a configured `providerPlugin` is not registered
- Document this mapping pattern for future provider implementations

## Technical Approach

### Step-by-Step Implementation:

1. **Schema Fix**: Update `DefaultLlmModelsSchema` to include `providerPlugin` validation
2. **Model Loader Enhancement**: Modify `mapJsonToModelInfo` to preserve `providerPlugin` in metadata
3. **Remove Hardcoded Models**: Delete `/src/providers/openai-responses-v1/models.ts` entirely
4. **Simplify Provider**: Update OpenAI provider to remove hardcoded model dependency
5. **Routing Logic**: Add provider plugin resolution and model routing to `BridgeClient`
6. **Mapping Validation**: Add validation for `providerPlugin` → provider registry resolution

### Key Files to Modify:

- `src/core/models/defaultLlmModelsSchema.ts` - Add schema validation
- `src/core/models/modelLoader.ts` - Preserve providerPlugin data in metadata
- `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts` - Remove hardcoded model dependency
- `src/client/bridgeClient.ts` - Add provider plugin selection and routing logic
- **DELETE**: `src/providers/openai-responses-v1/models.ts` - Remove entirely

## Acceptance Criteria

### Functional Requirements:

- [ ] `DefaultLlmModelsSchema` validates `providerPlugin` field correctly
- [ ] `mapJsonToModelInfo` preserves `providerPlugin` information in model metadata
- [ ] Hardcoded `/src/providers/openai-responses-v1/models.ts` file is completely removed
- [ ] OpenAI provider `supportsModel()` method is simplified (no longer uses hardcoded models)
- [ ] `BridgeClient` can resolve provider plugin from model configuration via `resolveProviderPlugin()`
- [ ] Canonical mapping defined: `providerPlugin` string → provider registry `(id, version)`
- [ ] Model routing works: modelId → model lookup → providerPlugin → provider plugin selection
- [ ] Validation fails fast when configured `providerPlugin` is not registered in provider registry

### Routing Test Requirements:

- [ ] Test complete routing flow: model ID → looks up model → resolves providerPlugin → selects specific provider plugin version from registry
- [ ] Test failure case: missing provider plugin mapping throws appropriate error
- [ ] Test validation: invalid `providerPlugin` values are rejected by schema
- [ ] Integration test: verify requests would be routed to correct provider plugin

### Quality Requirements:

- [ ] All TypeScript types compile without errors
- [ ] No linting errors in modified files
- [ ] Quality checks pass: `npm run quality`
- [ ] All existing tests continue to pass
- [ ] Code follows existing patterns and conventions

## Dependencies

**Prerequisites:**

- Understanding of existing model registry and provider plugin architecture
- Familiarity with Zod schema validation patterns used in the codebase
- Knowledge of provider registry `get(id, version)` method for exact version selection

**Files to Study:**

- `/src/data/defaultLlmModels.ts` - Current model configuration data structure
- `/src/core/models/` - Model loading and registry system
- `/src/core/providers/` - Provider plugin interfaces and registry patterns
- `/src/providers/openai-responses-v1/` - Current OpenAI provider implementation
- `/src/client/bridgeClient.ts` - Current model and provider registry usage

## Security Considerations

- Ensure schema validation prevents injection of invalid `providerPlugin` values
- Validate that provider plugin selection cannot bypass authentication or authorization
- Maintain type safety to prevent runtime errors from invalid provider configurations
- Add validation that fails securely when provider plugin resolution fails

## Testing Strategy

Include comprehensive unit tests in the same implementation:

- Schema validation tests for `providerPlugin` field (valid/invalid cases)
- Model loading tests with `providerPlugin` preservation in metadata
- Provider plugin string mapping and validation tests
- Complete routing flow integration tests (model → provider plugin resolution)
- Error handling tests for missing or invalid provider plugin configurations

## Out of Scope

- **DO NOT** create separate tasks for integration or performance testing
- **DO NOT** modify other provider implementations (Anthropic, Google, xAI) unless they have the same issue
- **DO NOT** change the overall architecture beyond fixing the identified issues
- **DO NOT** add new features beyond fixing the configuration inconsistency
- **DO NOT** modify the `ProviderPlugin` interface to add registry access (use routing approach instead)
