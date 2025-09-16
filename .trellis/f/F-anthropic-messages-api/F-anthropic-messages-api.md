---
id: F-anthropic-messages-api
title: Anthropic Messages API Provider Implementation
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/providers/anthropic-2023-06-01/configSchema.ts: Created comprehensive
    configuration schema with Zod validation including API key format validation
    (sk-ant- prefix), HTTPS enforcement for base URLs, date format validation
    for API version, timeout constraints (max 300000ms), and retry limits (0-5).
    Implements security-first approach preventing SSRF attacks and injection
    vulnerabilities.
  src/providers/anthropic-2023-06-01/__tests__/configSchema.test.ts:
    Created comprehensive test suite with 29 test cases covering all validation
    scenarios including valid configurations, API key validation, HTTPS
    enforcement, version format validation, timeout/retry boundaries, type
    inference, defaults, and security edge cases. Achieves >90% code coverage.
  src/providers/anthropic-2023-06-01/index.ts: Created barrel export file
    providing clean public API for the Anthropic provider configuration module,
    exporting the main schema and inferred TypeScript types.; Updated barrel
    export to include request and response schemas with proper TypeScript type
    exports; Updated module exports to include the new
    AnthropicMessagesV1Provider class following project conventions
  src/providers/anthropic-2023-06-01/: Created complete directory structure for
    Anthropic Messages API provider following established project patterns.
  src/providers/anthropic-2023-06-01/requestSchema.ts: Created comprehensive
    request schema with Zod validation for Anthropic Messages API v2023-06-01,
    including text/image content types, tool definitions, and parameter
    constraints (temperature, top_p, max_tokens)
  src/providers/anthropic-2023-06-01/responseSchema.ts: Created comprehensive
    response schema supporting non-streaming responses, streaming deltas with
    all event types, tool use blocks, usage statistics, and error responses
  src/providers/anthropic-2023-06-01/__tests__/requestSchema.test.ts:
    Created comprehensive test suite with 31 test cases covering valid/invalid
    requests, multimodal content, boundary values, and type inference
  src/providers/anthropic-2023-06-01/__tests__/responseSchema.test.ts:
    Created comprehensive test suite with 26 test cases covering response
    validation, streaming events, error responses, and edge cases
  src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts:
    Created the main AnthropicMessagesV1Provider class implementing the
    ProviderPlugin interface with proper configuration management, model
    support, and placeholder implementations for all required methods
  src/providers/anthropic-2023-06-01/__tests__/anthropicMessagesV1Provider.test.ts:
    Created comprehensive unit test suite with 36 test cases covering all
    provider functionality, error handling, interface compliance, and edge cases
    with >90% coverage
log: []
schema: v1.0
childrenIds:
  - T-create-anthropic-provider-1
  - T-create-provider-module
  - T-implement-anthropic-error
  - T-implement-non-streaming
  - T-implement-request-translation
  - T-implement-streaming-response
  - T-implement-tool-definition
  - T-integrate-provider-methods
  - T-update-model-registry-to-use
  - T-create-anthropic-api-request
  - T-create-anthropic-provider
created: 2025-09-16T13:04:04.085Z
updated: 2025-09-16T13:04:04.085Z
---

# Anthropic Messages API Provider Implementation

Implement a complete provider plugin for Anthropic's Messages API following Phase 6 of the implementation plan. This feature delivers vertical slice B, enabling the LLM Bridge library to work with Claude models including tool calling, streaming, and session-scoped prompt caching capabilities.

## Purpose and Functionality

Create a fully functional `anthropic-2023-06-01` provider plugin that:

- Translates unified Bridge requests to Anthropic Messages API format
- Handles streaming responses with proper delta parsing
- Supports tool calling with Anthropic's native tools format
- Implements session-scoped prompt caching capabilities where available
- Provides comprehensive error normalization
- Maintains compatibility with the existing provider plugin architecture

## Key Components to Implement

### 1. Provider Plugin Structure

- `AnthropicMessagesV1Provider` class implementing `ProviderPlugin` interface with `version: "2023-06-01"`
- Configuration schema with API key, base URL, and version handling
- Model-agnostic operation accepting any model ID routed to it

### 2. Request Translation (`translator.ts`)

- Convert unified `Message[]` to Anthropic Messages API format
- Handle multi-modal content (text, images, documents)
- Translate unified tool definitions to Anthropic tools format
- Support system messages and conversation flow
- Handle session-scoped prompt caching markers where supported

### 3. Response Parsing (`responseParser.ts` & `streamingParser.ts`)

- Parse non-streaming Anthropic responses to unified format
- Stream parsing for Server-Sent Events (SSE) from Anthropic
- Delta accumulation and message reconstruction
- Tool call extraction and formatting
- Stop reason handling and termination detection

### 4. Tool System Integration (`toolTranslator.ts`)

- Translate unified `ToolDefinition` to Anthropic tools format
- Handle tool call execution flow with graceful fallback if parallel tools unsupported
- Support both built-in and provider-native tools
- Process tool results and integrate into conversation flow

### 5. Error Handling (`errorNormalizer.ts`)

- Map Anthropic HTTP errors to unified error taxonomy
- Handle rate limiting (429) responses
- Authentication and authorization errors
- Invalid request format errors
- Model-specific error conditions

### 6. Streaming Implementation

- SSE parser for Anthropic's streaming format following existing patterns
- Delta processing for incremental content
- Tool call streaming support
- Proper stream termination and cleanup

## Detailed Acceptance Criteria

### Functional Behavior

- **Request Translation**: Successfully convert Bridge `ChatRequest` to valid Anthropic Messages API requests with proper headers (`x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-beta` when needed)
- **Response Processing**: Parse Anthropic responses back to unified `Message` format with correct content types, roles, and metadata
- **Streaming Support**: Handle streaming responses with proper delta accumulation and real-time updates
- **Tool Integration**: Execute tool calls seamlessly with proper argument parsing and result integration (when tool system is enabled in config), skip tool execution when disabled
- **Multi-modal Content**: Support text, images, and documents with proper encoding and MIME type handling
- **Conversation Management**: Maintain conversation state and handle multi-turn interactions correctly

### API Compatibility

- **Base URL**: Use `https://api.anthropic.com/v1/messages` for all API requests
- **Model Support**: Work with all Claude models (Haiku, Sonnet, Opus variants) as defined in `defaultLlmModels.ts`
- **Version Handling**: Support Anthropic API version 2023-06-01 with appropriate headers
- **Parameter Mapping**: Correctly map temperature, max_tokens, stop sequences, and other parameters
- **Content Types**: Handle all supported content types: text, images (base64), documents (PDF, text files)

### Required HTTP Headers

- **x-api-key**: API key authentication header
- **anthropic-version**: Must be set to `2023-06-01`
- **content-type**: Must be `application/json`
- **anthropic-beta**: For beta features like tool calling (e.g., `anthropic-beta: computer-use-2025-01-24`)

### Tool Calling Requirements

- **Schema Translation**: Convert Zod schemas to Anthropic's JSON schema format for tool definitions
- **Tool Execution**: Support Anthropic's tool execution capabilities with graceful fallback if parallel execution is unsupported
- **Tool Results**: Properly format and inject tool results back into conversation
- **Error Handling**: Handle tool execution failures gracefully with proper error propagation
- **Config Gating**: Respect tool system configuration - skip tool execution when disabled, execute when enabled

### Performance & Reliability (Goals, not strict SLOs)

- **Response Time**: Aim for reasonable response times for simple requests, streaming deltas as quickly as possible
- **Memory Efficiency**: Streaming implementation with bounded memory usage for large responses
- **Error Recovery**: Graceful degradation for network issues, API errors, and malformed responses
- **Connection Management**: Use existing HttpTransport infrastructure with proper timeout handling

### Integration Points

- **Provider Registry**: Register correctly with `ProviderRegistry` using `providerRegistry.register(plugin)` or `client.registerProvider(plugin)`
- **Model Registry**: Work seamlessly with models configured with `providerPlugin: "anthropic-2023-06-01"`
- **Transport Layer**: Integrate with existing `HttpTransport` infrastructure
- **Tool Router**: Coordinate with `ToolRouter` for tool execution workflow when enabled
- **Provider Plugin Mapping**: BridgeClient maps 'anthropic-2023-06-01' to { id: 'anthropic', version: '2023-06-01' } in getProviderKeyFromPluginString

### Security & Data Protection

- **API Key Handling**: Secure API key management without logging sensitive data
- **Request Sanitization**: Validate and sanitize all request data before API calls
- **Response Redaction**: Apply redaction rules to prevent sensitive data exposure
- **Error Information**: Avoid exposing internal details in error messages

### Testing Requirements

- **Unit Tests**: Comprehensive test coverage for all modules (90% coverage goal)
- **Integration Tests**: End-to-end tests with mocked Anthropic API responses
- **Contract Tests**: Verify API request/response format compatibility
- **Streaming Tests**: Test streaming behavior with various response patterns (avoid timing-sensitive assertions)
- **Tool Execution Tests**: Test complete tool calling workflow with both enabled and disabled tool system configurations
- **Error Scenario Tests**: Test error handling for various failure modes

## Technical Requirements

### Architecture Alignment

- Follow existing provider plugin pattern established by OpenAI provider
- Maintain separation of concerns: config, translation, parsing, errors
- Use dependency injection for transport and configuration
- Support model-agnostic operation (accept any model ID)

### Type Safety & Validation

- Use Zod schemas for all API boundary validation
- Strict TypeScript types with no `any` usage
- Runtime validation of API responses
- Comprehensive error type definitions

### API Request/Response Structure

#### Request Format

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "messages": [{ "role": "user", "content": "Hello, world" }]
}
```

#### Response Format (Non-streaming)

```json
{
  "id": "msg_013Zva2CMHLNnXjNJJKqJ2EF",
  "model": "claude-sonnet-4-20250514",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hi My name is Claude."
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 2095,
    "output_tokens": 503
  },
  "type": "message"
}
```

#### Streaming Response

- Uses Server-Sent Events (SSE) format
- Each SSE data event contains JSON structure with message deltas
- Final event marks completion

### Prompt Caching Support

- Implement Anthropic's session-scoped prompt caching capabilities where available
- Support provider-native cache markers within current session
- Handle cache reuse logic for the current conversation
- Note: Persistent cross-session caching will be addressed in Phase 10 with shared KV store

### Streaming Architecture

- Non-blocking streaming implementation with proper backpressure handling
- Support for streaming interruption during tool calls
- Delta buffering and partial response handling using existing SSE parsing helpers
- Clean stream termination and resource cleanup

## Dependencies

### Internal Dependencies

- `ProviderPlugin` interface from core providers
- `HttpTransport` from core transport
- `Message`, `ContentPart`, and other core message types
- `ToolDefinition` and tool execution pipeline
- Error classes from core errors module
- Existing SSE parsing utilities (e.g., `parseSSEChunk`)

### External Dependencies

- Zod for schema validation
- Built-in Node.js HTTP/streaming capabilities
- No additional external dependencies (following project constraints)

### Prerequisites

- Update Anthropic entries in `src/data/defaultLlmModels.ts` to use `providerPlugin: "anthropic-2023-06-01"` (can be tracked as separate task if needed)

## Implementation Guidance

### File Structure

```
src/providers/anthropic-2023-06-01/
├── index.ts                    # Main exports
├── anthropicMessagesV1Provider.ts  # Provider class
├── configSchema.ts            # Configuration schema
├── translator.ts              # Request translation
├── responseParser.ts          # Non-streaming response parsing
├── streamingParser.ts         # Streaming response parsing
├── toolTranslator.ts          # Tool definition translation
├── errorNormalizer.ts         # Error mapping
├── requestSchema.ts           # API request validation
├── responseSchema.ts          # API response validation
└── __tests__/                 # Test suite
```

### Development Approach

1. **Start with Configuration**: Define and validate provider config schema
2. **Implement Core Translation**: Build request/response translation logic
3. **Add Streaming Support**: Implement SSE parsing and delta processing using existing patterns
4. **Integrate Tool System**: Add tool definition translation and execution
5. **Error Handling**: Implement comprehensive error normalization
6. **Testing & Validation**: Add comprehensive test coverage

### Integration Pattern

- Register with provider registry: `client.registerProvider(plugin)` or `providerRegistry.register(plugin)`
- Configure in bridge config with provider ID "anthropic"
- Route models via `providerPlugin: "anthropic-2023-06-01"` in model definitions
- Provider plugin exports: `id: "anthropic"`, `version: "2023-06-01"`

## Testing Strategy

### Test Categories

1. **Unit Tests**: Individual module testing with mocks
2. **Integration Tests**: Provider integration with core Bridge components
3. **Contract Tests**: API compatibility verification with recorded fixtures
4. **Streaming Tests**: Real-time streaming behavior validation (avoid timing-sensitive assertions)
5. **Error Tests**: Comprehensive error scenario coverage

### Test Data Requirements

- Recorded API request/response fixtures for various scenarios
- Mock streaming responses with different delta patterns
- Tool calling examples with complex schemas
- Error response examples for different failure modes
- Multi-modal content examples (text, images, documents)

### Quality Gates

- All tests pass with `npm test`
- Code quality passes with `npm run quality`
- Coverage meets or exceeds 90% threshold (goal)
- No TypeScript errors or `any` types
- Provider successfully registers and handles requests in integration tests

## Security Considerations

### Authentication & Authorization

- Secure API key storage and transmission
- Proper header management for Anthropic authentication (`x-api-key`, `anthropic-version`, `anthropic-beta`)
- No API keys in logs or error messages

### Data Protection

- Request/response redaction for sensitive data
- Proper handling of user content and system instructions
- Secure temporary file handling for documents
- Memory cleanup for streaming responses

### Input Validation

- Comprehensive request validation before API calls
- Response validation to prevent injection attacks
- File type and size validation for uploads
- Schema validation for all tool definitions and parameters

This comprehensive feature provides all necessary components to implement Anthropic Messages API support as specified in Phase 6 of the implementation plan, enabling seamless integration with Claude models while maintaining the high-quality standards and architectural patterns of the LLM Bridge library.
