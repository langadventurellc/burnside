---
id: T-create-google-test-configurati
title: Create Google test configuration interface and loader
status: open
priority: high
parent: F-google-gemini-end-to-end
prerequisites:
  - T-extend-api-key-validation-for
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T07:00:11.272Z
updated: 2025-09-17T07:00:11.272Z
---

# Create Google Test Configuration Interface and Loader

## Context

Create Google-specific test configuration interface and loader functions following the exact pattern used by OpenAI (`openAITestConfig.ts`) and Anthropic (`anthropicTestConfig.ts`) providers. This maintains provider isolation and follows the established architecture pattern.

## Reference Implementation

Follow the patterns in:

- `src/__tests__/e2e/shared/openAITestConfigInterface.ts` and `openAITestConfig.ts`
- `src/__tests__/e2e/shared/anthropicTestConfigInterface.ts` and `anthropicTestConfig.ts`

## Specific Implementation Requirements

### 1. Google Test Config Interface

Create `src/__tests__/e2e/shared/googleTestConfigInterface.ts`:

```typescript
export interface GoogleTestConfig {
  googleApiKey: string;
  testEnabled: boolean;
  testModel: string;
  timeout: number;
}
```

### 2. Google Test Config Loader

Create `src/__tests__/e2e/shared/googleTestConfig.ts`:

```typescript
import { ValidationError } from "../../../core/errors/validationError.js";
import { validateApiKey } from "./validateApiKey.js";
import type { GoogleTestConfig } from "./googleTestConfigInterface.js";

export function loadGoogleTestConfig(): GoogleTestConfig {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    throw new ValidationError(
      "GOOGLE_API_KEY environment variable is required for Google E2E tests",
    );
  }

  if (!validateApiKey(googleApiKey, "google")) {
    throw new ValidationError(
      "GOOGLE_API_KEY must be a valid Google API key format",
    );
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new ValidationError(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
    );
  }

  return {
    googleApiKey,
    testEnabled,
    testModel: process.env.E2E_GOOGLE_MODEL || "google:gemini-2.5-flash",
    timeout: 30000,
  };
}
```

### 3. Google Test Model Helper

Create `src/__tests__/e2e/shared/getGoogleTestModel.ts`:

```typescript
export function getGoogleTestModel(): string {
  return process.env.E2E_GOOGLE_MODEL || "google:gemini-2.5-flash";
}
```

## Acceptance Criteria

### Functional Requirements

- `loadGoogleTestConfig()` validates `GOOGLE_API_KEY` environment variable
- Function validates `E2E_TEST_ENABLED` is set to "true"
- Function uses `validateApiKey(key, "google")` for API key format validation
- Default model is `"google:gemini-2.5-flash"` (cost-efficient, full features)
- Environment variable `E2E_GOOGLE_MODEL` can override default model
- Default timeout is 30000ms (30 seconds)

### Error Handling

- Throws `ValidationError` with clear message if `GOOGLE_API_KEY` is missing
- Throws `ValidationError` if API key format is invalid
- Throws `ValidationError` if `E2E_TEST_ENABLED` is not "true"
- Error messages are specific and actionable for developers

### Testing Requirements

Create comprehensive unit tests in `src/__tests__/e2e/shared/__tests__/`:

- `googleTestConfig.test.ts` - Test config loading with various environment states
- `getGoogleTestModel.test.ts` - Test model selection logic

Test scenarios:

- Valid configuration loading
- Missing environment variables
- Invalid API key formats
- Environment variable override behavior
- Error message accuracy

## Technical Approach

1. **Follow existing patterns** from OpenAI and Anthropic implementations
2. **Use same validation approach** with ValidationError for consistency
3. **Import validateApiKey function** created in previous task
4. **Follow file naming conventions** matching other providers
5. **Use same timeout and structure** as existing providers
6. **Maintain provider isolation** - no dependencies on other provider configs

## Dependencies

- T-extend-api-key-validation-for (requires Google API key validation)

## Out of Scope

- Configuration for other providers (maintain isolation)
- Complex configuration validation beyond basic format checks
- Configuration caching or optimization
- Integration with provider authentication systems

## Files to Create

- `src/__tests__/e2e/shared/googleTestConfigInterface.ts` - Interface definition
- `src/__tests__/e2e/shared/googleTestConfig.ts` - Configuration loader function
- `src/__tests__/e2e/shared/getGoogleTestModel.ts` - Model selection helper
- `src/__tests__/e2e/shared/__tests__/googleTestConfig.test.ts` - Unit tests for config
- `src/__tests__/e2e/shared/__tests__/getGoogleTestModel.test.ts` - Unit tests for model selection
