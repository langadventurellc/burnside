---
id: T-implement-error-normalization
title: Implement error normalization and HTTP status mapping
status: done
priority: medium
parent: F-google-gemini-v1-provider
prerequisites:
  - T-create-gemini-api-request-and
affectedFiles:
  src/providers/google-gemini-v1/errorNormalizer.ts: Created comprehensive error
    normalizer with normalizeGeminiError() main function, HTTP status code
    mapping (400→ValidationError, 401/403→AuthError, 429→RateLimitError,
    500+→ProviderError), Google Gemini error status mapping
    (INVALID_ARGUMENT→ValidationError,
    UNAUTHENTICATED/PERMISSION_DENIED→AuthError,
    RESOURCE_EXHAUSTED→RateLimitError, INTERNAL→ProviderError), network error
    classification, error message sanitization (Google API keys, OAuth tokens),
    context enhancement with provider/version/timestamp, and proper BridgeError
    type instantiation.
  src/providers/google-gemini-v1/__tests__/errorNormalizer.test.ts:
    Created comprehensive unit test suite with 39 tests covering HTTP status
    code mapping, Gemini error status mapping, network error handling, error
    message extraction and sanitization, context preservation, fallback
    handling, and range-based status mapping. Tests verify proper error type
    classification, security sanitization, retry information parsing, and edge
    case handling with 100% pass rate.
  src/providers/google-gemini-v1/index.ts: Added export for normalizeGeminiError
    function to make error normalizer available for provider integration and
    external usage
log:
  - Implemented comprehensive error normalization for Google Gemini v1 provider
    with complete HTTP status mapping, Gemini-specific error status handling,
    network error classification, and security sanitization. Created robust
    error normalizer that maps all Gemini API errors to unified BridgeError
    taxonomy while preserving debugging context and providing actionable error
    messages. All 39 unit tests pass with full coverage of error scenarios, edge
    cases, and security requirements.
schema: v1.0
childrenIds: []
created: 2025-09-17T03:29:33.678Z
updated: 2025-09-17T03:29:33.678Z
---

# Implement Error Normalization and HTTP Status Mapping

## Context

This task implements error normalization for Google Gemini API responses, mapping provider-specific errors to the unified BridgeError taxonomy. This ensures consistent error handling across all providers and provides meaningful error messages for debugging and user feedback.

**Related Feature**: F-google-gemini-v1-provider - Google Gemini v1 Provider Implementation
**Reference Implementation**: `src/providers/openai-responses-v1/errorNormalizer.ts`

## Implementation Requirements

### 1. Create Error Normalizer

Create `src/providers/google-gemini-v1/errorNormalizer.ts` with:

- `normalizeGeminiError()` function mapping errors to BridgeError types
- HTTP status code mapping to appropriate error classes
- Gemini-specific error response parsing
- Error context preservation for debugging
- Retry and rate limit guidance

### 2. HTTP Status Code Mapping

- 400 Bad Request → ValidationError with detailed context
- 401 Unauthorized → AuthError with authentication guidance
- 403 Forbidden → AuthError with permission context
- 429 Too Many Requests → RateLimitError with retry information
- 500+ Server Errors → ProviderError with service status details
- Network errors → TransportError with connectivity context

### 3. Gemini Error Response Parsing

- Parse Gemini API error response format
- Extract error codes, messages, and context
- Handle nested error structures
- Preserve provider-specific error details
- Map to unified error taxonomy

### 4. Error Context Enhancement

- Add provider-specific context (model, endpoint, request ID)
- Include retry suggestions for transient errors
- Provide actionable error messages for common issues
- Preserve original error details for debugging
- Add security context for authentication errors

## Technical Approach

### Step 1: Study Existing Patterns

- Analyze `src/providers/openai-responses-v1/errorNormalizer.ts` for structure
- Analyze `src/providers/anthropic-2023-06-01/errorNormalizer.ts` for alternatives
- Study existing BridgeError types and error handling patterns
- Follow established error normalization approaches

### Step 2: Implement Error Normalizer

```typescript
// src/providers/google-gemini-v1/errorNormalizer.ts
import { BridgeError } from "../../core/errors/bridgeError";
import { ValidationError } from "../../core/errors/validationError";
import { AuthError } from "../../core/errors/authError";
import { RateLimitError } from "../../core/errors/rateLimitError";
import { ProviderError } from "../../core/errors/providerError";
import { TransportError } from "../../core/errors/transportError";

export function normalizeGeminiError(error: unknown): BridgeError {
  // Implementation here
}
```

### Step 3: Handle Different Error Types

- `normalizeHttpError()` for HTTP status-based errors
- `parseGeminiErrorResponse()` for API error responses
- `normalizeNetworkError()` for connection issues
- `createErrorContext()` for enhanced error information

### Step 4: Error Response Schema

```typescript
const GeminiErrorSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
    status: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});
```

### Step 5: Create Unit Tests

Write comprehensive unit tests in `src/providers/google-gemini-v1/__tests__/errorNormalizer.test.ts`:

- Test HTTP status code mapping for all error types
- Test Gemini error response parsing
- Test error context enhancement
- Test network error handling
- Test edge cases (malformed errors, missing fields)
- Test error message quality and actionability

## Acceptance Criteria

### Functional Requirements

- ✅ normalizeGeminiError() maps all error types to BridgeError taxonomy
- ✅ HTTP status codes map correctly to appropriate error classes
- ✅ Gemini error responses parse and extract relevant information
- ✅ Error context includes provider-specific details
- ✅ Retry guidance provided for appropriate error types
- ✅ Authentication errors include helpful troubleshooting information

### Error Mapping Requirements

- ✅ 400 errors → ValidationError with request validation context
- ✅ 401/403 errors → AuthError with API key and permission guidance
- ✅ 429 errors → RateLimitError with retry-after information
- ✅ 500+ errors → ProviderError with service status context
- ✅ Network errors → TransportError with connectivity details
- ✅ Unknown errors → BridgeError with preserved original context

### Error Context Requirements

- ✅ Provider name and version included in error context
- ✅ Model and endpoint information preserved when available
- ✅ Request ID and correlation data included for debugging
- ✅ Original error details preserved for investigation
- ✅ Actionable error messages for common failure scenarios

### Security Requirements

- ✅ API keys never exposed in error messages or logs
- ✅ Sensitive request data redacted from error context
- ✅ Error messages don't leak internal system information
- ✅ Authentication errors provide safe troubleshooting guidance
- ✅ Error context preserves debugging info without security risks

### Technical Requirements

- ✅ Function follows ProviderPlugin.normalizeError signature
- ✅ Proper error inheritance and type safety
- ✅ Performance optimized for error scenarios
- ✅ No 'any' types - all properly typed
- ✅ Integration with existing error handling system

### Testing Requirements

- ✅ Unit tests cover all error mapping scenarios
- ✅ Tests verify HTTP status code handling
- ✅ Tests check Gemini error response parsing
- ✅ Tests validate error context enhancement
- ✅ Tests verify security requirements (no data leaks)
- ✅ Tests handle edge cases and malformed errors
- ✅ Test coverage meets project standards (>90%)
- ✅ All tests pass with zero TypeScript errors

### Code Quality

- ✅ Module stays under 400 logical LOC limit
- ✅ Single responsibility: error normalization only
- ✅ No 'any' types - all properly typed
- ✅ Follows project linting and formatting standards
- ✅ Clear documentation and examples in code comments

## Files to Create/Modify

- Create: `src/providers/google-gemini-v1/errorNormalizer.ts`
- Create: `src/providers/google-gemini-v1/__tests__/errorNormalizer.test.ts`

## Dependencies

- Requires: T-create-gemini-api-request-and (error response schema)
- Requires: Core BridgeError types and error taxonomy
- Requires: HTTP status code understanding
- Blocks: Provider implementation task

## Out of Scope

- Request/response translation (handled by other tasks)
- Provider implementation logic (handled by provider task)
- Error recovery and retry logic (handled by transport layer)
- Logging and observability (handled by observability system)
