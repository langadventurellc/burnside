---
id: T-build-xai-request-translator
title: Build xAI request translator with model mapping
status: open
priority: high
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-implement-xai-request-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T19:56:50.647Z
updated: 2025-09-17T19:56:50.647Z
---

# Build xAI Request Translator with Model Mapping

## Context

This task implements the request translator that converts unified ChatRequest format to xAI-specific API format. The translator handles model ID mapping, content transformation, tool definitions, and xAI-specific request formatting.

## Reference Implementation

Use these files as reference patterns:

- `src/providers/openai-responses-v1/translator.ts` (primary template)
- `src/providers/google-gemini-v1/translator.ts` (advanced patterns)
- `src/core/providers/providerPlugin.ts` (interface requirements)

## Implementation Requirements

Create `src/providers/xai-v1/translator.ts` with the following components:

### Main Translation Function

```typescript
export function translateChatRequest(
  request: ChatRequest & { stream?: boolean },
  config: XAIV1Config,
  modelCapabilities?: { temperature?: boolean },
): ProviderHttpRequest {
  // Validate input request
  const validatedRequest = XAIV1RequestSchema.parse({
    model: mapModelId(request.model),
    messages: translateMessages(request.messages),
    stream: request.stream,
    max_tokens: request.maxTokens,
    temperature: modelCapabilities?.temperature
      ? request.temperature
      : undefined,
    top_p: request.topP,
    functions: request.tools ? translateTools(request.tools) : undefined,
  });

  return {
    url: `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...config.headers,
    },
    body: JSON.stringify(validatedRequest),
    timeout: config.timeout,
  };
}
```

### Model ID Mapping

```typescript
function mapModelId(unifiedModelId: string): string {
  // Strip provider prefix: "xai:grok-3" -> "grok-3"
  if (unifiedModelId.startsWith("xai:")) {
    return unifiedModelId.substring(4);
  }
  return unifiedModelId;
}
```

### Message Content Translation

```typescript
function translateMessages(messages: Message[]): any[] {
  return messages.map((message) => ({
    role: message.role,
    content: translateMessageContent(message.content),
    name: message.name,
  }));
}

function translateMessageContent(content: ContentPart[]): any {
  if (content.length === 1 && content[0].type === "text") {
    return content[0].text;
  }

  // Multimodal content
  return content.map((part) => {
    if (part.type === "text") {
      return { type: "text", text: part.text };
    } else if (part.type === "image" && part.imageUrl) {
      return {
        type: "image_url",
        image_url: { url: part.imageUrl },
      };
    }
    throw new ValidationError(`Unsupported content type: ${part.type}`);
  });
}
```

### Tool Definition Translation

```typescript
function translateTools(tools: ToolDefinition[]): any[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}
```

## Acceptance Criteria

### Functional Requirements

✅ **Request Translation**: Unified requests translate accurately to xAI format
✅ **Model Mapping**: Provider-prefixed model IDs map correctly to xAI model names
✅ **Message Translation**: Text and multimodal messages convert properly
✅ **Tool Translation**: Tool definitions convert to xAI function format
✅ **Header Formation**: Proper Authorization and Content-Type headers
✅ **URL Construction**: Correct endpoint URL with base URL handling

### Data Transformation Requirements

✅ **Content Handling**: Both text-only and multimodal content support
✅ **Parameter Mapping**: Temperature, maxTokens, topP map correctly
✅ **Stream Parameter**: Streaming flag passes through correctly
✅ **Optional Fields**: Handle undefined/null values appropriately
✅ **Model Capabilities**: Respect model capability restrictions

### Security Requirements

✅ **API Key Handling**: Secure API key inclusion in Authorization header
✅ **Input Validation**: Request validation through schema before translation
✅ **URL Safety**: Proper URL construction without injection vulnerabilities
✅ **Data Sanitization**: Content validation and safe transformation

## Testing Requirements

Include comprehensive unit tests covering:

### Basic Translation Tests

- Simple text message translation
- Model ID mapping (with and without provider prefix)
- Basic parameter translation (temperature, maxTokens, etc.)
- Header construction and authorization

### Advanced Translation Tests

- Multimodal message translation (text + images)
- Tool definition translation
- Streaming parameter handling
- Model capability restrictions (temperature support)

### Edge Case Tests

- Empty message arrays (should throw validation error)
- Invalid content types (should throw ValidationError)
- Missing required configuration (should throw error)
- Invalid model IDs (should throw validation error)

### Error Handling Tests

- Invalid message content types
- Malformed tool definitions
- Invalid configuration values
- Network timeout handling

## Implementation Steps

1. **Create Translator File**: Set up main translation function structure
2. **Implement Model Mapping**: Handle provider prefix stripping
3. **Message Translation**: Support text and multimodal content
4. **Tool Translation**: Convert unified tools to xAI function format
5. **Request Validation**: Validate translated request against schema
6. **Header Construction**: Build proper HTTP headers with authentication
7. **URL Formation**: Construct correct API endpoint URL
8. **Write Unit Tests**: Comprehensive test coverage for all scenarios
9. **Error Handling**: Proper error propagation and context

## Dependencies

- **Prerequisites**: T-implement-xai-request-and (request/response schemas)
- **Blocks**: Response parser and main provider class

## Out of Scope

- Response parsing (handled in response parser)
- HTTP request execution (handled by transport layer)
- Configuration validation (handled in config schema)
- Provider initialization (handled in main provider class)

## Technical Notes

- Follow OpenAI-compatible format for maximum compatibility
- Ensure model ID mapping handles edge cases (missing prefix, etc.)
- Validate all inputs through Zod schemas before API calls
- Handle multimodal content by converting to base64 data URLs when needed
- Support both legacy function calling and newer tool definitions
