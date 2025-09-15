---
id: F-openai-v1-provider-implementat
title: OpenAI Responses v1 Provider Implementation
status: open
priority: medium
parent: none
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
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
