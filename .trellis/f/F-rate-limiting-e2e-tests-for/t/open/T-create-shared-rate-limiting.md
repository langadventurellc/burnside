---
id: T-create-shared-rate-limiting
title: Create shared rate limiting E2E test utilities
status: open
priority: high
parent: F-rate-limiting-e2e-tests-for
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T16:47:33.007Z
updated: 2025-09-19T16:47:33.007Z
---

# Create Shared Rate Limiting E2E Test Utilities

## Context

This task creates the shared infrastructure for rate limiting E2E tests across all providers. This follows the existing E2E test pattern in `src/__tests__/e2e/shared/` where common utilities are created for reuse across provider-specific tests.

**Parent Feature**: F-rate-limiting-e2e-tests-for - Rate Limiting E2E Tests for All Providers

**Existing Patterns to Follow**:

- Review `src/__tests__/e2e/shared/anthropicModelHelpers.ts` for client creation patterns
- Follow `src/__tests__/e2e/shared/testHelpers.ts` for validation utility patterns
- Use `src/__tests__/e2e/shared/withTimeout.ts` as reference for timeout handling
- Follow `src/__tests__/e2e/shared/createTestMessages.ts` for test data creation patterns

## Specific Implementation Requirements

### File to Create: `src/__tests__/e2e/shared/rateLimitingHelpers.ts`

**Core Functions to Implement**:

1. **`createRateLimitedTestClient(provider, rateLimitConfig, providerOverrides?)`**
   - Creates BridgeClient with rate limiting configuration
   - Supports all providers (openai, anthropic, google, xai)
   - Uses existing provider helper patterns
   - Integrates with Enhanced HTTP transport

2. **`validateRateLimitingBehavior(requestTimestamps, expectedRps, tolerance?)`**
   - Validates request timing follows rate limiting rules
   - Calculates actual RPS from timestamp array
   - Allows configurable tolerance (default ±200ms)
   - Returns boolean validation result

3. **`measureRequestTiming(requestFunction, requestCount)`**
   - Executes multiple requests and captures timing
   - Returns array of start timestamps
   - Handles async request execution
   - Integrates with existing timeout patterns

4. **`createMinimalTestRequest(provider)`**
   - Creates smallest possible valid request for each provider
   - Minimizes API usage and costs
   - Returns provider-specific request format
   - Uses existing message creation patterns

### Technical Approach

**Rate Limited Client Creation**:

```typescript
export function createRateLimitedTestClient(
  provider: "openai" | "anthropic" | "google" | "xai",
  rateLimitConfig: RateLimitConfig,
  providerOverrides?: Partial<BridgeConfig>,
): BridgeClient {
  // Follow existing provider helper patterns
  // Integrate rateLimitPolicy into BridgeConfig
  // Register appropriate provider plugin
}
```

**Request Timing Validation**:

```typescript
export function validateRateLimitingBehavior(
  timestamps: number[],
  expectedRps: number,
  toleranceMs: number = 200,
): { valid: boolean; actualRps: number; message: string } {
  // Calculate time span and actual RPS
  // Validate against expected RPS with tolerance
  // Return detailed validation results
}
```

## Detailed Acceptance Criteria

### Functional Requirements

- **Client Creation**: `createRateLimitedTestClient()` successfully creates BridgeClient instances with rate limiting enabled for all 4 providers
- **Timing Validation**: `validateRateLimitingBehavior()` accurately validates request timing against expected RPS with configurable tolerance
- **Request Measurement**: `measureRequestTiming()` correctly captures request timestamps for rate limiting analysis
- **Minimal Requests**: `createMinimalTestRequest()` creates valid, minimal requests for all providers to reduce API costs

### Integration Requirements

- **Provider Compatibility**: Utilities work with all existing provider configurations (API keys, models, environments)
- **E2E Infrastructure**: Functions integrate with existing E2E test setup, teardown, and environment validation
- **Timeout Handling**: Request timing utilities respect existing timeout patterns and cancellation
- **Error Handling**: Graceful handling of rate limiting errors and network failures

### Testing Requirements

- **Unit Tests**: Test each utility function with various input scenarios and edge cases
- **Provider Validation**: Verify utilities work with all provider configurations
- **Error Cases**: Test handling of invalid configurations, network errors, and timeout scenarios
- **Timing Accuracy**: Validate timing measurement accuracy within expected tolerances

### Code Quality Requirements

- **TypeScript Types**: Full type safety with proper interfaces and return types
- **Documentation**: JSDoc comments for all exported functions with examples
- **Error Messages**: Clear, actionable error messages for validation failures
- **Consistent Patterns**: Follow existing E2E test code style and patterns

## Dependencies

- Existing E2E test infrastructure in `src/__tests__/e2e/shared/`
- Enhanced HTTP transport implementation (F-rate-limiting-retries-and - completed)
- Rate limiting system implementation (F-rate-limiting-retries-and - completed)
- Provider-specific helper utilities (anthropicModelHelpers.ts, etc.)

## Out of Scope

- Provider-specific test implementations (handled by separate tasks)
- Performance measurement or benchmarking (only functional validation)
- Complex timing analysis beyond basic RPS validation
- Mock or stub implementations (E2E tests use real provider APIs)

## Security Considerations

- Use existing API key management and validation patterns
- Minimize API calls to reduce costs and avoid overwhelming providers
- Ensure test isolation doesn't leak credentials or affect other tests
- Follow existing environment variable security practices

## Implementation Guidance

### File Structure

```typescript
// Imports from existing E2E infrastructure
import type { BridgeClient } from '../../../client/bridgeClient';
import type { BridgeConfig } from '../../../core/config/bridgeConfig';
import type { RateLimitConfig } from '../../../core/transport/rateLimiting/rateLimitConfig';

// Export utility functions
export function createRateLimitedTestClient(...);
export function validateRateLimitingBehavior(...);
export function measureRequestTiming(...);
export function createMinimalTestRequest(...);
```

### Testing Strategy

- Unit tests for each utility function
- Integration tests with sample provider configurations
- Edge case testing for timing validation
- Error handling validation
