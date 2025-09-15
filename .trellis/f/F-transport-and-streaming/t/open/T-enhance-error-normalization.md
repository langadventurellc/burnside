---
id: T-enhance-error-normalization
title: Enhance Error Normalization System
status: open
priority: high
parent: F-transport-and-streaming
prerequisites:
  - T-implement-sse-server-sent
  - T-implement-chunked-response
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T08:21:30.313Z
updated: 2025-09-15T08:21:30.313Z
---

# Enhance Error Normalization System

## Context

This task enhances the existing error normalization interface to provide concrete implementation that maps HTTP status codes and network errors to typed Bridge error classes. This provides consistent error handling across all provider implementations.

**Reference**: Feature F-transport-and-streaming  
**File**: `src/core/errors/errorNormalizer.ts` (enhance existing interface)
**New File**: `src/core/errors/httpErrorNormalizer.ts`
**Test File**: `src/core/errors/__tests__/httpErrorNormalizer.test.ts`

## Implementation Requirements

Enhance the existing `ErrorNormalizer` interface with a concrete implementation for HTTP errors:

### Core Functionality

1. **HTTP Status Mapping**: Map status codes to appropriate Bridge error types
2. **Network Error Handling**: Handle connection failures and timeouts
3. **Provider Context Preservation**: Maintain original error context
4. **Error Code Mapping**: Support provider-specific error code translation
5. **Retry Information**: Extract and preserve retry-after headers

### Technical Approach

1. Create `HttpErrorNormalizer` class implementing existing interface
2. Define status code to error type mapping rules
3. Implement error context extraction and preservation
4. Handle various error scenarios (network, HTTP, provider-specific)
5. Support configurable error mapping for different providers

### API Enhancement

```typescript
// Enhance existing interface usage
class HttpErrorNormalizer implements ErrorNormalizer {
  constructor(private config?: ErrorNormalizationConfig);
  normalize(providerError: unknown, context: ErrorContext): NormalizedError;
  static fromHttpResponse(response: ProviderHttpResponse, context: ErrorContext): NormalizedError;
  static fromNetworkError(error: Error, context: ErrorContext): NormalizedError;
}

interface ErrorNormalizationConfig {
  statusCodeMapping?: Record<number, string>;
  preserveOriginalError?: boolean;
  includeStackTrace?: boolean;
}
```

## Detailed Acceptance Criteria

### HTTP Status Code Mapping

- ✅ 400 Bad Request → `ValidationError` with request context
- ✅ 401 Unauthorized → `AuthError` with credential hints
- ✅ 403 Forbidden → `AuthError` with permission context
- ✅ 408 Request Timeout → `TimeoutError` with timeout details
- ✅ 429 Too Many Requests → `RateLimitError` with retry-after parsing
- ✅ 500+ Server Errors → `ProviderError` with server context
- ✅ 502/503/504 → `TransportError` with connectivity context

### Network Error Mapping

- ✅ Connection refused → `TransportError` with connection details
- ✅ DNS resolution failure → `TransportError` with DNS context
- ✅ SSL/TLS errors → `TransportError` with certificate context
- ✅ Timeout errors → `TimeoutError` with timeout configuration
- ✅ Abort signal → `TransportError` with cancellation context

### Context Preservation

- ✅ Original error details preserved in context
- ✅ HTTP status and headers included
- ✅ Request URL and method preserved
- ✅ Provider-specific error codes mapped
- ✅ Stack trace included when configured

### Rate Limit Handling

- ✅ Retry-After header parsing (seconds and HTTP-date)
- ✅ Rate limit type detection (requests, tokens, etc.)
- ✅ Quota information extraction when available
- ✅ Provider-specific rate limit formats
- ✅ Exponential backoff hint calculation

### Provider-Specific Support

- ✅ Configurable error code mapping
- ✅ Custom error message extraction
- ✅ Provider error format recognition
- ✅ Nested error unwrapping
- ✅ Multi-language error message support

## Testing Requirements (Include in Same Task)

Create comprehensive unit tests in `src/core/errors/__tests__/httpErrorNormalizer.test.ts`:

### Status Code Mapping Tests

- All major HTTP status codes (400, 401, 403, 408, 429, 500, 502, 503, 504)
- Edge case status codes
- Custom status code mappings
- Invalid status codes
- Missing status code handling

### Network Error Tests

- Connection timeout scenarios
- DNS resolution failures
- SSL certificate errors
- Connection refused errors
- Abort signal scenarios

### Context Preservation Tests

- Original error details maintained
- HTTP headers preserved
- Request information included
- Provider context maintained
- Stack trace handling

### Rate Limit Tests

- Retry-After header parsing (numeric)
- HTTP-date format Retry-After headers
- Missing Retry-After scenarios
- Provider-specific rate limit formats
- Quota information extraction

### Provider-Specific Tests

- OpenAI error format handling
- Anthropic error format handling
- Google/Generic error formats
- Custom provider error mapping
- Nested error unwrapping

## Security Considerations

- Sanitize error messages to prevent information leakage
- Redact sensitive data from error context
- Prevent error message injection attacks
- Handle malformed provider error responses safely
- Audit error normalization for data exposure

## Dependencies

- Existing error classes (`TransportError`, `TimeoutError`, `RateLimitError`, etc.)
- HTTP response interfaces (`ProviderHttpResponse`)
- Error context interfaces (`ErrorContext`, `NormalizedError`)
- Jest testing framework

## Out of Scope

- Error logging or monitoring integration (handled by observability layer)
- Error recovery or retry logic (handled by transport layer)
- Provider-specific error response parsing (handled by provider plugins)
- Advanced error categorization beyond basic HTTP mapping
- Real-time error pattern analysis or machine learning
