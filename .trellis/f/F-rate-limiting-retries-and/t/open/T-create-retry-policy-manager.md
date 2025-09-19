---
id: T-create-retry-policy-manager
title: Create Retry Policy Manager with Unit Tests
status: open
priority: high
parent: F-rate-limiting-retries-and
prerequisites:
  - T-implement-exponential-backoff
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T03:01:47.962Z
updated: 2025-09-19T03:01:47.962Z
---

# Create Retry Policy Manager with Unit Tests

## Context

This task implements the retry policy manager that determines when and how to retry HTTP requests based on response status codes, headers, and configuration. It integrates with the backoff strategy to provide comprehensive retry logic.

## Links to Related Work

- **Parent Feature**: F-rate-limiting-retries-and - Rate Limiting, Retries, and Provider-Native Prompt Caching
- **Prerequisite**: T-implement-exponential-backoff - Backoff strategy implementation
- **Architecture Reference**: `docs/library-architecture.md` retry specifications
- **Error Integration**: `src/core/errors/` - existing error handling patterns

## Implementation Requirements

Create `src/core/transport/retry/retryPolicy.ts` with the following specifications:

### Core Retry Policy Interface

```typescript
export interface RetryConfig {
  attempts: number; // 0-10 range, default: 2
  backoff: "exponential" | "linear";
  baseDelayMs: number; // Default: 1000
  maxDelayMs: number; // Default: 30000
  jitter: boolean; // Default: true
  retryableStatusCodes: number[]; // Default: [429, 500, 502, 503, 504]
}

export interface RetryContext {
  attempt: number; // Current attempt (0-based)
  lastError: Error; // Last error/response
  lastResponse?: ProviderHttpResponse;
  abortSignal?: AbortSignal;
}

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
  reason: string;
}

export class RetryPolicy {
  constructor(config: RetryConfig);

  // Determine if and how to retry
  shouldRetry(context: RetryContext): RetryDecision;

  // Extract retry delay from provider headers
  parseRetryAfter(headers: Record<string, string>): number | null;

  // Update configuration at runtime
  updateConfig(config: Partial<RetryConfig>): void;
}
```

### Retry Decision Logic

1. **Attempt Limit Check**: `attempt < config.attempts`
2. **Status Code Check**: Response status in `retryableStatusCodes`
3. **AbortSignal Check**: Not aborted
4. **Retry-After Header**: Parse and respect provider timing
5. **Backoff Calculation**: Use configured strategy with jitter

### Retry-After Header Parsing

Support standard formats:

- **Seconds**: `Retry-After: 120` (120 seconds)
- **HTTP Date**: `Retry-After: Wed, 21 Oct 2015 07:28:00 GMT`
- **Invalid/Missing**: Return null (use backoff strategy)

## Acceptance Criteria

### Functional Requirements

- ✅ Retries respect attempt limits (0-10 range)
- ✅ Only retryable status codes trigger retries (429, 5xx)
- ✅ Non-retryable errors (4xx except 429) fail immediately
- ✅ Retry-After headers override backoff calculation
- ✅ AbortSignal cancellation prevents retries
- ✅ Configuration can be updated at runtime

### Unit Tests Required

Create comprehensive tests in `src/core/transport/retry/__tests__/retryPolicy.test.ts`:

1. **Retry Decision Logic**
   - Retryable status codes (429, 500, 502, 503, 504) return shouldRetry: true
   - Non-retryable status codes (400, 401, 404) return shouldRetry: false
   - Attempt limit exceeded returns shouldRetry: false
   - AbortSignal aborted returns shouldRetry: false

2. **Retry-After Header Parsing**
   - Numeric seconds format parsed correctly
   - HTTP date format parsed correctly
   - Invalid/malformed headers return null
   - Missing header returns null

3. **Delay Calculation**
   - Uses backoff strategy when no Retry-After header
   - Respects Retry-After header when present
   - Applies jitter when configured
   - Caps delays at maximum configured value

4. **Configuration Management**
   - Default configuration works correctly
   - Runtime configuration updates apply immediately
   - Invalid configurations rejected gracefully

5. **Edge Cases**
   - Zero attempts configured (no retries)
   - Maximum attempts (10) respected
   - Very large Retry-After values capped
   - Concurrent retry decisions work safely

### Test Scenarios

```typescript
// Retryable scenarios
const retryableResponses = [
  { status: 429, headers: {} },
  { status: 500, headers: {} },
  { status: 502, headers: { "retry-after": "60" } },
  { status: 503, headers: { "retry-after": "Wed, 21 Oct 2015 07:28:00 GMT" } },
];

// Non-retryable scenarios
const nonRetryableResponses = [
  { status: 400, headers: {} }, // Bad request
  { status: 401, headers: {} }, // Unauthorized
  { status: 404, headers: {} }, // Not found
];
```

## Security Considerations

- **Resource Protection**: Maximum attempts prevent infinite retry loops
- **DoS Prevention**: Retry-After header respect prevents aggressive retries
- **Input Validation**: Validate configuration and headers to prevent abuse

## Dependencies

- **Internal**: BackoffStrategy (from prerequisite task)
- **Existing**: ProviderHttpResponse type (from transport)
- **Node.js**: Date parsing for HTTP date format

## Out of Scope

- HTTP transport integration (separate task)
- Retry execution/orchestration (separate task)
- Provider-specific retry logic (handled by configuration)
- Retry metrics/monitoring (future enhancement)

## Files to Create/Modify

- **Create**: `src/core/transport/retry/retryPolicy.ts`
- **Create**: `src/core/transport/retry/__tests__/retryPolicy.test.ts`
- **Update**: `src/core/transport/retry/index.ts` (add exports)

Estimated effort: 2 hours
