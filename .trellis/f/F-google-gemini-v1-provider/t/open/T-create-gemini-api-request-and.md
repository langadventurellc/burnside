---
id: T-create-gemini-api-request-and
title: Create Gemini API request and response schemas
status: open
priority: high
parent: F-google-gemini-v1-provider
prerequisites:
  - T-create-provider-configuration-1
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T03:26:51.471Z
updated: 2025-09-17T03:26:51.471Z
---

# Create Gemini API Request and Response Schemas

## Context

This task creates Zod schemas that validate the Google Gemini API request and response formats, ensuring type safety and proper validation for all API interactions. These schemas serve as the contract between our provider and Google's API, following the patterns established in existing providers.

**Related Feature**: F-google-gemini-v1-provider - Google Gemini v1 Provider Implementation

## Implementation Requirements

### 1. Create Request Schema

Create `src/providers/google-gemini-v1/requestSchema.ts` with:

- Zod schema for Gemini API request format
- `contents` array with role ("user" | "model") and parts structure
- `tools` array for function calling with schema definitions
- `generationConfig` for model parameters
- Support for both `generateContent` and `streamGenerateContent` endpoints

### 2. Create Response Schema

Create `src/providers/google-gemini-v1/responseSchema.ts` with:

- Zod schema for Gemini API response format
- `candidates` array with content and metadata
- `citation_metadata` and `url_context_metadata` structures
- `function_call` objects for tool execution
- Usage metadata and model information
- Error response format handling

### 3. Follow Established Patterns

- Study `src/providers/openai-responses-v1/requestSchema.ts` and `responseSchema.ts`
- Study `src/providers/anthropic-2023-06-01/requestSchema.ts` and `responseSchema.ts`
- Maintain consistency with existing schema validation approaches
- Use proper TypeScript typing with Zod inference

## Technical Approach

### Step 1: Analyze Gemini API Format

Based on research, implement schemas matching:

```typescript
// Request format
{
  "contents": [
    {
      "role": "user" | "model",
      "parts": [
        { "text": "..." } |
        { "inline_data": { "mime_type": "...", "data": "..." } }
      ]
    }
  ],
  "tools": [
    {
      "function": {
        "name": "...",
        "description": "...",
        "parameters": { /* JSON Schema */ }
      }
    }
  ]
}
```

### Step 2: Create Request Schema

```typescript
// src/providers/google-gemini-v1/requestSchema.ts
import { z } from "zod";

const GeminiPartSchema = z.union([
  z.object({ text: z.string() }),
  z.object({
    inline_data: z.object({
      mime_type: z.string(),
      data: z.string(),
    }),
  }),
]);

export const GeminiRequestSchema = z.object({
  contents: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      parts: z.array(GeminiPartSchema),
    }),
  ),
  tools: z
    .array(
      z.object({
        function: z.object({
          name: z.string(),
          description: z.string().optional(),
          parameters: z.record(z.unknown()),
        }),
      }),
    )
    .optional(),
  generationConfig: z
    .object({
      temperature: z.number().optional(),
      maxOutputTokens: z.number().optional(),
    })
    .optional(),
});
```

### Step 3: Create Response Schema

```typescript
// src/providers/google-gemini-v1/responseSchema.ts
export const GeminiResponseSchema = z.object({
  candidates: z.array(
    z.object({
      content: z
        .object({
          parts: z.array(GeminiPartSchema),
        })
        .optional(),
      function_call: z
        .object({
          name: z.string(),
          args: z.record(z.unknown()),
        })
        .optional(),
      citation_metadata: z
        .array(
          z.object({
            quote: z.string(),
            uri: z.string(),
          }),
        )
        .optional(),
      url_context_metadata: z
        .array(
          z.object({
            url: z.string(),
            relevance: z.number(),
          }),
        )
        .optional(),
    }),
  ),
  usage: z
    .object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number(),
    })
    .optional(),
});
```

### Step 4: Create Unit Tests

Write comprehensive unit tests for both schemas:

- Test valid request/response objects
- Test invalid formats and edge cases
- Test optional field handling
- Test union type validation (different part types)
- Test nested object validation

## Acceptance Criteria

### Functional Requirements

- ✅ Request schema validates Gemini API request format accurately
- ✅ Response schema validates Gemini API response format accurately
- ✅ Schemas handle both text and multimodal content parts
- ✅ Tool/function calling structures properly validated
- ✅ Citation and grounding metadata schemas complete
- ✅ Optional fields handled correctly with appropriate defaults

### Technical Requirements

- ✅ Schemas use proper Zod validation patterns
- ✅ TypeScript interfaces properly inferred from schemas
- ✅ Error messages are clear and actionable
- ✅ Schemas support both streaming and non-streaming responses
- ✅ Union types properly handle different content part formats

### Testing Requirements

- ✅ Unit tests cover all schema validation paths
- ✅ Tests verify valid request/response examples
- ✅ Tests check invalid format rejection
- ✅ Tests validate optional field behavior
- ✅ Test coverage meets project standards (>90%)
- ✅ All tests pass with zero TypeScript errors

### Code Quality

- ✅ Each module stays under 400 logical LOC limit
- ✅ Single responsibility per schema file
- ✅ No 'any' types - all properly typed with Zod
- ✅ Follows project linting and formatting standards
- ✅ Clear documentation and examples in code comments

## Files to Create/Modify

- Create: `src/providers/google-gemini-v1/requestSchema.ts`
- Create: `src/providers/google-gemini-v1/responseSchema.ts`
- Create: `src/providers/google-gemini-v1/__tests__/requestSchema.test.ts`
- Create: `src/providers/google-gemini-v1/__tests__/responseSchema.test.ts`

## Dependencies

- Requires: T-create-provider-configuration-1 (configuration patterns)
- Requires: Zod validation library
- Blocks: All translation and parsing tasks

## Out of Scope

- Request/response translation logic (handled by translator tasks)
- Provider implementation (handled by other tasks)
- API integration testing (handled by integration test tasks)
- Error normalization logic (handled by error handling tasks)
