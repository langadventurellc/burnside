---
id: F-anthropic-end-to-end-testing
title: Anthropic End-to-End Testing Infrastructure
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/validateApiKey.ts:
    Extended validateApiKey function to
    support Anthropic provider with sk-ant- prefix validation alongside existing
    OpenAI support
  src/__tests__/e2e/shared/anthropicTestConfigInterface.ts:
    Created new interface
    for Anthropic test configuration following one-export-per-file rule
  src/__tests__/e2e/shared/anthropicTestConfig.ts: Implemented
    loadAnthropicTestConfig function with environment variable validation and
    error handling
  src/__tests__/e2e/shared/anthropicModelHelpers.ts: Created
    createAnthropicTestClient function for Anthropic provider registration and
    configuration
  src/__tests__/e2e/shared/getAnthropicTestModel.ts: Implemented
    getAnthropicTestModel function for environment-based model selection with
    defaults
  src/__tests__/e2e/shared/__tests__/validateApiKey.anthropic.test.ts:
    Comprehensive unit tests for Anthropic API key validation covering
    valid/invalid cases and error scenarios
  src/__tests__/e2e/shared/__tests__/anthropicTestConfig.test.ts:
    Complete test coverage for Anthropic test configuration loading including
    mocking and error cases
  src/__tests__/e2e/shared/__tests__/anthropicModelHelpers.test.ts:
    Full unit tests for Anthropic client creation with provider registration and
    configuration override testing
  src/__tests__/e2e/shared/__tests__/getAnthropicTestModel.test.ts:
    Unit tests for Anthropic model selection covering environment variables and
    default values
  src/__tests__/e2e/setup/globalSetup.ts: Updated to add Anthropic validation
    alongside existing OpenAI validation using test pattern detection via
    process.argv and JEST_TEST_PATH_PATTERN
  src/__tests__/e2e/setup/setupEnv.ts: Refactored to provider-aware validation
    with validateProviderEnvironment function that handles both OpenAI and
    Anthropic credentials based on test path
  src/__tests__/e2e/setup/__tests__/globalSetup.test.ts: Created comprehensive
    unit tests for global setup validation logic covering provider credential
    isolation, test pattern detection, and error handling scenarios
  src/__tests__/e2e/anthropic/chat.e2e.test.ts: "Created comprehensive E2E test
    suite for Anthropic chat completion with 14 test cases exactly mirroring
    OpenAI structure, including parameterized tests across all Anthropic models,
    conversation context handling, response validation, model integration, and
    error handling scenarios; Fixed Anthropic API requirement by adding
    maxTokens: 100 to all client.chat() calls, ensuring tests work with live
    Anthropic APIs that require maxTokens parameter (unlike OpenAI which makes
    it optional)"
  src/__tests__/e2e/anthropic/streaming.e2e.test.ts: "Created comprehensive
    Anthropic streaming E2E test suite with 12 test cases exactly mirroring
    OpenAI structure: Basic Streaming (parameterized tests + multiple deltas),
    Delta Accumulation (correct accumulation + content ordering), Stream
    Lifecycle (start/end + cancellation), Format Validation (schema compliance +
    usage info), and Error Handling (invalid models + timeouts + empty
    messages). Includes proper helper functions for delta collection,
    accumulation, and validation, with correct timeout patterns and Anthropic
    API requirements."
log: []
schema: v1.0
childrenIds:
  - T-add-npm-script-and-environment
  - T-create-anthropic-streaming
  - T-create-anthropic-tool
  - T-create-anthropic-chat
  - T-extend-shared-helpers-for
  - T-update-jest-setup-files-for
created: 2025-09-17T00:40:55.311Z
updated: 2025-09-17T00:40:55.311Z
---

# Anthropic End-to-End Testing Infrastructure

## Overview

Implement end-to-end testing infrastructure for the Anthropic provider that exactly mirrors the existing OpenAI E2E testing patterns. This feature validates the LLM Bridge library's integration with real Anthropic APIs, covering chat completion, streaming, and tool execution functionality using the same test structure as OpenAI.

## Purpose and Functionality

Create E2E testing infrastructure that:

- Replicates the exact OpenAI E2E test patterns for Anthropic
- Uses the same Jest configuration and npm script patterns
- Maintains provider credential isolation (no breaking changes to OpenAI tests)
- Extends existing shared setup files for Anthropic validation
- Tests chat completion, streaming, and tool execution with live Anthropic APIs
- Uses environment variables for configuration and API keys
- Runs independently from unit tests (only when explicitly requested)

## Key Components to Implement

### 1. Anthropic Test Directory Structure

```
src/__tests__/e2e/anthropic/
├── chat.e2e.test.ts          # Mirror of OpenAI chat tests
├── streaming.e2e.test.ts     # Mirror of OpenAI streaming tests
└── tools.e2e.test.ts         # Mirror of OpenAI tool tests
```

### 2. Environment Setup Extensions

- **Global Setup**: Update `src/__tests__/e2e/setup/globalSetup.ts` to validate `ANTHROPIC_API_KEY` when running Anthropic tests
- **Per-test Setup**: Update `src/__tests__/e2e/setup/setupEnv.ts` to handle Anthropic environment validation
- **Environment Documentation**: Update `.env.example` to document Anthropic variables alongside OpenAI

### 3. Shared Helper Extensions

- **API Key Validation**: Extend existing `validateApiKey.ts` provider discrimination for `sk-ant-` prefix
- **Provider-Specific Config**: Add `loadAnthropicTestConfig()` function to avoid coupling with OpenAI config
- **Model Helpers**: Add Anthropic provider registration function to `modelHelpers.ts`
- **Test Model Selection**: Add Anthropic model selection logic to `getTestModel.ts`

### 4. NPM Script Integration

- Add `test:e2e:anthropic` script following the OpenAI pattern
- Use same Jest configuration (`jest.e2e.config.mjs`) with Anthropic path filtering

## Detailed Acceptance Criteria

### Functional Behavior

1. **Test Execution Control**
   - E2E tests MUST NOT run during normal `npm test` execution
   - E2E tests MUST only run when explicitly requested via `npm run test:e2e:anthropic`
   - Tests MUST validate `ANTHROPIC_API_KEY` and `E2E_TEST_ENABLED` before execution in same setup stages as OpenAI
   - Tests MUST fail gracefully if API keys are missing or invalid (sk-ant- format)
   - OpenAI tests MUST continue to work without requiring Anthropic credentials

2. **Chat Completion Tests** (Mirror OpenAI chat.e2e.test.ts - 14 test cases)
   - **Basic Chat Functionality**: Parameterized tests across all Anthropic models from defaultLlmModels.ts
   - **Response Validation**: Unified message schema validation, metadata checking, timestamp format
   - **Model Integration**: Default model usage, registry integration verification
   - **Error Handling**: Authentication errors, invalid model requests, malformed requests, network timeouts

3. **Streaming Tests** (Mirror OpenAI streaming.e2e.test.ts - 12 test cases)
   - **Basic Streaming**: Delta collection across all streaming-capable Anthropic models
   - **Delta Accumulation**: Correct assembly of streaming deltas into complete responses
   - **Stream Lifecycle**: Start/end handling, cancellation scenarios
   - **Format Validation**: StreamDelta schema compliance, usage information in final delta

4. **Tool Execution Tests** (Mirror OpenAI tools.e2e.test.ts - 18 test cases)
   - **Tool Registration**: Successful tool registration and validation
   - **Function Calling**: Tool execution across tool-capable Anthropic models
   - **Tool System Integration**: BridgeClient integration, tool result formatting
   - **Tool Error Handling**: Registration errors, execution failures, disabled tool system

### Configuration Requirements

1. **Environment Variables** (Document in `.env.example`)
   - `ANTHROPIC_API_KEY`: Required Anthropic API key (sk-ant- prefix)
   - `E2E_TEST_ENABLED`: Flag to explicitly enable e2e testing (must be "true")
   - `E2E_ANTHROPIC_MODEL`: Optional model override (default: "anthropic:claude-3-5-haiku-latest")

2. **Environment Setup Updates**
   - Update `globalSetup.ts` to validate Anthropic credentials when test pattern includes "anthropic"
   - Update `setupEnv.ts` to handle Anthropic-specific validation using provider pattern
   - Keep OpenAI validation working independently without Anthropic dependencies

3. **Model Selection Logic**
   - Default to `anthropic:claude-3-5-haiku-latest` (Haiku 3.0)
   - Use models from existing `defaultLlmModels.ts` seed data
   - Filter models by capabilities (streaming, toolCalls) like OpenAI tests
   - Register custom models if E2E_ANTHROPIC_MODEL specifies non-seeded model

### Integration Requirements

1. **Provider Credential Isolation**
   - Create `loadAnthropicTestConfig()` function to avoid coupling with `loadTestConfig()`
   - Maintain separate credential validation paths for OpenAI and Anthropic
   - Ensure OpenAI tests continue working without Anthropic environment variables

2. **Shared Helper Compatibility**
   - Reuse existing `validateApiKey()` with provider discrimination already present
   - Maintain same helper function signatures and return types where possible
   - Follow existing patterns for BridgeClient creation and model registration

3. **Test Pattern Replication**
   - Use exact same test descriptions and structure as OpenAI tests
   - Apply same timeout values (15s for basic, 30s for extended, 45s for streaming)
   - Use same validation helpers (`validateMessageSchema`, `withTimeout`, etc.)
   - Follow same parameterized testing patterns for model coverage

### Performance Requirements

1. **Response Time Validation** (Non-blocking observability)
   - Use same generous timeouts as OpenAI tests to avoid flakiness
   - Monitor but don't gate on response times
   - Use same timeout patterns (15s basic, 30s extended, 45s streaming)

2. **Resource Usage Guidelines**
   - Use minimal test data to reduce API costs
   - Use default Haiku model for cost efficiency
   - Follow same request patterns as OpenAI tests

### Security Requirements

1. **API Key Management**
   - Never log or expose API keys in test output
   - Validate sk-ant- format before making requests
   - Use environment variables exclusively for sensitive data
   - Fail securely if credentials are missing

2. **Environment Loading**
   - Use same `NODE_OPTIONS="--import=dotenv/config"` pattern as OpenAI
   - Extend existing environment validation in globalSetup/setupEnv without breaking OpenAI

## Implementation Guidance

### Technical Approach

1. **File Creation Pattern**

   ```
   src/__tests__/e2e/anthropic/chat.e2e.test.ts     # Copy OpenAI chat.e2e.test.ts structure
   src/__tests__/e2e/anthropic/streaming.e2e.test.ts # Copy OpenAI streaming.e2e.test.ts structure
   src/__tests__/e2e/anthropic/tools.e2e.test.ts    # Copy OpenAI tools.e2e.test.ts structure
   ```

2. **Environment Setup Extensions**

   ```typescript
   // globalSetup.ts - Add Anthropic validation alongside OpenAI
   export default async function globalSetup() {
     // Existing OpenAI validation

     // Add Anthropic validation when running Anthropic tests
     const testPattern = process.env.JEST_TEST_PATH_PATTERN;
     if (testPattern?.includes("anthropic")) {
       const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
       if (!anthropicApiKey || !validateApiKey(anthropicApiKey, "anthropic")) {
         throw new Error(
           "ANTHROPIC_API_KEY is required for Anthropic E2E tests",
         );
       }
     }
   }

   // setupEnv.ts - Add Anthropic per-test validation
   // Extend existing pattern for provider-specific validation
   ```

3. **Provider-Specific Configuration**

   ```typescript
   // testConfig.ts - Add separate Anthropic config loader
   export function loadAnthropicTestConfig(): AnthropicTestConfig {
     const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
     if (!anthropicApiKey) {
       throw new ValidationError(
         "ANTHROPIC_API_KEY environment variable is required for Anthropic E2E tests",
       );
     }

     if (!validateApiKey(anthropicApiKey, "anthropic")) {
       throw new ValidationError(
         "ANTHROPIC_API_KEY must be a valid Anthropic API key format",
       );
     }

     const testEnabled = process.env.E2E_TEST_ENABLED === "true";
     if (!testEnabled) {
       throw new ValidationError(
         'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
       );
     }

     return {
       anthropicApiKey,
       testEnabled,
       testModel:
         process.env.E2E_ANTHROPIC_MODEL || "anthropic:claude-3-5-haiku-latest",
       timeout: 30000,
     };
   }

   // Keep existing loadTestConfig() unchanged for OpenAI
   ```

4. **API Key Validation Extension**

   ```typescript
   // validateApiKey.ts - Extend existing provider discrimination
   export function validateApiKey(
     key: string,
     provider: "openai" | "anthropic",
   ): boolean {
     if (provider === "anthropic") {
       return key.startsWith("sk-ant-") && key.length >= 20;
     }
     // Existing OpenAI logic unchanged
     return key.startsWith("sk-") && key.length >= 20;
   }
   ```

5. **Model Helpers Extension**

   ```typescript
   // modelHelpers.ts - Add Anthropic client factory
   export function createAnthropicTestClient(
     overrides?: Partial<BridgeConfig>,
   ): BridgeClient {
     const testConfig = loadAnthropicTestConfig();
     const config: BridgeConfig = {
       defaultProvider: "anthropic",
       providers: { anthropic: { apiKey: testConfig.anthropicApiKey } },
       modelSeed: "builtin",
       tools: { enabled: true, builtinTools: ["echo"] },
       ...overrides,
     };
     const client = new BridgeClient(config);
     client.registerProvider(new AnthropicMessagesV1Provider());
     return client;
   }

   // Keep existing createTestClient() unchanged for OpenAI
   ```

6. **NPM Script Addition**

   ```json
   {
     "test:e2e:anthropic": "NODE_OPTIONS='--import=dotenv/config' jest --config jest.e2e.config.mjs --testPathPattern=anthropic"
   }
   ```

7. **Environment Documentation**

   ```bash
   # .env.example - Add Anthropic variables alongside existing OpenAI docs

   # Anthropic E2E Testing (optional - only needed for Anthropic E2E tests)
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
   E2E_ANTHROPIC_MODEL=anthropic:claude-3-5-haiku-latest
   ```

### Test Structure Replication

1. **Chat Tests** - Exact mirror of OpenAI patterns:
   - Parameterized tests across all Anthropic models
   - Same test descriptions and validation logic
   - Same error scenarios (auth, invalid model, malformed requests, timeouts)

2. **Streaming Tests** - Exact mirror of OpenAI patterns:
   - Same delta accumulation and validation logic
   - Same lifecycle management patterns
   - Same format validation and error handling

3. **Tool Tests** - Exact mirror of OpenAI patterns:
   - Same tool registration and execution patterns
   - Same error handling scenarios
   - Same tool system integration tests

## Dependencies

- Existing E2E testing infrastructure (✅ Complete)
- AnthropicMessagesV1Provider implementation (✅ Complete)
- Anthropic models in defaultLlmModels.ts (✅ Complete)
- Jest E2E configuration (✅ Complete)

## Testing Requirements

1. **Environment Setup Testing**
   - Validate ANTHROPIC_API_KEY format and presence in setup files
   - Test API key validation logic with valid/invalid keys
   - Verify Jest configuration isolation works for Anthropic tests
   - Ensure OpenAI tests continue to work without Anthropic credentials

2. **Test Pattern Validation**
   - All Anthropic tests should pass when OpenAI tests pass
   - Same test structure and descriptions as OpenAI equivalents
   - Proper model filtering and capability-based test execution

## Security Considerations

1. **Credential Management**
   - Use environment variables exclusively for API keys
   - Never commit test credentials to repository
   - Implement secure defaults for missing credentials
   - Maintain provider credential isolation

2. **API Key Validation**
   - Reuse existing `validateApiKey()` with provider discrimination
   - Strict sk-ant- prefix validation for Anthropic
   - Minimum length requirements
   - Format validation before API calls

## File Structure

```
src/__tests__/e2e/anthropic/
├── chat.e2e.test.ts              # Anthropic chat completion tests (mirror OpenAI)
├── streaming.e2e.test.ts         # Anthropic streaming tests (mirror OpenAI)
└── tools.e2e.test.ts             # Anthropic tool execution tests (mirror OpenAI)

src/__tests__/e2e/setup/
├── globalSetup.ts                # Extended with Anthropic API key validation
└── setupEnv.ts                   # Extended with Anthropic per-test validation

src/__tests__/e2e/shared/
├── testConfig.ts                 # Add loadAnthropicTestConfig() function
├── validateApiKey.ts             # Extend existing provider discrimination
├── modelHelpers.ts               # Add createAnthropicTestClient() function
└── getTestModel.ts               # Add getAnthropicTestModel() function

.env.example                      # Document Anthropic environment variables
package.json                      # Add test:e2e:anthropic script
```

This feature provides exact parity with OpenAI E2E testing while maintaining provider credential isolation and ensuring OpenAI tests continue to work independently. The implementation extends existing setup files and shared helpers without breaking existing functionality.
