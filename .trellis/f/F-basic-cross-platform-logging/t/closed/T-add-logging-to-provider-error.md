---
id: T-add-logging-to-provider-error
title: Add logging to provider error handling
status: done
priority: medium
parent: F-basic-cross-platform-logging
prerequisites:
  - T-integrate-logging-configuratio
affectedFiles:
  src/client/bridgeClient.ts:
    Added error and debug logging to provider operation
    error normalization pipeline for both chat and stream operations
  src/providers/google-gemini-v1/googleGeminiV1Provider.ts:
    Added error logging to
    normalizeError method with proper error context and normalization failure
    handling
  src/providers/google-gemini-v1/responseParser.ts:
    Replaced console logging with
    structured logger calls for response validation failures and debugging
  src/providers/openai-responses-v1/openAIResponsesV1Provider.ts:
    Added error logging to normalizeError method with provider context and error
    details
  src/providers/openai-responses-v1/responseParser.ts: Added error and debug
    logging for response validation failures with truncated response data
  src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts:
    Added error logging to normalizeError method with proper error handling and
    context
  src/providers/anthropic-2023-06-01/responseParser.ts: Added error and debug
    logging for response validation failures with provider context
  src/providers/xai-v1/xaiV1Provider.ts: Added error logging to normalizeError
    method with comprehensive error context and failure handling
  src/providers/xai-v1/responseParser.ts: Added error and debug logging for
    response validation failures with truncated response details
  src/core/transport/httpTransport.ts: Added error and debug logging to
    handleFetchError and handleStreamError methods for transport-level debugging
  src/client/__tests__/bridgeClientErrorLogging.test.ts: Created test suite to
    verify logging functionality is properly integrated and working
log:
  - Successfully implemented comprehensive logging for provider error handling
    across all providers and transport layers. Added structured logging to error
    normalization pipelines in BridgeClient, all 4 providers (Google, OpenAI,
    Anthropic, xAI), response validation failures, and HTTP transport error
    handling. Replaced existing console logging in Google provider with
    structured logging. All quality checks pass and logging functionality
    verified with tests.
schema: v1.0
childrenIds: []
created: 2025-09-19T18:10:13.510Z
updated: 2025-09-19T18:10:13.510Z
---

# Add Logging to Provider Error Handling

## Context

Add strategic logging to provider error handling and response validation to help debug intermittent API failures and validation issues. This addresses the core debugging need by providing visibility into what providers are actually returning versus what's expected.

**Feature Context**: Part of F-basic-cross-platform-logging - Basic Cross-Platform Logging System
**Prerequisites**: T-integrate-logging-configuratio (logger must be configured in BridgeClient first)
**Target Issue**: Solve problems like the Google "UNEXPECTED_TOOL_CALL" error by logging raw responses

## Specific Implementation Requirements

### Provider Error Logging Points

Add logging to key error handling locations across all providers:

1. **Error Normalizers**: Log raw errors before normalization
2. **Response Parsers**: Log validation failures with response data
3. **HTTP Transport**: Log request/response details for failed requests
4. **BridgeClient**: Log normalized errors with context

### Implementation Files and Locations

**Core Error Handling** (`src/client/bridgeClient.ts`):

- **Line ~399**: Before `plugin.normalizeError(error)` - log raw error
- **Line ~404**: After normalization - log final normalized error with context

**Provider Response Parsers** (add to all providers):

- **Google**: `src/providers/google-gemini-v1/responseParser.ts` around line 81 (validation failures)
- **OpenAI**: `src/providers/openai-responses-v1/responseParser.ts` around line 160 (validation failures)
- **Anthropic**: `src/providers/anthropic-2023-06-01/responseParser.ts` around line 150 (validation failures)
- **xAI**: `src/providers/xai-v1/responseParser.ts` around line 138 (validation failures)

**Provider Error Normalizers** (add to all providers):

- **Google**: `src/providers/google-gemini-v1/googleGeminiV1Provider.ts` around line 409
- **OpenAI**: `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts` in normalizeError method
- **Anthropic**: `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts` in normalizeError method
- **xAI**: `src/providers/xai-v1/xaiV1Provider.ts` in normalizeError method

### Technical Approach

**Logging Strategy:**

1. **Error Level**: Use logger.error() for actual failures
2. **Debug Level**: Use logger.debug() for request/response details
3. **Context Preservation**: Include request ID, provider, model, and operation context
4. **Data Truncation**: Limit response body logging to first 1000 characters

**Example Logging Implementation:**

```typescript
// In response parser validation catch block
catch (error: unknown) {
  logger.error('Response validation failed', {
    provider: 'google',
    model: request.model,
    status: response.status,
    errorDetails: error instanceof Error ? error.message : String(error)
  });

  logger.debug('Raw response data', {
    provider: 'google',
    responseText: responseText.substring(0, 1000),
    headers: response.headers
  });

  throw new ValidationError(/* existing error handling */);
}
```

### Detailed Acceptance Criteria

**Error Logging Requirements:**

- **Raw Error Details**: Log original error before provider normalization
- **Validation Failures**: Log response validation errors with actual response data
- **Request Context**: Include provider name, model, operation type in all logs
- **Response Data**: Log response status, headers, and truncated body for failures
- **Normalized Errors**: Log final BridgeError with error codes and context

**HTTP Request/Response Logging:**

- **Failed Requests**: Log HTTP method, URL, status code for failed requests
- **Request Headers**: Log sanitized headers (exclude API keys and authorization)
- **Response Content**: Log first 1000 characters of response body for debugging
- **Timing Info**: Include request duration for failed requests

**Provider-Specific Requirements:**

- **Google**: Enhance existing Google response debugging from the earlier task
- **OpenAI**: Add logging to OpenAI error and validation paths
- **Anthropic**: Add logging to Anthropic error and validation paths
- **xAI**: Add logging to xAI error and validation paths
- **Consistency**: Same logging format and detail level across all providers

## Dependencies on Other Tasks

- **T-integrate-logging-configuratio**: Logger must be configured and available for import

## Security Considerations

**Data Protection:**

- **API Key Sanitization**: Never log API keys or authorization headers
- **Response Filtering**: Don't log user content or personal information by default
- **Size Limits**: Truncate large responses to prevent log flooding
- **Error Safety**: Logging failures don't expose additional sensitive information

## Testing Requirements

**Unit Tests** (include in same task):

1. **Error Logging**: Test that errors are logged before and after normalization
2. **Validation Logging**: Test response validation failure logging
3. **Data Sanitization**: Test that API keys are not logged
4. **Cross-Provider**: Test logging works consistently across all 4 providers
5. **Level Configuration**: Test that logging respects configured levels
6. **Error Safety**: Test that logging failures don't break error handling

**Test Files:**

- **Provider Tests**: Add to existing provider test files
- **Integration Tests**: Test actual error scenarios with logging enabled

**Key Test Scenarios:**

- Provider API failures with various error types
- Response validation failures (like UNEXPECTED_TOOL_CALL)
- Network errors and timeouts
- Invalid API responses
- Malformed JSON responses

## Implementation Guidance

**Integration Approach:**

1. **Import Logger**: Add `import { logger } from '../core/logging/simpleLogger'` to each file
2. **Existing Error Blocks**: Add logging calls to existing try-catch blocks
3. **Minimal Changes**: Don't change existing error handling logic, just add logging
4. **Consistent Format**: Use same log message format across all providers

**Error Context Pattern:**

```typescript
logger.error("Provider operation failed", {
  provider: "provider-name",
  model: request.model,
  operation: "chat" | "stream" | "normalize",
  error: error.message,
  context: additionalContext,
});
```

**Keep It Simple:**

- **Add to Existing**: Don't create new error handling, add to existing catch blocks
- **No Infrastructure**: Don't create new error tracking systems
- **Console Only**: Use the simple logger, no external logging services
- **Performance Safe**: Use debug level for verbose data, error level for failures

## Out of Scope

- Complex error tracking or metrics collection
- Integration with external monitoring services
- Detailed performance logging or timing analysis
- Request/response logging for successful operations
- Custom error formatting or structured error data
- Error recovery or retry logic changes

This task provides the critical debugging visibility needed to troubleshoot provider issues like the intermittent Google "UNEXPECTED_TOOL_CALL" errors.
