---
id: F-anthropic-messages-api
title: Anthropic Messages API Provider Implementation
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/providers/anthropic-2025-05-14/configSchema.ts: Core configuration schema
    with Zod validation for API key (sk-ant- prefix), base URL (HTTPS-only),
    version (YYYY-MM-DD format), timeout (max 300000ms), and retry limits (0-5)
  src/providers/anthropic-2025-05-14/constants.ts:
    Default configuration constants
    for base URL, API version, timeout, and retry settings
  src/providers/anthropic-2025-05-14/isValidAnthropicApiKey.ts:
    Type guard function for validating Anthropic API key format with sk-ant-
    prefix requirement
  src/providers/anthropic-2025-05-14/validateAnthropicConfig.ts: Configuration validation utility function with comprehensive error handling
  src/providers/anthropic-2025-05-14/index.ts:
    Barrel export file providing clean
    public API surface for the Anthropic provider configuration
  src/providers/anthropic-2025-05-14/__tests__/configSchema.test.ts:
    Comprehensive test suite with 38 tests achieving 100% code coverage across
    all validation scenarios, edge cases, and utility functions
log: []
schema: v1.0
childrenIds:
  - T-create-anthropic-api-request
  - T-create-anthropic-provider-1
  - T-create-anthropic-provider
  - T-create-provider-module
  - T-implement-anthropic-error
  - T-implement-non-streaming
  - T-implement-request-translation
  - T-implement-streaming-response
  - T-implement-tool-definition
  - T-integrate-provider-methods
  - T-update-model-registry-to-use
created: 2025-09-16T13:04:04.085Z
updated: 2025-09-16T13:04:04.085Z
---

# Anthropic Messages API Provider Implementation

Implement a complete provider plugin for Anthropic's Messages API following Phase 6 of the implementation plan. This feature delivers vertical slice B, enabling the LLM Bridge library to work with Claude models including tool calling, streaming, and session-scoped prompt caching capabilities.

## Purpose and Functionality

Create a fully functional `anthropic-2025-05-14` provider plugin that:

- Translates unified Bridge requests to Anthropic Messages API format
- Handles streaming responses with proper delta parsing
- Supports tool calling with Anthropic's native tools format
- Implements session-scoped prompt caching capabilities where available
- Provides comprehensive error normalization
- Maintains compatibility with the existing provider plugin architecture

## Key Components to Implement

### 1. Provider Plugin Structure

- `AnthropicMessagesV1Provider` class implementing `ProviderPlugin` interface with `version: "2025-05-14"`
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

- **Request Translation**: Successfully convert Bridge `ChatRequest` to valid Anthropic Messages API requests with proper headers (`x-api-key`, `anthropic-version: 2025-05-14`, `anthropic-beta` when needed)
- **Response Processing**: Parse Anthropic responses back to unified `Message` format with correct content types, roles, and metadata
- **Streaming Support**: Handle streaming responses with proper delta accumulation and real-time updates
- **Tool Integration**: Execute tool calls seamlessly with proper argument parsing and result integration (when tool system is enabled in config), skip tool execution when disabled
- **Multi-modal Content**: Support text, images, and documents with proper encoding and MIME type handling
- **Conversation Management**: Maintain conversation state and handle multi-turn interactions correctly

### API Compatibility

- **Model Support**: Work with all Claude models (Haiku, Sonnet, Opus variants) as defined in `defaultLlmModels.ts`
- **Version Handling**: Support Anthropic API version 2025-05-14 with appropriate headers
- **Parameter Mapping**: Correctly map temperature, max_tokens, stop sequences, and other parameters
- **Content Types**: Handle all supported content types: text, images (base64), documents (PDF, text files)

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
- **Model Registry**: Work seamlessly with models configured with `providerPlugin: "anthropic-2025-05-14"`
- **Transport Layer**: Integrate with existing `HttpTransport` infrastructure
- **Tool Router**: Coordinate with `ToolRouter` for tool execution workflow when enabled
- **Provider Plugin Mapping**: BridgeClient maps 'anthropic-2025-05-14' to { id: 'anthropic', version: '2025-05-14' } in getProviderKeyFromPluginString

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

- Update Anthropic entries in `src/data/defaultLlmModels.ts` to use `providerPlugin: "anthropic-2025-05-14"` (can be tracked as separate task if needed)

## Implementation Guidance

### File Structure

```
src/providers/anthropic-2025-05-14/
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
- Route models via `providerPlugin: "anthropic-2025-05-14"` in model definitions
- Provider plugin exports: `id: "anthropic"`, `version: "2025-05-14"`

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
