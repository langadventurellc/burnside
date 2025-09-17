---
id: F-xai-grok-provider-implementati
title: xAI Grok Provider Implementation
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/providers/xai-v1/configSchema.ts: Created xAI v1 configuration schema with
    Zod validation including API key format validation (xai- prefix), HTTPS
    enforcement, timeout/retry limits, and optional fields (organization,
    project, headers). Exports both Zod schema and TypeScript type with
    comprehensive JSDoc documentation.
  src/providers/xai-v1/__tests__/configSchema.test.ts:
    Created comprehensive unit
    test suite with 39 test cases covering valid configurations, API key
    validation, HTTPS enforcement, timeout/retry validation, optional fields,
    type inference, and security edge cases. Ensures 100% code coverage and
    validates all error messages.
  src/providers/xai-v1/requestSchema.ts:
    Created comprehensive xAI request schema
    with Zod validation supporting all 6 Grok models, OpenAI Responses API
    format with input array, multimodal content (text/image_url), function
    calling, and advanced features like reasoning and search parameters.
    Includes proper TypeScript type inference and JSDoc documentation.
  src/providers/xai-v1/responseSchema.ts: Created main xAI response schema for
    non-streaming responses supporting message and reasoning output types, usage
    metadata with detailed token counts, tool calls, and all optional fields
    like background, metadata, and text formatting. Follows OpenAI Responses API
    structure.
  src/providers/xai-v1/streamingResponseSchema.ts: Created streaming response
    schema for xAI response chunks with delta updates, supporting incremental
    content delivery, tool calls in streaming format, and usage information in
    final chunks. Validates response.chunk object type.
  src/providers/xai-v1/errorResponseSchema.ts:
    Created error response schema with
    validation for error codes, messages, types, and parameters. Includes
    non-empty string validation for required fields and proper nullable handling
    for optional parameters.
  src/providers/xai-v1/__tests__/requestSchema.test.ts:
    Created comprehensive test
    suite with 27 test cases covering valid requests (all models, multimodal
    content, function calling), invalid requests (missing fields, wrong types,
    parameter ranges), and edge cases. Includes TypeScript type inference
    verification.
  src/providers/xai-v1/__tests__/responseSchema.test.ts: Created response schema
    test suite with 20+ test cases covering complete responses with all fields,
    reasoning outputs, mixed output types, invalid responses, edge cases, and
    type inference validation.
  src/providers/xai-v1/__tests__/streamingResponseSchema.test.ts:
    Created streaming response test suite with 18+ test cases covering streaming
    chunks with deltas, tool calls, usage information, invalid chunks, edge
    cases with optional fields, and multi-output scenarios.
  src/providers/xai-v1/__tests__/errorResponseSchema.test.ts: Created error
    response test suite with 15+ test cases covering common error types (rate
    limit, auth, validation), invalid error responses, edge cases with special
    characters, and type inference validation.
  src/providers/xai-v1/translator.ts:
    Created comprehensive xAI request translator
    that converts unified ChatRequest format to xAI Responses API v1 format.
    Includes model ID mapping, message content translation (text/multimodal),
    tool definition conversion, parameter mapping, header construction, and URL
    building with proper error handling and Zod validation.; Extracted tool
    translation functionality to dedicated modules and updated imports to use
    new toolsTranslator
  src/providers/xai-v1/__tests__/translator.test.ts: Created comprehensive unit
    test suite with 34 test cases covering model mapping, message translation
    (text/multimodal), tool translation (JSON Schema/Zod), parameter handling,
    header construction, URL building, error scenarios, and schema validation.
    Includes helper functions for safe body parsing and complete test coverage.;
    Updated existing test expectation to match improved Zod schema conversion
    instead of placeholder behavior
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
  src/providers/xai-v1/streamingParser.ts: Created streaming parser with SSE
    handling, xAI chunk conversion to StreamDelta format, tool call
    accumulation, and comprehensive error handling
  src/providers/xai-v1/__tests__/fixtures/streamingEvents.ts: Created test
    fixtures with realistic xAI streaming response examples for comprehensive
    testing scenarios
  src/providers/xai-v1/__tests__/streamingParser.test.ts: Created comprehensive
    unit test suite with 21 tests covering success cases, error handling, edge
    cases, and performance testing
  src/providers/xai-v1/toolTranslator.ts: Created comprehensive single tool
    translation functionality with proper Zod-to-JSON Schema conversion,
    provider hints support, and validation following OpenAI patterns
  src/providers/xai-v1/toolsTranslator.ts:
    Created array wrapper for multiple tool
    translation with detailed error handling and context for failed conversions
  src/providers/xai-v1/xaiTool.ts: Created XAITool interface type definition
    following OpenAI compatibility format
  src/providers/xai-v1/xaiToolFunction.ts: Created XAIToolFunction interface type definition for tool function structure
  src/providers/xai-v1/__tests__/fixtures/toolExamples.ts: Created comprehensive
    test fixtures with tool definitions and expected xAI formats for testing
  src/providers/xai-v1/__tests__/toolTranslator.test.ts: Created comprehensive
    unit test suite with 22 test cases covering schema conversion, error
    handling, and type validation
  src/providers/xai-v1/__tests__/toolsTranslator.test.ts:
    Created unit test suite
    with 11 test cases covering array translation, error handling, and
    performance testing
  src/providers/xai-v1/errorNormalizer.ts: Created complete xAI error normalizer
    with main normalizeXAIError function, comprehensive error type mapping
    (authentication, rate limit, validation, provider, transport, timeout), HTTP
    status code handling, network error classification, context preservation
    with sanitization, and utility functions for error detection and metadata
    extraction
  src/providers/xai-v1/__tests__/errorNormalizer.test.ts: Created comprehensive
    unit test suite with 48 test cases covering HTTP status mapping, xAI API
    error mapping, network error handling, edge cases, retry information
    extraction, context preservation, and message sanitization with 100% code
    coverage
log: []
schema: v1.0
childrenIds:
  - T-create-xai-error-normalizer
  - T-create-xai-provider-module
  - T-implement-main-xai-provider
  - T-build-xai-request-translator
  - T-build-xai-tool-translator-for
  - T-create-xai-configuration
  - T-create-xai-response-parser
  - T-implement-xai-request-and
  - T-implement-xai-streaming
created: 2025-09-17T19:39:03.829Z
updated: 2025-09-17T19:39:03.829Z
---

# xAI Grok Provider Implementation

## Overview

Implement a complete xAI Grok provider plugin (`xai-v1`) for the LLM Bridge library, enabling support for Grok models (grok-3-mini, grok-3, grok-4-0709) with full streaming, tool calling, and multimodal capabilities. This implementation follows the established provider plugin pattern used by OpenAI, Anthropic, and Google providers.

## Context & Background

The LLM Bridge library uses a provider plugin architecture where each LLM provider is implemented as a separate plugin that translates between the unified bridge interface and provider-specific APIs. xAI's Grok API is largely OpenAI-compatible but has key differences in authentication, endpoints, model names, and error handling.

**xAI API Specifications:**

- Base URL: `https://api.x.ai/v1/`
- Authentication: `Authorization: Bearer xai-<api-key>`
- Models: grok-3-mini, grok-3, grok-4-0709
- OpenAI-compatible request/response format with xAI-specific differences
- Supports streaming via Server-Sent Events (SSE)
- Function/tool calling similar to OpenAI format
- Multimodal support via base64-encoded images in JSON

## Implementation Requirements

### Core Provider Files

Create the complete xAI provider plugin structure at `src/providers/xai-v1/`:

**1. Configuration Schema (`configSchema.ts`)**

- Zod schema for xAI-specific configuration validation
- API key validation (must start with "xai-")
- Base URL defaulting to `https://api.x.ai/v1`
- Optional timeout, headers, and organization settings
- HTTPS enforcement for security

**2. Request Schema (`requestSchema.ts`)**

- Zod validation for xAI API request format
- Model validation for supported Grok models
- Message format validation (OpenAI-compatible)
- Tool/function calling schema
- Stream parameter validation

**3. Response Schema (`responseSchema.ts`)**

- Zod validation for xAI API responses
- Non-streaming response format validation
- Streaming chunk format validation
- Usage information schema
- Tool call response validation

**4. Request Translator (`translator.ts`)**

- Convert unified ChatRequest to xAI API format
- Handle model ID mapping (strip provider prefix)
- Transform message content including multimodal support
- Convert tool definitions to xAI function format
- Apply temperature and other model capability translations

**5. Response Parser (`responseParser.ts`)**

- Parse non-streaming xAI responses to unified format
- Extract message content, usage info, and metadata
- Handle tool call responses
- Error detection and propagation

**6. Streaming Parser (`streamingParser.ts`)**

- Parse Server-Sent Events (SSE) from xAI streaming API
- Convert streaming chunks to unified StreamDelta format
- Handle stream termination detection
- Accumulate streaming tool calls

**7. Error Normalizer (`errorNormalizer.ts`)**

- Map xAI-specific errors to BridgeError types
- Handle rate limiting errors with proper codes
- Authentication and authorization error mapping
- Network and timeout error normalization
- Parse xAI error response format

**8. Tool Translator (`toolTranslator.ts`)**

- Convert unified tool definitions to xAI function format
- Handle tool call parsing from responses
- Format tool results for subsequent requests
- Support both streaming and non-streaming tool calls

**9. Main Provider Class (`xaiV1Provider.ts`)**

- Implement complete ProviderPlugin interface
- Provider metadata (id: "xai", version: "v1")
- Configuration initialization and validation
- Request translation orchestration
- Response parsing coordination
- Error handling integration

**10. Module Exports (`index.ts`)**

- Export provider class and configuration types
- Provider metadata constants
- Utility function exports for advanced usage
- Default export for easy registration

### Provider Registration

Update `src/providers/index.ts` to include the new xAI provider:

```typescript
export { XAIV1Provider, XAI_PROVIDER_INFO } from "./xai-v1/index";
export { default as xaiV1Provider } from "./xai-v1/index";
```

### Comprehensive Testing

Create extensive unit test coverage following existing patterns:

**Unit Tests (13 test files):**

1. `configSchema.test.ts` - Configuration validation edge cases
2. `requestSchema.test.ts` - Request format validation
3. `responseSchema.test.ts` - Response format validation
4. `translator.test.ts` - Request translation logic
5. `responseParser.test.ts` - Response parsing accuracy
6. `streamingParser.test.ts` - Streaming response handling
7. `errorNormalizer.test.ts` - Error mapping completeness
8. `toolTranslator.test.ts` - Function calling translation
9. `xaiV1Provider.test.ts` - Provider integration
10. `index.test.ts` - Module exports validation
11. `registration.test.ts` - Provider registration
12. `termination.test.ts` - Stream termination detection
13. `contractValidation.test.ts` - ProviderPlugin interface compliance

**Test Fixtures:**

- Mock xAI responses for all supported models
- Streaming event sequences
- Error response examples
- Tool calling scenarios
- Multimodal request/response pairs

## Technical Implementation Details

### Authentication & Configuration

```typescript
// API key must start with "xai-" prefix
apiKey: z.string().startsWith("xai-", "API key must start with 'xai-'");
baseUrl: z.string().url().default("https://api.x.ai/v1");
```

### Model Mapping

Map unified model IDs to xAI model names:

- `xai:grok-3-mini` → `grok-3-mini`
- `xai:grok-3` → `grok-3`
- `xai:grok-4-0709` → `grok-4-0709`

### Request Translation Specifics

- Convert image content to base64 data URLs in JSON payload
- Map tool definitions to xAI function format (similar to OpenAI)
- Handle streaming parameter (`stream: true/false`)
- Apply model capabilities (temperature support)

### Response Parsing Specifics

- Parse SSE streaming format identical to OpenAI
- Extract usage tokens from response
- Handle xAI-specific metadata fields
- Detect stream termination (`[DONE]` marker)

### Error Handling Mapping

```typescript
"rate_limit_exceeded" → RateLimitError
"invalid_api_key" → AuthenticationError
"quota_exceeded" → QuotaExceededError
"model_not_found" → ValidationError
"insufficient_permissions" → AuthorizationError
```

## Acceptance Criteria

### Functional Requirements

✅ **Provider Registration**: xAI provider registers successfully in provider registry  
✅ **Configuration Validation**: All configuration schemas validate correctly with appropriate error messages  
✅ **Request Translation**: Unified requests translate accurately to xAI API format  
✅ **Response Parsing**: xAI responses parse correctly to unified format  
✅ **Streaming Support**: Streaming responses work with proper chunk handling and termination  
✅ **Tool Calling**: Function calling works for tool-enabled models  
✅ **Error Handling**: All xAI error types map to appropriate BridgeError instances  
✅ **Model Support**: All configured Grok models (grok-3-mini, grok-3, grok-4-0709) work correctly

### Code Quality Requirements

✅ **Type Safety**: No `any` types, complete TypeScript coverage  
✅ **Validation**: Zod schemas for all request/response boundaries  
✅ **Testing**: 100% unit test coverage for all provider components  
✅ **Documentation**: Comprehensive JSDoc comments for all public interfaces  
✅ **Error Handling**: Proper error propagation with context preservation  
✅ **Performance**: Efficient parsing with minimal overhead

### Integration Requirements

✅ **Provider Plugin Interface**: Full compliance with ProviderPlugin contract  
✅ **Model Registry**: Works with centralized model configuration in defaultLlmModels.ts  
✅ **Transport Layer**: Integrates with existing HTTP transport infrastructure  
✅ **Bridge Client**: Compatible with BridgeClient chat and stream methods

### Security Requirements

✅ **Authentication**: Proper API key validation and header formatting  
✅ **Input Validation**: All user inputs validated through Zod schemas  
✅ **HTTPS Enforcement**: Base URL validation requires HTTPS protocol  
✅ **Error Sanitization**: No sensitive data leaked in error messages

## Implementation Guidance

### Development Approach

1. **Start with OpenAI Template**: Use `openai-responses-v1` as the foundation and modify for xAI specifics
2. **Focus on Differences**: Concentrate on authentication, base URL, models, and error codes
3. **Test-Driven Development**: Write tests alongside implementation
4. **Follow Established Patterns**: Use existing provider patterns for consistency

### Key Files to Reference

- `src/providers/openai-responses-v1/` - Primary template for structure
- `src/providers/google-gemini-v1/` - Advanced configuration patterns
- `src/core/providers/providerPlugin.ts` - Interface requirements
- `src/data/defaultLlmModels.ts` - Model configuration (already includes xAI models)

### Testing Strategy

- Unit test each component in isolation
- Mock all external HTTP calls
- Test error scenarios comprehensively
- Validate schema edge cases
- Ensure streaming termination works correctly

### Performance Considerations

- Efficient JSON parsing for streaming responses
- Minimal memory allocation during streaming
- Fast schema validation paths
- Proper resource cleanup for streams

## Dependencies

- No external dependencies beyond existing project dependencies
- Leverages existing Zod validation framework
- Uses established error handling infrastructure
- Integrates with current transport layer

## Security Considerations

- API key validation prevents invalid authentication
- HTTPS enforcement prevents insecure connections
- Input sanitization through Zod schemas
- Error message sanitization to prevent data leaks
- Proper handling of sensitive configuration data

## Definition of Done

- [ ] All 10 core provider files implemented and tested
- [ ] Provider registration updated in index.ts
- [ ] 13 comprehensive unit test files with full coverage
- [ ] All tests pass including quality gates (lint, format, type-check)
- [ ] Documentation complete with JSDoc comments
- [ ] Provider works with all configured xAI models
- [ ] Streaming and non-streaming requests work correctly
- [ ] Tool calling functionality verified
- [ ] Error handling covers all xAI error types
- [ ] Code follows established patterns and conventions
