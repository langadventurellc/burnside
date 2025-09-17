---
id: T-create-xai-response-parser
title: Create xAI response parser for non-streaming
status: done
priority: high
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-implement-xai-request-and
affectedFiles:
  src/providers/xai-v1/toolCallParser.ts: Created comprehensive tool call parser
    that validates and converts xAI tool calls to unified ToolCall format.
    Includes robust JSON argument parsing, schema validation with Zod, error
    handling with detailed context, and metadata extraction with provider
    identification.
  src/providers/xai-v1/responseParser.ts: Created main response parser that
    converts xAI API responses to unified message format. Handles content
    conversion from output_text to unified text format, usage information
    mapping (input_tokens → promptTokens, output_tokens → completionTokens),
    tool call integration, metadata extraction, and comprehensive error handling
    for malformed responses.
  src/providers/xai-v1/__tests__/fixtures/nonStreamingResponses.ts:
    Created comprehensive test fixtures with valid xAI response examples
    including text responses, tool calls, multiple tool calls, minimal
    responses, responses without usage, reasoning outputs, and empty content
    scenarios.
  src/providers/xai-v1/__tests__/fixtures/errorResponses.ts: Created error
    response test fixtures for testing error handling scenarios including empty
    responses, invalid JSON, malformed tool calls, missing required fields, and
    schema validation failures.
  src/providers/xai-v1/__tests__/fixtures/index.ts: Created barrel export file for centralized test fixture imports.
  src/providers/xai-v1/__tests__/toolCallParser.test.ts: Created comprehensive
    test suite with 21 test cases covering successful parsing, error handling,
    edge cases, and type validation for the tool call parser.
  src/providers/xai-v1/__tests__/responseParser.test.ts: Created comprehensive
    test suite with 30 test cases covering successful parsing, error handling,
    content conversion, usage extraction, metadata extraction, and edge cases
    for the response parser.
log:
  - Successfully implemented the xAI response parser for non-streaming
    responses. Created a comprehensive implementation that converts xAI API
    responses to unified bridge format, including message extraction, usage
    information mapping, tool call parsing, and robust error handling. The
    parser handles all response scenarios including text-only responses, tool
    calls, reasoning outputs, empty content, and various error conditions.
    Includes 100% test coverage with 30 comprehensive test cases covering
    success scenarios, error handling, content conversion, usage extraction,
    metadata preservation, and edge cases. All quality checks (lint, format,
    type-check) pass with no issues.
schema: v1.0
childrenIds: []
created: 2025-09-17T19:57:28.341Z
updated: 2025-09-17T19:57:28.341Z
---

# Create xAI Response Parser for Non-Streaming

## Context

This task implements the response parser for non-streaming xAI API responses, converting them from xAI format to the unified bridge format. The parser handles message extraction, usage information, tool calls, and error detection.

## Reference Implementation

Use these files as reference patterns:

- `src/providers/openai-responses-v1/responseParser.ts` (primary template)
- `src/providers/google-gemini-v1/responseParser.ts` (alternative patterns)
- `src/core/messages/message.ts` (unified message format)

## Implementation Requirements

Create `src/providers/xai-v1/responseParser.ts` with the following components:

### Main Response Parser Function

```typescript
export async function parseXaiResponse(
  response: ProviderHttpResponse,
  originalRequest: ChatRequest,
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
  // Parse and validate response
  const responseText = await response.text();
  const responseData = JSON.parse(responseText);

  // Check for error response
  if (responseData.error) {
    throw new ProviderError(`xAI API error: ${responseData.error.message}`, {
      code: responseData.error.code,
      type: responseData.error.type,
      param: responseData.error.param,
    });
  }

  // Validate response format
  const validatedResponse = XAIV1ResponseSchema.parse(responseData);

  // Extract first choice (xAI always returns single choice for non-streaming)
  const choice = validatedResponse.choices[0];
  if (!choice) {
    throw new ProviderError("No choices returned in response");
  }

  return {
    message: convertToUnifiedMessage(choice.message, originalRequest),
    usage: validatedResponse.usage
      ? {
          promptTokens: validatedResponse.usage.prompt_tokens,
          completionTokens: validatedResponse.usage.completion_tokens,
          totalTokens: validatedResponse.usage.total_tokens,
        }
      : undefined,
    model: validatedResponse.model,
    metadata: {
      id: validatedResponse.id,
      created: validatedResponse.created,
      finishReason: choice.finish_reason,
    },
  };
}
```

### Message Conversion

```typescript
function convertToUnifiedMessage(
  xaiMessage: any,
  originalRequest: ChatRequest,
): Message {
  const content: ContentPart[] = [];

  // Handle text content
  if (xaiMessage.content) {
    content.push({
      type: "text",
      text: xaiMessage.content,
    });
  }

  // Handle function calls
  if (xaiMessage.function_call) {
    content.push({
      type: "tool_call",
      toolCallId: generateToolCallId(),
      toolName: xaiMessage.function_call.name,
      toolArguments: JSON.parse(xaiMessage.function_call.arguments),
    });
  }

  return {
    id: generateMessageId(),
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
    metadata: {
      provider: "xai",
      finishReason: "stop", // Will be updated by caller with actual finish reason
    },
  };
}
```

### Utility Functions

```typescript
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateToolCallId(): string {
  return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function validateResponseStructure(response: any): void {
  if (
    !response.choices ||
    !Array.isArray(response.choices) ||
    response.choices.length === 0
  ) {
    throw new ProviderError("Invalid response structure: no choices found");
  }
}
```

### Error Detection and Handling

```typescript
function detectResponseErrors(responseData: any): void {
  // Check for explicit error responses
  if (responseData.error) {
    throw new ProviderError(`xAI API error: ${responseData.error.message}`, {
      code: responseData.error.code,
      type: responseData.error.type || "api_error",
      originalError: responseData.error,
    });
  }

  // Check for malformed responses
  if (!responseData.choices || responseData.choices.length === 0) {
    throw new ProviderError("Malformed response: no choices available");
  }

  // Check for content filtering
  const choice = responseData.choices[0];
  if (choice.finish_reason === "content_filter") {
    throw new ProviderError("Content was filtered by xAI safety systems");
  }
}
```

## Acceptance Criteria

### Functional Requirements

✅ **Response Parsing**: xAI responses parse correctly to unified format
✅ **Message Extraction**: Assistant messages convert with proper content
✅ **Usage Information**: Token usage extracts correctly when available
✅ **Tool Call Handling**: Function calls convert to unified tool call format
✅ **Error Detection**: API errors and malformed responses detected
✅ **Metadata Preservation**: Response metadata preserved in unified format

### Data Transformation Requirements

✅ **Content Conversion**: Text content converts to unified ContentPart format
✅ **Function Call Conversion**: xAI function calls convert to tool calls
✅ **Usage Mapping**: Token counts map correctly to unified usage format
✅ **ID Generation**: Unique message and tool call IDs generated
✅ **Timestamp Addition**: Current timestamp added to messages

### Error Handling Requirements

✅ **API Errors**: xAI API errors converted to ProviderError with context
✅ **Validation Errors**: Schema validation errors caught and handled
✅ **Malformed Responses**: Invalid response structures detected
✅ **Content Filtering**: Content filter responses handled appropriately

## Testing Requirements

Include comprehensive unit tests covering:

### Success Case Tests

- Basic text response parsing
- Response with usage information
- Function call response parsing
- Response metadata extraction
- Empty content handling

### Error Case Tests

- API error responses (various error codes)
- Malformed response structures
- Missing choices array
- Content filtering responses
- JSON parsing errors

### Edge Case Tests

- Response without usage information
- Multiple choices handling (should use first choice)
- Null/undefined content handling
- Invalid function call arguments

### Integration Tests

- End-to-end parsing with mock xAI responses
- Tool call ID generation uniqueness
- Message ID generation uniqueness
- Timestamp format validation

## Implementation Steps

1. **Create Parser File**: Set up main response parsing function
2. **Response Validation**: Implement schema validation and error checking
3. **Message Conversion**: Convert xAI messages to unified format
4. **Usage Extraction**: Parse token usage information
5. **Tool Call Handling**: Convert function calls to unified tool calls
6. **Error Detection**: Comprehensive error detection and handling
7. **Metadata Extraction**: Preserve response metadata
8. **Write Unit Tests**: Full test coverage for all scenarios
9. **Integration Testing**: Verify end-to-end parsing works correctly

## Dependencies

- **Prerequisites**: T-implement-xai-request-and (response schema)
- **Works with**: T-build-xai-request-translator (request context)
- **Blocks**: Main provider class and streaming parser

## Out of Scope

- Streaming response parsing (handled in separate streaming parser)
- HTTP response handling (handled by transport layer)
- Request validation (handled in translator)
- Provider configuration (handled in config schema)

## Technical Notes

- Use OpenAI-compatible response format as the foundation
- Ensure proper error propagation with context preservation
- Generate unique IDs for messages and tool calls
- Handle edge cases like missing usage information gracefully
- Follow established patterns from existing provider parsers
