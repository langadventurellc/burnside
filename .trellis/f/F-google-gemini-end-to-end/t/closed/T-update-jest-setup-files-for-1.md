---
id: T-update-jest-setup-files-for-1
title: Update Jest setup files for Google provider validation
status: done
priority: high
parent: F-google-gemini-end-to-end
prerequisites:
  - T-extend-api-key-validation-for
affectedFiles:
  src/__tests__/e2e/setup/globalSetup.ts: Added Google provider detection logic
    and Google API key validation that triggers when test pattern includes
    'google'. Extended isRunningOpenAITests logic to exclude Google tests as
    well as Anthropic tests.
  src/__tests__/e2e/setup/setupEnv.ts: Added Google provider validation to
    validateProviderEnvironment function with else if condition for
    testPath.includes('google'). Includes Google API key presence check and
    format validation using validateApiKey function.
  src/__tests__/e2e/setup/__tests__/globalSetup.test.ts: Added comprehensive
    Google provider test coverage including Google API key validation tests,
    test pattern detection for Google provider, and provider credential
    isolation tests ensuring Google tests don't require other provider
    credentials and vice versa.
log:
  - Successfully updated Jest setup files to support Google provider validation
    while maintaining provider credential isolation. Extended globalSetup.ts to
    detect Google test patterns and validate GOOGLE_API_KEY when running Google
    tests. Extended setupEnv.ts to handle Google-specific environment validation
    using the existing provider pattern. Updated globalSetup.test.ts with
    comprehensive test coverage for Google provider scenarios including provider
    isolation tests. All quality checks pass and tests verify the Google
    provider integration works correctly while maintaining backward
    compatibility with OpenAI and Anthropic providers.
schema: v1.0
childrenIds: []
created: 2025-09-17T07:01:01.984Z
updated: 2025-09-17T07:01:01.984Z
---

# Update Jest Setup Files for Google Provider Validation

## Context

Update the existing Jest setup files (`globalSetup.ts` and `setupEnv.ts`) to include Google provider validation while maintaining provider credential isolation. This follows the exact pattern used for Anthropic provider integration.

## Reference Implementation

Follow the pattern in:

- `src/__tests__/e2e/setup/globalSetup.ts` - Current OpenAI/Anthropic validation
- `src/__tests__/e2e/setup/setupEnv.ts` - Provider-aware validation pattern

## Specific Implementation Requirements

### 1. Update Global Setup

Extend `src/__tests__/e2e/setup/globalSetup.ts` to add Google validation:

```typescript
// Add Google validation when running Google tests
const testPattern = process.env.JEST_TEST_PATH_PATTERN;
if (testPattern?.includes("google")) {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey || !validateApiKey(googleApiKey, "google")) {
    throw new Error("GOOGLE_API_KEY is required for Google E2E tests");
  }
}
```

### 2. Update Setup Environment

Extend `src/__tests__/e2e/setup/setupEnv.ts` to handle Google-specific validation using the existing provider pattern. Follow the same approach used for Anthropic provider discrimination.

### 3. Provider Isolation

Ensure that:

- OpenAI tests continue to work without Google credentials
- Anthropic tests continue to work without Google credentials
- Google tests only require Google credentials
- No breaking changes to existing test execution

## Acceptance Criteria

### Functional Requirements

- `globalSetup.ts` validates `GOOGLE_API_KEY` when test pattern includes "google"
- `setupEnv.ts` handles Google-specific environment validation per test
- Existing OpenAI validation continues to work unchanged
- Existing Anthropic validation continues to work unchanged
- Provider credential isolation is maintained

### Environment Validation

- Google validation only triggers when running Google-specific tests
- Validation uses `validateApiKey(key, "google")` function
- Clear error messages for missing or invalid Google API keys
- Test pattern detection works with Jest's `--testPathPattern=google` filter

### Testing Requirements

Create/update unit tests in `src/__tests__/e2e/setup/__tests__/`:

- Update existing `globalSetup.test.ts` to cover Google provider scenarios
- Test Google credential validation logic
- Test provider isolation (other providers don't require Google creds)
- Test Jest test pattern detection for Google provider

Test scenarios:

- Valid Google credentials with Google test pattern
- Missing Google credentials with Google test pattern
- Google test pattern detection
- Provider isolation verification
- Backward compatibility with existing providers

## Technical Approach

1. **Import validateApiKey function** created in previous task
2. **Follow existing pattern** for provider credential validation
3. **Use test pattern detection** via `process.env.JEST_TEST_PATH_PATTERN`
4. **Maintain provider isolation** - don't break existing flows
5. **Add clear error messages** following existing error message patterns
6. **Update existing unit tests** to cover new Google scenarios

## Dependencies

- T-extend-api-key-validation-for (requires Google API key validation)

## Out of Scope

- Changes to Jest configuration files
- Changes to NPM scripts (handled in separate task)
- Provider authentication implementation
- Test execution optimization

## Files to Modify

- `src/__tests__/e2e/setup/globalSetup.ts` - Add Google validation logic
- `src/__tests__/e2e/setup/setupEnv.ts` - Extend provider-specific validation
- `src/__tests__/e2e/setup/__tests__/globalSetup.test.ts` - Update unit tests for Google scenarios

## Integration Notes

This task ensures that the Jest test environment is properly configured to validate Google credentials before attempting to run Google E2E tests, while maintaining the isolation that allows other provider tests to run independently.
