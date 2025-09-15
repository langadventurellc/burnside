---
id: T-implement-json-to-modelinfo
title: Implement JSON-to-ModelInfo mapping layer
status: open
priority: high
parent: F-provider-plugin-framework
prerequisites:
  - T-extend-providerplugin
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T17:03:38.707Z
updated: 2025-09-15T17:03:38.707Z
---

# Implement JSON-to-ModelInfo Mapping Layer

## Context

The `ModelRegistry` exists but has no mechanism to seed default models from `docs/defaultLlmModels.json`. This task creates a platform-agnostic mapping layer that converts the JSON structure to `ModelInfo[]` with proper default capabilities, enabling the registry to be populated with model metadata.

**Related Feature**: F-provider-plugin-framework - Provider Plugin Framework  
**JSON Structure**: `docs/defaultLlmModels.json` contains nested providers with models array
**Target Structure**: `ModelInfo` interface from `src/core/providers/modelInfo.ts`

## Specific Implementation Requirements

### 1. Create Core Mapping Function (`src/core/models/modelLoader.ts`)

```typescript
import type { ModelInfo } from "../providers/modelInfo.js";
import type { ModelCapabilities } from "../providers/modelCapabilities.js";

/**
 * Platform-agnostic function to convert defaultLlmModels.json structure
 * to ModelInfo array with default capabilities
 */
export function mapJsonToModelInfo(
  jsonData: DefaultLlmModelsJson,
): ModelInfo[] {
  return jsonData.providers.flatMap((provider) =>
    provider.models.map((model) => ({
      id: model.id,
      name: model.name,
      provider: provider.id, // Inferred from parent provider object
      capabilities: {
        streaming: false,
        toolCalls: false,
        images: false,
        documents: false,
        supportedContentTypes: [], // Required by ModelCapabilities
        maxTokens: model.contextLength, // Map contextLength to maxTokens
      },
      metadata: {
        contextLength: model.contextLength,
        originalProviderId: provider.id,
      },
    })),
  );
}

/**
 * JSON schema validation for defaultLlmModels.json structure
 */
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
        }),
      ),
    }),
  ),
});

export type DefaultLlmModelsJson = z.infer<typeof DefaultLlmModelsSchema>;
```

### 2. Key Mapping Logic

- **Provider Inference**: Extract `provider.id` from parent provider object in nested JSON
- **Default Capabilities**: Set all capabilities to `false` initially (providers will enrich later)
- **Context Length Handling**: Store in both `maxTokens` and `metadata.contextLength`
- **Required Fields**: Ensure `supportedContentTypes: []` for `ModelCapabilities` compliance
- **Validation**: Use Zod schema to validate JSON structure before mapping

### 3. Error Handling

- Validate JSON structure using Zod schema
- Throw `ValidationError` for malformed JSON
- Handle missing required fields with clear error messages
- Preserve error context for debugging

## Detailed Acceptance Criteria

### Core Mapping Function

- ✅ `mapJsonToModelInfo` function converts parsed JSON to `ModelInfo[]` array
- ✅ Provider ID correctly inferred from parent provider object in nested structure
- ✅ All JSON model fields mapped: `id` → `id`, `name` → `name`, `contextLength` → `maxTokens` + metadata
- ✅ Default capabilities set: `{ streaming: false, toolCalls: false, images: false, documents: false, supportedContentTypes: [] }`
- ✅ `metadata.contextLength` preserves original context length value
- ✅ Function has no file system dependencies (platform-agnostic)

### JSON Schema Validation

- ✅ `DefaultLlmModelsSchema` validates the expected JSON structure
- ✅ Schema requires `schemaVersion`, `providers` array with proper nesting
- ✅ Provider schema requires `id`, `name`, and `models` array
- ✅ Model schema requires `id`, `name`, and positive `contextLength`
- ✅ Validation errors provide clear, actionable error messages

### Error Handling

- ✅ Invalid JSON structure throws `ValidationError` with specific details
- ✅ Missing required fields result in clear validation error messages
- ✅ Malformed model entries are caught during validation
- ✅ Error handling follows existing codebase patterns using `ValidationError`

### Type Safety

- ✅ All functions use strict TypeScript typing (no `any` types)
- ✅ `DefaultLlmModelsJson` type properly inferred from Zod schema
- ✅ Return type `ModelInfo[]` matches existing interface exactly
- ✅ Function parameters and return values are properly typed

### Integration Requirements

- ✅ Uses existing `ModelInfo` and `ModelCapabilities` interfaces
- ✅ Follows existing validation patterns with `ValidationError`
- ✅ Import statements follow established codebase patterns
- ✅ File structure aligns with existing `src/core/models/` organization

### Testing Requirements

- ✅ Unit tests with actual `docs/defaultLlmModels.json` structure
- ✅ Validation tests with malformed JSON inputs
- ✅ Provider inference tests with various nested structures
- ✅ Default capabilities verification tests
- ✅ Error handling tests for edge cases
- ✅ Type checking tests to ensure ModelInfo compatibility

## Technical Approach

### File Creation

- **New File**: `src/core/models/modelLoader.ts`
- **Exports**: `mapJsonToModelInfo`, `DefaultLlmModelsSchema`, `DefaultLlmModelsJson`
- **Imports**: `ModelInfo`, `ModelCapabilities`, `ValidationError`, `zod`

### Implementation Strategy

- Use `Array.flatMap` for efficient nested array processing
- Leverage Zod for both validation and type inference
- Store original context length in metadata for provider-specific use
- Map `contextLength` to `maxTokens` as expected by `ModelCapabilities`

### JSON Structure Handling

The function must handle this exact JSON structure from `docs/defaultLlmModels.json`:

```json
{
  "schemaVersion": "1.0.0",
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "models": [
        {
          "id": "gpt-4o-2024-08-06",
          "name": "GPT-4o",
          "contextLength": 128000
        }
      ]
    }
  ]
}
```

### Cross-Platform Design

- No file system access in core mapping function
- Pure function that accepts parsed JSON object
- Compatible with React Native, Electron, and Web environments
- Node-specific file loading handled in separate task

## Dependencies

- **Prerequisite**: T-extend-providerplugin (needs updated types)
- **Blocks**: Node-only file loader task
- **Uses**: Existing `ModelInfo`, `ModelCapabilities`, `ValidationError`, Zod

## Out of Scope

- File system reading (handled by Node-only loader task)
- Model registry integration (handled by other tasks)
- Provider-specific capability enrichment (handled in vertical slice phases)
- HTTP transport or API communication (not needed for mapping)

## Security Considerations

- Input validation via Zod schema prevents malformed data processing
- No code execution on JSON content (pure data mapping)
- Sanitize string inputs through type validation
- Error messages should not leak sensitive file system information
