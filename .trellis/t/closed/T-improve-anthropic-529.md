---
id: T-improve-anthropic-529
title: Improve Anthropic 529 overloaded error handling and consumer visibility
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/errors/errorCodes.ts: Added OVERLOADED_ERROR constant to ERROR_CODES
  src/core/errors/overloadedError.ts:
    Created new OverloadedError class extending
    BridgeError following existing patterns
  src/core/errors/index.ts: Added OverloadedError export
  src/providers/anthropic-2023-06-01/errorNormalizer.ts: Added 529 status code
    mapping to OverloadedError, updated buildHttpErrorMessage for 529 case,
    added retry context extraction for overload errors, updated
    normalizeAnthropicError to handle OverloadedError instances, added
    OverloadedError case to createBridgeError function
  src/providers/anthropic-2023-06-01/__tests__/errorNormalizer.test.ts:
    Added comprehensive unit tests for 529 error handling including basic
    mapping, retry info extraction, and Anthropic error message handling
log:
  - Successfully implemented improved Anthropic 529 overloaded error handling
    with clear consumer visibility. Added OverloadedError class extending
    BridgeError, updated Anthropic error normalizer to handle 529 status codes
    with proper message and retry context extraction, and added comprehensive
    unit tests. All quality checks pass with no regressions.
schema: v1.0
childrenIds: []
created: 2025-09-20T03:31:59.831Z
updated: 2025-09-20T03:31:59.831Z
---

## Problem Statement

When Anthropic returns a 529 "Overloaded" HTTP status code, the library currently handles it as a generic `ProviderError` without providing clear information to consumers that the service is specifically overloaded. This makes it difficult for library consumers to distinguish between different types of provider errors and implement appropriate retry strategies.

From the error logs, the current behavior shows:

- 529 errors are normalized to generic `ProviderError`
- No specific error message indicating overload condition
- Missing retry information that could help consumers

## Required Changes

### 1. Create a new OverloadedError class

- Add `OVERLOADED_ERROR: "OVERLOADED_ERROR"` to `ERROR_CODES` in `src/core/errors/errorCodes.ts`
- Create a new `OverloadedError` class that extends `BridgeError` (follow existing error class patterns)
- Export the new error class from appropriate index files

### 2. Update Anthropic error normalization

- Add `529: "OverloadedError"` to `STATUS_CODE_MAPPING` in `src/providers/anthropic-2023-06-01/errorNormalizer.ts`
- Add case for 529 in `buildHttpErrorMessage()` with clear message: `"Anthropic service is overloaded, please retry later"`
- Update `normalizeAnthropicError()` to recognize and handle the new `OverloadedError` class

### 3. Add retry context information

- Extract retry-after headers from 529 responses in `buildHttpErrorContext()`
- Include `retryAfterSeconds` and `shouldRetry: true` in error context when available
- Follow the same pattern used for 429 rate limit errors

### 4. Update unit tests

- Add tests for 529 error handling in Anthropic provider test files
- Test that `OverloadedError` is thrown with correct message and context
- Test retry information extraction from headers
- Ensure existing error handling still works

## Technical Implementation

**Files to modify:**

- `src/core/errors/errorCodes.ts` - Add OVERLOADED_ERROR constant
- `src/core/errors/` - Create new OverloadedError class (follow existing patterns)
- `src/providers/anthropic-2023-06-01/errorNormalizer.ts` - Update mappings and normalization
- Test files for the above changes

**Implementation approach:**

1. Follow existing error class patterns in the codebase
2. Ensure the OverloadedError provides clear, actionable information
3. Include retry timing information when available from response headers
4. Maintain backward compatibility with existing error handling

## Acceptance Criteria

✅ **Error Classification**: 529 responses are classified as `OverloadedError` instead of generic `ProviderError`

✅ **Clear Messaging**: Error message clearly indicates service is overloaded and suggests retrying

✅ **Retry Information**: When retry-after headers are present, they are included in error context

✅ **Type Safety**: Library consumers can catch `OverloadedError` specifically and handle overload scenarios

✅ **Backward Compatibility**: Existing error handling continues to work without breaking changes

✅ **Test Coverage**: Unit tests verify correct error classification, messaging, and retry information extraction

✅ **Consumer Experience**: Library users can easily identify overloaded conditions and implement appropriate retry logic

## Out of Scope

- Automatic retry logic (consumers should handle retries based on their needs)
- Changes to other provider error handling (focus only on Anthropic 529 errors)
- Rate limiting logic (this is specifically for overload scenarios, not rate limits)
