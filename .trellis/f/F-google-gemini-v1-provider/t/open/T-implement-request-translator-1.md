---
id: T-implement-request-translator-1
title: Implement request translator for unified to Gemini format
status: open
priority: high
parent: F-google-gemini-v1-provider
prerequisites:
  - T-create-gemini-api-request-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T03:27:26.047Z
updated: 2025-09-17T03:27:26.047Z
---

# Implement Request Translator for Unified to Gemini Format

## Context

This task implements the core request translation logic that converts unified LLM Bridge requests into Google Gemini API format. This is a critical component that handles message transformation, content type mapping, and header preparation for API calls.

**Related Feature**: F-google-gemini-v1-provider - Google Gemini v1 Provider Implementation
**Reference Implementation**: `src/providers/openai-responses-v1/translator.ts`

## Implementation Requirements

### 1. Create Request Translator

Create `src/providers/google-gemini-v1/translator.ts` with:

- `translateChatRequest()` function converting `ChatRequest` to Gemini format
- Message role mapping: "user"→"user", "assistant"→"model", "system"→"user"
- Content part translation for text, images, and documents
- Tool definition integration (delegated to tool translator)
- Proper endpoint URL construction for each model
- Authentication header preparation

### 2. Message Translation Logic

- Convert unified `Message[]` to Gemini `contents` array
- Handle role mapping with proper fallbacks
- Merge system messages into user messages (Gemini doesn't support system role)
- Preserve message order and content integrity
- Handle empty or malformed messages gracefully

### 3. Content Part Mapping

- Text content: direct mapping to `{ "text": "..." }`
- Image content: convert to `{ "inline_data": { "mime_type": "...", "data": "..." } }`
- Document content: convert to inline_data format with proper MIME types
- Content validation and size limit enforcement
- Base64 encoding for binary content

### 4. Request Formatting

- Construct proper Gemini API request structure
- Add authentication headers (`x-goog-api-key`)
- Build endpoint URLs for specific models
- Handle streaming vs non-streaming request differences
- Add generation config (temperature, maxTokens) when provided

## Technical Approach

### Step 1: Study Existing Patterns

- Analyze `src/providers/openai-responses-v1/translator.ts` for structure
- Analyze `src/providers/anthropic-2023-06-01/translator.ts` for alternatives
- Follow established error handling and validation patterns
- Maintain consistency with existing translation approaches

### Step 2: Implement Core Translation

```typescript
// src/providers/google-gemini-v1/translator.ts
import type { ChatRequest } from "../../client/chatRequest";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import type { GoogleGeminiV1Config } from "./configSchema";
import { GeminiRequestSchema } from "./requestSchema";

export function translateChatRequest(
  request: ChatRequest & { stream?: boolean },
  config: GoogleGeminiV1Config,
  modelCapabilities?: { temperature?: boolean },
): ProviderHttpRequest {
  // Implementation here
}
```

### Step 3: Handle Content Translation

- Implement `translateContentPart()` for different content types
- Add proper MIME type detection for images/documents
- Handle base64 encoding for binary content
- Validate content against model capabilities

### Step 4: Create Unit Tests

Write comprehensive unit tests in `src/providers/google-gemini-v1/__tests__/translator.test.ts`:

- Test basic message translation
- Test role mapping edge cases
- Test content part translation for all types
- Test endpoint URL construction
- Test header preparation
- Test streaming vs non-streaming differences
- Test error handling for invalid inputs

## Acceptance Criteria

### Functional Requirements

- ✅ translateChatRequest() converts unified requests to Gemini format
- ✅ Message roles map correctly: "user"→"user", "assistant"→"model"
- ✅ System messages merge into user messages appropriately
- ✅ Content parts translate correctly for text, images, documents
- ✅ Endpoint URLs construct correctly for all 5 Gemini models
- ✅ Authentication headers include proper x-goog-api-key
- ✅ Streaming and non-streaming requests handled appropriately

### Content Translation Requirements

- ✅ Text content maps directly to Gemini text parts
- ✅ Image content converts to inline_data with proper MIME types
- ✅ Document content converts to inline_data with base64 encoding
- ✅ Content validation enforces size and format limits
- ✅ Base64 encoding works correctly for binary content

### Technical Requirements

- ✅ Function follows ProviderPlugin.translateRequest signature
- ✅ Proper error handling with meaningful error messages
- ✅ Request validation using Gemini request schema
- ✅ Type safety with no 'any' types
- ✅ Performance optimized for typical request sizes

### Testing Requirements

- ✅ Unit tests cover all translation scenarios
- ✅ Tests verify endpoint URL construction for all models
- ✅ Tests check header preparation and authentication
- ✅ Tests validate content part translation accuracy
- ✅ Tests verify error handling for edge cases
- ✅ Test coverage meets project standards (>90%)
- ✅ All tests pass with zero TypeScript errors

### Code Quality

- ✅ Module stays under 400 logical LOC limit
- ✅ Single responsibility: request translation only
- ✅ No 'any' types - all properly typed
- ✅ Follows project linting and formatting standards
- ✅ Clear documentation and examples in code comments

## Files to Create/Modify

- Create: `src/providers/google-gemini-v1/translator.ts`
- Create: `src/providers/google-gemini-v1/__tests__/translator.test.ts`

## Dependencies

- Requires: T-create-gemini-api-request-and (request schema)
- Requires: Core ChatRequest and ProviderHttpRequest types
- Requires: GoogleGeminiV1Config from configuration task
- Blocks: Provider implementation and integration tasks

## Out of Scope

- Tool definition translation (handled by separate tool translator task)
- Response parsing (handled by response parser tasks)
- Error normalization (handled by error handling tasks)
- Provider registration (handled by provider implementation task)
