---
id: F-google-gemini-v1-provider
title: Google Gemini v1 Provider Implementation
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/providers/google-gemini-v1/configSchema.ts: Created configuration schema
    with Zod validation for Google Gemini v1 provider. Includes required apiKey
    validation, optional baseUrl with HTTPS enforcement and default to Google's
    API endpoint, timeout and maxRetries validation with reasonable bounds,
    comprehensive JSDoc documentation, and exported TypeScript interface using
    Zod inference.
  src/providers/google-gemini-v1/__tests__/configSchema.test.ts:
    Created comprehensive unit test suite with 26 tests covering valid
    configurations, invalid API key validation, HTTPS enforcement for baseUrl,
    timeout and maxRetries validation, type inference and defaults, and security
    edge cases. Tests ensure proper validation behavior and error messages for
    all scenarios.
  src/providers/google-gemini-v1/requestSchema.ts: Created comprehensive Zod
    schema for Google Gemini API v1 request validation with support for contents
    array (user/model roles), multimodal content parts (text and inline_data),
    function calling tools with declarations, generation config (temperature,
    tokens, topK/topP), safety settings with categories and thresholds, and
    system instructions. Includes proper validation constraints, error messages,
    and TypeScript type inference.
  src/providers/google-gemini-v1/responseSchema.ts: Created comprehensive Zod
    schema for Google Gemini API v1 response validation supporting candidates
    array with content parts, function calls, finish reasons, safety ratings,
    citation metadata with sources, usage metadata for token counting, prompt
    feedback, and both streaming and non-streaming response formats. Includes
    proper enum validation and optional field handling.
  src/providers/google-gemini-v1/__tests__/requestSchema.test.ts:
    Created comprehensive unit test suite with 31 tests covering valid requests
    (minimal, full parameter, multimodal, conversation, function calling),
    invalid requests (missing/empty contents, invalid roles, out-of-range
    parameters), boundary cases (edge values), and type inference verification.
    Tests ensure proper Zod validation behavior and error messages.
  src/providers/google-gemini-v1/__tests__/responseSchema.test.ts:
    Created comprehensive unit test suite with 26 tests covering valid responses
    (minimal, metadata, function calling, safety filtering), invalid responses
    (negative tokens, malformed data), boundary cases (zero/large values,
    optional fields), streaming response validation, and type inference
    verification. Tests ensure proper schema validation for all response
    scenarios.
  src/providers/google-gemini-v1/translator.ts: Created comprehensive request
    translator with translateChatRequest function that converts unified
    ChatRequest to Gemini API format. Implements message role mapping, content
    part translation for text/images/documents/code, system message extraction
    and merging, generation config handling, proper endpoint URL construction
    for streaming/non-streaming, and authentication header preparation. Includes
    robust error handling with ValidationError wrapping and comprehensive input
    validation.
  src/providers/google-gemini-v1/__tests__/translator.test.ts:
    Created comprehensive unit test suite with 37 tests covering all translation
    scenarios including successful translation, system message handling,
    endpoint URL construction, header construction, request validation, error
    handling, and edge cases. Tests verify proper role mapping, content part
    translation, generation config inclusion, streaming vs non-streaming
    behavior, and comprehensive error scenarios with 100% pass rate.
  src/providers/google-gemini-v1/toolTranslator.ts: Created comprehensive tool
    definition translator with translateToolDefinitions() and
    parseFunctionCall() functions. Implements Zod-to-JSON Schema conversion for
    all major schema types (string, number, boolean, object, array, enum,
    optional, default, literal). Supports Gemini provider hints with
    'hints.gemini.function' override capability. Includes robust error handling
    with ValidationError wrapping and proper TypeScript typing throughout.
  src/providers/google-gemini-v1/__tests__/toolTranslator.test.ts:
    "Created comprehensive unit test suite with 28 tests covering all
    translation scenarios: basic schema conversion, complex nested objects,
    provider hints, JSON Schema input handling, edge cases, error conditions,
    function call parsing, and integration tests. Tests verify proper schema
    conversion accuracy, hint override behavior, error handling, and round-trip
    conversion consistency."
  src/providers/google-gemini-v1/responseParser.ts:
    Created comprehensive response
    parser with parseGeminiResponse() main function and helper functions for
    extracting content parts, source references, tool calls, usage metadata, and
    response metadata. Handles text content, function calls, citations, and
    error scenarios with proper TypeScript typing.
  src/providers/google-gemini-v1/__tests__/responseParser.test.ts:
    Created comprehensive unit test suite with 20+ test cases covering all
    parsing scenarios including successful responses, function call parsing,
    citation processing, usage metadata extraction, error handling, and edge
    cases. All tests passing with full coverage.
log: []
schema: v1.0
childrenIds:
  - T-create-api-response-fixtures
  - T-create-provider-exports-and
  - T-implement-error-normalization
  - T-implement-googlegeminiv1provid
  - T-implement-non-streaming-1
  - T-implement-streaming-response-1
  - T-create-gemini-api-request-and
  - T-create-provider-configuration-1
  - T-implement-request-translator-1
  - T-implement-tool-definition-1
created: 2025-09-17T03:05:49.808Z
updated: 2025-09-17T03:05:49.808Z
---

# Google Gemini v1 Provider Implementation

## Purpose and Functionality

Implement a complete Google Gemini v1 provider plugin that enables the LLM Bridge library to interact with Google's Gemini 2.0/2.5 models through their REST API. This provider will support chat completions, streaming responses, function calling, citation/grounding capabilities, and multimodal content processing (text, images, documents) for all 5 Gemini models defined in the default model registry.

## Key Components to Implement

### 1. Provider Plugin Infrastructure

- **GoogleGeminiV1Provider class** implementing the `ProviderPlugin` interface
- **Configuration schema** with Zod validation for API key and base URL
- **Provider registration** in the main provider registry
- **Model routing** for all 5 target Gemini models via `providerPlugin: "google-gemini-v1"`

### 2. Request Translation System

- **Message translation** from unified `Message[]` to Gemini `contents` format
- **Content part mapping** supporting text, images, and documents
- **Tool definition translation** from Zod schemas to Gemini function declarations
- **Request formatting** with proper headers and endpoint URLs

### 3. Response Processing System

- **Non-streaming response parser** for complete chat responses
- **Streaming response parser** with Google's streaming format handling and delta accumulation
- **Citation/grounding handler** mapping Gemini metadata to unified `SourceRef[]`
- **Function call parser** extracting tool invocations from responses

### 4. Error Handling and Normalization

- **HTTP status code mapping** to appropriate `BridgeError` types
- **Gemini-specific error parsing** from API error responses
- **Error context preservation** with provider-specific details
- **Retry and rate limit handling** following Gemini API guidelines

### 5. Multimodal Content Support

- **Image processing** with base64 encoding and MIME type handling
- **Document support** for various file formats
- **Content type validation** against model capabilities

## Target Models Support

Support all 5 Gemini models defined in `src/data/defaultLlmModels.ts`:

- `gemini-2.0-flash-lite` - Optimized for speed, supports text/image/document
- `gemini-2.5-flash-lite` - Enhanced efficiency, supports text/image/document
- `gemini-2.0-flash` - Full featured, supports text/image/document
- `gemini-2.5-flash` - Latest optimized, supports text/image/document
- `gemini-2.5-pro` - Flagship model, supports text/image/document

All models support streaming, tool calls, images, and documents with 1M token context windows.

## Detailed Acceptance Criteria

### Functional Requirements

#### 1. Provider Registration and Configuration

- ✅ GoogleGeminiV1Provider class implements all ProviderPlugin interface methods
- ✅ Provider exports correctly following pattern in `src/providers/index.ts`
- ✅ Configuration schema validates required fields: apiKey, optional baseUrl
- ✅ All 5 Gemini models route correctly to google-gemini-v1 provider plugin
- ✅ supportsModel() returns true for all Gemini model IDs

#### 2. Request Translation

- ✅ translateRequest() converts unified ChatRequest to Gemini API format
- ✅ Message roles map correctly: "user"→"user", "assistant"→"model"
- ✅ Content parts translate: text, image (inline_data), document
- ✅ Tool definitions convert from Zod schemas to Gemini function declarations
- ✅ Request includes proper authentication headers (x-goog-api-key)
- ✅ Endpoint URLs construct correctly for each model ID

#### 3. Response Processing

- ✅ parseResponse() handles both streaming and non-streaming modes correctly
- ✅ Non-streaming returns complete Message with content, usage, and metadata
- ✅ Streaming yields StreamDelta objects with incremental content
- ✅ Citation metadata maps to unified SourceRef[] format
- ✅ Function calls extract correctly with name, arguments, and execution context
- ✅ Response metadata preserves model information and token usage

#### 4. Streaming Implementation

- ✅ Streaming parser handles Google's streaming format (SSE or chunked JSON) with robust chunk framing and delta assembly
- ✅ Delta accumulation builds complete messages from streaming chunks
- ✅ isTerminal() correctly detects stream completion
- ✅ Provider emits tool-call deltas; agent loop handles pause/execute/resume
- ✅ Stream cancellation works properly with AbortSignal

#### 5. Error Handling

- ✅ normalizeError() maps HTTP status codes to appropriate BridgeError types
- ✅ 400 errors → ValidationError with detailed context
- ✅ 401/403 errors → AuthError with authentication guidance
- ✅ 429 errors → RateLimitError with retry information
- ✅ 500+ errors → ProviderError with service status details
- ✅ Network errors → TransportError with connectivity context

#### 6. Tool Integration

- ✅ Tool definitions translate to Gemini function declaration format
- ✅ Function calls parse from response with correct name/arguments
- ✅ Tool execution integrates with unified tool system
- ✅ Tool results format correctly for conversation continuation
- ✅ Multiple tool calls in single response handle properly

#### 7. Multimodal Content

- ✅ Image content encodes as base64 with proper MIME types
- ✅ Document processing supports common formats (PDF, text, etc.)
- ✅ Content validation ensures compatibility with model limits
- ✅ File size and format restrictions enforced appropriately

### Technical Requirements

#### 1. Code Structure and Organization

- ✅ Provider follows established pattern from openai-responses-v1/anthropic providers
- ✅ All modules stay under 400 logical LOC limit
- ✅ Single domain concept per module with clear responsibilities
- ✅ No 'any' types - all interfaces properly typed with Zod validation
- ✅ Exports limited to necessary public interfaces via index.ts

#### 2. Schema Validation

- ✅ Configuration schema with proper Zod validation
- ✅ Request schema validates Gemini API format
- ✅ Response schema validates expected Gemini response structure
- ✅ Tool schema handles function declaration conversion
- ✅ Error schema normalizes Gemini error responses

#### 3. Testing Coverage

- ✅ Contract tests with recorded Gemini API fixtures
- ✅ Unit tests for all translation and parsing functions
- ✅ Streaming behavior tests with mock responses
- ✅ Error handling tests for all error scenarios
- ✅ Tool integration tests with function call examples
- ✅ Citation/grounding tests with metadata preservation

#### 4. Integration Points

- ✅ Provider registers correctly in main provider registry
- ✅ BridgeClient routes requests to Gemini provider based on model configuration
- ✅ Model capabilities align with defined feature support
- ✅ Transport layer integration for HTTP requests and streaming
- ✅ Error normalization integrates with global error handling

### Performance Requirements

#### 1. Response Times

- ✅ Request translation completes efficiently for typical requests
- ✅ Response parsing handles large responses appropriately
- ✅ Streaming chunk processing maintains reasonable latency
- ✅ Error normalization adds minimal overhead

#### 2. Memory Usage

- ✅ Streaming responses process incrementally without buffering entire response
- ✅ Large multimodal content handles efficiently with proper chunking
- ✅ Provider instance maintains minimal memory footprint
- ✅ No memory leaks in streaming or error handling paths

## Implementation Guidance

### Technical Approach

#### 1. Follow Established Patterns

- Use `openai-responses-v1` provider as primary template for structure
- Adopt similar module organization: translator, responseParser, streamingParser, etc.
- Follow same testing patterns with fixtures and contract tests
- Maintain consistent error handling and normalization approaches

#### 2. Gemini API Specifics

- Use base URL: `https://generativelanguage.googleapis.com/v1beta/models/`
- Authenticate with `x-goog-api-key` header
- Handle both `:generateContent` and `:streamGenerateContent` endpoints
- Process streaming responses with proper chunk buffering and parsing

#### 3. Content Translation Strategy

- Map unified ContentPart types to Gemini parts format
- Handle `inline_data` structure for binary content (images, documents)
- Preserve MIME types and encoding for multimodal content
- Support provider-specific content hints and formatting

#### 4. Function Calling Implementation

- Convert Zod schemas to JSON Schema format for Gemini functions
- Handle `NON-BLOCKING` behavior for async tool execution
- Parse function_call responses with proper argument extraction
- Integrate tool results back into conversation flow

#### 5. Citation and Grounding

- Map `citation_metadata` and `url_context_metadata` to SourceRef[]
- Preserve source attribution across streaming chunks
- Handle relevance scoring and snippet extraction
- Maintain citation links throughout response processing

### File Structure

```
src/providers/google-gemini-v1/
├── index.ts                    # Main exports
├── googleGeminiV1Provider.ts   # Core provider implementation
├── configSchema.ts             # Configuration validation
├── translator.ts               # Request translation
├── responseParser.ts           # Non-streaming response parsing
├── streamingParser.ts          # Streaming parser
├── toolTranslator.ts           # Function calling translation
├── errorNormalizer.ts          # Error mapping
├── requestSchema.ts            # Request validation
├── responseSchema.ts           # Response validation
└── __tests__/                  # Test files
    ├── fixtures/               # API response fixtures
    ├── integration.test.ts     # E2E tests
    ├── translator.test.ts      # Translation tests
    ├── responseParser.test.ts  # Parsing tests
    ├── streamingParser.test.ts # Streaming tests
    ├── toolTranslator.test.ts  # Tool tests
    └── errorNormalizer.test.ts # Error tests
```

## Testing Requirements

### 1. Contract Tests

- Record actual Gemini API responses for all 5 supported models
- Test both streaming and non-streaming response formats
- Include function calling examples with tool execution
- Cover citation/grounding scenarios with metadata
- Test error responses for various failure modes

### 2. Unit Tests

- All translation functions with input/output validation
- Response parsing with various content types
- Streaming parser with chunked and complete responses
- Error normalization with comprehensive error scenarios
- Tool translation with complex schema examples

### 3. Integration Tests

- End-to-end request/response cycles with mock transport
- Provider registration and model routing verification
- BridgeClient integration with Gemini provider
- Error propagation through full request lifecycle
- Streaming behavior with cancellation and interruption

## Security Considerations

### Input Validation

- Validate all request parameters through Zod schemas
- Sanitize multimodal content inputs
- Enforce content size limits
- Validate tool definitions and arguments

### Authentication and Authorization

- Secure API key storage and transmission
- Request signature validation where applicable
- Rate limiting integration
- Access control for tool execution

### Data Protection

- Avoid logging sensitive request/response content
- Implement response redaction for security
- Secure handling of multimodal binary data
- Protection of citation source information

## Dependencies

### Internal Dependencies

- Core provider plugin interface and registry
- Unified message and content type definitions
- Transport layer for HTTP requests and streaming
- Error taxonomy and normalization system
- Tool system integration

### External Dependencies

- Zod for schema validation
- HTTP client capabilities for streaming
- JSON parsing for response processing
- Base64 encoding/decoding for multimodal content

## Success Metrics

### Functional Completeness

- All 5 Gemini models accessible through unified interface
- Complete feature parity with OpenAI and Anthropic providers for supported content types
- Text, image, and document content support
- Robust function calling integration
- Citation preservation and attribution

### Quality Metrics

- 100% test coverage for core functionality
- Zero TypeScript errors or warnings
- All linting and formatting checks pass
- Integration with existing BridgeClient
- Documentation and examples complete
