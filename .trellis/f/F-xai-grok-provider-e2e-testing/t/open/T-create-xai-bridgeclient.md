---
id: T-create-xai-bridgeclient
title: Create xAI BridgeClient factory and model helpers
status: open
priority: high
parent: F-xai-grok-provider-e2e-testing
prerequisites:
  - T-create-xai-test-configuration
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T00:10:13.863Z
updated: 2025-09-18T00:10:13.863Z
---

# Create xAI BridgeClient Factory and Model Helpers

## Context

This task implements the BridgeClient factory and model management infrastructure for xAI E2E testing. This follows the exact patterns from OpenAI E2E testing but registers the XAIV1Provider and uses xAI-specific configuration.

## Reference Implementation

Follow these existing OpenAI E2E testing patterns:

- `src/__tests__/e2e/shared/openAIModelHelpers.ts` - BridgeClient factory with provider registration
- `src/__tests__/e2e/shared/ensureModelRegistered.ts` - Model registry management

## Implementation Requirements

### 1. Create xAI Model Helpers (`src/__tests__/e2e/shared/xaiModelHelpers.ts`)

Implement BridgeClient factory with xAI provider registration:

```typescript
import { BridgeClient } from "../../../client/bridgeClient";
import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import { XAIV1Provider } from "../../../providers/xai-v1/xaiV1Provider";
import { loadXaiTestConfig } from "./xaiTestConfig";

export function createTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  const testConfig = loadXaiTestConfig();

  const config: BridgeConfig = {
    defaultProvider: "xai",
    providers: {
      xai: { apiKey: testConfig.xaiApiKey },
    },
    modelSeed: "builtin", // Use builtin seed to populate registry with Grok models
    tools: {
      enabled: true,
      builtinTools: ["echo"], // Required when tools enabled per schema
    },
    ...overrides,
  };

  const client = new BridgeClient(config);
  client.registerProvider(new XAIV1Provider());
  return client;
}
```

### 2. Verify Model Registry Integration

Ensure the implementation works with builtin model seeding:

- **Default models**: grok-3-mini, grok-3, grok-4-0709 should be automatically registered
- **Model capabilities**: Verify streaming, toolCalls, images capabilities are preserved
- **Provider plugin**: Ensure models use "xai-v1" provider plugin correctly

The builtin seed already includes these models in `src/data/defaultLlmModels.ts`:

```typescript
{
  id: "xai",
  name: "xAI",
  models: [
    {
      id: "grok-3-mini",
      providerPlugin: "xai-v1",
      name: "Grok 3 Mini",
      contextLength: 130000,
      streaming: true,
      toolCalls: true,
      images: true,
      documents: true,
      supportedContentTypes: ["text", "image", "document"],
    },
    // ... grok-3 and grok-4-0709
  ]
}
```

### 3. Create Test Configuration Override Support

Add support for custom provider configurations for testing scenarios:

```typescript
export function createTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  // Implementation handles provider config overrides for authentication testing
  // Supports custom API keys for error testing scenarios
}
```

## Technical Approach

1. **Follow OpenAI patterns exactly**: Mirror the structure and approach of `openAIModelHelpers.ts`
2. **xAI provider registration**: Use XAIV1Provider instead of OpenAIResponsesV1Provider
3. **Configuration integration**: Use the xAI test configuration from the previous task
4. **Model registry**: Leverage builtin seed for automatic Grok model registration
5. **Tool system**: Enable tools with echo builtin for testing tool functionality

## Acceptance Criteria

### Functional Requirements

- ✅ `createTestClient()` returns properly configured BridgeClient for xAI
- ✅ XAIV1Provider is registered and initialized correctly
- ✅ Default provider set to "xai" for test scenarios
- ✅ API key from XAI_API_KEY environment variable is used
- ✅ Builtin model seed populates registry with all three Grok models
- ✅ Tool system enabled with echo tool for testing

### Model Registry Integration

- ✅ All Grok models (grok-3-mini, grok-3, grok-4-0709) available in registry
- ✅ Model capabilities correctly loaded (streaming, toolCalls, images)
- ✅ Provider plugin correctly set to "xai-v1" for all models
- ✅ Default test model (grok-3-mini) works with created client

### Configuration Support

- ✅ Supports BridgeConfig overrides for custom test scenarios
- ✅ Handles provider configuration overrides (for authentication error testing)
- ✅ Maintains secure defaults while allowing test customization

### Error Handling

- ✅ Fails gracefully if xAI configuration is invalid
- ✅ Provides clear error messages for configuration issues
- ✅ Validates provider registration succeeds

## Dependencies

- Previous task: T-create-xai-test-configuration (for loadXaiTestConfig)
- XAIV1Provider from xAI provider implementation
- BridgeClient and BridgeConfig from core library
- Default model registry with Grok models

## Files to Create

**New Files:**

- `src/__tests__/e2e/shared/xaiModelHelpers.ts`

## Integration Testing

Verify integration works correctly:

- Create BridgeClient instance
- Verify XAIV1Provider is registered
- Check model registry contains expected Grok models
- Validate tool system is properly enabled
- Test configuration override functionality

## Technical Notes

### Provider Registration

- Use `client.registerProvider(new XAIV1Provider())` pattern
- Ensure provider initialization happens after BridgeClient creation
- Validate provider accepts xAI configuration correctly

### Model Registry

- Leverage `modelSeed: "builtin"` for automatic model registration
- No need for manual model registration since Grok models are in default seed
- Verify model IDs use "xai:" prefix format (e.g., "xai:grok-3-mini")

### Tool System

- Enable tools with `{ enabled: true, builtinTools: ["echo"] }`
- Echo tool required for tool execution E2E testing
- Validate tool registration works with xAI provider

## Out of Scope

- E2E test file implementation (handled by subsequent tasks)
- Custom model registration logic (builtin seed sufficient)
- Provider-specific error testing (handled in test files)
- Jest configuration (handled by configuration task)
