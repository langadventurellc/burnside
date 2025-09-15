---
id: T-implement-error-normalizer
title: Implement error normalizer for OpenAI API errors
status: open
priority: medium
parent: F-openai-v1-provider-implementat
prerequisites:
  - T-create-openai-responses-v1
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T19:39:36.852Z
updated: 2025-09-15T19:39:36.852Z
---

# Implement Error Normalizer for OpenAI API Errors

Implement the error normalization logic that converts OpenAI-specific errors to unified BridgeError types.

## Context

This task implements the `normalizeError()` method for the OpenAI Responses v1 provider plugin. It follows the error normalization patterns established in `src/core/errors/` and maps OpenAI API errors to the appropriate BridgeError subclasses.

Reference existing error normalization patterns in `src/core/errors/defaultNormalizeError.ts` and error types.

## Implementation Requirements

### File to Create/Modify

- `src/providers/openai-responses-v1/errorNormalizer.ts` - Error normalization logic
- Update `src/providers/openai-responses-v1/index.ts` - Implement normalizeError method

### 1. Error Normalizer (`src/providers/openai-responses-v1/errorNormalizer.ts`)

**Core Normalization Function:**

```typescript
export function normalizeOpenAIError(error: unknown): BridgeError;
```

**OpenAI Error Mapping:**

- **401 Unauthorized** → `AuthError`
  - Invalid API key, expired tokens, insufficient permissions
- **429 Too Many Requests** → `RateLimitError`
  - Rate limiting, quota exceeded
- **400 Bad Request** → `ValidationError`
  - Invalid request format, missing required fields
- **404 Not Found** → `ValidationError`
  - Invalid model, endpoint not found
- **500+ Server Errors** → `ProviderError`
  - OpenAI internal errors, service unavailable
- **Network Errors** → `TransportError`
  - Connection timeouts, DNS failures

**OpenAI Error Structure Handling:**

- Parse OpenAI error response format:
  ```json
  {
    "error": {
      "message": "string",
      "type": "string",
      "code": "string"
    }
  }
  ```
- Extract meaningful error messages and codes
- Preserve OpenAI-specific error context

### 2. Error Type Detection

**HTTP Status Code Mapping:**

- Implement status code to error type mapping
- Handle edge cases and unknown status codes
- Default to `ProviderError` for unrecognized errors

**OpenAI Error Type Mapping:**

- Map OpenAI `error.type` field to BridgeError types:
  - `"authentication_error"` → `AuthError`
  - `"rate_limit_error"` → `RateLimitError`
  - `"invalid_request_error"` → `ValidationError`
  - `"server_error"` → `ProviderError`

**Context Preservation:**

- Include original OpenAI error details in BridgeError context
- Preserve error codes and types for debugging
- Maintain error message clarity for end users

### 3. Provider Plugin Integration (`src/providers/openai-responses-v1/index.ts`)

**Update normalizeError Method:**

- Replace placeholder implementation with actual normalizer
- Handle different error input types (HTTP responses, exceptions, etc.)
- Ensure consistent error format regardless of error source

**Error Processing Pipeline:**

```typescript
normalizeError(error: unknown): BridgeError {
  try {
    return normalizeOpenAIError(error);
  } catch (normalizationError) {
    // Fallback to generic ProviderError
    return new ProviderError("Error normalization failed", { originalError: error });
  }
}
```

## Technical Approach

1. **Error Pattern Matching**: Identify OpenAI error patterns and structures
2. **Status Code Mapping**: Use HTTP status codes as primary error classification
3. **Context Preservation**: Maintain OpenAI-specific error details for debugging
4. **Fallback Handling**: Graceful degradation for unknown error types
5. **Type Safety**: Proper error type construction and validation

## Acceptance Criteria

### Functional Requirements

- [ ] Successfully maps all common OpenAI error types to BridgeError subclasses
- [ ] Handles HTTP status codes correctly (401, 429, 400, 404, 500+)
- [ ] Preserves OpenAI error messages and context
- [ ] Provides fallback handling for unknown error types

### Error Mapping Requirements

- [ ] AuthError for authentication failures (401, auth errors)
- [ ] RateLimitError for rate limiting (429, quota errors)
- [ ] ValidationError for bad requests (400, 404, validation errors)
- [ ] ProviderError for server errors (500+, service errors)
- [ ] TransportError for network/connection errors

### Context Preservation Requirements

- [ ] Original OpenAI error details included in BridgeError context
- [ ] Error messages remain user-friendly and actionable
- [ ] OpenAI error codes and types preserved for debugging
- [ ] HTTP status codes included in error context

### Error Handling Requirements

- [ ] Handles different error input types (responses, exceptions, strings)
- [ ] Graceful fallback for malformed or unknown errors
- [ ] No information loss during error normalization
- [ ] Consistent error format regardless of error source

### Testing Requirements (Include in this task)

- [ ] Unit tests for each OpenAI error type mapping
- [ ] Unit tests for HTTP status code handling
- [ ] Unit tests for malformed/unknown error inputs
- [ ] Unit tests for context preservation and error details
- [ ] Unit tests for fallback error handling
- [ ] Test file: `src/providers/openai-responses-v1/__tests__/errorNormalizer.test.ts`

## Dependencies

- Task: "Create OpenAI Responses v1 provider plugin structure and schemas"
- Existing BridgeError types from `src/core/errors/`
- Error normalization patterns from core
- HTTP status code mappings

## Out of Scope

- Error recovery or retry logic (handled by transport layer)
- Request/response parsing errors (handled by respective parsers)
- Provider registration errors (handled by registration task)
- Streaming-specific error handling (handled by streaming parser)
