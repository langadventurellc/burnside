---
id: T-add-prompt-caching-capability
title: Add Prompt Caching Capability to Model Schema with Unit Tests
status: open
priority: medium
parent: F-rate-limiting-retries-and
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:02:49.496Z
updated: 2025-09-19T03:02:49.496Z
---

# Add Prompt Caching Capability to Model Schema with Unit Tests

## Context

This task extends the existing model schema to include the `promptCaching` capability flag, following the established pattern for model capabilities in the LLM Bridge Library. This enables models to declare their support for provider-native prompt caching features.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Existing Pattern**: `src/core/models/defaultLlmModelsSchema.ts` - extend this schema
- **Model Data**: `src/data/defaultLlmModels.ts` - update Anthropic models
- **Architecture Reference**: `docs/library-architecture.md` prompt caching section

## Implementation Requirements

### Extend DefaultLlmModelsSchema

Update `src/core/models/defaultLlmModelsSchema.ts` to add the promptCaching capability:

```typescript
export const DefaultLlmModelsSchema = z.object({
  schemaVersion: z.string(),
  providers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      models: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          contextLength: z.number().positive(),
          providerPlugin: z.string().optional(),
          streaming: z.boolean().optional(),
          toolCalls: z.boolean().optional(),
          images: z.boolean().optional(),
          documents: z.boolean().optional(),
          temperature: z.boolean().optional(),
          thinking: z.boolean().optional(),
          promptCaching: z.boolean().optional(), // ADD THIS LINE
          supportedContentTypes: z.array(z.string()).optional(),
        }),
      ),
    }),
  ),
});
```

### Update Default Model Data

Update `src/data/defaultLlmModels.ts` to include promptCaching for Anthropic models:

```typescript
// Add promptCaching: true to Anthropic models that support it
{
  id: "claude-3-haiku-20240307",
  providerPlugin: "anthropic-2023-06-01",
  name: "Claude 3 Haiku",
  contextLength: 200000,
  streaming: true,
  toolCalls: true,
  images: true,
  documents: true,
  promptCaching: true, // ADD THIS
  supportedContentTypes: ["text", "image", "document"],
}
// ... repeat for other Anthropic models
```

### Model Registry Integration

Ensure the model registry properly handles the new capability when loading models from the schema.

## Acceptance Criteria

### Schema Validation

- ✅ promptCaching field validates as optional boolean
- ✅ Models without promptCaching field remain valid
- ✅ Models with promptCaching: true validate correctly
- ✅ Models with promptCaching: false validate correctly
- ✅ Non-boolean promptCaching values are rejected
- ✅ Existing models continue to validate without changes

### Model Data Updates

- ✅ All Anthropic models include promptCaching: true
- ✅ Other providers (OpenAI, Google, xAI) remain unchanged initially
- ✅ Default model data validates against updated schema
- ✅ No breaking changes to existing model configurations

### Unit Tests Required

Create comprehensive tests in `src/core/models/__tests__/promptCachingCapability.test.ts`:

1. **Schema Validation**
   - Models with promptCaching: true validate
   - Models with promptCaching: false validate
   - Models without promptCaching validate (optional field)
   - Invalid promptCaching values (string, number) are rejected

2. **Model Data Validation**
   - Updated defaultLlmModels validates against schema
   - Anthropic models have promptCaching: true
   - Other provider models remain unchanged
   - No validation errors in default data

3. **Backward Compatibility**
   - Existing model configurations without promptCaching work
   - Model registry loads models with new capability correctly
   - No breaking changes to model loading logic

4. **Edge Cases**
   - Empty models array validates
   - Providers without models validate
   - Mixed capability configurations work

### Test Data Examples

```typescript
// Valid model configurations
const validModels = [
  {
    id: "claude-test",
    name: "Claude Test",
    contextLength: 100000,
    promptCaching: true,
  },
  {
    id: "gpt-test",
    name: "GPT Test",
    contextLength: 8000,
    promptCaching: false,
  },
  {
    id: "legacy-model",
    name: "Legacy Model",
    contextLength: 4000,
    // No promptCaching field - should be valid
  },
];

// Invalid configurations
const invalidModels = [
  {
    id: "bad-model",
    name: "Bad Model",
    contextLength: 1000,
    promptCaching: "yes", // Should be boolean
  },
];
```

## Security Considerations

- **Data Validation**: Strict boolean validation prevents injection
- **Backward Compatibility**: No security implications from optional field
- **Default Safety**: Models default to no caching (secure by default)

## Dependencies

- **Zod**: Existing validation library
- **Existing Schema**: Current DefaultLlmModelsSchema structure

## Out of Scope

- Provider plugin caching implementation (separate task)
- Cache management logic (separate task)
- Runtime capability detection (separate task)
- Model capability querying API (future enhancement)

## Files to Create/Modify

- **Update**: `src/core/models/defaultLlmModelsSchema.ts` - Add promptCaching field
- **Update**: `src/data/defaultLlmModels.ts` - Add promptCaching to Anthropic models
- **Create**: `src/core/models/__tests__/promptCachingCapability.test.ts` - Unit tests
- **Update**: `src/data/__tests__/defaultLlmModels.test.ts` - Validate updated data

Estimated effort: 1 hour
