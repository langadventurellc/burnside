---
id: T-extend-api-key-validation-for
title: Extend API key validation for Google provider
status: done
priority: high
parent: F-google-gemini-end-to-end
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/validateApiKey.ts:
    Added Google provider case to switch
    statement with AIza prefix and 39-character length validation
  src/__tests__/e2e/shared/__tests__/validateApiKey.google.test.ts:
    Created comprehensive test suite with 20 test cases covering valid Google
    API keys, invalid formats, edge cases, and backward compatibility
    verification
log:
  - Extended validateApiKey function to support Google provider with exact
    Google API key format validation (AIza prefix, exactly 39 characters).
    Implemented comprehensive unit test suite with 20 test cases covering
    valid/invalid keys, edge cases, and backward compatibility. All existing
    OpenAI and Anthropic validation continues working unchanged. All quality
    checks pass with 100% test coverage.
schema: v1.0
childrenIds: []
created: 2025-09-17T06:59:47.204Z
updated: 2025-09-17T06:59:47.204Z
---

# Extend API Key Validation for Google Provider

## Context

Extend the existing `validateApiKey.ts` function to support Google API key validation, following the same pattern used for OpenAI and Anthropic providers. Google API keys have a different format (no standard prefix like `sk-` or `sk-ant-`) and require length-based validation.

## Reference Implementation

Follow the pattern in `src/__tests__/e2e/shared/validateApiKey.ts` which currently supports OpenAI and Anthropic providers. The existing implementation shows provider discrimination using a provider parameter.

## Specific Implementation Requirements

### 1. Update validateApiKey Function

Extend the existing `validateApiKey` function to accept `"google"` as a valid provider:

```typescript
export function validateApiKey(
  key: string,
  provider: "openai" | "anthropic" | "google",
): boolean {
  if (provider === "google") {
    // Google API keys don't have standard prefix, validate by length and basic format
    return typeof key === "string" && key.length >= 20 && key.length <= 200;
  }
  // Keep existing OpenAI and Anthropic logic unchanged
  // ...existing code
}
```

### 2. Google API Key Validation Logic

- **No prefix requirement**: Unlike OpenAI (`sk-`) or Anthropic (`sk-ant-`), Google API keys don't have a standard prefix
- **Length validation**: Must be between 20-200 characters
- **Type validation**: Must be a string
- **Basic format**: Should contain alphanumeric characters

### 3. Unit Tests

Create comprehensive unit tests in `src/__tests__/e2e/shared/__tests__/validateApiKey.google.test.ts`:

- Valid Google API key formats (various lengths within range)
- Invalid keys (too short, too long, wrong type, null/undefined)
- Edge cases (empty string, boundary lengths)
- Ensure existing OpenAI and Anthropic validation still works

## Acceptance Criteria

### Functional Requirements

- `validateApiKey(key, "google")` returns `true` for valid Google API keys (20-200 chars)
- `validateApiKey(key, "google")` returns `false` for invalid keys (too short/long, wrong type)
- Existing OpenAI validation continues to work unchanged: `validateApiKey("sk-...", "openai")`
- Existing Anthropic validation continues to work unchanged: `validateApiKey("sk-ant-...", "anthropic")`

### Testing Requirements

- Unit tests cover all validation scenarios for Google keys
- Unit tests verify existing provider validation is not broken
- Tests cover edge cases and boundary conditions
- Test file follows existing naming convention (`validateApiKey.google.test.ts`)

### Security Requirements

- Validation prevents obviously invalid keys from being used
- No logging or exposure of actual API key values in validation
- Type safety maintained with TypeScript provider union type

## Technical Approach

1. **Read existing implementation** in `src/__tests__/e2e/shared/validateApiKey.ts`
2. **Follow the same pattern** used for OpenAI/Anthropic discrimination
3. **Add Google-specific validation logic** with appropriate length checks
4. **Update TypeScript types** to include `"google"` in provider union
5. **Write comprehensive unit tests** following existing test patterns
6. **Verify backward compatibility** with existing providers

## Dependencies

- None - this is a foundational task that other tasks will depend on

## Out of Scope

- Actual API key authentication with Google services (handled by provider)
- Validation beyond basic format checking
- Integration with other provider validation systems
- Performance optimization of validation logic

## Files to Modify

- `src/__tests__/e2e/shared/validateApiKey.ts` - Add Google provider support
- `src/__tests__/e2e/shared/__tests__/validateApiKey.google.test.ts` - Create Google-specific tests (new file)
