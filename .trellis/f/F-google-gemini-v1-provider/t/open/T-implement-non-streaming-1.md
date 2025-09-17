---
id: T-implement-non-streaming-1
title: Implement non-streaming response parser
status: open
priority: high
parent: F-google-gemini-v1-provider
prerequisites:
  - T-create-gemini-api-request-and
  - T-implement-tool-definition-1
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T03:28:29.820Z
updated: 2025-09-17T03:28:29.820Z
---

# Implement Non-Streaming Response Parser

## Context

This task implements the response parser for non-streaming Gemini API responses, converting Gemini's response format back to the unified LLM Bridge format. This handles complete responses from the `generateContent` endpoint, including content extraction, citation handling, and function call processing.

**Related Feature**: F-google-gemini-v1-provider - Google Gemini v1 Provider Implementation
**Reference Implementation**: `src/providers/openai-responses-v1/responseParser.ts`

## Implementation Requirements

### 1. Create Response Parser

Create `src/providers/google-gemini-v1/responseParser.ts` with:

- `parseGeminiResponse()` function converting Gemini responses to unified format
- Content part extraction from candidates array
- Citation metadata mapping to `SourceRef[]`
- Function call extraction and parsing
- Usage metadata extraction (token counts)
- Error handling for malformed responses

### 2. Content Extraction Logic

- Extract text content from Gemini response parts
- Handle multimodal content (images, documents) if present in responses
- Combine multiple content parts into unified content array
- Preserve content order and structure
- Handle empty or missing content gracefully

### 3. Citation and Grounding Processing

- Map `citation_metadata` to unified `SourceRef[]` format
- Extract URLs, titles, and snippets from `url_context_metadata`
- Preserve relevance scores and attribution information
- Handle missing or incomplete citation data
- Maintain citation links to specific content spans

### 4. Function Call Processing

- Extract function calls from candidate responses
- Parse function names and arguments
- Validate function call structure
- Handle multiple function calls in single response
- Integration with tool translation system

### 5. Usage and Metadata Extraction

- Extract token usage information (prompt, completion, total tokens)
- Preserve model information and response metadata
- Handle missing usage data gracefully
- Map Gemini-specific metadata to unified format

## Technical Approach

### Step 1: Study Existing Patterns

- Analyze `src/providers/openai-responses-v1/responseParser.ts` for structure
- Analyze `src/providers/anthropic-2023-06-01/responseParser.ts` for alternatives
- Follow established response parsing and error handling patterns
- Maintain consistency with existing parser approaches

### Step 2: Implement Core Parser

```typescript
// src/providers/google-gemini-v1/responseParser.ts
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import type { Message } from "../../core/messages/message";
import { GeminiResponseSchema } from "./responseSchema";

export async function parseGeminiResponse(
  response: ProviderHttpResponse,
): Promise<{
  message: Message;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  model: string;
  metadata?: Record<string, unknown>;
}> {
  // Implementation here
}
```

### Step 3: Implement Helper Functions

- `extractContentParts()` for content extraction
- `extractCitations()` for citation processing
- `extractFunctionCalls()` for function call parsing
- `extractUsageMetadata()` for token usage information

### Step 4: Create Unit Tests

Write comprehensive unit tests in `src/providers/google-gemini-v1/__tests__/responseParser.test.ts`:

- Test basic response parsing for text content
- Test multimodal content extraction
- Test citation and grounding metadata processing
- Test function call extraction and validation
- Test usage metadata extraction
- Test error handling for malformed responses
- Test edge cases (empty responses, missing fields)

## Acceptance Criteria

### Functional Requirements

- ✅ parseGeminiResponse() converts Gemini responses to unified format
- ✅ Text content extracts correctly from response parts
- ✅ Multimodal content (images, documents) handles appropriately
- ✅ Citation metadata maps accurately to SourceRef[] format
- ✅ Function calls parse correctly with names and arguments
- ✅ Usage metadata extracts token counts and model information

### Content Processing Requirements

- ✅ Multiple content parts combine into unified content array
- ✅ Content order and structure preserved through parsing
- ✅ Empty or missing content handled gracefully
- ✅ Content type detection works for different part types
- ✅ Content validation ensures compatibility with unified format

### Citation Processing Requirements

- ✅ citation_metadata maps to SourceRef with URI and snippets
- ✅ url_context_metadata maps to SourceRef with relevance scores
- ✅ Citation attribution preserved and linked correctly
- ✅ Missing citation data handled without errors
- ✅ Multiple citations per response handled appropriately

### Function Call Processing Requirements

- ✅ Function calls extract with correct names and arguments
- ✅ Multiple function calls in response handled correctly
- ✅ Function call validation ensures proper structure
- ✅ Integration with tool translator for argument parsing
- ✅ Error handling for malformed function calls

### Technical Requirements

- ✅ Async function signature matching ProviderPlugin interface
- ✅ Proper error handling with meaningful error messages
- ✅ Response validation using Gemini response schema
- ✅ Type safety with no 'any' types
- ✅ Performance optimized for typical response sizes

### Testing Requirements

- ✅ Unit tests cover all parsing scenarios
- ✅ Tests verify content extraction accuracy
- ✅ Tests check citation processing correctness
- ✅ Tests validate function call parsing
- ✅ Tests verify usage metadata extraction
- ✅ Tests handle error cases and edge conditions
- ✅ Test coverage meets project standards (>90%)
- ✅ All tests pass with zero TypeScript errors

### Code Quality

- ✅ Module stays under 400 logical LOC limit
- ✅ Single responsibility: response parsing only
- ✅ No 'any' types - all properly typed
- ✅ Follows project linting and formatting standards
- ✅ Clear documentation and examples in code comments

## Files to Create/Modify

- Create: `src/providers/google-gemini-v1/responseParser.ts`
- Create: `src/providers/google-gemini-v1/__tests__/responseParser.test.ts`

## Dependencies

- Requires: T-create-gemini-api-request-and (response schema)
- Requires: T-implement-tool-definition-1 (function call parsing)
- Requires: Core Message and SourceRef types
- Blocks: Provider implementation and integration tasks

## Out of Scope

- Streaming response parsing (handled by separate streaming parser task)
- Request translation (handled by translator tasks)
- Error normalization (handled by error handling tasks)
- Provider registration (handled by provider implementation task)
