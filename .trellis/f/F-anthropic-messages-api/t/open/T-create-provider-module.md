---
id: T-create-provider-module
title: Create provider module exports and registration
status: open
priority: high
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-provider-1
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T13:26:12.999Z
updated: 2025-09-16T13:26:12.999Z
---

# Create Provider Module Exports and Registration

Implement the main module exports and provider registration infrastructure for the Anthropic Messages API provider, following the established pattern for clean module boundaries and including BridgeClient mapping dependency.

## Context

This task creates the module's main export file and ensures the provider can be properly imported and registered with the Bridge client. It establishes the public API surface for the Anthropic provider and includes updating the BridgeClient provider plugin mapping.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/index.ts` and `src/providers/index.ts`

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Locations

Create and update:

- `src/providers/anthropic-2023-06-01/index.ts` (new)
- `src/providers/index.ts` (update to export new provider)
- Update BridgeClient provider plugin mapping for "anthropic-2023-06-01"

### Provider Module Exports (`src/providers/anthropic-2023-06-01/index.ts`)

```typescript
/**
 * Anthropic Messages API v2023-06-01 Provider Module
 *
 * Main export module for the Anthropic Messages API provider plugin.
 * Provides the complete provider implementation and related types
 * for integration with the LLM Bridge library.
 */

export { AnthropicMessagesV1Provider } from "./anthropicMessagesV1Provider.js";
export type { AnthropicMessagesConfig } from "./configSchema.js";

// Export schemas for advanced usage
export { AnthropicMessagesConfigSchema } from "./configSchema.js";

// Default export for easy registration
export { AnthropicMessagesV1Provider as default } from "./anthropicMessagesV1Provider.js";

/**
 * Provider plugin metadata for identification
 */
export const ANTHROPIC_PROVIDER_INFO = {
  id: "anthropic",
  version: "2023-06-01",
  name: "Anthropic Messages Provider",
} as const;
```

### Main Providers Export Update (`src/providers/index.ts`)

Add Anthropic provider to the main providers export:

```typescript
// Existing exports...
export * from "./openai-responses-v1/index.js";

// Add new Anthropic provider export
export * from "./anthropic-2023-06-01/index.js";

// Update provider registry exports if applicable
export {
  // existing providers...
  ANTHROPIC_PROVIDER_INFO,
} from "./anthropic-2023-06-01/index.js";
```

### BridgeClient Provider Plugin Mapping Update

**Critical Integration Requirement**: Update the BridgeClient to handle the "anthropic-2023-06-01" provider plugin mapping.

1. **Locate BridgeClient mapping function**: Find `getProviderKeyFromPluginString` or similar mapping logic
2. **Add Anthropic mapping**: Add entry for "anthropic-2023-06-01" → `{ id: "anthropic", version: "2023-06-01" }`
3. **Ensure consistency**: Verify mapping aligns with provider plugin identifier used in model configurations

### Registration Helper (optional utility)

Create a registration helper function in the index file:

```typescript
/**
 * Creates and configures an Anthropic Messages API provider instance
 *
 * @param config - Provider configuration
 * @returns Configured provider instance ready for registration
 */
export async function createAnthropicProvider(
  config: AnthropicMessagesConfig,
): Promise<AnthropicMessagesV1Provider> {
  const provider = new AnthropicMessagesV1Provider();
  await provider.initialize(config);
  return provider;
}
```

### Documentation Comments

Include comprehensive JSDoc comments:

- Module purpose and usage
- Export descriptions
- Configuration requirements
- Integration examples
- Version compatibility notes

## Acceptance Criteria

1. **Module Structure**:
   - ✅ Clean module exports with named and default exports
   - ✅ Type exports separated from runtime exports
   - ✅ Provider metadata constants exported
   - ✅ Follows established pattern from OpenAI provider

2. **Import/Export Validation**:
   - ✅ All exports can be imported without errors
   - ✅ TypeScript types are properly exported
   - ✅ Default export works for direct registration
   - ✅ Named exports work for selective imports

3. **Integration Points**:
   - ✅ Provider can be imported from main providers module
   - ✅ Configuration types accessible for client code
   - ✅ Provider metadata available for tooling/introspection

4. **BridgeClient Mapping**:
   - ✅ **BridgeClient maps 'anthropic-2023-06-01' to { id: 'anthropic', version: '2023-06-01' } in getProviderKeyFromPluginString**
   - ✅ **Provider plugin mapping works correctly for model routing**
   - ✅ **Integration with Bridge client provider discovery**

5. **Documentation**:
   - ✅ Comprehensive JSDoc comments for all exports
   - ✅ Usage examples in module documentation
   - ✅ Clear provider identification and versioning

6. **Unit Tests** (included in this task):
   - ✅ Test all exports are accessible
   - ✅ Test provider metadata constants
   - ✅ Test default vs named export equivalence
   - ✅ Test provider creation helper function
   - ✅ Test integration with main providers module
   - ✅ **Test BridgeClient provider plugin mapping**
   - ✅ Verify TypeScript type exports

7. **File Structure Validation**:
   - ✅ Follows established directory structure
   - ✅ Import paths use .js extensions for ESM compatibility
   - ✅ No circular dependencies introduced

## Dependencies

- Provider class from T-create-anthropic-provider-1
- Configuration schema from T-create-anthropic-provider
- Main providers module structure
- **BridgeClient provider plugin mapping infrastructure**

## Out of Scope

- Provider registration with Bridge client (handled by client code)
- Runtime provider discovery (handled by Bridge core)
- Provider plugin loading mechanisms (handled by core framework)

## Testing Requirements

Create `src/providers/anthropic-2023-06-01/__tests__/index.test.ts` with:

- Export accessibility tests
- Module structure validation
- Provider metadata verification
- Integration testing with main exports
- **BridgeClient mapping verification tests**
- TypeScript type availability tests

## Integration Notes

After this task, users will be able to:

```typescript
// Named import
import {
  AnthropicMessagesV1Provider,
  type AnthropicMessagesConfig,
} from "llm-bridge/providers/anthropic-2023-06-01";

// Default import
import AnthropicProvider from "llm-bridge/providers/anthropic-2023-06-01";

// From main providers module
import { AnthropicMessagesV1Provider } from "llm-bridge/providers";
```

And the BridgeClient will properly route models with `providerPlugin: "anthropic-2023-06-01"` to the Anthropic provider.
