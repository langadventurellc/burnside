---
id: T-update-model-registry-to-use
title: Update model registry to use anthropic-2023-06-01 provider plugin
status: done
priority: medium
parent: F-anthropic-messages-api
prerequisites:
  - T-create-provider-module
affectedFiles:
  src/data/defaultLlmModels.ts: Updated all 5 Anthropic model entries to use
    'anthropic-2023-06-01' provider plugin instead of 'anthropic-messages-v1',
    maintaining all other model capabilities and metadata
  src/data/__tests__/defaultLlmModels.test.ts: Created comprehensive test suite
    with 12 test cases covering Anthropic model configuration validation,
    provider plugin consistency, schema compliance, and integration requirements
log:
  - Successfully updated all Anthropic model configurations in
    defaultLlmModels.ts to use the correct 'anthropic-2023-06-01' provider
    plugin identifier. All 5 Anthropic models (claude-3-haiku-20240307,
    claude-3-5-haiku-latest, claude-sonnet-4-20250514, claude-opus-4-20250514,
    claude-opus-4-1-20250805) now use the proper provider plugin that matches
    the existing BridgeClient mapping. Created comprehensive unit tests with 12
    test cases covering provider plugin validation, schema compliance, model
    metadata integrity, and integration requirements. All quality checks pass
    and tests achieve full coverage of the updated functionality.
schema: v1.0
childrenIds: []
created: 2025-09-16T13:33:44.935Z
updated: 2025-09-16T13:33:44.935Z
---

# Update Model Registry to Use anthropic-2023-06-01 Provider Plugin

Update the Anthropic model configurations in `defaultLlmModels.ts` to use the correct date-based provider plugin identifier and ensure proper integration with the new provider, including BridgeClient mapping requirements.

## Context

This task updates the model configuration to use the correct provider plugin identifier that matches the date-based versioning scheme established for the Anthropic provider. This ensures proper model routing to the new provider implementation and includes updating the BridgeClient mapping.

**Current State**: Models use `providerPlugin: "anthropic-messages-v1"`

**Target State**: Models use `providerPlugin: "anthropic-2023-06-01"`

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File to Update

Update `src/data/defaultLlmModels.ts`

### Required Changes

1. **Update Provider Plugin References**:
   Change all Anthropic model entries from:

   ```typescript
   providerPlugin: "anthropic-messages-v1";
   ```

   To:

   ```typescript
   providerPlugin: "anthropic-2023-06-01";
   ```

2. **Affected Models**:
   - `claude-3-haiku-20240307`
   - `claude-3-5-haiku-latest`
   - `claude-sonnet-4-20250514`
   - `claude-opus-4-20250514`
   - `claude-opus-4-1-20250805`

3. **Context Length Updates** (validate before changing):
   Based on latest research, update context lengths only if confirmed elsewhere in the repo:
   - Claude Sonnet 4: Update to 1M context if supported in beta (verify first)
   - Other models: Verify current context limits before changing

### BridgeClient Mapping Requirement

**Critical Integration Step**: Ensure BridgeClient has proper mapping for the new provider plugin identifier.

1. **Verify BridgeClient Mapping**: Confirm that `getProviderKeyFromPluginString` (or equivalent mapping function) includes:

   ```typescript
   "anthropic-2023-06-01": { id: "anthropic", version: "2023-06-01" }
   ```

2. **Add BridgeClient Mapping** (if not done in T-create-provider-module):
   - Locate the provider plugin mapping logic in BridgeClient
   - Add entry for "anthropic-2023-06-01"
   - Test that mapping works correctly

### Implementation Details

```typescript
// Before (current)
{
  id: "claude-sonnet-4-20250514",
  providerPlugin: "anthropic-messages-v1",
  name: "Claude Sonnet 4",
  contextLength: 200000,
  // ... other properties
}

// After (updated)
{
  id: "claude-sonnet-4-20250514",
  providerPlugin: "anthropic-2023-06-01",
  name: "Claude Sonnet 4",
  contextLength: 1000000, // Only update if confirmed supported
  // ... other properties
}
```

### Validation Requirements

1. **Provider Plugin Consistency**:
   - All Anthropic models use the same provider plugin identifier
   - Provider plugin matches the actual provider directory name
   - No models left with old identifier

2. **Model Capability Verification**:
   - Tool calls supported for all models
   - Streaming capabilities correctly configured
   - Multi-modal support (images, documents) properly set
   - **Context lengths reflect current API capabilities (validate before changing)**

3. **Schema Validation**:
   - Updated models still validate against `DefaultLlmModelsSchema`
   - No breaking changes to model configuration structure
   - Type safety maintained

4. **BridgeClient Integration**:
   - **Provider plugin mapping exists in BridgeClient**
   - **Model routing works correctly to new provider**
   - **No runtime errors for provider resolution**

### Testing Integration

1. **Unit Test Updates**:
   Create `src/data/__tests__/anthropicModelsUpdate.test.ts`:

   ```typescript
   describe("Anthropic Model Updates", () => {
     it("should use correct provider plugin identifier", () => {
       const anthropicModels = defaultLlmModels.providers.find(
         (p) => p.id === "anthropic",
       )?.models;

       anthropicModels?.forEach((model) => {
         expect(model.providerPlugin).toBe("anthropic-2023-06-01");
       });
     });

     it("should maintain model capabilities", () => {
       // Verify tool calls, streaming, etc. are preserved
     });

     it("should have valid BridgeClient mapping", () => {
       // Test BridgeClient can resolve provider plugin identifier
     });
   });
   ```

2. **Integration Test Validation**:
   - Verify models route correctly to new provider
   - Test that Bridge client can use updated models
   - Confirm no breaking changes in client behavior

## Acceptance Criteria

1. **Provider Plugin Update**:
   - ✅ All Anthropic models use `providerPlugin: "anthropic-2023-06-01"`
   - ✅ No models left with old identifier
   - ✅ Provider plugin identifier matches implementation

2. **Model Configuration Integrity**:
   - ✅ All model capabilities preserved (toolCalls, streaming, images, documents)
   - ✅ Context lengths updated only if confirmed supported
   - ✅ Model names and IDs unchanged
   - ✅ Supported content types maintained

3. **Schema Validation**:
   - ✅ Updated models validate against schema
   - ✅ No TypeScript compilation errors
   - ✅ Schema parsing succeeds for all models

4. **BridgeClient Integration**:
   - ✅ **Provider plugin mapping exists in BridgeClient for "anthropic-2023-06-01"**
   - ✅ **Models route to correct provider implementation**
   - ✅ **Bridge client can instantiate models successfully**
   - ✅ **No runtime errors during provider resolution**

5. **Backward Compatibility**:
   - ✅ Existing client code continues to work
   - ✅ Model IDs remain stable
   - ✅ No breaking changes to public API

6. **Unit Tests** (included in this task):
   - ✅ Test provider plugin identifier consistency
   - ✅ Test model capability preservation
   - ✅ Test schema validation with updates
   - ✅ **Test BridgeClient mapping functionality**
   - ✅ Test model routing behavior
   - ✅ Achieve >90% coverage of updated code

## Dependencies

- Provider implementation from T-create-provider-module
- **BridgeClient provider plugin mapping (critical dependency)**
- Model schema validation from core models
- Provider plugin mapping infrastructure

## Out of Scope

- Adding new Claude models not currently configured
- Changing model IDs or fundamental model structure
- Performance optimization of model loading
- Advanced model capability detection beyond static configuration

## Testing Requirements

Create comprehensive tests to validate:

- Provider plugin identifier consistency across all Anthropic models
- Model capability preservation during update
- Schema validation and type safety
- **BridgeClient provider plugin mapping and model routing**
- Integration with Bridge client model loading

### Test File

`src/data/__tests__/anthropicModelsUpdate.test.ts`

### Validation Checks

- All Anthropic models use correct provider plugin
- Model configurations remain valid
- **BridgeClient can resolve provider plugin to provider instance**
- No regression in model capabilities or routing
- Type safety maintained throughout update process
