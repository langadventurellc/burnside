---
id: F-openai-v1-provider-implementat
title: OpenAI Responses v1 Provider Implementation
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/providers/openai-responses-v1/configSchema.ts:
    Created OpenAI configuration
    Zod schema with API key validation and optional settings
  src/providers/openai-responses-v1/requestSchema.ts: Created comprehensive
    request schema for OpenAI API with message, parameter, and content type
    validation
  src/providers/openai-responses-v1/models.ts: Implemented model capabilities
    mapping for GPT-4o and GPT-5 with streaming and content type support
  src/providers/openai-responses-v1/index.ts:
    Main provider plugin implementation
    with ProviderPlugin interface and placeholder methods; Updated
    translateRequest method to use real translator implementation instead of
    placeholder, added proper error handling for uninitialized provider; Updated
    parseResponse method to note interface limitation requiring async body
    reading for non-streaming responses; Implemented async parseResponse method
    with ReadableStream body reading, added private readResponseBody method with
    proper stream handling and error management; Updated parseResponse method to
    use streaming parser instead of throwing NOT_IMPLEMENTED error for streaming
    responses; Updated normalizeError method to use actual error normalizer
    implementation instead of placeholder, added import for normalizeOpenAIError
    function and ProviderError class; Implemented isTerminal method with proper
    type discrimination between StreamDelta and UnifiedResponse, checking
    finished flag and response.completed event type; Created proper module
    export structure with named and default exports for OpenAI provider and
    configuration types
  src/providers/openai-responses-v1/__tests__/configSchema.test.ts: Comprehensive unit tests for configuration schema validation
  src/providers/openai-responses-v1/__tests__/requestSchema.test.ts: Unit tests for request schema with valid/invalid cases and edge conditions
  src/providers/openai-responses-v1/__tests__/models.test.ts: Unit tests for model capabilities and metadata functions
  src/providers/openai-responses-v1/__tests__/index.test.ts:
    Provider plugin tests
    covering initialization, model support, and placeholder implementations;
    Updated existing test to match new parseResponse error message reflecting
    interface limitation; Updated tests to handle new async parseResponse
    behavior, added tests for ValidationError on null response body and
    streaming NOT_IMPLEMENTED behavior; Updated provider tests to verify
    streaming functionality returns AsyncIterable instead of throwing
    NOT_IMPLEMENTED; Updated provider plugin tests to reflect actual error
    normalization implementation instead of NOT_IMPLEMENTED placeholder, added
    tests for HTTP errors, OpenAI API errors, and error normalization failure
    handling; Updated placeholder test to verify actual isTerminal functionality
    instead of expecting NOT_IMPLEMENTED error; Created comprehensive unit tests
    for module exports, provider instantiation, and interface compliance
  src/providers/index.ts: Updated to export OpenAIResponsesV1Provider for
    registration and use; Updated main providers export to use new index file
    structure and added default export for easy registration
  src/providers/openai-responses-v1/translator.ts: Created core request
    translation logic converting unified ChatRequest to OpenAI Responses API v1
    format with proper content part mapping, URL construction, and header
    generation; Fixed translator to always include stream field defaulting to
    false for proper OpenAI API compliance and contract testing
  src/providers/openai-responses-v1/__tests__/translator.test.ts:
    Added comprehensive unit tests covering successful translations, error
    handling, URL construction, header generation, and parameter mapping with 16
    test cases
  src/providers/openai-responses-v1/responseSchema.ts: Created comprehensive Zod
    schemas for OpenAI Responses API v1 validation including content parts,
    choices, usage, and complete response structure
  src/providers/openai-responses-v1/responseParser.ts: Implemented core response
    parsing logic converting OpenAI responses to unified Message format with
    content conversion, usage extraction, and metadata handling
  src/providers/openai-responses-v1/__tests__/responseSchema.test.ts:
    Created 30 comprehensive unit tests validating OpenAI response schema with
    valid/invalid responses and edge cases
  src/providers/openai-responses-v1/__tests__/responseParser.test.ts:
    Created 67 comprehensive unit tests covering successful parsing, error
    handling, content conversion, usage extraction, and metadata handling
  src/core/providers/providerPlugin.ts:
    Updated parseResponse method signature to
    return Promise<ResponseObject> for non-streaming responses, updated JSDoc
    examples to show async/await usage patterns
  src/core/validation/providerSchemas.ts: Enhanced parseResponse validation to
    accept functions returning Promise or AsyncIterable using Zod union type
  src/core/providers/inMemoryProviderRegistry.ts: Updated provider registration
    validation to accept async parseResponse functions
  src/core/providers/__tests__/providerRegistry.test.ts: Updated test mocks to
    return promises using Promise.resolve for async parseResponse behavior
  src/client/__tests__/bridgeClientRegistries.test.ts: Changed jest mocks from
    mockReturnValue to mockResolvedValue for async parseResponse testing
  src/core/validation/__tests__/providerSchemas.test.ts: Updated test functions to async for parseResponse validation compatibility
  src/providers/openai-responses-v1/streamingParser.ts:
    Created comprehensive SSE
    streaming parser with OpenAI semantic event validation schemas, state
    management, and StreamDelta conversion logic
  src/providers/openai-responses-v1/__tests__/streamingParser.test.ts:
    Created 20 comprehensive unit tests covering all event types, error
    conditions, edge cases, and state management scenarios
  src/providers/openai-responses-v1/errorNormalizer.ts: Created comprehensive
    error normalization logic converting OpenAI-specific errors to unified
    BridgeError types with HTTP status code mapping, OpenAI error type
    classification, network error patterns, context preservation, and security
    sanitization
  src/providers/openai-responses-v1/__tests__/errorNormalizer.test.ts:
    Created 79 comprehensive unit tests covering all error normalization
    scenarios including HTTP status codes, OpenAI error types, network errors,
    context preservation, fallback handling, and edge cases
  src/providers/openai-responses-v1/__tests__/termination.test.ts:
    Created comprehensive unit tests covering terminal and non-terminal
    StreamDeltas, UnifiedResponse handling, and edge cases with 17 test
    scenarios
  src/client/bridgeClient.ts: Added public registerProvider() method with proper
    validation and error handling for provider registration; Added
    resolveProviderPlugin method to resolve provider plugin from model
    configuration, added getProviderKeyFromPluginString method with canonical
    mapping from providerPlugin strings to provider registry keys
  src/providers/openai-responses-v1/__tests__/registration.test.ts:
    Created extensive unit tests covering successful registration, validation,
    error handling, provider capabilities, and registry state management;
    Updated test expectations to reflect that model support is determined by
    registry, not hardcoded capabilities
  src/providers/openai-responses-v1/__tests__/fixtures/nonStreamingResponses.ts:
    Created realistic OpenAI API non-streaming response fixtures including
    success, empty content, usage data, content parts, length limits, and
    content filtering scenarios
  src/providers/openai-responses-v1/__tests__/fixtures/streamingEvents.ts:
    Created comprehensive streaming SSE event fixtures including complete
    sequences, partial usage, individual events, malformed events, and long
    sequences for performance testing
  src/providers/openai-responses-v1/__tests__/fixtures/errorResponses.ts:
    Created error response fixtures covering HTTP 401, 429, 400, 500 errors and
    malformed error responses for robust error handling testing
  src/providers/openai-responses-v1/__tests__/fixtures/requestExamples.ts:
    Created request example fixtures with expected OpenAI API translations for
    contract validation, including basic text, streaming, complex parameters,
    and multimodal content
  src/providers/openai-responses-v1/__tests__/fixtures/index.ts:
    Created central export point for all test fixtures providing organized
    access for contract testing and integration validation
  src/providers/openai-responses-v1/__tests__/integration.test.ts:
    Created comprehensive integration tests validating complete request →
    response pipeline using fixtures, covering non-streaming, streaming, error
    handling, request translation, and end-to-end validation; Updated test
    expectations for new supportsModel behavior
  src/providers/openai-responses-v1/__tests__/contractValidation.test.ts:
    Created contract validation tests ensuring fixture data matches real OpenAI
    API response structures and validates API contract compliance
  src/providers/openai-responses-v1/__tests__/e2eStreaming.test.ts:
    Created end-to-end streaming tests specifically for Phase 4 acceptance
    criteria, validating streaming delta accumulation produces correct final
    text
  src/core/models/defaultLlmModelsSchema.ts:
    Enhanced schema validation to include
    providerPlugin and other missing fields (streaming, toolCalls, images,
    documents) as optional fields, updated JSDoc example
  src/core/models/modelLoader.ts:
    Modified mapJsonToModelInfo function to preserve
    providerPlugin field in model metadata using conditional spread operator for
    backward compatibility
  src/providers/openai-responses-v1/openAIResponsesV1Provider.ts:
    Removed import of hardcoded getModelCapabilities function, simplified
    supportsModel method to return true for all models since support is now
    determined by model registry
  src/providers/openai-responses-v1/__tests__/openAIResponsesV1Provider.test.ts:
    Updated test expectations to reflect new behavior where supportsModel
    returns true for all models
log:
  - "Auto-completed: All child tasks are complete"
  - "Auto-completed: All child tasks are complete"
schema: v1.0
childrenIds:
  - T-create-openai-responses-v1
  - T-create-test-fixtures-and
  - T-fix-model-configuration
  - T-implement-error-normalizer
  - T-implement-request-translator
  - T-implement-response-parser-for
  - T-implement-sse-streaming
  - T-implement-termination
  - T-register-openai-responses-v1
  - T-update-providerplugin
created: 2025-09-15T19:04:11.147Z
updated: 2025-09-15T19:04:11.147Z
---

# OpenAI Responses v1 Provider Implementation

Implement the first vertical slice provider plugin for OpenAI's Responses API v1 to enable end-to-end chat and streaming functionality in the LLM Bridge library.

## Purpose and Functionality

This feature implements the OpenAI Responses v1 provider plugin as defined in Phase 4 of the implementation plan, providing:

- Request translation from unified ChatRequest format to OpenAI Responses API v1 format
- Streaming response parser that converts OpenAI semantic SSE events to unified StreamDelta format
- Error normalization mapping OpenAI-specific errors to BridgeError instances
- Termination detection for streaming responses
- Full integration with BridgeClient.chat() and BridgeClient.stream() methods

## Key Components to Implement

### 1. Provider Plugin Structure (`src/providers/openai-responses-v1/`)

- **index.ts** - Main provider plugin export implementing ProviderPlugin interface
- **schema.ts** - Zod schemas for OpenAI Responses v1 configuration and API request/response types
- **translator.ts** - Request translation from unified format to OpenAI Responses API payloads
- **responseParser.ts** - Response parsing from OpenAI Responses format back to unified format
- **streamingParser.ts** - Semantic SSE event parsing for streaming responses using existing SseParser infrastructure
- **errorNormalizer.ts** - Error mapping from OpenAI errors to BridgeError types
- **models.ts** - OpenAI model capabilities and metadata

### 2. Provider Registration

- Register the openai-responses-v1 provider in the main providers index
- Integration with existing ProviderRegistry system using ("openai", "responses-v1") key

### 3. Contract Tests (`src/providers/openai-responses-v1/__tests__/`)

- **fixtures/** - Recorded OpenAI Responses API response fixtures for deterministic testing
- **integration.test.ts** - End-to-end tests proving chat and streaming work
- **translator.test.ts** - Unit tests for request translation logic
- **responseParser.test.ts** - Unit tests for response parsing logic
- **streamingParser.test.ts** - Unit tests for semantic SSE event parsing
- **errorNormalizer.test.ts** - Unit tests for error normalization

## Detailed Acceptance Criteria

### Functional Behavior

- **Non-streaming chat**: Successfully translate ChatRequest → OpenAI Responses API call → unified response
- **Streaming chat**: Successfully handle semantic SSE events → StreamDelta → final message reconstruction
- **Model support**: Operate model-agnostically; verify with 1-2 representative models from defaultLlmModels.ts
- **Error handling**: Normalize OpenAI API errors (rate limits, auth, validation) to appropriate BridgeError types
- **Request validation**: Validate outgoing requests match OpenAI Responses API v1 specification
- **Response validation**: Parse OpenAI Responses correctly including usage metadata

### User Interface Requirements

- Integrate seamlessly with existing BridgeClient.chat() and BridgeClient.stream() methods
- No changes required to public API surface - internal implementation only
- Configuration follows existing provider config pattern with apiKey, baseUrl, etc.

### Data Validation and Error Handling

- **Request validation**: Ensure all outgoing requests have required fields per Responses API v1
- **Response validation**: Validate OpenAI response structure before parsing
- **Error normalization**: Map OpenAI error codes to appropriate BridgeError types:
  - 401 → AuthError
  - 429 → RateLimitError
  - 400 → ValidationError
  - 500+ → ProviderError
- **Streaming error handling**: Handle malformed SSE events gracefully using existing SseParser
- **Network timeouts**: Proper timeout handling with TimeoutError

### Integration Points

- **ProviderRegistry**: Register with existing registry system using ("openai", "responses-v1") key per established `id:version` convention
- **Transport layer**: Use existing HttpTransport for HTTP requests
- **Streaming infrastructure**: Leverage existing SseParser class from `src/core/streaming/sseParser.ts`
- **Error system**: Integrate with existing error taxonomy and normalization

### Performance Requirements (Goals)

- Streaming latency: Aim for minimal event processing delay
- Memory efficiency: Streaming should not buffer entire response in memory
- Request overhead: Keep translation overhead minimal

### Security Considerations (Goals)

- API key handling: Secure handling of OpenAI API keys through configuration
- Request redaction: Ensure sensitive data is redacted in logs/error messages
- Input validation: Validate all inputs to prevent injection attacks

## Implementation Guidance

### Technical Approach

- Follow existing codebase patterns in `src/core/providers/` for consistency
- Use Zod schemas for all validation and type safety
- Implement ProviderPlugin interface defined in `src/core/providers/providerPlugin.ts`
- Leverage existing SseParser class and HttpTransport infrastructure
- Follow single-concept file ownership (≤400 LOC per file)

### API Integration Patterns

- Use OpenAI Responses API v1 endpoint: `POST /v1/responses`
- Handle both `stream=false` and `stream=true` modes per Responses API semantics
- Support Responses API parameters: `model`, `input` (array of messages), `stream`
- Parse OpenAI Responses format with appropriate fields for this API version

### Streaming Event Handling

**Key SSE Event Types to Handle:**

- `response.created` - Response lifecycle started
- `response.output_text.delta` - Incremental text content chunks
- `response.completed` - Response finished successfully
- `error` - Error occurred during generation

**Termination Detection:**

- Stream completion is indicated by `response.completed` event (not `[DONE]` sentinel)
- Error termination is indicated by `error` event
- Use existing SseParser for robust event parsing and buffering

**Event Processing:**

- Each event has a `type` field indicating the semantic event type
- Events are typed instances with predefined schemas
- Convert semantic events to unified StreamDelta format
- Handle multiple event types per response appropriately

### SSE Infrastructure Dependencies

**Available Core Infrastructure:**

- `SseParser` class from `src/core/streaming/sseParser.ts` - Handles SSE field parsing, buffering, and event extraction
- `parseSSEChunk` utility from `src/core/providers/parseSSEChunk.ts` - Simple chunk-to-JSON parsing helper
- Provider should use SseParser for robust event processing rather than parseSSEChunk

**Implementation Strategy:**

- Import and use existing SseParser for event stream processing
- Map OpenAI semantic events to unified StreamDelta format in streamingParser.ts
- Handle event-specific logic (text deltas, completion detection) in responseParser.ts

### Testing Requirements

- **Contract tests**: Use minimal recorded fixtures to ensure API compatibility
- **Unit tests**: Test each component in isolation with mocked dependencies
- **Integration tests**: Prove end-to-end functionality through BridgeClient
- **Error testing**: Verify error conditions are properly handled
- **Streaming tests**: Test SSE event parsing with representative semantic event patterns

### Error Handling Strategy

- Use existing error normalization infrastructure from `src/core/errors/`
- Create OpenAI-specific error normalizer following existing patterns
- Ensure OpenAI error responses are mapped to appropriate BridgeError subclasses
- Handle malformed events gracefully using SseParser error recovery

## Dependencies

- Completion of core provider infrastructure (Phases 0-3)
- Existing ProviderPlugin interface and registry
- HTTP transport and streaming infrastructure (SseParser, HttpTransport)
- Error taxonomy and normalization system
- Zod validation framework

## Testing Strategy

- Create focused test fixtures from OpenAI Responses API responses
- Test both successful and error scenarios with semantic events
- Verify streaming behavior with representative event patterns
- Ensure error normalization covers key OpenAI error codes
- Validate request translation preserves required data

## Success Metrics

- Contract tests pass with recorded OpenAI Responses fixtures
- BridgeClient.chat() works end-to-end with OpenAI models
- BridgeClient.stream() works end-to-end with proper delta emission
- Error handling covers documented OpenAI error conditions
- Code quality passes `npm run quality` checks
- Example test proves E2E streaming deltas accumulate to final text (Phase 4 acceptance criteria)

## Implementation Notes

- This is the first provider implementation, establishing patterns for future providers
- Focus on simplicity and correctness over optimization in this initial implementation
- Ensure good documentation for future provider implementers
- Provider naming follows architecture convention: openai-responses-v1
- Registry key format follows existing pattern: ("openai", "responses-v1")
