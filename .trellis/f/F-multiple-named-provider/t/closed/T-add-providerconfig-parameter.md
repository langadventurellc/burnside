---
id: T-add-providerconfig-parameter
title: Add providerConfig parameter to ChatRequest and StreamRequest
status: done
priority: high
parent: F-multiple-named-provider
prerequisites:
  - T-update-bridgeconfig-interface
affectedFiles:
  src/client/chatRequest.ts: Added optional providerConfig parameter to
    ChatRequest interface and updated JSDoc documentation with comprehensive
    examples showing usage with named provider configurations
  src/client/streamRequest.ts: Updated JSDoc examples to include providerConfig
    usage in streaming scenarios, demonstrating inheritance from ChatRequest
    interface
  src/client/__tests__/chatRequest.test.ts:
    Added comprehensive test coverage for
    providerConfig parameter including interface structure tests, TypeScript
    compilation tests, and type safety validation
  src/client/__tests__/streamRequest.test.ts:
    Added inheritance verification tests
    for providerConfig parameter to ensure proper type compatibility between
    StreamRequest and ChatRequest interfaces
log:
  - >-
    Successfully implemented the providerConfig parameter for ChatRequest and
    StreamRequest interfaces to support multiple named provider configurations.


    **Key Accomplishments:**


    1. **Interface Updates**: Added optional `providerConfig?: string` parameter
    to ChatRequest interface with comprehensive JSDoc documentation explaining
    when it's required vs optional.


    2. **Inheritance Verification**: Confirmed that StreamRequest correctly
    inherits the providerConfig parameter from ChatRequest through interface
    extension, maintaining type safety and compatibility.


    3. **Documentation Enhancement**: Updated JSDoc examples in both interfaces
    to demonstrate usage patterns with named provider configurations, including
    scenarios like "prod", "dev", "backup" configurations for different
    providers (OpenAI, Anthropic).


    4. **Comprehensive Testing**: Added extensive test coverage including:
       - Interface structure tests for optional parameter behavior
       - TypeScript compilation tests with various scenarios (with/without providerConfig)
       - Inheritance tests verifying StreamRequest properly inherits from ChatRequest
       - Type safety validation tests ensuring proper inference and compatibility

    5. **Quality Assurance**: All tests pass (540 total tests) and quality
    checks (lint, format, type-check) pass successfully with no regressions.


    The implementation supports the parent feature's goal of enabling multiple
    named configurations per provider (e.g., "openai-prod", "openai-dev",
    "anthropic-main", "anthropic-backup") by allowing users to specify which
    configuration to use via the providerConfig parameter in their requests. The
    parameter is optional when only one configuration exists, but will be
    required when multiple configurations exist for the same provider
    (validation to be handled in separate tasks).
schema: v1.0
childrenIds: []
created: 2025-09-24T19:22:29.974Z
updated: 2025-09-24T19:22:29.974Z
---

# Add providerConfig Parameter to Request Interfaces

## Context

To support multiple named configurations per provider, users must be able to specify which configuration to use in their requests. This task adds the `providerConfig` parameter to both `ChatRequest` and `StreamRequest` interfaces.

**Related Files:**

- `src/client/chatRequest.ts` - Chat request interface
- `src/client/streamRequest.ts` - Stream request interface
- **Reference**: Feature F-multiple-named-provider for requirements

## Specific Implementation Requirements

### 1. Update ChatRequest Interface

Add new optional parameter to `ChatRequest`:

```typescript
/** Provider configuration name to use for this request (required when multiple configs exist for a provider) */
providerConfig?: string;
```

### 2. Update StreamRequest Interface

Since `StreamRequest` extends `ChatRequest`, the parameter will be inherited automatically. Verify this works correctly and add any stream-specific documentation if needed.

### 3. Update JSDoc Documentation

Add comprehensive documentation with examples:

```typescript
/**
 * @example
 * // Using named provider configuration
 * const request: ChatRequest = {
 *   messages: [...],
 *   model: "openai:gpt-4",
 *   providerConfig: "prod" // Uses the "prod" OpenAI configuration
 * };
 */
```

### 4. Add Interface Examples

Update existing examples in the JSDoc to show usage with the new parameter across different scenarios.

## Technical Approach

1. Add `providerConfig?: string` to `ChatRequest` interface
2. Update JSDoc comments with comprehensive examples
3. Verify `StreamRequest` inherits the parameter correctly
4. Add documentation explaining when the parameter is required vs optional
5. Update existing examples to demonstrate usage patterns

## Acceptance Criteria

### Interface Definition

- **GIVEN** a developer imports `ChatRequest` or `StreamRequest`
- **WHEN** they define a request object with `providerConfig`
- **THEN** TypeScript accepts the parameter without errors
- **AND** the parameter is properly typed as `string | undefined`

### Documentation Completeness

- **GIVEN** a developer reviews the interface documentation
- **WHEN** they read the JSDoc comments
- **THEN** they understand when `providerConfig` is required vs optional
- **AND** examples demonstrate both scenarios clearly

### Type Safety

- **GIVEN** various request configurations
- **WHEN** TypeScript processes the interfaces
- **THEN** type checking works correctly for both with and without `providerConfig`
- **AND** autocomplete suggestions include the new parameter

## Testing Requirements

### Unit Tests (include in this task)

- Test `ChatRequest` interface with and without `providerConfig`
- Test `StreamRequest` interface inherits parameter correctly
- Verify TypeScript compilation with various parameter combinations
- Test optional nature of the parameter works as expected

## Dependencies

- Requires completion of T-update-bridgeconfig-interface for understanding the configuration structure
- Must be completed before provider resolution logic tasks

## Out of Scope

- Actual usage of the parameter in request processing (handled in separate tasks)
- Validation logic for provider configuration names (handled in separate tasks)
- Error handling for invalid configuration names (handled in separate tasks)
