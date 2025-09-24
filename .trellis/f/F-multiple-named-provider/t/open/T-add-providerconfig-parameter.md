---
id: T-add-providerconfig-parameter
title: Add providerConfig parameter to ChatRequest and StreamRequest
status: open
priority: high
parent: F-multiple-named-provider
prerequisites:
  - T-update-bridgeconfig-interface
affectedFiles: {}
log: []
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
