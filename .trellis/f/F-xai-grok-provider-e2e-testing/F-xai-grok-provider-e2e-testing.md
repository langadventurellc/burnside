---
id: F-xai-grok-provider-e2e-testing
title: xAI Grok Provider E2E Testing Implementation
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/xaiTestConfigInterface.ts:
    Created TypeScript interface
    with xaiApiKey, testEnabled, testModel, and timeout properties following
    established pattern
  src/__tests__/e2e/shared/xaiTestConfig.ts: Created configuration loader with
    XAI_API_KEY validation, E2E_TEST_ENABLED checking, model selection with
    E2E_XAI_MODEL override support, and proper error handling
  src/__tests__/e2e/shared/validateApiKey.ts:
    Extended existing API key validation
    to support xAI provider with 'xai-' prefix requirement and minimum length
    validation
  src/__tests__/e2e/shared/getXaiTestModel.ts: Created model selection helper
    returning E2E_XAI_MODEL environment variable override or default
    'xai:grok-3-mini'
  src/__tests__/e2e/shared/xaiModelHelpers.ts: Created BridgeClient factory
    function following OpenAI E2E patterns with XAIV1Provider registration, xAI
    configuration, builtin model seed, and echo tool support
  src/client/bridgeClient.ts: Added xai-v1 provider plugin mapping to enable
    automatic provider resolution for Grok models from builtin seed
log: []
schema: v1.0
childrenIds:
  - T-add-xai-e2e-test-configuration
  - T-create-xai-bridgeclient
  - T-implement-xai-chat-completion
  - T-implement-xai-streaming-e2e
  - T-implement-xai-tool-execution
  - T-create-xai-test-configuration
created: 2025-09-18T00:08:03.828Z
updated: 2025-09-18T00:08:03.828Z
---

# xAI Grok Provider E2E Testing Implementation

## Overview

Implement comprehensive end-to-end testing infrastructure for the xAI Grok provider, following the established patterns from the OpenAI E2E testing framework. This feature validates real API integration with xAI's Grok models, covering chat completion, streaming, and tool execution functionality.

## Purpose and Functionality

This feature creates a complete E2E testing suite that:

- Validates real API integration with xAI Grok services (grok-3-mini, grok-3, grok-4-0709)
- Tests chat completion, streaming, and tool execution end-to-end workflows
- Uses environment variables for secure API key management
- Runs independently from unit tests (only when explicitly requested)
- Follows the exact patterns established by the OpenAI E2E testing infrastructure

## Key Components to Implement

### 1. xAI E2E Test Files

- **Chat Tests** (`src/__tests__/e2e/xai/chat.e2e.test.ts`) - Basic chat completion functionality
- **Streaming Tests** (`src/__tests__/e2e/xai/streaming.e2e.test.ts`) - Real-time streaming validation
- **Tools Tests** (`src/__tests__/e2e/xai/tools.e2e.test.ts`) - Tool execution and integration

### 2. xAI Helper Infrastructure

- **Configuration Management** (`xaiTestConfig.ts`) - API key validation and test configuration
- **Client Factory** (`xaiModelHelpers.ts`) - BridgeClient creation with XAIV1Provider registration
- **Model Selection** (`getXaiTestModel.ts`) - Default model handling with override support
- **Type Definitions** (`xaiTestConfigInterface.ts`) - TypeScript interfaces for test configuration

### 3. Environment Configuration

- **Environment Variables** - XAI_API_KEY, E2E_XAI_MODEL support
- **NPM Scripts** - `test:e2e:xai` command for isolated test execution
- **Documentation** - Updated .env.example with xAI configuration

## Detailed Acceptance Criteria

### Functional Requirements

1. **Chat Completion Testing**
   - ✅ Test all three Grok models (grok-3-mini, grok-3, grok-4-0709) with parameterized tests
   - ✅ Validate basic chat requests with simple prompts return valid responses
   - ✅ Test conversation context handling with multi-turn dialogues
   - ✅ Verify response format matches unified message schema exactly
   - ✅ Validate metadata presence and provider identification
   - ✅ Test consecutive requests maintain independence and unique IDs

2. **Streaming Functionality**
   - ✅ Execute real-time streaming chat requests with delta accumulation
   - ✅ Validate StreamDelta structure compliance (id, delta, finished fields)
   - ✅ Test stream lifecycle management (start, multiple deltas, proper termination)
   - ✅ Verify final delta is marked as finished=true
   - ✅ Test stream cancellation scenarios and resource cleanup
   - ✅ Validate accumulated message matches expected unified format

3. **Tool System Integration**
   - ✅ Register and execute echo tool through BridgeClient with xAI provider
   - ✅ Test tool call extraction from xAI responses using current metadata paths
   - ✅ Validate tool execution workflow with proper result formatting
   - ✅ Test requests when tools are available but not used
   - ✅ Handle tool registration errors and execution failures gracefully

4. **Error Handling**
   - ✅ Test authentication errors with invalid API keys
   - ✅ Handle invalid model requests with appropriate error messages
   - ✅ Manage network timeouts and connection failures
   - ✅ Validate malformed request handling (empty messages, invalid parameters)

### Configuration Requirements

1. **Environment Variables**
   - `XAI_API_KEY`: Required xAI API key with "xai-" prefix validation
   - `E2E_TEST_ENABLED`: Reuse existing flag for test enablement
   - `E2E_XAI_MODEL`: Optional model override (default: "xai:grok-3-mini")

2. **Test Configuration**
   - API key format validation (must start with "xai-")
   - Test enablement validation before execution
   - Graceful failure when credentials missing or invalid
   - Support for custom model selection via environment variables

### Integration Requirements

1. **Model Registry Alignment**
   - Use models from default seed data (grok-3-mini, grok-3, grok-4-0709)
   - Leverage builtin modelSeed configuration for automatic registration
   - Validate model availability before executing tests
   - Support custom model registration if E2E_XAI_MODEL specifies non-seeded model

2. **BridgeClient Integration**
   - Create BridgeClient instances with XAIV1Provider registration
   - Test provider initialization and configuration validation
   - Validate tool system integration with current architecture
   - Ensure compatibility with existing transport layer

3. **Test Framework Integration**
   - Use existing Jest E2E configuration with xAI-specific test pattern
   - Extend timeouts to 25-30 seconds for API calls
   - Integrate with existing global setup/teardown infrastructure
   - Follow established error handling and validation patterns

### Performance Requirements

1. **Response Time Validation** (Non-blocking observability)
   - Monitor response times without gating tests
   - Use generous timeouts (25-30s) to avoid flakiness
   - Log performance metrics for monitoring

2. **Resource Usage**
   - Use minimal test data to reduce API costs
   - Prefer grok-3-mini model for cost efficiency
   - Implement basic request counting for awareness

### Security Requirements

1. **API Key Management**
   - Never log or expose API keys in test output
   - Validate "xai-" prefix format before making requests
   - Use environment variables exclusively for sensitive data
   - Fail securely if credentials are missing

2. **Input Validation**
   - Validate all test parameters through proper schemas
   - Sanitize test messages to prevent data leakage
   - Ensure secure defaults for missing configuration

## Implementation Guidance

### Technical Approach

1. **Follow OpenAI E2E Patterns Exactly**
   - Mirror file structure: `src/__tests__/e2e/xai/` directory
   - Replicate test categories: chat, streaming, tools
   - Use same helper function patterns with xAI-specific implementations
   - Maintain consistent validation and error handling approaches

2. **xAI-Specific Adaptations**
   - Register XAIV1Provider instead of OpenAIResponsesV1Provider
   - Use xAI model identifiers (grok-3-mini, grok-3, grok-4-0709)
   - Validate "xai-" API key prefix requirement
   - Test xAI-specific error codes and response formats

3. **Helper Function Structure**

   ```typescript
   // xaiModelHelpers.ts
   export function createTestClient(
     overrides?: Partial<BridgeConfig>,
   ): BridgeClient {
     const config: BridgeConfig = {
       defaultProvider: "xai",
       providers: { xai: { apiKey: testConfig.xaiApiKey } },
       modelSeed: "builtin",
       tools: { enabled: true, builtinTools: ["echo"] },
       ...overrides,
     };
     const client = new BridgeClient(config);
     client.registerProvider(new XAIV1Provider());
     return client;
   }
   ```

4. **Test Data Strategy**
   - Use predictable prompts for consistent response validation
   - Design tool definitions compatible with current execution paths
   - Create test scenarios minimizing token usage
   - Validate against actual xAI response formats

### Testing Strategy

1. **Test Categories**
   - **Smoke Tests**: Basic connectivity and authentication
   - **Functional Tests**: Core features with real API responses
   - **Integration Tests**: Full workflow validation
   - **Error Tests**: Failure scenarios and recovery

2. **Model Testing Approach**
   - **Parameterized Tests**: Test all three Grok models for compatibility
   - **Capability Filtering**: Filter models by streaming/tool support as needed
   - **Default Model**: Use grok-3-mini as primary test model
   - **Override Support**: Allow custom model via E2E_XAI_MODEL environment variable

## Testing Requirements

### Test Execution Control

- E2E tests MUST NOT run during normal `npm test` execution
- E2E tests MUST only run when explicitly requested via `npm run test:e2e:xai`
- Tests MUST validate environment variables before execution
- Tests MUST fail gracefully if API keys are missing or invalid

### Response Validation

- All responses MUST validate against unified message schema
- Streaming deltas MUST conform to StreamDelta interface requirements
- Tool call extraction MUST work with current metadata.tool_calls paths
- Error responses MUST map to appropriate BridgeError types

### Model Compatibility

- Test suite MUST work with all configured Grok models
- Model registry integration MUST use builtin seed data
- Custom model support MUST work via environment variable override
- Model capabilities MUST be respected (streaming, tool calls, etc.)

## Security Considerations

1. **Credential Management**
   - Use environment variables exclusively for API keys
   - Never commit test credentials to repository
   - Implement secure defaults for missing credentials
   - Validate API key format before making requests

2. **Data Protection**
   - Use minimal test data to reduce exposure
   - Implement appropriate logging controls without exposing keys
   - Ensure test cleanup removes sensitive data
   - Sanitize error messages to prevent data leakage

## Dependencies

- xAI Grok provider implementation (already complete)
- Existing Jest E2E testing infrastructure
- BridgeClient and tool system implementation
- xAI API access and valid API key
- Default model registry seed data with Grok models

## File Structure

```
src/__tests__/e2e/xai/
├── chat.e2e.test.ts                    # Chat completion E2E tests
├── streaming.e2e.test.ts               # Streaming functionality tests
└── tools.e2e.test.ts                   # Tool execution tests

src/__tests__/e2e/shared/
├── xaiTestConfig.ts                    # xAI configuration loading
├── xaiTestConfigInterface.ts           # TypeScript interfaces
├── xaiModelHelpers.ts                  # BridgeClient factory
└── getXaiTestModel.ts                  # Model selection helper

Updated Files:
├── package.json                        # Add test:e2e:xai script
└── .env.example                        # Add xAI environment documentation
```

## Success Criteria

- All 3 test files implemented with comprehensive coverage
- 4 new helper files supporting xAI testing infrastructure
- NPM script enabling isolated xAI E2E test execution
- Environment documentation updated for xAI configuration
- All tests pass with real xAI API integration
- Test suite follows established OpenAI patterns exactly
- Security requirements met for API key management
- Performance requirements satisfied with appropriate timeouts
