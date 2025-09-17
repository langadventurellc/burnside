---
id: F-google-gemini-end-to-end
title: Google Gemini End-to-End Testing Infrastructure
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/validateApiKey.ts:
    Added Google provider case to switch
    statement with AIza prefix and 39-character length validation
  src/__tests__/e2e/shared/__tests__/validateApiKey.google.test.ts:
    Created comprehensive test suite with 20 test cases covering valid Google
    API keys, invalid formats, edge cases, and backward compatibility
    verification
  src/__tests__/e2e/shared/googleTestConfigInterface.ts: Created interface
    definition with googleApiKey, testEnabled, testModel, and timeout properties
    matching OpenAI/Anthropic patterns
  src/__tests__/e2e/shared/googleTestConfig.ts:
    Implemented loadGoogleTestConfig()
    function with environment validation, API key format checking, and default
    model configuration
  src/__tests__/e2e/shared/getGoogleTestModel.ts: Created getGoogleTestModel()
    helper function for model selection with environment override support
  src/__tests__/e2e/shared/__tests__/googleTestConfig.test.ts:
    Added comprehensive test suite with 12 test cases covering configuration
    loading, error handling, and validation scenarios
  src/__tests__/e2e/shared/__tests__/getGoogleTestModel.test.ts:
    Created test suite with 4 test cases for model selection logic and
    environment variable handling
  src/__tests__/e2e/shared/googleModelHelpers.ts: Created Google test client
    factory function with createGoogleTestClient() that configures BridgeClient
    for Google provider testing, following exact patterns from OpenAI and
    Anthropic helpers
  src/__tests__/e2e/shared/__tests__/googleModelHelpers.test.ts:
    Added comprehensive unit test suite with 7 test cases covering client
    creation, provider registration verification, configuration overrides, error
    handling, and integration testing
  src/__tests__/e2e/setup/globalSetup.ts: Added Google provider detection logic
    and Google API key validation that triggers when test pattern includes
    'google'. Extended isRunningOpenAITests logic to exclude Google tests as
    well as Anthropic tests.
  src/__tests__/e2e/setup/setupEnv.ts: Added Google provider validation to
    validateProviderEnvironment function with else if condition for
    testPath.includes('google'). Includes Google API key presence check and
    format validation using validateApiKey function.
  src/__tests__/e2e/setup/__tests__/globalSetup.test.ts: Added comprehensive
    Google provider test coverage including Google API key validation tests,
    test pattern detection for Google provider, and provider credential
    isolation tests ensuring Google tests don't require other provider
    credentials and vice versa.
  src/__tests__/e2e/google/chat.e2e.test.ts: Created comprehensive Google chat
    completion E2E test suite with 14 test cases mirroring OpenAI/Anthropic
    patterns. Includes parameterized tests across all 5 Google models,
    conversation context handling, response validation, model integration tests,
    and error handling scenarios. Uses Google-specific test helpers and follows
    exact same test structure and validation logic as existing providers.
log: []
schema: v1.0
childrenIds:
  - T-add-google-e2e-npm-script-and
  - T-create-google-chat-completion
  - T-create-google-streaming-e2e
  - T-create-google-tool-execution
  - T-create-google-model-helpers
  - T-create-google-test-configurati
  - T-extend-api-key-validation-for
  - T-update-jest-setup-files-for-1
created: 2025-09-17T06:52:49.815Z
updated: 2025-09-17T06:52:49.815Z
---

# Google Gemini End-to-End Testing Infrastructure

## Overview

Implement end-to-end testing infrastructure for the Google Gemini provider that exactly mirrors the existing OpenAI and Anthropic E2E testing patterns. This feature validates the LLM Bridge library's integration with real Google Gemini APIs, covering chat completion, streaming, and tool execution functionality using the same test structure and patterns as the existing providers.

## Purpose and Functionality

Create E2E testing infrastructure that:

- Replicates the exact OpenAI and Anthropic E2E test patterns for Google Gemini
- Uses the same Jest configuration and npm script patterns
- Maintains provider credential isolation (no breaking changes to existing tests)
- Extends existing shared setup files for Google Gemini validation
- Tests chat completion, streaming, and tool execution with live Google Gemini APIs
- Uses environment variables for configuration and API keys
- Runs independently from unit tests (only when explicitly requested)

## Key Components to Implement

### 1. Google Gemini Test Directory Structure

```
src/__tests__/e2e/google/
├── chat.e2e.test.ts          # Mirror of OpenAI/Anthropic chat tests
├── streaming.e2e.test.ts     # Mirror of OpenAI/Anthropic streaming tests
└── tools.e2e.test.ts         # Mirror of OpenAI/Anthropic tool tests
```

### 2. Environment Setup Extensions

- **Global Setup**: Update `src/__tests__/e2e/setup/globalSetup.ts` to validate `GOOGLE_API_KEY` when running Google tests
- **Per-test Setup**: Update `src/__tests__/e2e/setup/setupEnv.ts` to handle Google environment validation
- **Environment Documentation**: Update `.env.example` to document Google variables alongside existing providers

### 3. Shared Helper Extensions

- **API Key Validation**: Extend existing `validateApiKey.ts` for Google API key format (no standard prefix)
- **Provider-Specific Config**: Add `googleTestConfig.ts` and `googleTestConfigInterface.ts` to avoid coupling with other providers
- **Model Helpers**: Add `googleModelHelpers.ts` with Google provider registration function
- **Test Model Selection**: Add `getGoogleTestModel.ts` for Google model selection logic

### 4. NPM Script Integration

- Add `test:e2e:google` script following the OpenAI/Anthropic pattern
- Use same Jest configuration (`jest.e2e.config.mjs`) with Google path filtering

## Detailed Acceptance Criteria

### Functional Behavior

1. **Test Execution Control**
   - E2E tests MUST NOT run during normal `npm test` execution
   - E2E tests MUST only run when explicitly requested via `npm run test:e2e:google`
   - Tests MUST validate `GOOGLE_API_KEY` and `E2E_TEST_ENABLED` before execution in same setup stages as other providers
   - Tests MUST fail gracefully if API keys are missing or invalid
   - OpenAI and Anthropic tests MUST continue to work without requiring Google credentials

2. **Chat Completion Tests** (Mirror OpenAI/Anthropic chat.e2e.test.ts - 14 test cases)
   - **Basic Chat Functionality**: Parameterized tests across all 5 Google Gemini models:
     - `google:gemini-2.0-flash-lite` - Optimized for speed
     - `google:gemini-2.5-flash-lite` - Enhanced efficiency
     - `google:gemini-2.0-flash` - Full featured
     - `google:gemini-2.5-flash` - Latest optimized
     - `google:gemini-2.5-pro` - Flagship model
   - **Response Validation**: Unified message schema validation, metadata checking, timestamp format
   - **Model Integration**: Default model usage, registry integration verification
   - **Error Handling**: Authentication errors, invalid model requests, malformed requests, network timeouts

3. **Streaming Tests** (Mirror OpenAI/Anthropic streaming.e2e.test.ts - 12 test cases)
   - **Basic Streaming**: Delta collection across all streaming-capable Google models
   - **Delta Accumulation**: Correct assembly of streaming deltas into complete responses
   - **Stream Lifecycle**: Start/end handling, cancellation scenarios
   - **Format Validation**: StreamDelta schema compliance, usage information in final delta

4. **Tool Execution Tests** (Mirror OpenAI/Anthropic tools.e2e.test.ts - 18 test cases)
   - **Tool Registration**: Successful tool registration and validation
   - **Function Calling**: Tool execution across tool-capable Google models
   - **Tool System Integration**: BridgeClient integration, tool result formatting
   - **Tool Error Handling**: Registration errors, execution failures, disabled tool system

### Configuration Requirements

1. **Environment Variables** (Document in `.env.example`)
   - `GOOGLE_API_KEY`: Required Google API key (no standard prefix like `sk-` or `sk-ant-`)
   - `E2E_TEST_ENABLED`: Flag to explicitly enable e2e testing (must be "true")
   - `E2E_GOOGLE_MODEL`: Optional model override (default: "google:gemini-2.5-flash")

2. **Environment Setup Updates**
   - Update `globalSetup.ts` to validate Google credentials when test pattern includes "google"
   - Update `setupEnv.ts` to handle Google-specific validation using provider pattern
   - Keep OpenAI and Anthropic validation working independently without Google dependencies

3. **Model Selection Logic**
   - Default to `google:gemini-2.5-flash` (cost-efficient, full feature support)
   - Use models from existing `defaultLlmModels.ts` seed data
   - Filter models by capabilities (streaming, toolCalls) like existing tests
   - Register custom models if E2E_GOOGLE_MODEL specifies non-seeded model

### Integration Requirements

1. **Provider Credential Isolation**
   - Create `googleTestConfig.ts` function to avoid coupling with `openAITestConfig()` or `anthropicTestConfig()`
   - Maintain separate credential validation paths for all providers
   - Ensure existing tests continue working without Google environment variables

2. **Shared Helper Compatibility**
   - Extend existing `validateApiKey()` with Google provider discrimination
   - Maintain same helper function signatures and return types where possible
   - Follow existing patterns for BridgeClient creation and model registration

3. **Test Pattern Replication**
   - Use exact same test descriptions and structure as OpenAI/Anthropic tests
   - Apply same timeout values (15s for basic, 30s for extended, 45s for streaming)
   - Use same validation helpers (`validateMessageSchema`, `withTimeout`, etc.)
   - Follow same parameterized testing patterns for model coverage

### Performance Requirements

1. **Response Time Validation** (Non-blocking observability)
   - Use same generous timeouts as existing tests to avoid flakiness
   - Monitor but don't gate on response times
   - Use same timeout patterns (15s basic, 30s extended, 45s streaming)

2. **Resource Usage Guidelines**
   - Use minimal test data to reduce API costs
   - Use default Gemini 2.5 Flash model for cost efficiency
   - Follow same request patterns as existing tests

### Security Requirements

1. **API Key Management**
   - Never log or expose API keys in test output
   - Validate Google API key format (no standard prefix, length-based validation)
   - Use environment variables exclusively for sensitive data
   - Fail securely if credentials are missing

2. **Environment Loading**
   - Use same `NODE_OPTIONS="--import=dotenv/config"` pattern as existing providers
   - Extend existing environment validation in globalSetup/setupEnv without breaking other providers

## Implementation Guidance

### Technical Approach

#### 1. **Google Gemini API Specifics**

Based on current Google Gemini API (2025):

- **Base URL**: `https://generativelanguage.googleapis.com/v1beta/models/`
- **Authentication**: Uses `x-goog-api-key` header (not `Authorization: Bearer`)
- **Endpoints**:
  - Sync: `{model}:generateContent`
  - Streaming: `{model}:streamGenerateContent` (Server-Sent Events)
- **Request Format**: Uses `contents` array with `role`/`parts` structure
- **API Key Format**: No standard prefix (unlike `sk-` or `sk-ant-`), validate by length and format

#### 2. **File Creation Pattern**

Follow exact Anthropic implementation pattern:

```
src/__tests__/e2e/google/chat.e2e.test.ts     # Copy OpenAI/Anthropic chat.e2e.test.ts structure
src/__tests__/e2e/google/streaming.e2e.test.ts # Copy OpenAI/Anthropic streaming.e2e.test.ts structure
src/__tests__/e2e/google/tools.e2e.test.ts    # Copy OpenAI/Anthropic tools.e2e.test.ts structure
```

#### 3. **Environment Setup Extensions**

```typescript
// globalSetup.ts - Add Google validation alongside OpenAI/Anthropic
export default async function globalSetup() {
  // Existing OpenAI/Anthropic validation

  // Add Google validation when running Google tests
  const testPattern = process.env.JEST_TEST_PATH_PATTERN;
  if (testPattern?.includes("google")) {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey || !validateApiKey(googleApiKey, "google")) {
      throw new Error("GOOGLE_API_KEY is required for Google E2E tests");
    }
  }
}

// setupEnv.ts - Add Google per-test validation
// Extend existing pattern for provider-specific validation
```

#### 4. **Provider-Specific Configuration**

```typescript
// googleTestConfig.ts - Add separate Google config loader
export function loadGoogleTestConfig(): GoogleTestConfig {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    throw new ValidationError(
      "GOOGLE_API_KEY environment variable is required for Google E2E tests",
    );
  }

  if (!validateApiKey(googleApiKey, "google")) {
    throw new ValidationError(
      "GOOGLE_API_KEY must be a valid Google API key format",
    );
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new ValidationError(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
    );
  }

  return {
    googleApiKey,
    testEnabled,
    testModel: process.env.E2E_GOOGLE_MODEL || "google:gemini-2.5-flash",
    timeout: 30000,
  };
}

// Keep existing loadTestConfig() and loadAnthropicTestConfig() unchanged
```

#### 5. **API Key Validation Extension**

```typescript
// validateApiKey.ts - Extend existing provider discrimination
export function validateApiKey(
  key: string,
  provider: "openai" | "anthropic" | "google",
): boolean {
  if (provider === "google") {
    // Google API keys don't have standard prefix, validate by length and basic format
    return typeof key === "string" && key.length >= 20 && key.length <= 200;
  }
  if (provider === "anthropic") {
    return key.startsWith("sk-ant-") && key.length >= 20;
  }
  // Existing OpenAI logic unchanged
  return key.startsWith("sk-") && key.length >= 20;
}
```

#### 6. **Model Helpers Extension**

```typescript
// googleModelHelpers.ts - Add Google client factory
export function createGoogleTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  const testConfig = loadGoogleTestConfig();
  const config: BridgeConfig = {
    defaultProvider: "google",
    providers: { google: { apiKey: testConfig.googleApiKey } },
    modelSeed: "builtin",
    tools: { enabled: true, builtinTools: ["echo"] },
    ...overrides,
  };
  const client = new BridgeClient(config);
  client.registerProvider(new GoogleGeminiV1Provider());
  return client;
}

// Keep existing createTestClient() and createAnthropicTestClient() unchanged
```

### Google Gemini Provider Integration

The Google Gemini v1 provider is already fully implemented with:

- ✅ **GoogleGeminiV1Provider** class implementing ProviderPlugin interface
- ✅ **Configuration schema** with Zod validation for API key and base URL
- ✅ **Request translation** from unified ChatRequest to Gemini API format
- ✅ **Response processing** for both streaming and non-streaming modes
- ✅ **Tool calling support** with function definition translation
- ✅ **Error normalization** mapping HTTP/Gemini errors to BridgeError types
- ✅ **Multimodal content** support for text, images, and documents

### Test Structure Replication

1. **Chat Tests** - Exact mirror of OpenAI/Anthropic patterns:
   - Parameterized tests across all 5 Google models
   - Same test descriptions and validation logic
   - Same error scenarios (auth, invalid model, malformed requests, timeouts)

2. **Streaming Tests** - Exact mirror of OpenAI/Anthropic patterns:
   - Same delta accumulation and validation logic
   - Same lifecycle management patterns
   - Same format validation and error handling

3. **Tool Tests** - Exact mirror of OpenAI/Anthropic patterns:
   - Same tool registration and execution patterns
   - Same error handling scenarios
   - Same tool system integration tests

## Testing Requirements

### 1. **Environment Setup Testing**

- Validate GOOGLE_API_KEY format and presence in setup files
- Test API key validation logic with valid/invalid keys
- Verify Jest configuration isolation works for Google tests
- Ensure existing provider tests continue to work without Google credentials

### 2. **Test Pattern Validation**

- All Google tests should pass when other provider tests pass
- Same test structure and descriptions as OpenAI/Anthropic equivalents
- Proper model filtering and capability-based test execution

### 3. **Integration Validation**

- Test each major test category with real Google Gemini API responses
- Validate error handling with controlled failure scenarios
- Verify model registry integration works correctly

## Security Considerations

### Input Validation

- Validate all request parameters through existing Zod schemas
- Sanitize multimodal content inputs
- Enforce content size limits
- Validate tool definitions and arguments

### Authentication and Authorization

- Secure API key storage and transmission via environment variables
- Use Google's `x-goog-api-key` header authentication
- Rate limiting integration with Google API quotas
- Access control for tool execution

### Data Protection

- Avoid logging sensitive request/response content
- Implement response redaction for security
- Secure handling of multimodal binary data
- Protection of citation source information

## Dependencies

### Internal Dependencies

- Existing E2E testing infrastructure (✅ Complete)
- GoogleGeminiV1Provider implementation (✅ Complete)
- Google models in defaultLlmModels.ts (✅ Complete - 5 models configured)
- Jest E2E configuration (✅ Complete)

### External Dependencies

- Google Gemini API access and valid API key
- HTTP client capabilities for streaming (✅ Available)
- JSON parsing for response processing (✅ Available)
- Base64 encoding/decoding for multimodal content (✅ Available)

## Success Metrics

### Functional Completeness

- All 5 Google Gemini models accessible through unified interface
- Complete feature parity with OpenAI and Anthropic providers for supported content types
- Text, image, and document content support
- Robust function calling integration
- Comprehensive error handling

### Quality Metrics

- All tests pass when properly configured with valid Google API key
- Zero TypeScript errors or warnings
- All linting and formatting checks pass
- Integration with existing BridgeClient
- Documentation and examples complete

## File Structure

```
src/__tests__/e2e/google/
├── chat.e2e.test.ts              # Google chat completion tests (mirror OpenAI/Anthropic)
├── streaming.e2e.test.ts         # Google streaming tests (mirror OpenAI/Anthropic)
└── tools.e2e.test.ts             # Google tool execution tests (mirror OpenAI/Anthropic)

src/__tests__/e2e/setup/
├── globalSetup.ts                # Extended with Google API key validation
└── setupEnv.ts                   # Extended with Google per-test validation

src/__tests__/e2e/shared/
├── googleTestConfig.ts           # Add loadGoogleTestConfig() function
├── googleTestConfigInterface.ts  # Add GoogleTestConfig interface
├── validateApiKey.ts             # Extend existing provider discrimination for Google
├── googleModelHelpers.ts         # Add createGoogleTestClient() function
└── getGoogleTestModel.ts         # Add getGoogleTestModel() function

.env.example                      # Document Google environment variables
package.json                      # Add test:e2e:google script
```

This feature provides exact parity with OpenAI and Anthropic E2E testing while maintaining provider credential isolation and ensuring existing tests continue to work independently. The implementation extends existing setup files and shared helpers without breaking existing functionality.
