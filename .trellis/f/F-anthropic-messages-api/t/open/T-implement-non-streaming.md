---
id: T-implement-non-streaming
title: Implement non-streaming response parser
status: open
priority: high
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-api-request
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T13:27:50.350Z
updated: 2025-09-16T13:27:50.350Z
---

# Implement Non-Streaming Response Parser

Implement the response parser that converts Anthropic Messages API responses to unified Bridge format, handling content blocks, tool calls, and metadata extraction.

## Context

This task implements the response parsing logic for non-streaming Anthropic API responses. The parser converts Anthropic's response format to the Bridge library's structured response format with usage information, following the established pattern from the OpenAI provider.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/responseParser.ts`

**API Documentation**: Anthropic Messages API v2023-06-01 response format

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Location

Create `src/providers/anthropic-2023-06-01/responseParser.ts`

### Core Parsing Functions

1. **Main Response Parser**:

   ```typescript
   export function parseAnthropicResponse(
     response: ProviderHttpResponse,
     responseText: string,
   ): {
     message: Message;
     usage?: {
       promptTokens: number;
       completionTokens: number;
       totalTokens?: number;
     };
     model: string;
     metadata?: Record<string, unknown>;
   } {
     // Implementation - takes pre-read responseText like OpenAI parser
   }
   ```

2. **Content Block Parsing**:

   ```typescript
   function parseContentBlocks(blocks: AnthropicContentBlock[]): ContentPart[] {
     // Convert Anthropic content blocks to unified ContentPart[]
   }
   ```

3. **Tool Call Extraction**:

   ```typescript
   function extractToolCalls(blocks: AnthropicContentBlock[]): ToolCall[] {
     // Extract tool use blocks as tool calls
   }
   ```

4. **Metadata Extraction**:
   ```typescript
   function extractResponseMetadata(
     response: AnthropicMessagesResponse,
   ): Record<string, unknown> {
     // Extract stop reason and other metadata
   }
   ```

### Parsing Logic

1. **Response Validation**:
   - Parse responseText (not response.body)
   - Validate response against schema
   - Handle error responses appropriately
   - Check for required fields

2. **Content Processing**:
   - Convert text blocks to `{ type: "text", text: string }`
   - Handle tool_use blocks separately
   - Preserve content ordering from API response
   - Handle empty content appropriately

3. **Tool Call Processing**:
   - Extract tool_use blocks as tool calls
   - Map tool ID, name, and input arguments
   - Generate tool call IDs if not present
   - Handle malformed tool calls gracefully

4. **Structured Return Format**:
   ```typescript
   return {
     message: {
       id: response.id,
       role: "assistant",
       content: parseContentBlocks(response.content),
       toolCalls: extractToolCalls(response.content),
       metadata: {
         provider: "anthropic",
         model: response.model,
         stopReason: response.stop_reason,
       },
     },
     usage: {
       promptTokens: response.usage.input_tokens,
       completionTokens: response.usage.output_tokens,
       totalTokens: response.usage.input_tokens + response.usage.output_tokens,
     },
     model: response.model,
     metadata: extractResponseMetadata(response),
   };
   ```

### Technical Approach

```typescript
import type { Message } from "../../core/messages/message.js";
import type { ContentPart } from "../../core/messages/contentPart.js";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse.js";
import type { ToolCall } from "../../core/tools/toolCall.js";
import { ProviderError } from "../../core/errors/providerError.js";
import { ValidationError } from "../../core/errors/validationError.js";
import {
  AnthropicMessagesResponse,
  AnthropicErrorResponse,
} from "./responseSchema.js";

export function parseAnthropicResponse(
  response: ProviderHttpResponse,
  responseText: string,
): {
  message: Message;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  model: string;
  metadata?: Record<string, unknown>;
} {
  // Parse responseText (pre-read, not response.body)
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    throw new ProviderError("Invalid JSON in Anthropic response", {
      cause: error,
      context: { provider: "anthropic", status: response.status },
    });
  }

  // Check for error response
  if (
    parsed &&
    typeof parsed === "object" &&
    "type" in parsed &&
    parsed.type === "error"
  ) {
    const errorResponse = AnthropicErrorResponse.parse(parsed);
    throw new ProviderError(errorResponse.error.message, {
      context: {
        provider: "anthropic",
        errorType: errorResponse.error.type,
        status: response.status,
      },
    });
  }

  // Validate and parse successful response
  const validatedResponse = AnthropicMessagesResponse.parse(parsed);

  // Convert to structured format
  const message: Message = {
    id: validatedResponse.id,
    role: "assistant",
    content: parseContentBlocks(validatedResponse.content),
    toolCalls: extractToolCalls(validatedResponse.content),
    metadata: {
      provider: "anthropic",
      model: validatedResponse.model,
      stopReason: validatedResponse.stop_reason,
    },
  };

  const usage = {
    promptTokens: validatedResponse.usage.input_tokens,
    completionTokens: validatedResponse.usage.output_tokens,
    totalTokens:
      validatedResponse.usage.input_tokens +
      validatedResponse.usage.output_tokens,
  };

  return {
    message,
    usage,
    model: validatedResponse.model,
    metadata: extractResponseMetadata(validatedResponse),
  };
}
```

### Error Handling

1. **JSON Parsing Errors**: Handle malformed JSON responses from responseText
2. **Schema Validation Errors**: Handle responses that don't match expected format
3. **API Error Responses**: Convert Anthropic errors to Bridge errors
4. **Missing Content**: Handle responses with empty or missing content
5. **Tool Call Parsing**: Handle malformed tool calls gracefully

## Acceptance Criteria

1. **Response Parsing**:
   - ✅ **Takes pre-read responseText parameter like OpenAI parser (not response.body)**
   - ✅ **Returns structured object with message, usage, model, metadata**
   - ✅ Successfully parses valid Anthropic responses
   - ✅ Converts content blocks to unified ContentPart format
   - ✅ Handles responses with no content gracefully

2. **Content Block Processing**:
   - ✅ Text blocks converted to text content parts
   - ✅ Tool use blocks extracted as tool calls
   - ✅ Content ordering preserved from API response
   - ✅ Handles mixed content types correctly

3. **Tool Call Extraction**:
   - ✅ Tool use blocks converted to ToolCall format
   - ✅ Tool ID, name, and arguments properly extracted
   - ✅ Handles multiple tool calls in single response
   - ✅ Malformed tool calls handled gracefully with errors

4. **Usage and Metadata**:
   - ✅ **Usage statistics properly mapped to { promptTokens, completionTokens, totalTokens }**
   - ✅ Stop reason included in message metadata
   - ✅ Model and provider information included
   - ✅ Response ID preserved in message
   - ✅ **Additional metadata returned in structured response**

5. **Error Handling**:
   - ✅ JSON parsing errors handled appropriately
   - ✅ API error responses converted to Bridge errors
   - ✅ Schema validation errors handled gracefully
   - ✅ Proper error context and stack traces

6. **Unit Tests** (included in this task):
   - ✅ Test successful response parsing with responseText input
   - ✅ Test content block processing
   - ✅ Test tool call extraction
   - ✅ **Test structured return format with usage information**
   - ✅ Test error response handling
   - ✅ Test malformed response handling
   - ✅ Achieve >90% code coverage

## Dependencies

- Response schemas from T-create-anthropic-api-request
- Core Message, ContentPart, and ToolCall types
- Core error classes (ProviderError, ValidationError)
- HTTP response types from core transport

## Out of Scope

- Streaming response parsing (separate task)
- Tool call execution (handled by core tool system)
- Advanced metadata processing beyond basic fields
- Response caching or optimization

## Testing Requirements

Create `src/providers/anthropic-2023-06-01/__tests__/responseParser.test.ts` with:

- Valid response parsing tests with responseText input
- Content block processing tests
- Tool call extraction tests
- **Structured response format validation tests**
- Error response handling tests
- Malformed response scenarios
- Edge cases (empty content, missing fields)
