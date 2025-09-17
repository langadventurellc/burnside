---
id: T-create-xai-provider-module
title: Create xAI provider module exports and registration
status: open
priority: medium
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-implement-main-xai-provider
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T20:01:10.044Z
updated: 2025-09-17T20:01:10.044Z
---

# Create xAI Provider Module Exports and Registration

## Context

This task creates the module export structure for the xAI provider and updates the global provider registry to include the new xAI provider. This enables the xAI provider to be discovered and used by the LLM Bridge library.

## Reference Implementation

Use these files as reference patterns:

- `src/providers/openai-responses-v1/index.ts` (export structure)
- `src/providers/google-gemini-v1/index.ts` (advanced exports)
- `src/providers/index.ts` (provider registration)

## Implementation Requirements

### 1. Create Provider Module Exports (`src/providers/xai-v1/index.ts`)

```typescript
/**
 * xAI v1 Provider Module
 *
 * Main export module for the xAI v1 provider plugin.
 * Provides the complete provider implementation and related types
 * for integration with the LLM Bridge library.
 */

// Core provider exports
export { XAIV1Provider } from "./xaiV1Provider";
export type { XAIV1Config } from "./configSchema";

// Default export for easy registration
export { XAIV1Provider as default } from "./xaiV1Provider";

/**
 * Provider plugin metadata for identification
 */
export const XAI_PROVIDER_INFO = {
  id: "xai",
  version: "v1",
  name: "xAI Grok Provider",
  description:
    "Provider for xAI's Grok models with streaming and tool calling support",
  supportedModels: [
    "grok-3-mini",
    "grok-3",
    "grok-4-0709",
    "grok-2",
    "grok-2-mini",
    "grok-2-vision-1212",
  ],
  capabilities: {
    streaming: true,
    toolCalls: true,
    images: true,
    documents: true,
    maxTokens: 8192,
    supportedContentTypes: ["text", "image", "document"],
    temperature: true,
    topP: true,
    promptCaching: false,
  },
} as const;

// Utility exports for advanced usage
export { parseXaiResponseStream } from "./streamingParser";
export { parseXaiResponse } from "./responseParser";
export { translateChatRequest } from "./translator";
export { translateToolDefinitions, parseToolCalls } from "./toolTranslator";
export {
  XAIV1ResponseSchema,
  XAIV1StreamingResponseSchema,
  type XAIV1Response,
  type XAIV1StreamingResponse,
} from "./responseSchema";
export { XAIV1RequestSchema, type XAIV1Request } from "./requestSchema";
export { XAIV1ConfigSchema } from "./configSchema";
export { normalizeXaiError } from "./errorNormalizer";
```

### 2. Update Global Provider Registry (`src/providers/index.ts`)

Add xAI provider to the existing provider exports:

```typescript
// Add to existing exports
export { XAIV1Provider, XAI_PROVIDER_INFO } from "./xai-v1/index";
export { default as xaiV1Provider } from "./xai-v1/index";
```

### 3. Type Definitions Export (`src/providers/xai-v1/types.ts`)

Create consolidated type exports if needed:

```typescript
/**
 * Consolidated type exports for xAI provider
 */

export type { XAIV1Config } from "./configSchema";
export type { XAIV1Request } from "./requestSchema";
export type {
  XAIV1Response,
  XAIV1StreamingResponse,
  XAIV1ErrorResponse,
} from "./responseSchema";

// Re-export provider class type
export type { XAIV1Provider } from "./xaiV1Provider";

// Provider metadata type
export type XAIProviderInfo = typeof XAI_PROVIDER_INFO;
```

## Acceptance Criteria

### Module Export Requirements

✅ **Provider Class Export**: XAIV1Provider class exported as named and default export
✅ **Configuration Types**: All configuration types exported for consumer use
✅ **Provider Metadata**: XAI_PROVIDER_INFO constant exported with complete information
✅ **Utility Functions**: Key utility functions exported for advanced usage
✅ **Schema Exports**: Request/response schemas exported for validation
✅ **Type Definitions**: Complete TypeScript type coverage for all exports

### Registration Requirements

✅ **Global Registry**: xAI provider added to global provider index
✅ **Named Exports**: Provider available as named export
✅ **Default Export**: Provider available as default export for dynamic imports
✅ **Metadata Export**: Provider info available for discovery and introspection
✅ **Consistent Naming**: Follows established naming patterns from other providers

### Documentation Requirements

✅ **JSDoc Comments**: Comprehensive documentation for all exports
✅ **Usage Examples**: Clear examples of how to import and use the provider
✅ **Type Documentation**: Type definitions properly documented
✅ **Capability Information**: Provider capabilities clearly documented

## Testing Requirements

Include unit tests covering:

### Export Structure Tests

- All expected exports are available
- Named exports work correctly
- Default export works correctly
- Type exports are accessible

### Provider Registry Tests

- Provider appears in global registry
- Provider metadata is correct
- Provider can be imported from registry
- No naming conflicts with existing providers

### Integration Tests

- Provider can be instantiated from exports
- Configuration types work correctly
- Utility functions work when imported
- Provider registration integration works

## Implementation Steps

1. **Create Module Index**: Set up main export file with all necessary exports
2. **Provider Metadata**: Define complete provider information and capabilities
3. **Utility Exports**: Export key utility functions for advanced usage
4. **Type Exports**: Ensure all TypeScript types are properly exported
5. **Update Global Registry**: Add xAI provider to global provider index
6. **Documentation**: Add comprehensive JSDoc comments
7. **Write Unit Tests**: Test all export functionality
8. **Integration Testing**: Verify provider registration works end-to-end

## Dependencies

- **Prerequisites**: T-implement-main-xai-provider (main provider class)
- **Enables**: xAI provider usage throughout the library

## Out of Scope

- Provider usage examples (handled in documentation)
- Advanced provider configuration (handled in config schema)
- Provider selection logic (handled by model registry)
- Performance optimization (initial implementation focus)

## Technical Notes

- Follow the established export patterns from existing providers
- Ensure all necessary types are exported for consumer use
- Maintain consistency with provider naming conventions
- Export utility functions that consumers might need for advanced usage
- Verify no circular import dependencies
