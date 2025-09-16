---
id: T-implement-request-translation
title: Implement request translation from Bridge to Anthropic format
status: done
priority: high
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-api-request
affectedFiles:
  src/providers/anthropic-2023-06-01/translator.ts: Created main request
    translator implementing translateChatRequest function that converts unified
    Bridge ChatRequest format to Anthropic Messages API v2023-06-01 format.
    Includes content type conversion (text, image, code), system message
    extraction, parameter mapping (temperature, stream, topP, stopSequences),
    tool placeholder support, comprehensive validation, and proper HTTP request
    construction with headers.
  src/providers/anthropic-2023-06-01/__tests__/translator.test.ts:
    Created comprehensive unit test suite with 25 test cases covering successful
    translation scenarios, content type mapping, parameter validation, error
    handling, HTTP request structure, and edge cases. Achieves >90% code
    coverage including multi-modal content, streaming support, system message
    handling, and comprehensive validation scenarios.
log:
  - Successfully implemented request translation from Bridge to Anthropic format
    with comprehensive functionality and test coverage. The translator converts
    unified ChatRequest objects to Anthropic Messages API v2023-06-01 format,
    handling multi-modal content (text, image, code), system message extraction,
    parameter mapping including streaming support, and proper error handling.
    Implemented complete content type mapping with validation, temperature range
    validation, and comprehensive HTTP request construction. All 25 unit tests
    pass with >90% coverage including edge cases, error scenarios, and parameter
    validation. The implementation follows project conventions with strict
    TypeScript typing, Zod validation patterns, and security-first approach.
schema: v1.0
childrenIds: []
created: 2025-09-16T13:27:14.430Z
updated: 2025-09-16T13:27:14.430Z
---

# Implement Request Translation from Bridge to Anthropic Format

Implement the request translator that converts unified Bridge `ChatRequest` objects to Anthropic Messages API format, handling multi-modal content, system messages, and tool definitions.

## Context

This task implements the core request translation logic that converts the Bridge library's unified format to Anthropic's Messages API format. The translator handles message conversion, content type mapping, tool definition translation, and parameter mapping.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/translator.ts`

**API Documentation**: Anthropic Messages API v2023-06-01 specification

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Location

Create `src/providers/anthropic-2023-06-01/translator.ts`

### Core Translation Functions

1. **Main Translation Function**:

   ```typescript
   export function translateChatRequest(
     request: ChatRequest & { stream?: boolean },
     config: AnthropicMessagesConfig,
   ): ProviderHttpRequest {
     // Implementation with stream flag support
   }
   ```

2. **Message Translation**:

   ```typescript
   function translateMessages(messages: Message[]): {
     messages: AnthropicMessage[];
     system?: string;
   } {
     // Convert unified Message[] to Anthropic format
     // Extract system messages to separate field
     // Handle conversation flow and roles
   }
   ```

3. **Content Translation**:

   ```typescript
   function translateContentParts(parts: ContentPart[]): AnthropicContent[] {
     // Convert text, image, document content
     // Handle base64 encoding for images
     // Map MIME types appropriately
   }
   ```

4. **Tool Translation** (placeholder):
   ```typescript
   function translateToolDefinitions(tools: ToolDefinition[]): AnthropicTool[] {
     // Placeholder - detailed implementation in separate task
     return [];
   }
   ```

### Translation Logic

1. **Message Processing**:
   - Convert Bridge `Message[]` to Anthropic messages array
   - Extract system messages to `system` field (Anthropic requires separate field)
   - Handle user/assistant role mapping
   - Merge consecutive messages of same role if needed
   - Handle tool call messages and tool result messages

2. **Content Type Mapping**:
   - `{ type: "text", text: string }` → Anthropic text content
   - `{ type: "image", data: string, mimeType: string }` → Anthropic image content with base64 source
   - `{ type: "document", data: string, mimeType: string }` → Convert to text representation
   - Handle unsupported content types gracefully

3. **Parameter Mapping**:
   - `temperature` → Direct mapping (0-1 range)
   - `maxTokens` → `max_tokens` (required field)
   - `stopSequences` → `stop_sequences`
   - **`request.stream === true` → `anthropicRequest.stream = true`**
   - Handle provider-specific parameters

4. **HTTP Request Construction**:
   ```typescript
   return {
     method: "POST",
     url: `${config.baseUrl}/v1/messages`,
     headers: {
       "Content-Type": "application/json",
       "x-api-key": config.apiKey,
       "anthropic-version": config.version,
       "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15", // conditionally
     },
     body: JSON.stringify(anthropicRequest),
   };
   ```

### Technical Approach

```typescript
import type { ChatRequest } from "../../client/chatRequest.js";
import type { Message } from "../../core/messages/message.js";
import type { ContentPart } from "../../core/messages/contentPart.js";
import type { ToolDefinition } from "../../core/tools/toolDefinition.js";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest.js";
import type { AnthropicMessagesConfig } from "./configSchema.js";
import { ValidationError } from "../../core/errors/validationError.js";

export function translateChatRequest(
  request: ChatRequest & { stream?: boolean },
  config: AnthropicMessagesConfig,
): ProviderHttpRequest {
  // Validate required fields
  if (!request.messages.length) {
    throw new ValidationError("Messages array cannot be empty");
  }

  if (!request.maxTokens) {
    throw new ValidationError("maxTokens is required for Anthropic API");
  }

  // Translate messages and extract system prompt
  const { messages, system } = translateMessages(request.messages);

  // Build Anthropic request object
  const anthropicRequest: any = {
    model: request.model,
    max_tokens: request.maxTokens,
    messages,
  };

  // Add optional fields
  if (system) anthropicRequest.system = system;
  if (request.temperature !== undefined)
    anthropicRequest.temperature = request.temperature;
  if (request.topP !== undefined) anthropicRequest.top_p = request.topP;
  if (request.stopSequences?.length)
    anthropicRequest.stop_sequences = request.stopSequences;

  // Handle streaming flag from request
  if (request.stream === true) anthropicRequest.stream = true;

  // Add tools if present (placeholder)
  if (request.tools?.length) {
    anthropicRequest.tools = translateToolDefinitions(request.tools);
  }

  return {
    method: "POST",
    url: `${config.baseUrl}/v1/messages`,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": config.version,
      ...(needsBetaHeader(request) && {
        "anthropic-beta": getBetaHeader(request),
      }),
    },
    body: JSON.stringify(anthropicRequest),
  };
}
```

## Acceptance Criteria

1. **Message Translation**:
   - ✅ Converts unified Message[] to Anthropic messages format
   - ✅ Extracts system messages to separate system field
   - ✅ Handles user/assistant role mapping correctly
   - ✅ Merges consecutive same-role messages when needed
   - ✅ Preserves message ordering and conversation flow

2. **Content Type Support**:
   - ✅ Text content translated correctly
   - ✅ Image content converted to base64 format with proper MIME types
   - ✅ Document content handled appropriately
   - ✅ Unsupported content types fail gracefully with clear errors

3. **Parameter Mapping**:
   - ✅ All supported parameters mapped correctly
   - ✅ Required fields validated (maxTokens, messages)
   - ✅ Optional parameters included when present
   - ✅ **Stream flag properly mapped from `request.stream` to `anthropicRequest.stream`**
   - ✅ Parameter ranges validated (temperature 0-1)

4. **HTTP Request Structure**:
   - ✅ Proper method, URL, and headers
   - ✅ API key included in headers securely
   - ✅ Version header set correctly
   - ✅ Beta header included when needed
   - ✅ Request body properly JSON serialized

5. **Error Handling**:
   - ✅ Validation errors for missing required fields
   - ✅ Clear error messages for unsupported content
   - ✅ Configuration validation
   - ✅ Proper error context included

6. **Unit Tests** (included in this task):
   - ✅ Test basic message translation
   - ✅ Test system message extraction
   - ✅ Test multi-modal content translation
   - ✅ Test parameter mapping and validation
   - ✅ **Test streaming flag handling (`request.stream` → `anthropicRequest.stream`)**
   - ✅ Test HTTP request construction
   - ✅ Test error scenarios and edge cases
   - ✅ Achieve >90% code coverage

## Dependencies

- ChatRequest and Message types from core
- API request schemas from T-create-anthropic-api-request
- Configuration from T-create-anthropic-provider
- Core error classes

## Out of Scope

- Tool definition translation (separate task T-implement-tool-translation)
- Prompt caching implementation (basic support only)
- Advanced parameter validation beyond basic ranges
- Response handling (separate tasks)

## Testing Requirements

Create `src/providers/anthropic-2023-06-01/__tests__/translator.test.ts` with:

- Basic translation scenarios
- Multi-modal content tests
- Parameter mapping validation
- **Streaming flag translation tests**
- Error handling scenarios
- Edge cases (empty messages, invalid content types)
- HTTP request structure validation
