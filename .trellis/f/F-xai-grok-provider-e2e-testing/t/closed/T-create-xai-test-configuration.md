---
id: T-create-xai-test-configuration
title: Create xAI test configuration infrastructure
status: done
priority: high
parent: F-xai-grok-provider-e2e-testing
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/xaiTestConfigInterface.ts:
    Created TypeScript interface
    with xaiApiKey, testEnabled, testModel, and timeout properties following
    established pattern
  src/__tests__/e2e/shared/xaiTestConfig.ts: Created configuration loader with
    XAI_API_KEY validation, E2E_TEST_ENABLED checking, model selection with
    E2E_XAI_MODEL override support, and proper error handling
  src/__tests__/e2e/shared/validateApiKey.ts:
    Extended existing API key validation
    to support xAI provider with 'xai-' prefix requirement and minimum length
    validation
  src/__tests__/e2e/shared/getXaiTestModel.ts: Created model selection helper
    returning E2E_XAI_MODEL environment variable override or default
    'xai:grok-3-mini'
log:
  - Successfully implemented xAI test configuration infrastructure following
    established OpenAI patterns. Created TypeScript interface, configuration
    loader with API key validation, extended existing validateApiKey function
    for xAI support, and added model selection helper. All implementations
    follow project standards with proper error handling, security validation,
    and environment variable support. Quality checks and unit tests all pass.
schema: v1.0
childrenIds: []
created: 2025-09-18T00:09:35.689Z
updated: 2025-09-18T00:09:35.689Z
---

# Create xAI Test Configuration Infrastructure

## Context

This task implements the foundational configuration infrastructure for xAI E2E testing, following the exact patterns established by the OpenAI E2E testing framework. The xAI provider is already implemented and registered, so we need to create the configuration layer that validates API keys and manages test settings.

## Reference Implementation

Follow these existing OpenAI E2E testing patterns:

- `src/__tests__/e2e/shared/openAITestConfig.ts` - Configuration loading with API key validation
- `src/__tests__/e2e/shared/openAITestConfigInterface.ts` - TypeScript interface definitions
- `src/__tests__/e2e/shared/validateApiKey.ts` - API key format validation

## Implementation Requirements

### 1. Create xAI Test Configuration Interface (`src/__tests__/e2e/shared/xaiTestConfigInterface.ts`)

```typescript
export interface XaiTestConfig {
  xaiApiKey: string;
  testEnabled: boolean;
  testModel: string;
  timeout: number;
}
```

Follow the exact structure of `openAITestConfigInterface.ts` but adapted for xAI.

### 2. Create xAI Test Configuration Loader (`src/__tests__/e2e/shared/xaiTestConfig.ts`)

Implement configuration loading with:

- **XAI_API_KEY validation**: Must be present and start with "xai-" prefix
- **E2E_TEST_ENABLED validation**: Reuse existing flag, must be "true"
- **E2E_XAI_MODEL support**: Optional override, default to "xai:grok-3-mini"
- **Timeout configuration**: Default to 30000ms
- **Error handling**: Throw ValidationError for missing/invalid configuration

```typescript
export function loadXaiTestConfig(): XaiTestConfig {
  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) {
    throw new ValidationError(
      "XAI_API_KEY environment variable is required for E2E tests",
    );
  }

  if (!validateApiKey(xaiApiKey, "xai")) {
    throw new ValidationError("XAI_API_KEY must be a valid xAI API key format");
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new ValidationError(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
    );
  }

  return {
    xaiApiKey,
    testEnabled,
    testModel: process.env.E2E_XAI_MODEL || "xai:grok-3-mini",
    timeout: 30000,
  };
}
```

### 3. Extend API Key Validation (`src/__tests__/e2e/shared/validateApiKey.ts`)

Add xAI API key validation support to the existing function:

- Detect "xai" provider type
- Validate "xai-" prefix requirement
- Ensure minimum length for security

Update the existing `validateApiKey` function to handle xAI keys:

```typescript
// Add to existing function
if (provider === "xai") {
  return apiKey.startsWith("xai-") && apiKey.length > 10;
}
```

### 4. Create Model Selection Helper (`src/__tests__/e2e/shared/getXaiTestModel.ts`)

```typescript
export function getXaiTestModel(): string {
  return process.env.E2E_XAI_MODEL || "xai:grok-3-mini";
}
```

Follow the exact pattern of `getTestModel.ts` but for xAI.

## Technical Approach

1. **Mirror OpenAI patterns exactly**: Use the same file structure, naming conventions, and implementation patterns
2. **xAI-specific adaptations**: Handle "xai-" API key prefix and xAI model identifiers
3. **Reuse existing infrastructure**: Leverage existing ValidationError and test enablement patterns
4. **Security-first**: Validate API key format before any test execution

## Acceptance Criteria

### Functional Requirements

- ✅ `XaiTestConfig` interface matches OpenAI pattern with xAI-specific fields
- ✅ `loadXaiTestConfig()` validates XAI_API_KEY with "xai-" prefix requirement
- ✅ Configuration reuses existing E2E_TEST_ENABLED validation
- ✅ Support for E2E_XAI_MODEL environment override with sensible default
- ✅ Extended `validateApiKey()` handles xAI provider type correctly
- ✅ `getXaiTestModel()` provides environment-configurable model selection

### Error Handling

- ✅ Throws ValidationError for missing XAI_API_KEY
- ✅ Throws ValidationError for invalid API key format (missing "xai-" prefix)
- ✅ Throws ValidationError when E2E_TEST_ENABLED is not "true"
- ✅ All error messages are clear and actionable

### Security Requirements

- ✅ API key validation prevents invalid authentication attempts
- ✅ No API keys logged or exposed in error messages
- ✅ Secure defaults for all configuration options

## Dependencies

- Existing `ValidationError` class from core errors
- Existing `validateApiKey` function in shared E2E helpers
- Environment variable support (dotenv configuration)

## Files to Create/Modify

**New Files:**

- `src/__tests__/e2e/shared/xaiTestConfigInterface.ts`
- `src/__tests__/e2e/shared/xaiTestConfig.ts`
- `src/__tests__/e2e/shared/getXaiTestModel.ts`

**Modified Files:**

- `src/__tests__/e2e/shared/validateApiKey.ts` (extend for xAI support)

## Testing Approach

Include basic validation in the implementation:

- Test with valid xAI API key format
- Test error cases (missing key, invalid format, disabled tests)
- Verify environment variable override behavior
- Validate integration with existing error handling

## Out of Scope

- E2E test execution (handled by subsequent tasks)
- BridgeClient creation (handled by model helpers task)
- Jest configuration changes (handled by configuration task)
- NPM script additions (handled by configuration task)
