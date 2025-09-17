---
id: T-update-jest-setup-files-for
title: Update Jest setup files for Anthropic environment validation
status: open
priority: high
parent: F-anthropic-end-to-end-testing
prerequisites:
  - T-extend-shared-helpers-for
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T00:49:32.411Z
updated: 2025-09-17T00:49:32.411Z
---

# Update Jest Setup Files for Anthropic Environment Validation

## Context

This task extends the existing Jest setup infrastructure to validate Anthropic credentials when running Anthropic E2E tests, while maintaining complete compatibility with OpenAI tests. This follows the exact same validation stages as the OpenAI setup.

## Implementation Requirements

### 1. Update Global Setup (`src/__tests__/e2e/setup/globalSetup.ts`)

Add Anthropic validation alongside existing OpenAI validation:

```typescript
// Add import for validateApiKey
import { validateApiKey } from "../shared/validateApiKey.js";

export default async function globalSetup() {
  // Keep existing OpenAI validation logic unchanged

  // Add Anthropic validation when running Anthropic tests
  const testPattern =
    process.env.JEST_TEST_PATH_PATTERN || process.argv.join(" ");
  if (testPattern.includes("anthropic")) {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is required for Anthropic E2E tests",
      );
    }
    if (!validateApiKey(anthropicApiKey, "anthropic")) {
      throw new Error(
        "ANTHROPIC_API_KEY must be a valid Anthropic API key format (sk-ant- prefix)",
      );
    }
  }
}
```

**Testing**: Verify that Anthropic validation triggers only when running Anthropic tests and that OpenAI tests continue to work without Anthropic credentials.

### 2. Update Per-Test Setup (`src/__tests__/e2e/setup/setupEnv.ts`)

Extend existing per-test validation to handle Anthropic-specific validation following the same provider pattern:

```typescript
// Add provider-aware validation function
function validateProviderEnvironment(testPath: string) {
  // Keep existing OpenAI validation for OpenAI tests

  // Add Anthropic validation for Anthropic tests
  if (testPath.includes("anthropic")) {
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
  }
}

// Integrate into existing setup pattern
beforeEach(() => {
  const testPath = expect.getState().testPath || "";
  validateProviderEnvironment(testPath);
});
```

**Testing**: Add tests to verify provider-specific validation and ensure OpenAI tests don't require Anthropic credentials.

## Acceptance Criteria

- [ ] Global setup validates ANTHROPIC_API_KEY only when running Anthropic tests
- [ ] Per-test setup handles Anthropic validation following existing provider patterns
- [ ] OpenAI E2E tests continue to work without Anthropic environment variables
- [ ] Anthropic E2E tests fail gracefully with clear error messages if credentials are missing
- [ ] API key format validation (sk-ant- prefix) works in setup stages
- [ ] Test path detection correctly identifies Anthropic vs OpenAI test runs
- [ ] No breaking changes to existing Jest setup infrastructure

## Dependencies

- Requires completed T-extend-shared-helpers-for task for validateApiKey function
- Import ValidationError from existing error handling module
- Use existing Jest setup patterns and configuration

## Security Considerations

- Never log API keys in setup validation or error messages
- Validate API key format before proceeding with test execution
- Maintain provider credential isolation
- Fail securely if credentials are missing or invalid

## Testing Requirements

Write unit tests for:

- Global setup Anthropic validation logic
- Per-test setup provider discrimination
- Error handling for missing/invalid credentials
- Compatibility with existing OpenAI setup flow

## Out of Scope

- Creating actual Anthropic E2E test files (handled by separate tasks)
- Updating .env.example documentation (handled by separate task)
- Adding NPM scripts (handled by separate task)
