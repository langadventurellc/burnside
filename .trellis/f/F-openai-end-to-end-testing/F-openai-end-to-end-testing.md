---
id: F-openai-end-to-end-testing
title: OpenAI End-to-End Testing Infrastructure
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  jest.e2e.config.mjs: Created dedicated Jest configuration for E2E tests with
    ESM/TS settings, 30s timeout, and test pattern targeting *.e2e.test.ts files
  package.json: Added test:e2e and test:e2e:openai NPM scripts with NODE_OPTIONS
    for environment variable loading
  .env.example: Created comprehensive environment variable documentation with
    OpenAI API key setup, E2E test enablement, and usage instructions
  src/__tests__/e2e/setup/globalSetup.ts: Created Jest global setup with
    environment variable validation for OPENAI_API_KEY and E2E_TEST_ENABLED,
    including API key format validation
  src/__tests__/e2e/setup/setupEnv.ts: Created per-test environment setup with
    ValidationError-based validation for API key format and E2E test enablement
  src/__tests__/e2e/setup/globalTeardown.ts: Created Jest global teardown for post-test cleanup operations
  src/__tests__/e2e/openai/:
    Created empty directory for OpenAI-specific E2E tests
    (ready for future tasks)
  src/__tests__/e2e/shared/:
    Created empty directory for shared E2E test utilities
    (ready for future tasks)
  src/__tests__/e2e/shared/testConfigInterface.ts: Created TestConfig interface
    defining structure for E2E test configuration including API keys, test
    enablement, and timeout settings
  src/__tests__/e2e/shared/validateApiKey.ts: Created API key validation helper
    supporting OpenAI format validation (sk- prefix and minimum length
    requirements)
  src/__tests__/e2e/shared/testConfig.ts: Created test configuration loader with
    environment variable validation and error handling for missing/invalid API
    keys
  src/__tests__/e2e/shared/modelHelpers.ts:
    Created BridgeClient factory function
    with builtin model seeding, OpenAI provider registration, and proper tools
    configuration
  src/__tests__/e2e/shared/ensureModelRegistered.ts:
    Created model registry helper
    to register custom models with complete capabilities and metadata for
    non-seeded models
  src/__tests__/e2e/shared/getTestModel.ts: Created test model ID helper with
    environment variable override support (defaults to openai:gpt-4o-2024-08-06)
  src/__tests__/e2e/shared/testHelpers.ts: Created message schema validation
    helper for consistent response validation in E2E tests
  src/__tests__/e2e/shared/createTestMessages.ts: Created test message factory for generating properly formatted user messages
  src/__tests__/e2e/shared/withTimeout.ts: Created timeout wrapper utility for
    reliable E2E test execution with configurable timeouts
log: []
schema: v1.0
childrenIds:
  - T-implement-model-registry
  - T-implement-openai-chat
  - T-implement-openai-streaming
  - T-implement-openai-tool
  - T-implement-tool-call
  - T-create-e2e-test-directory
  - T-create-jest-e2e-configuration
created: 2025-09-16T06:13:46.927Z
updated: 2025-09-16T06:13:46.927Z
---

# OpenAI End-to-End Testing Infrastructure

## Overview

Implement end-to-end testing infrastructure that validates the LLM Bridge library's integration with real OpenAI APIs. These tests will verify that phases 1-5 of the implementation work correctly with live OpenAI services, covering chat completion, streaming, and tool execution functionality.

## Purpose and Functionality

This feature creates a separate testing infrastructure that:

- Validates real API integration with OpenAI services
- Tests chat completion, streaming, and tool execution end-to-end
- Uses environment variables for configuration and API keys
- Runs independently from unit tests (only when explicitly requested)
- Aligns with existing model registry and tool execution patterns

## Key Components to Implement

### 1. Test Configuration and Infrastructure

- **Separate Jest Configuration**: Create `jest.e2e.config.mjs` with proper ESM/TS settings
- **Environment Variable Management**: Validation and configuration for API keys and test settings
- **Test Organization**: Structured directory layout under `src/__tests__/e2e/`
- **NPM Scripts**: Commands to run e2e tests separately from unit tests

### 2. OpenAI Integration Testing

- **Chat Completion Tests**: Basic chat requests with response validation
- **Streaming Tests**: Real-time streaming with delta accumulation verification
- **Tool Execution Tests**: Function calling with proper tool call extraction
- **Error Handling Tests**: Network failures, authentication errors

### 3. Model Registry Integration

- **Default Model Usage**: Use models from existing seed data (e.g., "openai:gpt-4o-2024-08-06")
- **Dynamic Registration**: Support for registering custom models via environment variables
- **Model Validation**: Ensure requested models are registered before testing

## Detailed Acceptance Criteria

### Functional Behavior

1. **Test Execution Control**
   - E2E tests MUST NOT run during normal `npm test` execution
   - E2E tests MUST only run when explicitly requested via dedicated commands
   - Tests MUST validate environment variables before execution
   - Tests MUST fail gracefully if API keys are missing or invalid

2. **OpenAI Chat Integration**
   - Successfully execute basic chat completion requests with simple prompts
   - Validate response format matches unified message schema
   - Test with models from the existing model registry seed
   - Verify error handling for invalid requests and authentication failures

3. **Streaming Functionality**
   - Execute real-time streaming chat requests
   - Validate streaming delta format and accumulation
   - Test stream cancellation scenarios
   - Verify final accumulated message matches expected format

4. **Tool System Integration**
   - Register and execute tools through BridgeClient
   - Test tool call extraction from OpenAI responses (accounting for current metadata.tool_calls vs message.toolCalls paths)
   - Validate agent loop execution with tool results
   - Verify tool result formatting and current single-turn behavior

### Configuration Requirements

1. **Environment Variables**
   - `OPENAI_API_KEY`: Required OpenAI API key for testing
   - `E2E_TEST_ENABLED`: Flag to explicitly enable e2e testing
   - `E2E_OPENAI_MODEL`: Optional model override (default: "openai:gpt-4o-2024-08-06")

2. **Jest Configuration**
   - Mirror base Jest ESM/TS settings: `extensionsToTreatAsEsm`, `transform`, `moduleNameMapper`
   - Separate configuration file that only includes `*.e2e.test.ts` files
   - Extended timeouts for API calls (30 seconds default)
   - Use Jest's `globalSetup`/`globalTeardown` for one-time initialization
   - Use `setupFilesAfterEnv` for per-test environment setup

### Integration Requirements

1. **Model Registry Alignment**
   - Use models that exist in the default seed (`src/data/defaultLlmModels.ts`)
   - Provide helper to register custom models if E2E_OPENAI_MODEL specifies a non-seeded model
   - Validate model availability before executing tests

2. **Tool Call Processing Alignment**
   - Account for current tool call extraction path: `message.metadata.tool_calls` vs `message.toolCalls`
   - Provide test helpers that ensure tool calls are properly formatted for extraction
   - Test actual tool execution path used by `extractToolCallsFromMessage`

3. **BridgeClient Integration**
   - Use real BridgeClient instances with OpenAI provider registration
   - Test provider initialization and configuration
   - Validate current tool system behavior (single-turn execution returning original message)

### Performance Requirements

1. **Response Time Validation** (Non-blocking observability)
   - Monitor but don't gate on response times
   - Use generous timeouts to avoid test flakiness
   - Log performance metrics for monitoring

2. **Resource Usage Guidelines**
   - Use minimal test data to reduce API costs
   - Prefer available efficient models from the seed
   - Implement basic request counting for awareness

### Security Requirements

1. **API Key Management**
   - Never log or expose API keys in test output
   - Validate API key format before making requests
   - Use environment variables exclusively for sensitive data
   - Fail securely if credentials are missing

2. **Environment Loading**
   - Use `NODE_OPTIONS="--import=dotenv/config"` or Jest setupFiles for .env loading
   - Provide clear documentation for environment setup
   - Validate required environment variables in globalSetup

## Implementation Guidance

### Technical Approach

1. **Test Structure Organization**

   ```
   src/__tests__/e2e/
   ├── openai/
   │   ├── chat.e2e.test.ts
   │   ├── streaming.e2e.test.ts
   │   └── tools.e2e.test.ts
   ├── shared/
   │   ├── testConfig.ts
   │   ├── modelHelpers.ts
   │   ├── toolHelpers.ts
   │   └── testHelpers.ts
   ├── setup/
   │   ├── globalSetup.ts
   │   ├── globalTeardown.ts
   │   └── setupEnv.ts
   └── .env.example
   ```

2. **Model Registry Integration**

   ```typescript
   // In modelHelpers.ts - Show explicit model seeding setup
   import { BridgeClient } from "../../client/bridgeClient.js";
   import { OpenAIResponsesV1Provider } from "../../providers/openai-responses-v1/index.js";

   export function createTestClient(): BridgeClient {
     const config: BridgeConfig = {
       defaultProvider: "openai",
       providers: new Map([["openai", { apiKey: process.env.OPENAI_API_KEY }]]),
       modelSeed: "builtin", // Explicitly use builtin seed to populate registry
       tools: { enabled: true },
     };

     const client = new BridgeClient(config);
     client.registerProvider(new OpenAIResponsesV1Provider());
     return client;
   }

   // Helper to ensure custom model is registered if specified
   export async function ensureModelRegistered(
     client: BridgeClient,
     modelId: string,
   ) {
     if (!client.getModelRegistry().get(modelId)) {
       // Register custom model if E2E_OPENAI_MODEL specifies non-seeded model
       const [provider, model] = modelId.split(":");
       client.getModelRegistry().register(modelId, {
         id: modelId,
         name: model,
         provider,
         capabilities: { toolCalls: true, streaming: true },
         metadata: { providerPlugin: "openai-responses-v1" },
       });
     }
   }

   // Default model from seed, with override support
   export function getTestModel(): string {
     return process.env.E2E_OPENAI_MODEL || "openai:gpt-4o-2024-08-06";
   }
   ```

3. **Tool Call Path Reconciliation**

   ```typescript
   // In toolHelpers.ts - Handle tool call extraction alignment
   import type { Message } from "../../core/messages/message.js";

   export function prepareToolCallMessage(message: Message): Message {
     // Account for metadata.tool_calls vs message.toolCalls
     // Ensure tool calls are in the location expected by extractToolCallsFromMessage
     if (message.toolCalls && !message.metadata?.tool_calls) {
       return {
         ...message,
         metadata: {
           ...message.metadata,
           tool_calls: message.toolCalls,
         },
       };
     }
     return message;
   }
   ```

### Framework Integration

1. **Jest Configuration (`jest.e2e.config.mjs`)**

   ```javascript
   export default {
     preset: "ts-jest/presets/default-esm",
     extensionsToTreatAsEsm: [".ts"],
     testEnvironment: "node",
     testMatch: ["<rootDir>/src/**/*.e2e.test.ts"],
     testTimeout: 30000,
     transform: {
       "^.+\\.ts$": [
         "ts-jest",
         {
           useESM: true,
         },
       ],
     },
     moduleNameMapper: {
       "^(\\.{1,2}/.*)\\.js$": "$1",
     },
     globalSetup: "<rootDir>/src/__tests__/e2e/setup/globalSetup.ts",
     globalTeardown: "<rootDir>/src/__tests__/e2e/setup/globalTeardown.ts",
     setupFilesAfterEnv: ["<rootDir>/src/__tests__/e2e/setup/setupEnv.ts"],
   };
   ```

2. **Global Setup Structure**

   ```typescript
   // globalSetup.ts - One-time async initialization
   export default async function globalSetup() {
     // Validate environment variables
     // Set up any global test resources
     // Return teardown function if needed
   }

   // globalTeardown.ts - One-time cleanup
   export default async function globalTeardown() {
     // Clean up global resources
   }

   // setupEnv.ts - Per-test environment setup
   // Sets up environment for each test file
   ```

3. **NPM Scripts Addition**
   ```json
   {
     "test:e2e": "NODE_OPTIONS='--import=dotenv/config' jest --config jest.e2e.config.mjs",
     "test:e2e:openai": "NODE_OPTIONS='--import=dotenv/config' jest --config jest.e2e.config.mjs --testPathPattern=openai"
   }
   ```

### Testing Strategy

1. **Test Categories**
   - **Smoke Tests**: Basic connectivity and authentication
   - **Functional Tests**: Core features with real API responses
   - **Integration Tests**: Full workflow validation with current implementation behavior
   - **Error Tests**: Failure scenarios and recovery

2. **Test Data Management**
   - Use predictable prompts that generate consistent response structures
   - Design tool definitions that work with current execution paths
   - Create test scenarios that minimize token usage
   - Validate against actual response formats from the OpenAI provider

3. **Model Seeding Strategy**
   - Always create BridgeClient with `modelSeed: "builtin"` to populate registry
   - Use `ensureModelRegistered()` helper for custom models specified via E2E_OPENAI_MODEL
   - Validate model availability before executing tests to prevent "empty registry" runs

## Dependencies

- Jest testing framework (already configured)
- OpenAI API access and valid API key
- BridgeClient and OpenAI provider implementation (phases 1-5)
- Tool system and agent loop implementation (phase 5)
- Existing model registry seed data

## Testing Requirements

1. **Environment Setup Testing**
   - Validate environment variable configuration
   - Test API key validation and error handling
   - Verify Jest configuration isolation from unit tests

2. **Integration Validation**
   - Test each major test category with real API responses
   - Validate error handling with controlled failure scenarios
   - Verify model registry integration works correctly

3. **Tool Call Path Testing**
   - Verify tool calls are properly extracted from OpenAI responses
   - Test tool execution through current BridgeClient paths
   - Validate tool result formatting and message generation

## Security Considerations

1. **Credential Management**
   - Use environment variables exclusively for API keys
   - Never commit test credentials to repository
   - Implement secure defaults for missing credentials

2. **Data Protection**
   - Use minimal test data to reduce exposure
   - Implement appropriate logging controls
   - Ensure test cleanup removes sensitive data

## File Structure

```
jest.e2e.config.mjs                    # E2E Jest configuration with proper ESM/TS settings
src/__tests__/e2e/
├── openai/
│   ├── chat.e2e.test.ts              # Basic chat completion tests
│   ├── streaming.e2e.test.ts         # Streaming functionality tests
│   └── tools.e2e.test.ts             # Tool execution tests (aligned with current paths)
├── shared/
│   ├── testConfig.ts                 # Environment and configuration management
│   ├── modelHelpers.ts               # Model registry integration helpers
│   ├── toolHelpers.ts                # Tool call path reconciliation helpers
│   └── testHelpers.ts                # Common test utilities
├── setup/
│   ├── globalSetup.ts                # Jest globalSetup - one-time initialization
│   ├── globalTeardown.ts             # Jest globalTeardown - one-time cleanup
│   └── setupEnv.ts                   # Jest setupFilesAfterEnv - per-test setup
└── .env.example                      # Example environment configuration
```

## Future Enhancements (Out of Scope)

- Request throttling and circuit breaker mechanisms
- Advanced retry and backoff logic testing
- Comprehensive cost estimation and controls
- Performance SLA enforcement
- Multi-provider testing infrastructure

This feature provides focused validation of the LLM Bridge library's OpenAI integration while maintaining alignment with the existing codebase architecture and current implementation behavior.
