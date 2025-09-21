---
id: T-create-openai-mcp-tools-e2e
title: Create OpenAI MCP Tools E2E Test
status: open
priority: medium
parent: F-mcp-tooling-e2e-test-suite
prerequisites:
  - T-create-mcp-test-helpers-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T02:42:30.351Z
updated: 2025-09-21T02:42:30.351Z
---

# Create OpenAI MCP Tools E2E Test

## Context

Create end-to-end tests to validate MCP tooling integration with OpenAI provider. This test will verify that MCP tools can be discovered and executed through OpenAI models with basic smoke testing.

**Related Feature**: F-mcp-tooling-e2e-test-suite - Basic MCP Tooling E2E Validation
**Dependencies**: T-create-mcp-test-helpers-and (MCP test utilities)
**Pattern Reference**: `src/__tests__/e2e/openai/tools.e2e.test.ts`

## Technical Approach

### Implementation Location

- **File**: `src/__tests__/e2e/openai/mcpTools.e2e.test.ts`
- **Pattern**: Follow existing OpenAI E2E test structure and patterns
- **Integration**: Use MCP test helpers from shared utilities

### Test Structure

Based on existing `tools.e2e.test.ts` pattern:

```typescript
describe("OpenAI MCP Tool Basic Validation E2E", () => {
  let client: BridgeClient;
  let mcpServer: MockMcpServer;
  let testModel: string;

  beforeAll(async () => {
    // Setup similar to existing OpenAI tests
    // Plus MCP server setup and configuration
  });

  afterAll(async () => {
    // Cleanup MCP server and client
  });

  describe("MCP Tool Discovery", () => {
    // Test MCP tool registration works
  });

  describe("MCP Tool Execution", () => {
    // Test MCP tool execution through OpenAI
  });
});
```

### Model Selection

- **Single Model**: Use one representative OpenAI model that supports tool calls
- **Model Source**: Get from `defaultLlmModels.ts` OpenAI provider models with `toolCalls: true`
- **Test Model**: Use existing `getTestModel()` pattern or select first available tool-capable model

## Specific Implementation Requirements

### Test Setup

1. **Environment Validation**: Use existing OpenAI API key validation patterns
2. **MCP Server Setup**: Start MockMcpServer using shared utilities
3. **Client Creation**: Create BridgeClient with MCP configuration using helpers
4. **Model Registration**: Ensure selected model is registered and supports tools

### Test Cases

#### 1. MCP Tool Discovery Test

```typescript
test("should discover MCP tools during client initialization", async () => {
  // Verify MCP tools appear in tool registry
  // Check tool definition matches expected format
  // Ensure tool is accessible through ToolRouter
});
```

#### 2. MCP Tool Execution Test

```typescript
test("should execute MCP tool through OpenAI model", async () => {
  // Create chat request that uses MCP tool
  // Use withTimeout helper for API call
  // Validate response format matches existing tool tests
  // Verify MCP tool execution results
});
```

## Detailed Acceptance Criteria

### Functional Requirements

- **Tool Discovery**: MCP tools are discovered and registered during BridgeClient initialization
- **Tool Execution**: MCP tools can be executed through OpenAI chat requests
- **Response Format**: MCP tool responses match standard tool response format

### Test Environment Requirements

- **API Key**: Must respect `OPENAI_API_KEY` environment variable
- **E2E Flag**: Must respect `E2E_TEST_ENABLED=true` requirement
- **Timeouts**: Use existing timeout patterns (25-30 seconds for provider calls)
- **Error Handling**: Follow existing error handling and validation patterns

### Testing Requirements

- **Test Structure**: Follow existing OpenAI E2E test patterns
- **Validation**: Use existing `validateMessageSchema` and test helpers
- **Isolation**: Each test should be independent with proper setup/teardown

## Dependencies on Other Tasks

- **T-create-mcp-test-helpers-and**: Requires MCP test utilities
- **Future Tasks**: Will be template for other provider MCP tests

## Security Considerations

- **API Key Handling**: Use existing secure API key patterns
- **Server Configuration**: Ensure MCP server is localhost-only for testing
- **Input Validation**: Validate test inputs follow existing security patterns

## Integration Points

- **Existing OpenAI Tests**: Should not interfere with existing OpenAI E2E tests
- **Shared Utilities**: Reuse existing OpenAI test configuration and helpers
- **Global Setup**: Integrate with existing `globalSetup.ts` and `setupEnv.ts`

## Implementation Reference Points

Study these files for patterns:

- `src/__tests__/e2e/openai/tools.e2e.test.ts` - Main reference for test structure
- `src/__tests__/e2e/shared/openAIModelHelpers.ts` - Client creation patterns
- `src/__tests__/e2e/shared/openAITestConfig.ts` - Configuration patterns
- `src/__tests__/e2e/shared/validateApiKey.ts` - API key validation
- `src/__tests__/e2e/shared/withTimeout.ts` - Timeout handling

## Out of Scope

- **Multiple Models**: Test only one representative OpenAI model
- **Complex Scenarios**: Basic validation only, not comprehensive testing
- **Advanced MCP Features**: Only basic tool discovery and execution
- **Error Scenarios**: No dedicated error handling tests
- **Integration Validation**: No comparison to built-in tools

## Implementation Steps

1. Create `mcpTools.e2e.test.ts` file following OpenAI test patterns
2. Set up test environment with OpenAI API key validation
3. Implement MCP server setup using shared utilities
4. Create BridgeClient with MCP configuration
5. Add MCP tool discovery test case
6. Add MCP tool execution test case with OpenAI model
7. Ensure proper cleanup and resource management
8. Validate all tests pass with existing E2E infrastructure

This task establishes the pattern for provider-specific MCP testing that will be replicated for Anthropic, Google, and xAI providers.
