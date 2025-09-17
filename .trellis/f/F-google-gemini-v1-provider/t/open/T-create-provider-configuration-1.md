---
id: T-create-provider-configuration-1
title: Create provider configuration schema and validation
status: open
priority: high
parent: F-google-gemini-v1-provider
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T03:26:23.198Z
updated: 2025-09-17T03:26:23.198Z
---

# Create Provider Configuration Schema and Validation

## Context

This task establishes the foundation for the Google Gemini v1 provider by creating the configuration schema that validates API keys, base URLs, and other provider-specific settings. This follows the pattern established in existing providers like `src/providers/openai-responses-v1/configSchema.ts` and `src/providers/anthropic-2023-06-01/configSchema.ts`.

**Related Feature**: F-google-gemini-v1-provider - Google Gemini v1 Provider Implementation

## Implementation Requirements

### 1. Create Configuration Schema

Create `src/providers/google-gemini-v1/configSchema.ts` with:

- Zod schema for GoogleGeminiV1Config interface
- Required `apiKey` field with string validation
- Optional `baseUrl` field with default to `https://generativelanguage.googleapis.com/v1beta/models/`
- Optional request timeout and retry configuration
- Export typed configuration interface

### 2. Follow Established Patterns

- Study `src/providers/openai-responses-v1/configSchema.ts` for structure and validation patterns
- Study `src/providers/anthropic-2023-06-01/configSchema.ts` for alternative approaches
- Maintain consistency with existing provider configuration schemas
- Use proper TypeScript typing with Zod inference

### 3. API Key Security

- Ensure API key is marked as sensitive/secret in validation
- Add proper validation for API key format (non-empty string)
- Include validation error messages for debugging
- Support environment variable resolution patterns if needed

## Technical Approach

### Step 1: Create Schema File

```typescript
// src/providers/google-gemini-v1/configSchema.ts
import { z } from "zod";

export const GoogleGeminiV1ConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z
    .string()
    .url()
    .default("https://generativelanguage.googleapis.com/v1beta/models/"),
  // Additional configuration fields as needed
});

export type GoogleGeminiV1Config = z.infer<typeof GoogleGeminiV1ConfigSchema>;
```

### Step 2: Add Validation Logic

- Include proper error messages for each validation rule
- Add URL validation for baseUrl field
- Ensure configuration is exportable for use in provider class

### Step 3: Create Unit Tests

Write comprehensive unit tests in `src/providers/google-gemini-v1/__tests__/configSchema.test.ts`:

- Test valid configuration objects
- Test missing required fields (apiKey)
- Test invalid baseUrl formats
- Test default value application
- Test edge cases and validation error messages

## Acceptance Criteria

### Functional Requirements

- ✅ GoogleGeminiV1ConfigSchema validates required apiKey field
- ✅ Schema provides default baseUrl for Google Gemini API
- ✅ Configuration interface properly typed with Zod inference
- ✅ Schema follows patterns from existing provider configurations
- ✅ Validation error messages are clear and helpful

### Security Requirements

- ✅ API key validation prevents empty or invalid keys
- ✅ Base URL validation ensures only valid URLs accepted
- ✅ Configuration doesn't log or expose sensitive data
- ✅ Schema handles environment variable patterns safely

### Testing Requirements

- ✅ Unit tests cover all validation scenarios
- ✅ Tests verify default value application
- ✅ Tests check error message content and clarity
- ✅ Test coverage meets project standards (>90%)
- ✅ All tests pass with zero TypeScript errors

### Code Quality

- ✅ Module stays under 400 logical LOC limit
- ✅ Single responsibility: configuration validation only
- ✅ No 'any' types - all properly typed with Zod
- ✅ Follows project linting and formatting standards
- ✅ Clear documentation and examples in code comments

## Files to Create/Modify

- Create: `src/providers/google-gemini-v1/configSchema.ts`
- Create: `src/providers/google-gemini-v1/__tests__/configSchema.test.ts`

## Dependencies

- Requires: Zod validation library
- Blocked by: None - this is a foundational task
- Blocks: All other Google Gemini provider tasks

## Out of Scope

- Provider implementation logic (handled by other tasks)
- Request/response translation (handled by other tasks)
- Provider registration (handled by other tasks)
- API integration testing (handled by other tasks)
