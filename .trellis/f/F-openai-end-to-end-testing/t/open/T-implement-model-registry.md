---
id: T-implement-model-registry
title: Implement model registry helpers and test configuration
status: open
priority: high
parent: F-openai-end-to-end-testing
prerequisites:
  - T-create-e2e-test-directory
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T06:22:25.012Z
updated: 2025-09-16T06:22:25.012Z
---

# Implement Model Registry Helpers and Test Configuration

## Context

Create the model registry integration helpers and test configuration utilities that ensure proper model seeding and BridgeClient setup for E2E tests. This task handles the critical alignment with existing model registry and prevents "empty registry" issues.

Related to feature: F-openai-end-to-end-testing

## Specific Implementation Requirements

### 1. Create Model Helpers

Implement `src/__tests__/e2e/shared/modelHelpers.ts` with:

- `createTestClient()`: Creates properly configured BridgeClient with builtin model seeding
- `ensureModelRegistered()`: Registers custom models if specified via environment variables
- `getTestModel()`: Returns test model ID with environment override support

### 2. Create Test Configuration

Implement `src/__tests__/e2e/shared/testConfig.ts` with:

- Environment variable loading and validation
- Test configuration defaults
- API key validation utilities

### 3. Create General Test Helpers

Implement `src/__tests__/e2e/shared/testHelpers.ts` with:

- Common test utilities
- Response validation helpers
- Error testing utilities

## Technical Approach

### Model Helpers Implementation

```typescript
// modelHelpers.ts - Model registry integration
import { BridgeClient } from "../../../client/bridgeClient.js";
import { OpenAIResponsesV1Provider } from "../../../providers/openai-responses-v1/index.js";
import type { BridgeConfig } from "../../../core/config/bridgeConfig.js";

export function createTestClient(): BridgeClient {
  const config: BridgeConfig = {
    defaultProvider: "openai",
    providers: {
      openai: { apiKey: process.env.OPENAI_API_KEY! },
    },
    modelSeed: "builtin", // Explicitly use builtin seed to populate registry
    tools: {
      enabled: true,
      builtinTools: ["echo"], // Required when tools enabled per schema
    },
  };

  const client = new BridgeClient(config);
  client.registerProvider(new OpenAIResponsesV1Provider());
  return client;
}

export async function ensureModelRegistered(
  client: BridgeClient,
  modelId: string,
) {
  if (!client.getModelRegistry().get(modelId)) {
    // Register custom model if E2E_OPENAI_MODEL specifies non-seeded model
    const [provider, model] = modelId.split(":");
    client.getModelRegistry().register(modelId, {
      id: modelId,
      name: model,
      provider,
      capabilities: {
        streaming: true,
        toolCalls: true,
        images: false,
        documents: false,
        supportedContentTypes: ["text"],
      },
      metadata: { providerPlugin: "openai-responses-v1" },
    });
  }
}

export function getTestModel(): string {
  return process.env.E2E_OPENAI_MODEL || "openai:gpt-4o-2024-08-06";
}
```

### Test Configuration Implementation

```typescript
// testConfig.ts - Environment and configuration management
export interface E2ETestConfig {
  openaiApiKey: string;
  testEnabled: boolean;
  testModel: string;
  timeout: number;
}

export function loadTestConfig(): E2ETestConfig {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required for E2E tests",
    );
  }

  if (!validateApiKey(openaiApiKey)) {
    throw new Error("OPENAI_API_KEY must be a valid OpenAI API key format");
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new Error('E2E_TEST_ENABLED must be set to "true" to run E2E tests');
  }

  return {
    openaiApiKey,
    testEnabled,
    testModel: process.env.E2E_OPENAI_MODEL || "openai:gpt-4o-2024-08-06",
    timeout: 30000,
  };
}

export function validateApiKey(apiKey: string): boolean {
  // OpenAI API key format validation (starts with sk-, minimum length)
  return apiKey.startsWith("sk-") && apiKey.length >= 20;
}
```

### Test Helpers Implementation

```typescript
// testHelpers.ts - Common test utilities
import type { Message } from "../../../core/messages/message.js";

export function validateMessageSchema(message: Message): boolean {
  return (
    typeof message.id === "string" &&
    typeof message.role === "string" &&
    Array.isArray(message.content) &&
    typeof message.timestamp === "string"
  );
}

export function createSimplePrompt(text: string): Message {
  return {
    id: `test-msg-${Date.now()}`,
    role: "user",
    content: [{ type: "text", text }],
    timestamp: new Date().toISOString(),
  };
}
```

## Detailed Acceptance Criteria

### Functional Requirements

1. **Model Registry Integration**
   - ✅ `createTestClient()` creates BridgeClient with `modelSeed: "builtin"`
   - ✅ OpenAI provider is properly registered
   - ✅ Tools configuration includes required builtinTools when enabled
   - ✅ Providers configuration uses plain object (not Map)
   - ✅ Default model from seed data is used unless overridden

2. **Custom Model Support**
   - ✅ `ensureModelRegistered()` registers custom models with complete capabilities
   - ✅ Model capabilities include all required fields for InMemoryModelRegistry
   - ✅ Environment variable `E2E_OPENAI_MODEL` overrides default model
   - ✅ Model validation prevents "empty registry" errors
   - ✅ Proper model metadata includes providerPlugin mapping

3. **Configuration Management**
   - ✅ `loadTestConfig()` validates all required environment variables
   - ✅ `validateApiKey()` checks API key format (sk- prefix and length)
   - ✅ Clear error messages for missing or invalid configuration
   - ✅ Configuration provides sensible defaults

### Technical Requirements

1. **Type Safety and Schema Compliance**
   - ✅ BridgeConfig providers as plain object (not Map)
   - ✅ Tools config includes builtinTools when tools enabled
   - ✅ Model capabilities include all required fields
   - ✅ Proper TypeScript types for all functions and configurations
   - ✅ Import paths use proper ESM .js extensions

2. **Error Handling**
   - ✅ Graceful handling of missing environment variables
   - ✅ API key format validation without exposing sensitive data
   - ✅ Clear error messages for configuration issues
   - ✅ Validation without exposing sensitive data in logs

3. **Integration Alignment**
   - ✅ Uses exact model IDs from existing seed data
   - ✅ Proper provider plugin mapping ("openai-responses-v1")
   - ✅ Compatible with current BridgeClient architecture
   - ✅ Works with validateAndTransformConfig

## Dependencies

- T-create-e2e-test-directory must complete first (directory structure must exist)
- Existing model registry implementation in `src/data/defaultLlmModels.ts`
- BridgeClient and OpenAI provider implementations

## Security Considerations

1. **API Key Handling**
   - Never log actual API key values
   - Validate format without exposing content
   - Clear error messages that don't leak sensitive data

2. **Environment Variable Security**
   - Validate environment variables without logging values
   - Fail securely with actionable error messages
   - Ensure no sensitive data in error messages or logs

## Testing Requirements

1. **Unit Tests for Helpers**
   - Test `createTestClient()` creates properly configured client
   - Test `ensureModelRegistered()` handles custom models correctly
   - Test `loadTestConfig()` validation with various environment scenarios
   - Test `validateApiKey()` with valid and invalid formats
   - Test error handling for missing/invalid configuration

## Out of Scope

- Tool call reconciliation helpers (handled by separate task)
- Actual OpenAI test implementations (handled by other tasks)
- Streaming or chat-specific utilities (handled by other tasks)

## Files to Create

- `src/__tests__/e2e/shared/modelHelpers.ts`
- `src/__tests__/e2e/shared/testConfig.ts`
- `src/__tests__/e2e/shared/testHelpers.ts`
