---
id: T-create-anthropic-rate
title: Create Anthropic rate limiting E2E tests
status: done
priority: medium
parent: F-rate-limiting-e2e-tests-for
prerequisites:
  - T-create-shared-rate-limiting
affectedFiles:
  src/__tests__/e2e/anthropic/rateLimiting.e2e.test.ts:
    "Created comprehensive E2E
    tests for Anthropic rate limiting functionality with 4 test scenarios: basic
    throttling (2 RPS), disabled rate limiting validation, provider scope
    isolation, and model scope testing. Tests use sequential request execution
    to properly measure rate limiting delays and validate timing behavior using
    shared utilities."
log:
  - Implemented comprehensive Anthropic rate limiting E2E tests that validate
    rate limiting functionality works correctly with Anthropic provider APIs.
    Created 4 test scenarios that verify basic throttling behavior (2 RPS
    enforcement), configuration validation (disabled state), and scope isolation
    (provider and model level scoping). Tests use real Anthropic API endpoints
    with minimal requests to reduce costs while ensuring rate limiting prevents
    provider-side 429 errors. All tests pass reliably with appropriate timing
    tolerance for network variability.
schema: v1.0
childrenIds: []
created: 2025-09-19T16:48:30.328Z
updated: 2025-09-19T16:48:30.328Z
---

# Create Anthropic Rate Limiting E2E Tests

## Context

Implement end-to-end tests that validate rate limiting functionality works correctly with Anthropic provider APIs. This follows the existing E2E test pattern in `src/__tests__/e2e/anthropic/` where provider-specific tests are organized.

**Parent Feature**: F-rate-limiting-e2e-tests-for - Rate Limiting E2E Tests for All Providers  
**Prerequisites**: T-create-shared-rate-limiting (shared utilities must be completed first)

**Existing Patterns to Follow**:

- Review `src/__tests__/e2e/anthropic/chat.e2e.test.ts` for Anthropic test structure and patterns
- Follow environment setup patterns from existing Anthropic E2E tests
- Use `src/__tests__/e2e/shared/anthropicModelHelpers.ts` for Anthropic client creation
- Follow existing Jest describe/test organization and timeout handling

## Specific Implementation Requirements

### File to Create: `src/__tests__/e2e/anthropic/rateLimiting.e2e.test.ts`

**Test Structure**:

```typescript
describe("Anthropic Rate Limiting E2E", () => {
  let rateLimitedClient: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    // Environment setup following existing patterns
  });

  describe("Basic Rate Limiting", () => {
    // Core rate limiting tests
  });

  describe("Configuration Validation", () => {
    // Enabled/disabled state tests
  });

  describe("Scope Testing", () => {
    // Different scope level validation
  });
});
```

**Test Scenarios to Implement**:

1. **Basic Throttling Test**
   - Configure client with 2 RPS rate limit
   - Send 4 rapid consecutive requests
   - Validate total duration is 2+ seconds
   - Verify no provider 429 errors

2. **Disabled Rate Limiting Test**
   - Configure client with rate limiting disabled
   - Send multiple rapid requests
   - Verify requests proceed without throttling delays
   - Confirm functionality works normally

3. **Provider Scope Isolation**
   - Create two clients with provider-level scoping
   - Verify rate limits are independent between different provider configurations
   - Test concurrent requests to validate scope separation

4. **Model Scope Testing**
   - Configure client with provider:model scoping
   - Test different models have independent rate limiting
   - Validate scope key generation works correctly

## Detailed Acceptance Criteria

### Functional Behavior

- **Rate Limiting Enforcement**: When configured with 2 RPS, consecutive requests are properly throttled and take 2+ seconds total
- **No Provider Errors**: Rate limiting prevents provider-side 429 errors from rapid requests
- **Configuration Integration**: Rate limiting works through BridgeConfig configuration, not direct transport manipulation
- **Scope Validation**: Different scope levels (provider, provider:model) create independent rate limiting buckets

### Test Implementation

- **Environment Integration**: Tests use existing Anthropic E2E environment setup and API key validation
- **Request Timing**: Measure and validate request timing without detailed performance analysis
- **Error Handling**: Graceful handling of rate limiting scenarios and network issues
- **Test Isolation**: Tests don't interfere with other Anthropic E2E tests

### Anthropic-Specific Requirements

- **Model Selection**: Use existing Anthropic test model selection patterns
- **API Integration**: Test with real Anthropic messages API endpoints
- **Minimal Usage**: Use smallest possible requests to minimize API costs
- **Response Validation**: Verify responses follow expected Anthropic patterns

### Testing Quality

- **Consistent Results**: Tests pass reliably with timing tolerance for network variability
- **Timeout Handling**: Appropriate test timeouts that account for rate limiting delays (15-30 seconds)
- **Clear Assertions**: Descriptive test assertions that explain rate limiting behavior validation
- **Jest Integration**: Follow existing Jest patterns for describe blocks, beforeAll setup, and test structure

## Technical Approach

### Environment Setup

```typescript
beforeAll(() => {
  loadAnthropicTestConfig(); // Existing pattern
  testModel = getAnthropicTestModel(); // Existing pattern
  rateLimitedClient = createRateLimitedTestClient("anthropic", {
    enabled: true,
    maxRps: 2,
    scope: "provider",
  });
  ensureModelRegistered(rateLimitedClient, testModel);
});
```

### Test Implementation Pattern

```typescript
test("should throttle requests to 2 RPS", async () => {
  const startTime = performance.now();
  const requests = Array(4)
    .fill(null)
    .map(() =>
      rateLimitedClient.chat({
        messages: createMinimalTestRequest("anthropic"),
        model: testModel,
        maxTokens: 10,
      }),
    );

  await Promise.all(requests);
  const duration = performance.now() - startTime;

  expect(duration).toBeGreaterThan(2000); // 2+ seconds for 4 requests at 2 RPS
});
```

## Dependencies

- T-create-shared-rate-limiting (shared rate limiting utilities)
- Existing Anthropic E2E test infrastructure
- Anthropic API key and environment configuration
- Enhanced HTTP transport with rate limiting (already implemented)

## Out of Scope

- Performance benchmarking or detailed timing analysis
- Anthropic provider implementation changes
- Complex concurrent request testing beyond scope validation
- Retry logic testing (focused only on rate limiting)

## Security Considerations

- Use existing Anthropic API key management patterns
- Minimize API calls to reduce costs
- Follow existing environment variable security practices
- Ensure test isolation doesn't affect other Anthropic tests

## Testing Requirements

- **Unit Tests**: Test helper functions and configuration validation
- **E2E Scenarios**: All 4 test scenarios listed in implementation requirements
- **Error Handling**: Network errors, invalid configurations, timeout scenarios
- **Integration**: Verify compatibility with existing Anthropic E2E test infrastructure
