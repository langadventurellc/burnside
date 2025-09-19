---
id: F-rate-limiting-retries-and
title: Rate Limiting, Retries, and Provider-Native Prompt Caching
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/transport/retry/backoffConfig.ts: Created BackoffConfig interface
    defining strategy configuration with strategy type, timing parameters, and
    jitter settings
  src/core/transport/retry/backoffCalculator.ts: Created BackoffCalculator
    interface with calculateDelay and reset methods for strategy implementations
  src/core/transport/retry/exponentialBackoffStrategy.ts: Implemented
    ExponentialBackoffStrategy class with formula baseDelay * (multiplier ^
    attempt), jitter support, overflow protection, and comprehensive validation
  src/core/transport/retry/linearBackoffStrategy.ts: Implemented
    LinearBackoffStrategy class with formula baseDelay * (attempt + 1), jitter
    support, and validation
  src/core/transport/retry/createBackoffStrategy.ts:
    Created factory function for
    instantiating appropriate strategy based on configuration
  src/core/transport/retry/delayPromise.ts: Implemented Promise-based delay
    utility with AbortSignal support for cancellation during retry delays
  src/core/transport/retry/index.ts: Created barrel export file providing clean
    public API for all retry functionality; Updated barrel export file to
    include all new retry policy interfaces and classes for clean public API
  src/core/transport/retry/backoffStrategy.ts: Updated to re-export from barrel
    file for backward compatibility while maintaining deprecation notice
  src/core/transport/retry/__tests__/backoffStrategy.test.ts: Created
    comprehensive test suite with 34 tests covering exponential/linear
    strategies, jitter, edge cases, validation, and AbortSignal integration
  src/core/transport/index.ts:
    Added retry module exports to main transport barrel
    export for library-wide accessibility
  src/core/transport/retry/retryConfig.ts:
    Created RetryConfig interface defining
    retry behavior configuration with attempts, backoff strategy, timing
    parameters, jitter settings, and retryable status codes
  src/core/transport/retry/retryContext.ts: Created RetryContext interface for
    tracking retry attempt state including attempt number, error details,
    response data, and abort signals
  src/core/transport/retry/retryDecision.ts: Created RetryDecision interface for
    retry outcomes containing shouldRetry flag, delay timing, and reasoning
  src/core/transport/retry/retryPolicy.ts: Implemented RetryPolicy class with
    comprehensive retry decision logic, Retry-After header parsing,
    configuration validation, and backoff strategy integration
  src/core/transport/retry/__tests__/retryPolicy.test.ts: Created comprehensive
    unit test suite with 47 tests covering all retry policy functionality
    including decision logic, header parsing, delay calculation, configuration
    management, and edge cases
  src/core/transport/rateLimiting/tokenBucket.ts: Created TokenBucket class with
    high-precision timing using recursive setTimeout and performance.now(),
    thread-safe token consumption, configurable burst capacity, and proper
    memory management
  src/core/transport/rateLimiting/tokenBucketConfig.ts:
    Created TokenBucketConfig
    interface defining configuration options for token bucket initialization
    including burst capacity, refill rate, and timing parameters
  src/core/transport/rateLimiting/index.ts: Created barrel export file providing
    clean public API for rate limiting functionality with comprehensive
    documentation and usage examples; Updated barrel exports to include
    RateLimiter class and all related interfaces with comprehensive
    documentation
  src/core/transport/rateLimiting/__tests__/tokenBucket.test.ts:
    Created comprehensive unit test suite with 28 tests covering constructor
    validation, basic functionality, refill mechanics, burst capacity, edge
    cases, memory management, performance characteristics, and real-world
    scenarios
  src/core/transport/rateLimiting/rateLimiter.ts: Created RateLimiter class with
    scope management, lazy bucket creation, automatic cleanup, memory
    efficiency, and thread-safe operations
  src/core/transport/rateLimiting/rateLimitConfig.ts: Created RateLimitConfig
    interface defining configuration options for rate limiting behavior
  src/core/transport/rateLimiting/rateLimitContext.ts: Created RateLimitContext
    interface for request context information used in scope key generation
  src/core/transport/rateLimiting/rateLimitStatus.ts: Created RateLimitStatus
    interface for rate limiting status information including scope keys and
    token availability
  src/core/transport/rateLimiting/__tests__/rateLimiter.test.ts:
    Created comprehensive unit test suite with 37 tests covering all
    functionality including scope key generation, rate limiting logic, bucket
    management, configuration updates, concurrent access, edge cases, and
    performance characteristics
  src/core/models/defaultLlmModelsSchema.ts: "Added promptCaching:
    z.boolean().optional() field to model schema definition and updated JSDoc
    example to include promptCaching capability"
  src/core/providers/modelCapabilities.ts:
    "Added promptCaching?: boolean field to
    ModelCapabilities interface with JSDoc documentation and updated interface
    example"
  src/core/models/modelLoader.ts: "Added promptCaching: model.promptCaching ??
    false mapping in capabilities object, updated function documentation to
    mention promptCaching defaults to false, and updated JSDoc example"
  src/data/defaultLlmModels.ts: "Added promptCaching: true to all 5 Anthropic
    models (claude-3-haiku-20240307, claude-3-5-haiku-latest,
    claude-sonnet-4-20250514, claude-opus-4-20250514, claude-opus-4-1-20250805)
    to enable prompt caching support"
  src/core/models/__tests__/promptCachingCapability.test.ts:
    Created comprehensive
    test suite with 15 tests covering promptCaching capability mapping, schema
    validation, backward compatibility, and edge cases
  src/data/__tests__/defaultLlmModels.test.ts: Updated existing model validation
    tests to verify promptCaching capability and added test to verify other
    providers don't have promptCaching field initially
  src/core/models/__tests__/modelLoader.test.ts: "Updated capability expectation
    to include promptCaching: false default in model loader test"
  src/core/config/bridgeConfig.ts: Extended BridgeConfig interface to add
    rateLimitPolicy field with enabled, maxRps, burst, and scope properties.
    Updated JSDoc example to demonstrate rate limiting configuration usage.;
    Extended BridgeConfig interface to add optional retryPolicy field with
    attempts, backoff strategy, timing parameters, jitter settings, and
    retryable status codes. Updated JSDoc example to demonstrate retry
    configuration usage.
  src/core/config/bridgeConfigSchema.ts: Extended BridgeConfigSchema Zod
    validation to add comprehensive rate limiting validation with proper error
    messages, default values, business logic refinements for auto-burst
    calculation, and required field validation when enabled. Updated example in
    JSDoc documentation.; Extended BridgeConfigSchema Zod validation to add
    comprehensive retry policy validation with proper error messages, default
    values (attempts=2, backoff='exponential', baseDelayMs=1000,
    maxDelayMs=30000, jitter=true, retryableStatusCodes=[429,500,502,503,504]),
    and cross-field validation refinement for delay constraints. Updated JSDoc
    example.
  src/core/config/__tests__/rateLimitingConfig.test.ts:
    Created comprehensive test
    suite with 67 test cases covering all rate limiting validation scenarios
    including valid configurations, validation rules, default value behavior,
    backward compatibility, and edge cases. Tests verify auto-burst calculation,
    enum validation, boundary conditions, and error handling.
  src/core/config/__tests__/bridgeConfigSchema.test.ts: Added integration tests
    for rate limiting configuration to ensure proper interaction with existing
    BridgeConfig validation, including tests for complex configurations with
    tools and providers, validation preservation, and type compatibility.; Added
    integration tests for retry policy configuration to ensure proper
    interaction with existing BridgeConfig validation, including tests for
    complex configurations with tools, providers, and rate limiting, validation
    preservation, and type compatibility.
  src/core/config/__tests__/retryConfig.test.ts:
    Created comprehensive test suite
    with 35 test cases covering all retry configuration validation scenarios
    including valid configurations, validation rules, default value behavior,
    backward compatibility, and edge cases. Tests verify delay constraints,
    status code validation, backoff strategies, and integration with existing
    configuration.
log: []
schema: v1.0
childrenIds:
  - T-add-retry-configuration
  - T-create-enhanced-http
  - T-create-prompt-cache
  - T-extend-provider-plugin
  - T-implement-anthropic-provider
  - T-integrate-enhanced-transport
  - T-add-prompt-caching-capability
  - T-add-rate-limiting-configuratio
  - T-create-rate-limiter-with
  - T-create-retry-policy-manager
  - T-implement-exponential-backoff
  - T-implement-token-bucket
created: 2025-09-19T02:49:27.069Z
updated: 2025-09-19T02:49:27.069Z
---

# Rate Limiting, Retries, and Provider-Native Prompt Caching

## Overview

Implement Phase 10 of the LLM Bridge Library architecture to add production-ready reliability and performance optimizations. This feature adds three core capabilities:

1. **In-memory token-bucket rate limiting** with 429/Retry-After respect
2. **Automatic retry logic** with exponential backoff and jitter
3. **Provider-native prompt caching** hooks for session-based cache reuse

## Architecture Context

This implementation builds on the existing `HttpTransport` class and interceptor chain architecture. The current transport layer supports:

- Basic HTTP requests and streaming
- Interceptor chains for request/response processing
- Error normalization and AbortSignal cancellation
- Transport-level error handling

## Detailed Requirements

### 1. Rate Limiting System

**Core Implementation:**

- Token bucket algorithm with configurable requests-per-second (RPS) and burst capacity
- In-memory implementation with scope keys: `provider:version:model:keyHash[:endpoint]`
- Integration with existing `HttpTransport` to check rate limits before requests
- Automatic backoff when local rate limits are hit
- Respect for provider 429 responses and `Retry-After` headers

**Configuration Schema Extension:**
Extend the existing `BridgeConfig` interface with optional rate limiting configuration:

```typescript
// Add to BridgeConfig interface
rateLimitPolicy?: {
  enabled?: boolean;
  maxRps?: number;
  burst?: number;
  scope?: 'global' | 'provider' | 'provider:model' | 'provider:model:key';
}
```

### 2. Retry Logic with Exponential Backoff

**Core Implementation:**

- Configurable retry attempts (default: 2)
- Exponential backoff with jitter to prevent thundering herd
- Retry on specific HTTP status codes: 429, 500, 502, 503, 504
- Respect provider-specific retry headers (`Retry-After`)
- Integration with existing error handling and cancellation

**Configuration Schema Extension:**

```typescript
// Add to BridgeConfig interface
retryPolicy?: {
  attempts?: number; // 0-10 range, default: 2
  backoff?: 'exponential' | 'linear';
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}
```

### 3. Provider-Native Prompt Caching

**Core Implementation:**

- Add `promptCaching` capability flag to model definitions
- Extend provider plugins with **optional** caching hooks to maintain backward compatibility
- Implement Anthropic-style cache points mapping
- Session-based cache ID reuse within process lifetime

**Model Schema Extension:**

```typescript
// Add to DefaultLlmModelsSchema (existing model capability pattern)
promptCaching: z.boolean().optional();
```

**Provider Plugin Extension (Backward Compatible):**

```typescript
// Add optional methods to existing ProviderPlugin interface
interface ProviderPlugin {
  // ... existing required methods unchanged ...

  // Optional caching hooks - plugins can implement if they support caching
  supportsCaching?(modelId: string): boolean;
  createCacheRequest?(input: CacheableInput): CacheRequest | null;
  extractCacheIds?(response: ProviderResponse): string[];
  reuseCacheIds?(cacheIds: string[], input: CacheableInput): CacheableInput;
}
```

## Implementation Structure

### Core Components to Implement

#### 1. Rate Limiting (`src/core/transport/rateLimiting/`)

- `tokenBucket.ts` - Token bucket algorithm implementation
- `rateLimiter.ts` - Rate limiter coordinator with scope management
- `rateLimitPolicy.ts` - Configuration and policy management
- **Reuse existing** `src/core/errors/rateLimitError.ts` - No new error classes needed

#### 2. Retry System (`src/core/transport/retry/`)

- `retryPolicy.ts` - Retry configuration and rules
- `backoffStrategy.ts` - Exponential backoff with jitter implementation
- `retryableHttpTransport.ts` - Transport wrapper with retry logic
- `retryContext.ts` - Request context for retry attempts

#### 3. Performance Module (`src/core/performance/`)

- `promptCache.ts` - Cache management and session storage
- `cachePolicy.ts` - Cache eligibility and lifetime policies
- `cacheableInput.ts` - Types for cacheable request inputs
- `providerCaching/` - Provider-specific cache implementations

#### 4. Configuration Extensions

- Extend `BridgeConfigSchema` with optional rate limiting and retry fields
- Add rate limiting and retry configuration validation
- Update model capability schema for prompt caching

#### 5. Transport Integration

- Modify `HttpTransport` to integrate rate limiting and retries
- Add interceptors for cache handling
- Maintain backward compatibility with existing API

## Detailed Acceptance Criteria

### Rate Limiting

- ✅ Token bucket correctly enforces RPS limits with burst capacity
- ✅ Rate limits are scoped per provider/model/key combinations
- ✅ 429 responses trigger automatic backoff with jitter
- ✅ `Retry-After` headers are respected and override local timing
- ✅ Rate limiting can be disabled via configuration (default: disabled)
- ✅ Multiple concurrent requests respect shared rate limits

### Retry Logic

- ✅ Automatic retries on transient failures (429, 5xx status codes)
- ✅ Exponential backoff with configurable base and max delays
- ✅ Jitter prevents synchronized retry storms
- ✅ Configurable retry attempts (0-10 range, default: 2)
- ✅ AbortSignal cancellation works during retry delays
- ✅ Provider-specific retry headers override default backoff
- ✅ Non-retryable errors (4xx except 429) fail immediately

### Provider-Native Prompt Caching

- ✅ Existing provider plugins continue working without modification
- ✅ Anthropic provider can optionally implement cache point mapping
- ✅ Cache IDs are extracted from provider responses when supported
- ✅ Cache reuse works within same session/process
- ✅ Models with `promptCaching: true` capability support caching
- ✅ Cache misses gracefully fallback to normal requests

### Configuration & Integration

- ✅ All policies are optional with sensible defaults
- ✅ Configuration validation prevents invalid combinations
- ✅ Existing transport API remains unchanged
- ✅ Error handling integrates with existing error taxonomy
- ✅ Existing provider plugins continue working without changes

## Technical Implementation Guidelines

### Rate Limiting Implementation

1. Use sliding window token bucket for accurate RPS enforcement
2. Implement efficient in-memory storage with automatic cleanup
3. Generate scope keys deterministically from request context
4. Handle edge cases: burst exhaustion, concurrent access, cleanup

### Retry Implementation

1. Wrap existing `HttpTransport.fetch()` with retry logic
2. Use `setTimeout` with Promise-based delay implementation
3. Apply jitter: `delay * (0.5 + Math.random() * 0.5)`
4. Preserve original error for final failure after exhausting retries

### Caching Implementation

1. Add optional methods to provider plugin interface (backward compatible)
2. Implement Anthropic cache control headers mapping in Anthropic provider
3. Store cache IDs in session-scoped Map or similar
4. Validate cache eligibility before applying cache points

### Error Handling

- Reuse existing `RateLimitError` class from `src/core/errors/rateLimitError.ts`
- Extend existing error types rather than creating new hierarchies
- Maintain error context through retry attempts
- Preserve stack traces and original error information

## Testing Requirements

### Unit Tests Required

1. **Token Bucket Tests**
   - Token refill rate accuracy
   - Burst capacity limits
   - Concurrent access safety
   - Scope key generation

2. **Retry Logic Tests**
   - Exponential backoff timing
   - Jitter distribution
   - Retry attempt counting
   - Cancellation during delays

3. **Prompt Caching Tests**
   - Cache ID extraction (when provider supports it)
   - Cache reuse logic
   - Provider capability detection
   - Cache eligibility policies

4. **Integration Tests**
   - Rate limiting + retry interaction
   - Configuration validation
   - Transport wrapper behavior
   - Backward compatibility with existing providers

### Test Data Requirements

- Mock provider responses with cache headers
- HTTP error responses (429, 5xx) for retry testing
- Various rate limiting scenarios and edge cases
- Provider-specific caching examples (Anthropic format)

## Backward Compatibility

### API Compatibility

- All new features are opt-in via configuration (disabled by default)
- Existing `HttpTransport` public API unchanged
- Current error types and interceptors continue working
- **No breaking changes** to provider plugin interface - all caching methods are optional

### Configuration Compatibility

- New rate limiting and retry fields are optional in `BridgeConfig`
- Default values maintain current behavior (no rate limiting, no retries)
- Existing configurations continue working without modification

### Provider Plugin Compatibility

- Existing providers (OpenAI, Anthropic, Google, xAI) continue working unchanged
- Caching hooks are optional - providers implement only if they want caching support
- No required interface changes or compilation errors

## Implementation Order

1. **Phase 1**: Rate limiting infrastructure and token bucket
2. **Phase 2**: Retry logic with exponential backoff
3. **Phase 3**: Provider-native prompt caching framework (optional hooks)
4. **Phase 4**: Transport integration and configuration updates
5. **Phase 5**: Unit testing and validation

This feature represents approximately 12-15 tasks of 1-2 hours each, covering the complete implementation of Phase 10 requirements with backward compatibility and no breaking changes.
