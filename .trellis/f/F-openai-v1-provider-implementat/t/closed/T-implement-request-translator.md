---
id: T-implement-request-translator
title: Implement request translator for OpenAI Responses API v1
status: done
priority: high
parent: F-openai-v1-provider-implementat
prerequisites:
  - T-create-openai-responses-v1
affectedFiles:
  src/providers/openai-responses-v1/translator.ts: Created core request
    translation logic converting unified ChatRequest to OpenAI Responses API v1
    format with proper content part mapping, URL construction, and header
    generation
  src/providers/openai-responses-v1/__tests__/translator.test.ts:
    Added comprehensive unit tests covering successful translations, error
    handling, URL construction, header generation, and parameter mapping with 16
    test cases
  src/providers/openai-responses-v1/index.ts: Updated translateRequest method to
    use real translator implementation instead of placeholder, added proper
    error handling for uninitialized provider
log:
  - Successfully implemented the request translator for OpenAI Responses API v1.
    Created the core translation logic that converts unified ChatRequest format
    to OpenAI-specific format, including proper message content transformation,
    header construction, and parameter mapping. Added comprehensive unit tests
    covering all functionality and error cases. Updated the provider plugin to
    use the real implementation instead of placeholder. All tests pass with
    67/67 test cases successful.
schema: v1.0
childrenIds: []
created: 2025-09-15T19:37:58.045Z
updated: 2025-09-15T19:37:58.045Z
---

# Implement Request Translator for OpenAI Responses API v1

Implement the request translation logic that converts unified ChatRequest format to OpenAI Responses API v1 format.

## Context

This task implements the `translateRequest()` method for the OpenAI Responses v1 provider plugin. It builds on the schema and plugin structure from the previous task and follows the request translation patterns established in the ProviderPlugin interface.

Reference: [OpenAI Responses API Documentation](https://platform.openai.com/docs/api-reference/responses)

## Implementation Requirements

### File to Create/Modify

- `src/providers/openai-responses-v1/translator.ts` - Core translation logic
- Update `src/providers/openai-responses-v1/index.ts` - Implement translateRequest method

### 1. Request Translator (`src/providers/openai-responses-v1/translator.ts`)

**Core Translation Function:**

```typescript
export function translateChatRequestToOpenAI(
  request: ChatRequest & { stream?: boolean },
  config: OpenAIResponsesV1Config,
): ProviderHttpRequest;
```

**Translation Logic:**

- **URL Construction**: `${config.baseUrl}/v1/responses`
- **HTTP Method**: POST
- **Headers**:
  - `Authorization: Bearer ${config.apiKey}`
  - `Content-Type: application/json`
  - `OpenAI-Organization: ${config.organization}` (if provided)
- **Body Mapping**:
  - `model` → `model` (direct mapping)
  - `messages` → `input` (array of message objects)
  - `stream` → `stream` (optional boolean)
  - `temperature` → `temperature` (from options)
  - `maxTokens` → `max_tokens` (from options, snake_case conversion)

**Message Format Conversion:**

- Convert unified `Message[]` to OpenAI `input` format
- Map content parts properly:
  - Text content: `{ type: "text", text: string }`
  - Image content: Follow OpenAI image format
- Handle role mapping: `"user"`, `"assistant"`, `"system"`

### 2. Provider Plugin Integration (`src/providers/openai-responses-v1/index.ts`)

**Update translateRequest Method:**

- Replace placeholder implementation with actual translator call
- Use the translator function from `translator.ts`
- Apply configuration validation using Zod schema
- Handle translation errors and wrap in ValidationError

**Error Handling:**

- Validate request structure before translation
- Validate configuration before use
- Throw ValidationError for invalid inputs
- Provide clear error messages with context

## Technical Approach

1. **Use Existing Infrastructure**: Leverage `ProviderHttpRequest` type from `src/core/transport/`
2. **Follow Validation Patterns**: Use Zod schemas for input validation
3. **Handle Content Types**: Support text and image content properly
4. **Error Wrapping**: Use existing error types from `src/core/errors/`
5. **Configuration Security**: Handle API keys securely without logging

## Acceptance Criteria

### Functional Requirements

- [ ] Successfully converts ChatRequest to valid OpenAI Responses API format
- [ ] Handles both streaming and non-streaming requests
- [ ] Properly maps all supported request parameters
- [ ] Correctly constructs HTTP headers with authentication
- [ ] Supports text and image content in messages

### Message Translation Requirements

- [ ] Maps unified Message format to OpenAI input format correctly
- [ ] Handles system, user, and assistant roles properly
- [ ] Converts content parts (text, image) to OpenAI format
- [ ] Preserves message ordering and structure

### Error Handling Requirements

- [ ] Validates request structure before translation
- [ ] Throws appropriate ValidationError for invalid inputs
- [ ] Provides descriptive error messages
- [ ] Handles missing or invalid configuration gracefully

### Security Requirements

- [ ] API key is included in Authorization header securely
- [ ] No sensitive data is logged or exposed in errors
- [ ] Input validation prevents injection attacks
- [ ] Configuration is validated before use

### Testing Requirements (Include in this task)

- [ ] Unit tests for successful request translation
- [ ] Unit tests for streaming vs non-streaming requests
- [ ] Unit tests for different message types and content
- [ ] Unit tests for error conditions (invalid config, malformed request)
- [ ] Unit tests for security headers and authentication
- [ ] Test file: `src/providers/openai-responses-v1/__tests__/translator.test.ts`

## Dependencies

- Task: "Create OpenAI Responses v1 provider plugin structure and schemas"
- Existing ChatRequest and ProviderHttpRequest types
- Validation infrastructure from core

## Out of Scope

- Response parsing logic (handled by subsequent task)
- Streaming response handling (handled by subsequent task)
- Error normalization (handled by subsequent task)
- Tool call support (out of Phase 4 scope)
