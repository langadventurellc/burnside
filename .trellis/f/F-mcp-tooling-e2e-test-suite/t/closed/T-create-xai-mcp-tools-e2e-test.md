---
id: T-create-xai-mcp-tools-e2e-test
title: Create xAI MCP Tools E2E Test
status: done
priority: medium
parent: F-mcp-tooling-e2e-test-suite
prerequisites:
  - T-create-openai-mcp-tools-e2e
affectedFiles:
  src/__tests__/e2e/xai/mcpTools.e2e.test.ts:
    "New E2E test file implementing xAI
    MCP tool integration validation with two test suites: MCP Tool Discovery
    (validates client configuration) and MCP Tool Execution (validates tool
    execution through xAI chat API). Follows existing xAI E2E test patterns with
    proper timeout handling, validation, and cleanup. Uses XAIV1Provider with
    proper initialization and leverages shared MCP test utilities. Discovered
    xAI requires higher token limits (1000) for successful tool execution due to
    reasoning behavior."
log:
  - "Successfully implemented xAI MCP Tools E2E test that validates MCP tool
    integration with xAI provider. Created comprehensive test file with MCP tool
    discovery and execution validation following existing E2E test patterns. The
    test verifies that MCP tools can be discovered and executed through xAI chat
    requests with proper response formatting. Used shared MCP test utilities and
    followed project coding standards. All quality checks pass (lint, format,
    type-check) and E2E tests are green with 2 passing test cases. Key insight:
    xAI's Grok model requires higher token limits (1000 vs 100) due to its
    reasoning behavior before tool execution."
schema: v1.0
childrenIds: []
created: 2025-09-21T02:43:33.492Z
updated: 2025-09-21T02:43:33.492Z
---

# Create xAI MCP Tools E2E Test

## Context

Create end-to-end tests to validate MCP tooling integration with xAI provider. This completes the provider coverage by following the same pattern as the OpenAI MCP test to provide basic smoke testing for MCP tool discovery and execution.

**Related Feature**: F-mcp-tooling-e2e-test-suite - Basic MCP Tooling E2E Validation
**Dependencies**: T-create-openai-mcp-tools-e2e (Template pattern for provider MCP tests)
**Pattern Reference**: `src/__tests__/e2e/xai/tools.e2e.test.ts`

## Technical Approach

### Implementation Location

- **File**: `src/__tests__/e2e/xai/mcpTools.e2e.test.ts`
- **Pattern**: Follow OpenAI MCP test structure from T-create-openai-mcp-tools-e2e
- **xAI Specifics**: Use xAI-specific helpers and configurations

### Test Structure

Mirror OpenAI MCP test structure with xAI-specific setup:

```typescript
describe("xAI MCP Tool Basic Validation E2E", () => {
  let client: BridgeClient;
  let mcpServer: MockMcpServer;
  let testModel: string;

  beforeAll(async () => {
    // Use xAI test config and helpers
    // Setup MCP server and configuration
  });

  // Same test cases as OpenAI but with xAI provider
});
```

### Model Selection

- **Single Model**: Use one representative xAI model that supports tool calls
- **Model Source**: Get from `defaultLlmModels.ts` xAI provider models with `toolCalls: true`
- **Helper Integration**: Use existing `getXaiTestModel()` patterns

## Specific Implementation Requirements

### xAI-Specific Setup

1. **Environment Validation**: Use existing xAI API key validation patterns
2. **Client Creation**: Use xAI test helpers from `xaiModelHelpers.ts`
3. **Configuration**: Use `xaiTestConfig.ts` patterns for provider setup
4. **Model Selection**: Use `getXaiTestModel()` for model selection

### Test Cases (Identical to OpenAI)

- **MCP Tool Discovery**: Verify MCP tools are discovered during initialization
- **MCP Tool Execution**: Execute MCP tool through xAI model

### xAI-Specific Considerations

- **API Differences**: Account for any xAI-specific API patterns or requirements
- **Response Format**: Ensure xAI responses follow same validation patterns
- **Tool Call Format**: Handle any xAI-specific tool calling patterns
- **Timeout Handling**: Use xAI-appropriate timeouts and retry patterns

## Detailed Acceptance Criteria

### Functional Requirements

- **Tool Discovery**: MCP tools discovered and registered for xAI models
- **Tool Execution**: MCP tools execute correctly through xAI chat requests
- **Response Validation**: xAI + MCP responses pass existing validation
- **Complete Coverage**: All four providers (OpenAI, Anthropic, Google, xAI) have MCP validation

### Test Environment Requirements

- **API Key**: Must respect xAI API key environment variable
- **E2E Flag**: Must respect `E2E_TEST_ENABLED=true` requirement
- **Provider Detection**: Work with existing provider-specific test detection
- **Timeouts**: Use appropriate timeouts for xAI API calls

## Dependencies on Other Tasks

- **T-create-openai-mcp-tools-e2e**: Use as template for implementation pattern
- **Existing xAI Infrastructure**: Build on existing xAI E2E test setup

## Implementation Reference Points

Study these files for xAI-specific patterns:

- **OpenAI MCP Test**: T-create-openai-mcp-tools-e2e implementation (template)
- `src/__tests__/e2e/xai/tools.e2e.test.ts` - xAI test patterns
- `src/__tests__/e2e/shared/xaiModelHelpers.ts` - xAI client creation
- `src/__tests__/e2e/shared/xaiTestConfig.ts` - xAI configuration
- `src/__tests__/e2e/shared/getXaiTestModel.ts` - Model selection

## Out of Scope

- **Provider-Specific Features**: Focus on MCP integration, not xAI-specific features
- **Multiple Models**: Test only one representative xAI model
- **Complex Scenarios**: Basic validation matching OpenAI test scope
- **Error Scenarios**: No dedicated error handling tests

## Implementation Steps

1. Copy OpenAI MCP test structure to xAI directory
2. Replace OpenAI-specific imports with xAI equivalents
3. Update test descriptions and naming for xAI
4. Use xAI test helpers and configuration patterns
5. Adapt any provider-specific setup requirements (xAI API key format, etc.)
6. Ensure test cases validate same MCP functionality as OpenAI
7. Verify integration with existing xAI E2E infrastructure
8. Test with xAI API key and model selection

This task completes the provider coverage for MCP tooling validation, ensuring all four supported providers work with MCP tools using basic smoke testing.
