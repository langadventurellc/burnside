---
id: T-implement-googlegeminiv1provid
title: Implement GoogleGeminiV1Provider class and core integration
status: open
priority: high
parent: F-google-gemini-v1-provider
prerequisites:
  - T-implement-request-translator-1
  - T-implement-streaming-response-1
  - T-implement-error-normalization
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T03:30:13.073Z
updated: 2025-09-17T03:30:13.073Z
---

# Implement GoogleGeminiV1Provider Class and Core Integration

## Context

This task implements the main provider class that brings together all the individual components (translator, parsers, error handling) into a cohesive ProviderPlugin implementation. This is the central integration point that implements the ProviderPlugin interface and orchestrates all provider functionality.

**Related Feature**: F-google-gemini-v1-provider - Google Gemini v1 Provider Implementation
**Reference Implementation**: `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts`

## Implementation Requirements

### 1. Create Provider Class

Create `src/providers/google-gemini-v1/googleGeminiV1Provider.ts` with:

- GoogleGeminiV1Provider class implementing ProviderPlugin interface
- All required interface methods: initialize, translateRequest, parseResponse, isTerminal, normalizeError
- Configuration management and validation
- Model support detection for all 5 Gemini models
- Provider metadata and capabilities

### 2. Interface Implementation

- `initialize(config)` - validate and store provider configuration
- `translateRequest(request, modelCapabilities)` - delegate to request translator
- `parseResponse(response, isStreaming)` - delegate to appropriate parser
- `isTerminal(deltaOrResponse)` - detect completion for streaming responses
- `normalizeError(error)` - delegate to error normalizer
- `supportsModel(modelId)` - return true for all Gemini model IDs

### 3. Configuration Management

- Accept and validate GoogleGeminiV1Config during initialization
- Store configuration securely for use in requests
- Validate required fields (apiKey) and optional fields (baseUrl)
- Provide configuration defaults where appropriate
- Handle configuration errors gracefully

### 4. Model Support Detection

- Implement supportsModel() for all 5 target Gemini models
- Model ID pattern matching for Gemini model names
- Return true for: gemini-2.0-flash-lite, gemini-2.5-flash-lite, gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro
- Return false for non-Gemini models
- Handle model ID variations and aliases

### 5. Response Mode Routing

- Route non-streaming requests to parseGeminiResponse()
- Route streaming requests to parseGeminiResponseStream()
- Handle mode detection and appropriate parser selection
- Maintain type safety across both response modes
- Error handling for invalid response modes

## Technical Approach

### Step 1: Study Existing Patterns

- Analyze `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts` for structure
- Analyze `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts` for alternatives
- Follow established provider implementation patterns
- Maintain consistency with existing provider approaches

### Step 2: Implement Provider Class

```typescript
// src/providers/google-gemini-v1/googleGeminiV1Provider.ts
import type { ProviderPlugin } from "../../core/providers/providerPlugin";
import type { ChatRequest } from "../../client/chatRequest";
import type { StreamDelta } from "../../client/streamDelta";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import {
  GoogleGeminiV1ConfigSchema,
  type GoogleGeminiV1Config,
} from "./configSchema";

export class GoogleGeminiV1Provider implements ProviderPlugin {
  readonly id = "google";
  readonly name = "Google Gemini Provider";
  readonly version = "gemini-v1";

  private config?: GoogleGeminiV1Config;

  async initialize(config: Record<string, unknown>): Promise<void> {
    // Implementation here
  }

  // Other interface methods...
}
```

### Step 3: Implement Interface Methods

- Delegate translateRequest to request translator with proper typing
- Route parseResponse based on streaming flag
- Implement isTerminal for stream completion detection
- Wire up error normalization properly

### Step 4: Create Unit Tests

Write comprehensive unit tests in `src/providers/google-gemini-v1/__tests__/googleGeminiV1Provider.test.ts`:

- Test provider initialization with valid/invalid config
- Test model support detection for all target models
- Test request translation integration
- Test response parsing integration (streaming and non-streaming)
- Test error normalization integration
- Test termination detection for streaming responses

## Acceptance Criteria

### Functional Requirements

- ✅ GoogleGeminiV1Provider implements all ProviderPlugin interface methods
- ✅ Provider initializes correctly with valid configuration
- ✅ Model support detection works for all 5 target Gemini models
- ✅ Request translation integrates properly with unified requests
- ✅ Response parsing routes correctly for streaming and non-streaming
- ✅ Error normalization provides consistent error handling

### Interface Implementation Requirements

- ✅ initialize() validates config and stores securely
- ✅ translateRequest() delegates to translator with proper parameters
- ✅ parseResponse() routes to appropriate parser based on streaming flag
- ✅ isTerminal() detects stream completion accurately
- ✅ normalizeError() delegates to error normalizer correctly
- ✅ supportsModel() returns true for all Gemini model IDs

### Configuration Requirements

- ✅ Configuration validation using GoogleGeminiV1ConfigSchema
- ✅ Required apiKey field validation prevents empty values
- ✅ Optional baseUrl field uses appropriate default
- ✅ Configuration errors provide meaningful feedback
- ✅ Secure configuration storage without logging sensitive data

### Model Support Requirements

- ✅ supportsModel() returns true for gemini-2.0-flash-lite
- ✅ supportsModel() returns true for gemini-2.5-flash-lite
- ✅ supportsModel() returns true for gemini-2.0-flash
- ✅ supportsModel() returns true for gemini-2.5-flash
- ✅ supportsModel() returns true for gemini-2.5-pro
- ✅ supportsModel() returns false for non-Gemini models

### Integration Requirements

- ✅ Request translator integration preserves all request data
- ✅ Response parser integration handles both response modes
- ✅ Error normalizer integration provides consistent error types
- ✅ Streaming parser integration yields proper StreamDelta objects
- ✅ Tool translator integration enables function calling

### Technical Requirements

- ✅ Class follows ProviderPlugin interface exactly
- ✅ Proper error handling with meaningful error messages
- ✅ Type safety with no 'any' types
- ✅ Performance optimized for typical use cases
- ✅ Memory efficient with proper resource management

### Testing Requirements

- ✅ Unit tests cover all interface method implementations
- ✅ Tests verify configuration validation and storage
- ✅ Tests check model support detection accuracy
- ✅ Tests validate integration with all component modules
- ✅ Tests verify error handling and edge cases
- ✅ Test coverage meets project standards (>90%)
- ✅ All tests pass with zero TypeScript errors

### Code Quality

- ✅ Module stays under 400 logical LOC limit
- ✅ Single responsibility: provider integration only
- ✅ No 'any' types - all properly typed
- ✅ Follows project linting and formatting standards
- ✅ Clear documentation and examples in code comments

## Files to Create/Modify

- Create: `src/providers/google-gemini-v1/googleGeminiV1Provider.ts`
- Create: `src/providers/google-gemini-v1/__tests__/googleGeminiV1Provider.test.ts`

## Dependencies

- Requires: T-implement-request-translator-1 (request translation)
- Requires: T-implement-streaming-response-1 (streaming parser)
- Requires: T-implement-error-normalization (error handling)
- Requires: All schema and configuration tasks
- Blocks: Provider registration and integration tests

## Out of Scope

- Provider registration in main registry (handled by index/registration task)
- End-to-end integration testing (handled by integration test task)
- Documentation and examples (handled by documentation task)
- Performance optimization beyond basic efficiency (handled by separate optimization task if needed)
