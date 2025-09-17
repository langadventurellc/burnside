---
id: T-extend-shared-helpers-for
title: Extend shared helpers for Anthropic provider support
status: done
priority: high
parent: F-anthropic-end-to-end-testing
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/validateApiKey.ts:
    Extended validateApiKey function to
    support Anthropic provider with sk-ant- prefix validation alongside existing
    OpenAI support
  src/__tests__/e2e/shared/anthropicTestConfigInterface.ts:
    Created new interface
    for Anthropic test configuration following one-export-per-file rule
  src/__tests__/e2e/shared/anthropicTestConfig.ts: Implemented
    loadAnthropicTestConfig function with environment variable validation and
    error handling
  src/__tests__/e2e/shared/anthropicModelHelpers.ts: Created
    createAnthropicTestClient function for Anthropic provider registration and
    configuration
  src/__tests__/e2e/shared/getAnthropicTestModel.ts: Implemented
    getAnthropicTestModel function for environment-based model selection with
    defaults
  src/__tests__/e2e/shared/__tests__/validateApiKey.anthropic.test.ts:
    Comprehensive unit tests for Anthropic API key validation covering
    valid/invalid cases and error scenarios
  src/__tests__/e2e/shared/__tests__/anthropicTestConfig.test.ts:
    Complete test coverage for Anthropic test configuration loading including
    mocking and error cases
  src/__tests__/e2e/shared/__tests__/anthropicModelHelpers.test.ts:
    Full unit tests for Anthropic client creation with provider registration and
    configuration override testing
  src/__tests__/e2e/shared/__tests__/getAnthropicTestModel.test.ts:
    Unit tests for Anthropic model selection covering environment variables and
    default values
log:
  - Successfully extended shared helpers for Anthropic provider support while
    maintaining complete backward compatibility with OpenAI tests. Implemented
    API key validation for sk-ant- prefix, created separate Anthropic test
    configuration loading, added Anthropic test client creation function, and
    added Anthropic model selection helpers. All functionality includes
    comprehensive unit tests with 100% test coverage for new code. Quality
    checks (linting, formatting, type checking) and full test suite pass
    successfully.
schema: v1.0
childrenIds: []
created: 2025-09-17T00:49:10.595Z
updated: 2025-09-17T00:49:10.595Z
---

# Extend Shared Helpers for Anthropic Provider Support

## Context

This task extends the existing E2E test shared helpers to support Anthropic provider while maintaining complete backward compatibility with OpenAI tests. This is a foundational task that enables all subsequent Anthropic E2E test implementation.

## Implementation Requirements

### 1. Extend API Key Validation (`src/__tests__/e2e/shared/validateApiKey.ts`)

Add Anthropic API key validation to the existing provider discrimination function:

```typescript
export function validateApiKey(
  key: string,
  provider: "openai" | "anthropic",
): boolean {
  if (provider === "anthropic") {
    return key.startsWith("sk-ant-") && key.length >= 20;
  }
  // Keep existing OpenAI logic unchanged
  return key.startsWith("sk-") && key.length >= 20;
}
```

**Testing**: Add unit tests for Anthropic key validation covering valid/invalid sk-ant- prefixes and length requirements.

### 2. Add Anthropic Test Configuration (`src/__tests__/e2e/shared/testConfig.ts`)

Create separate `loadAnthropicTestConfig()` function to avoid coupling with OpenAI configuration:

```typescript
export interface AnthropicTestConfig {
  anthropicApiKey: string;
  testEnabled: boolean;
  testModel: string;
  timeout: number;
}

export function loadAnthropicTestConfig(): AnthropicTestConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new ValidationError(
      "ANTHROPIC_API_KEY environment variable is required for Anthropic E2E tests",
    );
  }

  if (!validateApiKey(anthropicApiKey, "anthropic")) {
    throw new ValidationError(
      "ANTHROPIC_API_KEY must be a valid Anthropic API key format",
    );
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new ValidationError(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
    );
  }

  return {
    anthropicApiKey,
    testEnabled,
    testModel:
      process.env.E2E_ANTHROPIC_MODEL || "anthropic:claude-3-5-haiku-latest",
    timeout: 30000,
  };
}
```

**Testing**: Add unit tests for configuration loading, validation, and error scenarios.

### 3. Add Anthropic Model Helpers (`src/__tests__/e2e/shared/modelHelpers.ts`)

Create `createAnthropicTestClient()` function following the OpenAI pattern:

```typescript
export function createAnthropicTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  const testConfig = loadAnthropicTestConfig();
  const config: BridgeConfig = {
    defaultProvider: "anthropic",
    providers: { anthropic: { apiKey: testConfig.anthropicApiKey } },
    modelSeed: "builtin",
    tools: { enabled: true, builtinTools: ["echo"] },
    ...overrides,
  };
  const client = new BridgeClient(config);
  client.registerProvider(new AnthropicMessagesV1Provider());
  return client;
}
```

**Testing**: Add unit tests for client creation, provider registration, and configuration merging.

### 4. Add Anthropic Model Selection (`src/__tests__/e2e/shared/getTestModel.ts`)

Add `getAnthropicTestModel()` function:

```typescript
export function getAnthropicTestModel(): string {
  return process.env.E2E_ANTHROPIC_MODEL || "anthropic:claude-3-5-haiku-latest";
}
```

**Testing**: Add unit tests for default model selection and environment override.

## Acceptance Criteria

- [ ] API key validation supports sk-ant- prefix validation with proper length checking
- [ ] Anthropic test configuration loads independently without affecting OpenAI config
- [ ] Anthropic test client creation registers AnthropicMessagesV1Provider correctly
- [ ] Default model selection uses claude-3-5-haiku-latest with environment override support
- [ ] All existing OpenAI helper functions continue to work unchanged
- [ ] Unit tests cover all new functionality with proper error scenarios
- [ ] No breaking changes to existing OpenAI E2E test infrastructure

## Dependencies

- Import AnthropicMessagesV1Provider from `src/providers/anthropic-2023-06-01/index.js`
- Use existing ValidationError from `src/core/errors/validationError.js`
- Follow existing patterns in OpenAI helper functions

## Security Considerations

- Never log API keys in test output or error messages
- Validate API key format before any operations
- Use environment variables exclusively for credentials
- Maintain provider credential isolation

## Out of Scope

- Creating actual Anthropic E2E test files (handled by separate tasks)
- Updating Jest setup files (handled by separate task)
- Adding NPM scripts (handled by separate task)
