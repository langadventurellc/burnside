---
id: T-create-google-model-helpers
title: Create Google model helpers for E2E testing
status: open
priority: high
parent: F-google-gemini-end-to-end
prerequisites:
  - T-create-google-test-configurati
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T07:00:38.038Z
updated: 2025-09-17T07:00:38.038Z
---

# Create Google Model Helpers for E2E Testing

## Context

Create Google-specific model helpers for E2E testing that follow the exact patterns used by OpenAI (`openAIModelHelpers.ts`) and Anthropic (`anthropicModelHelpers.ts`). This includes creating BridgeClient instances configured for Google provider testing and ensuring model registration works correctly.

## Reference Implementation

Follow the patterns in:

- `src/__tests__/e2e/shared/openAIModelHelpers.ts` - OpenAI client creation pattern
- `src/__tests__/e2e/shared/anthropicModelHelpers.ts` - Anthropic client creation pattern

## Specific Implementation Requirements

### 1. Google Model Helpers

Create `src/__tests__/e2e/shared/googleModelHelpers.ts`:

```typescript
import type { BridgeClient } from "../../../client/bridgeClient.js";
import type { BridgeConfig } from "../../../client/bridgeConfig.js";
import { BridgeClient as BridgeClientImpl } from "../../../client/bridgeClient.js";
import { GoogleGeminiV1Provider } from "../../../providers/google-gemini-v1/index.js";
import { loadGoogleTestConfig } from "./googleTestConfig.js";

export function createGoogleTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  const testConfig = loadGoogleTestConfig();
  const config: BridgeConfig = {
    defaultProvider: "google",
    providers: { google: { apiKey: testConfig.googleApiKey } },
    modelSeed: "builtin",
    tools: { enabled: true, builtinTools: ["echo"] },
    ...overrides,
  };
  const client = new BridgeClientImpl(config);
  client.registerProvider(new GoogleGeminiV1Provider());
  return client;
}
```

### 2. Integration with Existing Helpers

Ensure compatibility with existing shared helpers:

- Use `ensureModelRegistered()` from existing shared helpers
- Use same BridgeConfig structure as other providers
- Follow same provider registration pattern

## Acceptance Criteria

### Functional Requirements

- `createGoogleTestClient()` creates properly configured BridgeClient for Google provider
- Client uses `GoogleGeminiV1Provider` for provider registration
- Client is configured with Google API key from test configuration
- Default provider is set to "google"
- Model seed is set to "builtin" to populate registry with default models
- Tools are enabled with echo tool for testing
- Function accepts optional `BridgeConfig` overrides for test customization

### Provider Configuration

- Provider configuration uses Google API key from environment
- Default provider maps requests to Google Gemini provider
- Client can handle all 5 Google Gemini models from default registry:
  - `google:gemini-2.0-flash-lite`
  - `google:gemini-2.5-flash-lite`
  - `google:gemini-2.0-flash`
  - `google:gemini-2.5-flash`
  - `google:gemini-2.5-pro`

### Testing Requirements

Create comprehensive unit tests in `src/__tests__/e2e/shared/__tests__/googleModelHelpers.test.ts`:

- Client creation with default configuration
- Client creation with configuration overrides
- Provider registration verification
- Model registry population verification
- Error handling for invalid configurations
- Google provider integration testing

Test scenarios:

- Successful client creation with valid config
- Override behavior (providers, modelSeed, tools)
- Provider registration confirmation
- Error handling for missing API keys

## Technical Approach

1. **Import required dependencies** from BridgeClient and GoogleGeminiV1Provider
2. **Follow exact pattern** from OpenAI and Anthropic implementations
3. **Use loadGoogleTestConfig()** from previous task for configuration
4. **Register GoogleGeminiV1Provider** following same pattern as other providers
5. **Enable tools with echo** for test compatibility
6. **Support configuration overrides** for test flexibility

## Dependencies

- T-create-google-test-configurati (requires Google test configuration)
- GoogleGeminiV1Provider implementation (already complete)
- Existing BridgeClient infrastructure (already available)

## Out of Scope

- BridgeClient implementation changes
- Provider implementation changes
- Model registry modifications
- Complex client configuration beyond basic setup

## Files to Create

- `src/__tests__/e2e/shared/googleModelHelpers.ts` - Google client factory function
- `src/__tests__/e2e/shared/__tests__/googleModelHelpers.test.ts` - Unit tests for Google model helpers

## Integration Notes

This task creates the foundation for the actual E2E test files (chat, streaming, tools) by providing the properly configured BridgeClient instances they need to interact with Google Gemini APIs.
