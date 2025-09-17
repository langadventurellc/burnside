---
id: T-create-xai-error-normalizer
title: Create xAI error normalizer with comprehensive mapping
status: open
priority: medium
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-implement-xai-request-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T19:58:57.710Z
updated: 2025-09-17T19:58:57.710Z
---

# Create xAI Error Normalizer with Comprehensive Mapping

## Context

This task implements the error normalizer that converts xAI-specific errors to standardized BridgeError instances. The normalizer handles API errors, HTTP errors, network failures, and provides proper error categorization with context preservation.

## Reference Implementation

Use these files as reference patterns:

- `src/providers/openai-responses-v1/errorNormalizer.ts` (primary template)
- `src/providers/google-gemini-v1/errorNormalizer.ts` (alternative patterns)
- `src/core/errors/bridgeError.ts` (unified error types)

## Implementation Requirements

Create `src/providers/xai-v1/errorNormalizer.ts` with the following components:

### Main Error Normalizer Function

```typescript
export function normalizeXaiError(error: unknown): BridgeError {
  // Handle different error types
  if (isXaiApiError(error)) {
    return normalizeApiError(error);
  }

  if (isHttpError(error)) {
    return normalizeHttpError(error);
  }

  if (isNetworkError(error)) {
    return normalizeNetworkError(error);
  }

  if (isValidationError(error)) {
    return normalizeValidationError(error);
  }

  // Fallback for unknown errors
  return new BridgeError("Unknown error occurred", "UNKNOWN_ERROR", {
    originalError: error,
    provider: "xai",
  });
}
```

### xAI API Error Mapping

```typescript
function normalizeApiError(error: any): BridgeError {
  const errorCode = error.error?.code || error.code;
  const errorMessage =
    error.error?.message || error.message || "Unknown API error";

  // Map xAI error codes to BridgeError types
  switch (errorCode) {
    case "rate_limit_exceeded":
      return new RateLimitError(`Rate limit exceeded: ${errorMessage}`, {
        retryAfter: extractRetryAfter(error),
        provider: "xai",
        originalError: error,
      });

    case "invalid_api_key":
    case "authentication_failed":
      return new AuthenticationError(`Authentication failed: ${errorMessage}`, {
        provider: "xai",
        originalError: error,
      });

    case "insufficient_permissions":
    case "permission_denied":
      return new AuthorizationError(
        `Insufficient permissions: ${errorMessage}`,
        {
          provider: "xai",
          originalError: error,
        },
      );

    case "quota_exceeded":
    case "billing_hard_limit_reached":
      return new QuotaExceededError(`Quota exceeded: ${errorMessage}`, {
        provider: "xai",
        originalError: error,
      });

    case "model_not_found":
    case "invalid_model":
      return new ValidationError(`Model not found: ${errorMessage}`, {
        field: "model",
        provider: "xai",
        originalError: error,
      });

    case "bad_request":
    case "invalid_request_error":
      return new ValidationError(`Invalid request: ${errorMessage}`, {
        field: error.error?.param || "request",
        provider: "xai",
        originalError: error,
      });

    case "server_error":
    case "service_unavailable":
      return new ProviderError(`xAI service error: ${errorMessage}`, {
        provider: "xai",
        temporary: true,
        originalError: error,
      });

    case "unsupported_media_type":
      return new ValidationError(`Unsupported media type: ${errorMessage}`, {
        field: "content",
        provider: "xai",
        originalError: error,
      });

    case "function_call_error":
      return new ProviderError(`Function call error: ${errorMessage}`, {
        provider: "xai",
        originalError: error,
      });

    default:
      return new ProviderError(`xAI API error: ${errorMessage}`, {
        code: errorCode,
        provider: "xai",
        originalError: error,
      });
  }
}
```

### HTTP Error Handling

```typescript
function normalizeHttpError(error: any): BridgeError {
  const status = error.status || error.statusCode;
  const message = error.message || `HTTP ${status} error`;

  switch (status) {
    case 400:
      return new ValidationError(`Bad request: ${message}`, {
        provider: "xai",
        httpStatus: status,
        originalError: error,
      });

    case 401:
      return new AuthenticationError(`Unauthorized: ${message}`, {
        provider: "xai",
        httpStatus: status,
        originalError: error,
      });

    case 403:
      return new AuthorizationError(`Forbidden: ${message}`, {
        provider: "xai",
        httpStatus: status,
        originalError: error,
      });

    case 404:
      return new ValidationError(`Not found: ${message}`, {
        provider: "xai",
        httpStatus: status,
        originalError: error,
      });

    case 429:
      return new RateLimitError(`Rate limited: ${message}`, {
        retryAfter: extractRetryAfterFromHeaders(error),
        provider: "xai",
        httpStatus: status,
        originalError: error,
      });

    case 500:
    case 502:
    case 503:
    case 504:
      return new ProviderError(`Server error: ${message}`, {
        provider: "xai",
        httpStatus: status,
        temporary: true,
        originalError: error,
      });

    default:
      return new ProviderError(`HTTP error: ${message}`, {
        provider: "xai",
        httpStatus: status,
        originalError: error,
      });
  }
}
```

### Network Error Handling

```typescript
function normalizeNetworkError(error: any): BridgeError {
  const message = error.message || "Network error occurred";

  if (error.code === "TIMEOUT" || message.includes("timeout")) {
    return new TimeoutError(`Request timeout: ${message}`, {
      provider: "xai",
      originalError: error,
    });
  }

  if (error.code === "ECONNREFUSED" || message.includes("connection refused")) {
    return new ProviderError(`Connection refused: ${message}`, {
      provider: "xai",
      temporary: true,
      originalError: error,
    });
  }

  if (error.code === "ENOTFOUND" || message.includes("not found")) {
    return new ProviderError(`Host not found: ${message}`, {
      provider: "xai",
      originalError: error,
    });
  }

  return new ProviderError(`Network error: ${message}`, {
    provider: "xai",
    temporary: true,
    originalError: error,
  });
}
```

### Utility Functions

```typescript
function isXaiApiError(error: any): boolean {
  return (
    error &&
    ((error.error && typeof error.error.code === "string") ||
      (typeof error.code === "string" && error.message))
  );
}

function isHttpError(error: any): boolean {
  return (
    error &&
    (typeof error.status === "number" || typeof error.statusCode === "number")
  );
}

function isNetworkError(error: any): boolean {
  return (
    error &&
    (error.code === "TIMEOUT" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.name === "AbortError")
  );
}

function extractRetryAfter(error: any): number | undefined {
  const retryAfter = error.error?.retry_after || error.retry_after;
  return typeof retryAfter === "number" ? retryAfter : undefined;
}

function extractRetryAfterFromHeaders(error: any): number | undefined {
  const headers = error.response?.headers || error.headers;
  if (headers && headers["retry-after"]) {
    const retryAfter = parseInt(headers["retry-after"], 10);
    return isNaN(retryAfter) ? undefined : retryAfter;
  }
  return undefined;
}
```

## Acceptance Criteria

### Functional Requirements

✅ **Error Mapping**: All xAI error codes map to appropriate BridgeError types
✅ **HTTP Status Handling**: HTTP status codes convert to correct error types
✅ **Network Error Handling**: Network failures mapped appropriately
✅ **Context Preservation**: Original error information preserved in metadata
✅ **Rate Limit Information**: Retry-After headers extracted when available
✅ **Validation Errors**: Request validation errors categorized correctly

### Error Coverage Requirements

✅ **API Errors**: All documented xAI API error codes handled
✅ **Authentication Errors**: Invalid API keys and auth failures
✅ **Authorization Errors**: Permission and access control errors
✅ **Rate Limiting**: Rate limit and quota exceeded errors
✅ **Validation Errors**: Invalid requests and parameters
✅ **Server Errors**: 5xx HTTP status codes and service failures

### Context Preservation Requirements

✅ **Original Error**: Original error object preserved in metadata
✅ **Provider Information**: xAI provider context included
✅ **HTTP Status**: HTTP status codes preserved when available
✅ **Retry Information**: Retry-After headers extracted and preserved
✅ **Field Information**: Invalid field names preserved for validation errors

## Testing Requirements

Include comprehensive unit tests covering:

### xAI API Error Tests

- Rate limit exceeded errors
- Authentication and authorization failures
- Model not found errors
- Invalid request errors
- Server and service errors
- Function call errors

### HTTP Error Tests

- 4xx client errors (400, 401, 403, 404, 429)
- 5xx server errors (500, 502, 503, 504)
- Custom HTTP status codes
- Missing status code handling

### Network Error Tests

- Timeout errors
- Connection refused errors
- Host not found errors
- Abort signal errors

### Edge Case Tests

- Unknown error types
- Malformed error objects
- Missing error codes/messages
- Nested error structures
- Retry-After header extraction

## Implementation Steps

1. **Create Error Normalizer File**: Set up main normalization function
2. **API Error Mapping**: Implement xAI-specific error code mapping
3. **HTTP Error Handling**: Map HTTP status codes to error types
4. **Network Error Handling**: Handle connection and timeout errors
5. **Validation Error Handling**: Process request validation failures
6. **Utility Functions**: Error type detection and metadata extraction
7. **Context Preservation**: Ensure original error information is preserved
8. **Write Unit Tests**: Comprehensive test coverage for all error types
9. **Integration Testing**: Verify error handling in real scenarios

## Dependencies

- **Prerequisites**: T-implement-xai-request-and (error response schema)
- **Works with**: All other xAI provider components
- **Blocks**: Main provider class error handling

## Out of Scope

- Error logging and monitoring (handled by observability layer)
- Error recovery and retry logic (handled by transport layer)
- User-facing error message formatting (handled by client layer)

## Technical Notes

- Follow the established BridgeError taxonomy from existing providers
- Preserve as much context as possible for debugging
- Handle edge cases gracefully (malformed errors, missing codes)
- Extract retry information for rate limiting scenarios
- Ensure error mapping is comprehensive and follows xAI documentation
