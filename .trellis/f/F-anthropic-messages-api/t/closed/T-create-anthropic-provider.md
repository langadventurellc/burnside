---
id: T-create-anthropic-provider
title: Create Anthropic provider configuration schema and validation
status: done
priority: high
parent: F-anthropic-messages-api
prerequisites: []
affectedFiles:
  src/providers/anthropic-2025-05-14/configSchema.ts: Core configuration schema
    with Zod validation for API key (sk-ant- prefix), base URL (HTTPS-only),
    version (YYYY-MM-DD format), timeout (max 300000ms), and retry limits (0-5)
  src/providers/anthropic-2025-05-14/constants.ts:
    Default configuration constants
    for base URL, API version, timeout, and retry settings
  src/providers/anthropic-2025-05-14/isValidAnthropicApiKey.ts:
    Type guard function for validating Anthropic API key format with sk-ant-
    prefix requirement
  src/providers/anthropic-2025-05-14/validateAnthropicConfig.ts: Configuration validation utility function with comprehensive error handling
  src/providers/anthropic-2025-05-14/index.ts:
    Barrel export file providing clean
    public API surface for the Anthropic provider configuration
  src/providers/anthropic-2025-05-14/__tests__/configSchema.test.ts:
    Comprehensive test suite with 38 tests achieving 100% code coverage across
    all validation scenarios, edge cases, and utility functions
log:
  - >-
    Successfully implemented Anthropic provider configuration schema and
    validation with comprehensive Zod validation, TypeScript type safety, and
    extensive unit tests achieving 100% code coverage.


    **Implementation Highlights:**

    - Created complete configuration schema for Anthropic Messages API provider
    following established patterns

    - Implemented strict security validations including HTTPS enforcement and
    API key format validation (sk-ant- prefix)

    - Added comprehensive boundary testing for all validation rules (timeout max
    300000ms, retries 0-5, version date format)

    - Achieved 100% code coverage with 38 passing tests covering all
    valid/invalid scenarios and edge cases

    - Followed project conventions with one-export-per-file rule and proper
    barrel exports

    - All quality checks pass (lint, format, type-check) with no errors or
    warnings


    **Security Features Implemented:**

    - API key validation prevents injection attacks with strict sk-ant- prefix
    requirement

    - Base URL validation enforces HTTPS protocol to prevent HTTP downgrade
    attacks

    - Timeout validation prevents excessive values that could cause resource
    exhaustion

    - Comprehensive input validation with detailed error messages that don't
    expose sensitive data


    **Testing Coverage:**

    - Valid configuration scenarios with minimal and complete configs

    - Invalid configuration scenarios for all field types and boundary
    conditions  

    - Type guard and utility function testing with edge cases

    - Default value assignment and optional field handling

    - Type inference verification ensuring proper TypeScript integration
schema: v1.0
childrenIds: []
created: 2025-09-16T13:24:18.377Z
updated: 2025-09-16T13:24:18.377Z
---

# Create Anthropic Provider Configuration Schema and Validation

Implement the configuration schema for the Anthropic Messages API provider plugin, following the established pattern from the OpenAI provider.

## Context

This task creates the foundational configuration infrastructure for the `anthropic-2025-05-14` provider plugin. The configuration schema defines how users configure API keys, base URLs, and other provider-specific settings.

**Reference Implementation**: Follow the pattern established in `src/providers/openai-responses-v1/configSchema.ts`

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Location

Create `src/providers/anthropic-2025-05-14/configSchema.ts`

### Configuration Schema Design

Define and export the following components:

1. **AnthropicMessagesConfig Interface**:
   - `apiKey: string` - Anthropic API key (required)
   - `baseUrl?: string` - API base URL (default: "https://api.anthropic.com")
   - `version?: string` - API version (default: "2025-05-14")
   - `timeout?: number` - Request timeout in milliseconds
   - `maxRetries?: number` - Maximum retry attempts

2. **AnthropicMessagesConfigSchema (Zod)**:
   - Validate all configuration fields with appropriate defaults
   - API key validation (must start with 'sk-ant-')
   - Base URL validation (must be valid HTTPS URL - **enforced HTTPS scheme**)
   - Version validation (date format YYYY-MM-DD)
   - Timeout validation (positive integer, max 300000ms)
   - MaxRetries validation (0-5 retries)

3. **Type Guards and Utilities**:
   - `isValidAnthropicApiKey()` function
   - `validateAnthropicConfig()` function
   - Default configuration constants

### Technical Approach

```typescript
import { z } from "zod";

// Define the config interface
export interface AnthropicMessagesConfig {
  apiKey: string;
  baseUrl?: string;
  version?: string;
  timeout?: number;
  maxRetries?: number;
}

// Create Zod schema with validation - HTTPS enforcement
export const AnthropicMessagesConfigSchema = z.object({
  apiKey: z.string().startsWith("sk-ant-", "Invalid Anthropic API key format"),
  baseUrl: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith("https://"),
      "Base URL must use HTTPS protocol",
    )
    .default("https://api.anthropic.com"),
  version: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default("2025-05-14"),
  timeout: z.number().positive().max(300000).default(30000),
  maxRetries: z.number().min(0).max(5).default(3),
});
```

### Security Requirements

- Never log or expose API keys in error messages
- Validate API key format to prevent injection attacks
- **Ensure base URL validation prevents SSRF attacks by enforcing HTTPS**
- Redact sensitive fields in debugging/logging

## Acceptance Criteria

1. **Schema Definition**:
   - ✅ Configuration interface properly typed with TypeScript
   - ✅ Zod schema validates all fields with appropriate constraints
   - ✅ Default values set for optional fields

2. **Validation Logic**:
   - ✅ API key validation enforces 'sk-ant-' prefix format
   - ✅ **Base URL validation ensures HTTPS protocol (prevents HTTP downgrade)**
   - ✅ Version validation accepts date format (YYYY-MM-DD)
   - ✅ Timeout validation prevents excessive values
   - ✅ Retry count validation within reasonable bounds

3. **Type Safety**:
   - ✅ No `any` types used
   - ✅ Proper TypeScript inference from Zod schema
   - ✅ Export types are correctly inferred

4. **Unit Tests** (included in this task):
   - ✅ Test valid configuration parsing
   - ✅ Test invalid API key formats (empty, wrong prefix, etc.)
   - ✅ **Test invalid base URLs (HTTP instead of HTTPS, malformed URLs)**
   - ✅ Test boundary conditions for timeout and retry values
   - ✅ Test default value assignment
   - ✅ Achieve >90% code coverage for this module

5. **Security Validation**:
   - ✅ API key format prevents common injection patterns
   - ✅ **Base URL validation prevents SSRF vulnerabilities with HTTPS requirement**
   - ✅ No sensitive data appears in validation error messages

## Dependencies

- Zod library for schema validation
- Core validation utilities from `src/core/validation/`

## Out of Scope

- Provider registration logic (handled in separate task)
- HTTP client configuration (handled in separate task)
- Integration with other provider components

## Testing Requirements

Create `src/providers/anthropic-2025-05-14/__tests__/configSchema.test.ts` with:

- Valid configuration scenarios
- Invalid configuration scenarios with proper error messages
- Default value behavior
- Edge cases for all validation rules
- **HTTPS enforcement validation tests**
- Type inference verification
