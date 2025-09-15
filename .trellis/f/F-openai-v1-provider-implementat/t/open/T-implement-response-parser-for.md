---
id: T-implement-response-parser-for
title: Implement response parser for non-streaming OpenAI responses
status: open
priority: high
parent: F-openai-v1-provider-implementat
prerequisites:
  - T-create-openai-responses-v1
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T19:39:07.229Z
updated: 2025-09-15T19:39:07.229Z
---

# Implement Response Parser for Non-Streaming OpenAI Responses

Implement the response parsing logic that converts OpenAI Responses API v1 non-streaming responses to unified message format.

## Context

This task implements the non-streaming response parsing component of the `parseResponse()` method for the OpenAI Responses v1 provider plugin. It handles the conversion from OpenAI's response format to the unified format expected by the bridge library.

Reference: [OpenAI Responses API Documentation](https://platform.openai.com/docs/api-reference/responses)

## Implementation Requirements

### File to Create/Modify

- `src/providers/openai-responses-v1/responseParser.ts` - Core response parsing logic
- Update `src/providers/openai-responses-v1/index.ts` - Implement parseResponse method

### 1. Response Parser (`src/providers/openai-responses-v1/responseParser.ts`)

**Core Parsing Function:**

```typescript
export function parseOpenAIResponse(response: ProviderHttpResponse): {
  message: Message;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  model: string;
  metadata?: Record<string, unknown>;
};
```

**Response Format Handling:**

- Parse OpenAI Responses API v1 JSON response structure
- Extract response content and convert to unified Message format
- Map OpenAI output to content parts (text, images, etc.)
- Handle role mapping (assistant responses)

**Usage Information Extraction:**

- Extract token usage from OpenAI response
- Map to unified usage format:
  - `prompt_tokens` → `promptTokens`
  - `completion_tokens` → `completionTokens`
  - `total_tokens` → `totalTokens`

**Metadata Preservation:**

- Extract relevant metadata from OpenAI response
- Preserve response ID, model used, finish reason
- Include OpenAI-specific fields that may be useful for debugging

### 2. Message Construction

**Content Part Creation:**

- Convert OpenAI output content to unified ContentPart format
- Handle text output: `{ type: "text", text: string }`
- Handle other content types as they become available
- Preserve content ordering and structure

**Message Assembly:**

- Create unified Message with:
  - `role: "assistant"`
  - `content: ContentPart[]`
  - `id: string` (from response)
- Handle empty responses gracefully

### 3. Provider Plugin Integration (`src/providers/openai-responses-v1/index.ts`)

**Update parseResponse Method:**

- Implement logic to detect streaming vs non-streaming
- Route to appropriate parser (responseParser.ts vs streamingParser.ts)
- Handle response validation before parsing
- Return correct type based on streaming flag

**Integration Logic:**

```typescript
parseResponse(response: ProviderHttpResponse, isStreaming: boolean) {
  if (isStreaming) {
    return parseOpenAIResponseStream(response); // from streamingParser.ts
  } else {
    return parseOpenAIResponse(response); // from responseParser.ts
  }
}
```

## Technical Approach

1. **Response Validation**: Use Zod schemas to validate OpenAI response structure
2. **Content Mapping**: Convert OpenAI output format to unified content parts
3. **Error Handling**: Handle malformed responses and missing fields
4. **Type Safety**: Ensure proper typing throughout the parsing pipeline
5. **Metadata Preservation**: Retain useful OpenAI-specific information

## Acceptance Criteria

### Functional Requirements

- [ ] Successfully parses valid OpenAI Responses API v1 responses
- [ ] Converts OpenAI output to proper unified Message format
- [ ] Extracts and maps usage information correctly
- [ ] Preserves relevant metadata from OpenAI response
- [ ] Handles both successful and empty responses

### Message Construction Requirements

- [ ] Creates proper Message with assistant role
- [ ] Converts OpenAI content to unified ContentPart format
- [ ] Maintains content ordering and structure
- [ ] Sets appropriate message ID from response

### Integration Requirements

- [ ] parseResponse method routes correctly based on streaming flag
- [ ] Response validation occurs before parsing
- [ ] Error handling provides clear error messages
- [ ] Return types match ProviderPlugin interface exactly

### Error Handling Requirements

- [ ] Validates OpenAI response structure before parsing
- [ ] Handles missing or malformed response fields gracefully
- [ ] Throws appropriate ValidationError for invalid responses
- [ ] Provides descriptive error messages with context

### Testing Requirements (Include in this task)

- [ ] Unit tests for successful response parsing
- [ ] Unit tests for different OpenAI response formats
- [ ] Unit tests for usage extraction and metadata handling
- [ ] Unit tests for error conditions (malformed, missing fields)
- [ ] Unit tests for message construction and content mapping
- [ ] Test file: `src/providers/openai-responses-v1/__tests__/responseParser.test.ts`

## Dependencies

- Task: "Create OpenAI Responses v1 provider plugin structure and schemas"
- Existing Message and ContentPart types from core
- Validation infrastructure from core
- ProviderHttpResponse type from transport

## Out of Scope

- Streaming response parsing (handled by separate streaming task)
- Request translation (handled by previous task)
- Error normalization (handled by subsequent task)
- Tool call response handling (out of Phase 4 scope)
