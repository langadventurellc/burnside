---
id: T-implement-anthropic-error
title: Implement Anthropic error normalization and handling
status: open
priority: high
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-api-request
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T13:30:22.650Z
updated: 2025-09-16T13:30:22.650Z
---

# Implement Anthropic Error Normalization and Handling

Implement comprehensive error normalization that maps Anthropic-specific errors to the unified Bridge error taxonomy, handling authentication, rate limiting, validation, and provider-specific error conditions.

## Context

This task implements error handling and normalization for the Anthropic Messages API provider. The error normalizer converts Anthropic's HTTP errors, API error responses, and provider-specific conditions to Bridge's unified error taxonomy while preserving debugging context.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/errorNormalizer.ts` and core error handling

**API Documentation**: Anthropic API error response formats and HTTP status codes

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Location

Create `src/providers/anthropic-2023-06-01/errorNormalizer.ts`

### Core Error Handling Functions

1. **Main Error Normalizer**:

   ```typescript
   export function normalizeAnthropicError(
     error: unknown,
     context?: Record<string, unknown>,
   ): BridgeError {
     // Main error classification and normalization
   }
   ```

2. **HTTP Status Code Mapping**:

   ```typescript
   function mapHttpStatusToError(
     status: number,
     body: string,
     context?: Record<string, unknown>,
   ): BridgeError {
     // Map HTTP status codes to appropriate error types
   }
   ```

3. **API Error Response Handling**:

   ```typescript
   function handleAnthropicApiError(
     errorResponse: AnthropicErrorResponse,
     context?: Record<string, unknown>,
   ): BridgeError {
     // Handle structured API error responses
   }
   ```

4. **Context Enhancement**:
   ```typescript
   function enhanceErrorContext(
     baseContext: Record<string, unknown>,
     error: unknown,
   ): Record<string, unknown> {
     // Add provider-specific debugging context
   }
   ```

### Error Mapping Logic

1. **HTTP Status Code Mapping**:
   - `400`: ValidationError - Invalid request format
   - `401`: AuthError - Invalid or missing API key
   - `403`: AuthError - Insufficient permissions
   - `404`: ProviderError - Endpoint not found
   - `422`: ValidationError - Request validation failed
   - `429`: RateLimitError - Rate limit exceeded
   - `500+`: ProviderError - Server errors

2. **Anthropic Error Type Mapping**:

   ```typescript
   const ANTHROPIC_ERROR_MAPPING = {
     invalid_request_error: ValidationError,
     authentication_error: AuthError,
     permission_error: AuthError,
     not_found_error: ProviderError,
     rate_limit_error: RateLimitError,
     api_error: ProviderError,
     overloaded_error: ProviderError,
   };
   ```

3. **Context Preservation**:
   - Preserve original error information
   - Add provider identification
   - Include request/response details (sanitized)
   - Add timing and retry context
   - Maintain error chain for debugging

### Technical Approach

```typescript
import { BridgeError } from "../../core/errors/bridgeError.js";
import { AuthError } from "../../core/errors/authError.js";
import { ValidationError } from "../../core/errors/validationError.js";
import { RateLimitError } from "../../core/errors/rateLimitError.js";
import { ProviderError } from "../../core/errors/providerError.js";
import { TimeoutError } from "../../core/errors/timeoutError.js";
import { TransportError } from "../../core/errors/transportError.js";
import type { AnthropicErrorResponse } from "./responseSchema.js";

export function normalizeAnthropicError(
  error: unknown,
  context: Record<string, unknown> = {},
): BridgeError {
  const enhancedContext = enhanceErrorContext(context, error);

  // Handle network/transport errors
  if (error instanceof Error && error.name === "AbortError") {
    return new TimeoutError("Request timeout", {
      cause: error,
      context: enhancedContext,
    });
  }

  if (
    error instanceof Error &&
    (error.message.includes("fetch") || error.message.includes("network"))
  ) {
    return new TransportError("Network error", {
      cause: error,
      context: enhancedContext,
    });
  }

  // Handle HTTP response errors
  if (typeof error === "object" && error !== null && "status" in error) {
    const httpError = error as {
      status: number;
      body?: string;
      headers?: Record<string, string>;
    };
    return mapHttpStatusToError(
      httpError.status,
      httpError.body || "",
      enhancedContext,
    );
  }

  // Handle Anthropic API error responses
  if (isAnthropicErrorResponse(error)) {
    return handleAnthropicApiError(error, enhancedContext);
  }

  // Handle validation errors from our own code
  if (
    error instanceof ValidationError ||
    error instanceof AuthError ||
    error instanceof RateLimitError ||
    error instanceof ProviderError
  ) {
    // Already a Bridge error, just enhance context
    return new (error.constructor as any)(error.message, {
      cause: error.cause,
      context: { ...error.context, ...enhancedContext },
    });
  }

  // Fallback for unknown errors
  return new ProviderError("Unknown Anthropic provider error", {
    cause: error instanceof Error ? error : new Error(String(error)),
    context: enhancedContext,
  });
}

function mapHttpStatusToError(
  status: number,
  body: string,
  context: Record<string, unknown>,
): BridgeError {
  let parsedBody: any = null;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    // Body is not JSON, use raw body
  }

  const errorContext = {
    ...context,
    httpStatus: status,
    responseBody: body.substring(0, 500), // Truncate long responses
  };

  switch (status) {
    case 400:
      return new ValidationError(
        parsedBody?.error?.message || "Invalid request format",
        { context: errorContext },
      );

    case 401:
      return new AuthError(parsedBody?.error?.message || "Invalid API key", {
        context: errorContext,
      });

    case 403:
      return new AuthError(
        parsedBody?.error?.message || "Insufficient permissions",
        { context: errorContext },
      );

    case 422:
      return new ValidationError(
        parsedBody?.error?.message || "Request validation failed",
        { context: errorContext },
      );

    case 429:
      return new RateLimitError(
        parsedBody?.error?.message || "Rate limit exceeded",
        {
          context: errorContext,
          retryAfter: extractRetryAfter(context),
        },
      );

    case 500:
    case 502:
    case 503:
    case 504:
      return new ProviderError(
        parsedBody?.error?.message || "Anthropic server error",
        { context: errorContext },
      );

    default:
      return new ProviderError(
        `HTTP ${status}: ${parsedBody?.error?.message || "Unknown error"}`,
        { context: errorContext },
      );
  }
}

function handleAnthropicApiError(
  errorResponse: AnthropicErrorResponse,
  context: Record<string, unknown>,
): BridgeError {
  const errorType = errorResponse.error.type;
  const message = errorResponse.error.message;
  const errorContext = { ...context, anthropicErrorType: errorType };

  switch (errorType) {
    case "invalid_request_error":
      return new ValidationError(message, { context: errorContext });

    case "authentication_error":
      return new AuthError(message, { context: errorContext });

    case "permission_error":
      return new AuthError(message, { context: errorContext });

    case "rate_limit_error":
      return new RateLimitError(message, {
        context: errorContext,
        retryAfter: extractRetryAfter(context),
      });

    case "api_error":
    case "overloaded_error":
      return new ProviderError(message, { context: errorContext });

    default:
      return new ProviderError(message, { context: errorContext });
  }
}

function enhanceErrorContext(
  baseContext: Record<string, unknown>,
  error: unknown,
): Record<string, unknown> {
  return {
    ...baseContext,
    provider: "anthropic",
    version: "2023-06-01",
    timestamp: new Date().toISOString(),
    errorType: error?.constructor?.name || typeof error,
  };
}

function isAnthropicErrorResponse(
  error: unknown,
): error is AnthropicErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as any).error === "object" &&
    "type" in (error as any).error &&
    "message" in (error as any).error
  );
}

function extractRetryAfter(
  context: Record<string, unknown>,
): number | undefined {
  // Extract retry-after header if available
  const headers = context.headers as Record<string, string> | undefined;
  const retryAfter = headers?.["retry-after"];
  return retryAfter ? parseInt(retryAfter, 10) : undefined;
}
```

## Acceptance Criteria

1. **Error Classification**:
   - ✅ HTTP status codes mapped to appropriate error types
   - ✅ Anthropic error types converted to Bridge errors
   - ✅ Network/transport errors handled correctly
   - ✅ Unknown errors wrapped with fallback handling

2. **Error Context**:
   - ✅ Provider identification included in all errors
   - ✅ Original error information preserved
   - ✅ HTTP status and response details captured
   - ✅ Timing and request context maintained
   - ✅ Sensitive data (API keys) excluded from context

3. **Specific Error Types**:
   - ✅ Authentication errors (401, 403) → AuthError
   - ✅ Validation errors (400, 422) → ValidationError
   - ✅ Rate limiting (429) → RateLimitError with retry info
   - ✅ Server errors (500+) → ProviderError
   - ✅ Timeout errors → TimeoutError

4. **Rate Limiting Support**:
   - ✅ Rate limit errors include retry-after information
   - ✅ Headers parsed for retry timing
   - ✅ Context includes rate limiting details

5. **Error Chain Preservation**:
   - ✅ Original errors preserved in cause chain
   - ✅ Stack traces maintained for debugging
   - ✅ Error context accumulated through chain
   - ✅ Bridge error inheritance maintained

6. **Unit Tests** (included in this task):
   - ✅ Test HTTP status code mapping
   - ✅ Test Anthropic API error handling
   - ✅ Test network/transport error scenarios
   - ✅ Test error context enhancement
   - ✅ Test rate limit error processing
   - ✅ Test edge cases and malformed errors
   - ✅ Achieve >90% code coverage

## Dependencies

- Core error classes (AuthError, ValidationError, etc.)
- Response schemas from T-create-anthropic-api-request
- HTTP response types from transport layer

## Out of Scope

- Retry logic (handled by transport layer)
- Error reporting/telemetry (handled by observability layer)
- Circuit breaker patterns (handled by core infrastructure)
- Custom error recovery strategies

## Testing Requirements

Create `src/providers/anthropic-2023-06-01/__tests__/errorNormalizer.test.ts` with:

- HTTP status code mapping tests
- API error response handling tests
- Network error scenarios
- Context enhancement validation
- Rate limiting error tests
- Edge cases and malformed error handling
