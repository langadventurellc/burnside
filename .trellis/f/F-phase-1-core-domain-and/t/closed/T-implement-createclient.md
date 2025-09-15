---
id: T-implement-createclient
title: Implement createClient factory function with configuration validation
status: done
priority: high
parent: F-phase-1-core-domain-and
prerequisites:
  - T-create-bridgeclient-class
affectedFiles:
  src/core/config/bridgeConfigSchema.ts: Created comprehensive Zod schema for
    BridgeConfig validation with strict validation rules, custom refinements for
    provider validation, and proper TypeScript type inference
  src/core/config/__tests__/bridgeConfigSchema.test.ts:
    Implemented complete test
    suite with 39 test cases covering all validation scenarios, edge cases, and
    type inference verification
  src/core/config/index.ts: Added exports for BridgeConfigSchema and
    ValidatedBridgeConfig type to make schema validation available throughout
    the library
  src/createClient.ts: Implemented main factory function with configuration
    validation, environment variable processing, default merging, and
    comprehensive error handling with clear JSDoc documentation
  src/__tests__/createClient.test.ts: Created extensive test suite with 24 test
    cases covering all functionality including valid/invalid configurations,
    environment variables, error handling, and integration testing
  src/index.ts:
    Updated public API exports to include createClient function as the
    primary entry point with updated JSDoc examples
log:
  - Successfully implemented createClient factory function with comprehensive
    configuration validation using Zod schemas. The implementation provides the
    primary entry point for the LLM Bridge Library with validation, environment
    variable processing, sensible defaults, and clear error messages. All
    requirements met including comprehensive test coverage with 24 test cases
    covering valid configurations, validation errors, environment variable
    processing, error handling, and edge cases. All quality checks pass
    (linting, formatting, type checking) and all 462 tests in the codebase are
    passing.
schema: v1.0
childrenIds: []
created: 2025-09-15T05:37:25.283Z
updated: 2025-09-15T05:37:25.283Z
---

## Context

This task implements the primary factory function `createClient()` that serves as the main entry point for the LLM Bridge Library. The function will validate configuration using Zod schemas and return a properly configured BridgeClient instance.

**Related Specifications:**

- Feature: `F-phase-1-core-domain-and` - Phase 1: Core Domain and Public API Skeleton
- Architecture: `/docs/library-architecture.md` - Public API Surface (line 200)
- Implementation Plan: `/docs/implementation-plan.md` - Phase 1 requirements

## Specific Implementation Requirements

### 1. Create Factory Function Module

- Create `src/createClient.ts` for the main factory function
- Import and use BridgeConfig Zod schema for validation
- Return properly typed and configured BridgeClient instance
- Handle configuration errors with clear error messages

### 2. Configuration Validation

- Use existing BridgeConfig interface with Zod validation
- Validate all required configuration fields
- Provide sensible defaults for optional configuration
- Ensure configuration security (API keys, sensitive data)

### 3. Factory Function Implementation

```typescript
function createClient(config: BridgeConfig): BridgeClient;
```

- Accept BridgeConfig as input parameter
- Validate configuration using Zod schema
- Transform and normalize configuration values
- Initialize and return BridgeClient instance
- Throw clear errors for invalid configuration

### 4. Configuration Processing

- Merge user config with sensible defaults
- Validate provider configurations
- Normalize timeout and other numeric values
- Process environment variable references in API keys

## Technical Approach

### File Structure

```
src/
├── createClient.ts          # Main factory function (this task)
├── client/                  # BridgeClient implementation
├── core/config/             # Configuration schemas
└── index.ts                 # Main exports (updated)
```

### Implementation Steps

1. Create createClient.ts module
2. Import required dependencies (BridgeConfig schema, BridgeClient class)
3. Implement configuration validation with Zod
4. Add default configuration merging logic
5. Implement error handling for validation failures
6. Add BridgeClient instantiation and return
7. Create comprehensive unit tests
8. Update main index.ts to export createClient function
9. Add JSDoc documentation with usage examples

### Function Implementation

```typescript
import { z } from "zod";
import { BridgeConfig, BridgeConfigSchema } from "./core/config";
import { BridgeClient } from "./client";
import { BridgeError } from "./core/errors";

/**
 * Creates a configured LLM Bridge client instance.
 *
 * @param config - Configuration object for the bridge client
 * @returns Configured BridgeClient instance
 * @throws {ValidationError} When configuration is invalid
 * @throws {BridgeError} When client initialization fails
 */
export function createClient(config: BridgeConfig): BridgeClient {
  // Validate configuration with Zod
  const validatedConfig = BridgeConfigSchema.parse(config);

  // Merge with defaults and normalize
  const normalizedConfig = mergeWithDefaults(validatedConfig);

  // Create and return client instance
  return new BridgeClient(normalizedConfig);
}
```

## Detailed Acceptance Criteria

### Configuration Validation

- ✅ Valid configurations create BridgeClient successfully
- ✅ Invalid configurations throw ValidationError with clear messages
- ✅ Missing required fields reported with specific field names
- ✅ Invalid field values reported with expected format information

### Default Handling

- ✅ Missing optional fields filled with sensible defaults
- ✅ Timeout defaults to reasonable value (30000ms)
- ✅ Provider configurations merged properly with defaults
- ✅ Default values don't override explicitly provided values

### Client Creation

- ✅ Returned BridgeClient is properly configured and functional
- ✅ Client can access configuration values correctly
- ✅ Client initialization errors propagated clearly
- ✅ No configuration data leaked in error messages

### Error Handling

- ✅ Configuration validation errors use ValidationError type
- ✅ Client initialization errors use appropriate error types
- ✅ Error messages helpful for debugging configuration issues
- ✅ Sensitive configuration data not exposed in errors

### Function Signature

- ✅ Function accepts BridgeConfig parameter correctly
- ✅ Function returns BridgeClient type correctly
- ✅ TypeScript compilation without errors
- ✅ Proper JSDoc documentation with examples

## Dependencies

**Prerequisites:**

- `T-create-bridgeclient-class` - Need BridgeClient class implementation
- Existing BridgeConfig schema in core/config module
- Existing error types in core/errors module

**Blocks:**

- Main library export and public API completion
- Integration testing for complete API surface

## Security Considerations

### Configuration Security

- Safe handling of API keys and credentials in configuration
- No logging or exposure of sensitive configuration values
- Validation of configuration without leaking sensitive data
- Proper error messages that don't expose system internals

### Input Validation

- Strict validation of all configuration fields
- Prevention of configuration injection attacks
- Safe handling of environment variable references
- Validation of provider-specific configuration options

## Testing Requirements

### Unit Tests (Include in this task)

- **Valid Configuration Tests**: Various valid configuration combinations
- **Invalid Configuration Tests**: Missing fields, invalid values, wrong types
- **Default Handling Tests**: Proper merging with defaults, optional field handling
- **Client Creation Tests**: Successful instantiation, configuration access
- **Error Handling Tests**: Validation errors, client initialization errors
- **Environment Variable Tests**: Proper handling of env var references
- **Edge Case Tests**: Empty config, null values, unexpected field combinations

### Test File: `src/__tests__/createClient.test.ts`

### Example Test Cases

```typescript
describe("createClient", () => {
  describe("valid configuration", () => {
    it("creates client with minimal valid config", () => {
      const config = {
        providers: {
          openai: { apiKey: "test-key" },
        },
      };
      const client = createClient(config);
      expect(client).toBeInstanceOf(BridgeClient);
    });

    it("applies default values for optional fields", () => {
      const config = {
        providers: {
          openai: { apiKey: "test-key" },
        },
      };
      const client = createClient(config);
      // Test that defaults were applied correctly
    });
  });

  describe("invalid configuration", () => {
    it("throws ValidationError for missing required fields", () => {
      const invalidConfig = {};
      expect(() => createClient(invalidConfig)).toThrow(ValidationError);
    });

    it("throws ValidationError for invalid field types", () => {
      const invalidConfig = {
        timeout: "not-a-number",
        providers: { openai: { apiKey: "test" } },
      };
      expect(() => createClient(invalidConfig)).toThrow(ValidationError);
    });
  });

  describe("error handling", () => {
    it("provides clear error messages for validation failures", () => {
      const invalidConfig = { timeout: -1 };
      expect(() => createClient(invalidConfig)).toThrow(
        /timeout must be positive/,
      );
    });
  });
});
```

## Out of Scope

- Advanced configuration features (future phases)
- Provider-specific configuration validation (Phase 3+)
- Runtime configuration updates (future requirement)
- Configuration persistence or caching (future phases)
