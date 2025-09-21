---
id: T-create-mcp-test-helpers-and
title: Create MCP Test Helpers and Utilities
status: open
priority: high
parent: F-mcp-tooling-e2e-test-suite
prerequisites:
  - T-create-mock-mcp-server-for
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T02:41:51.483Z
updated: 2025-09-21T02:41:51.483Z
---

# Create MCP Test Helpers and Utilities

## Context

Create shared test utilities to support MCP E2E testing across all providers. These utilities will provide consistent patterns for MCP server setup, configuration creation, and test validation.

**Related Feature**: F-mcp-tooling-e2e-test-suite - Basic MCP Tooling E2E Validation
**Dependencies**: T-create-mock-mcp-server-for (Mock MCP Server implementation)
**Existing Pattern Reference**: `src/__tests__/e2e/shared/` utilities

## Technical Approach

### Implementation Location

- **File**: `src/__tests__/e2e/shared/mcpTestHelpers.ts`
- **Pattern**: Follow existing shared utility patterns from `createTestTool.ts`, `testToolHandler.ts`
- **Integration**: Work with existing BridgeClient and provider helper patterns

### Utility Functions to Implement

#### 1. MCP Configuration Builder

```typescript
export function createMcpTestConfig(serverUrl: string): BridgeConfigSchema {
  // Create test configuration with MCP server
  // Based on existing test config patterns from openAITestConfig.ts
}
```

#### 2. MCP Server Lifecycle Helper

```typescript
export async function setupMcpServer(): Promise<{
  server: MockMcpServer;
  config: BridgeConfigSchema;
  cleanup: () => Promise<void>;
}> {
  // Start mock server and return config + cleanup function
}
```

#### 3. MCP Tool Validation

```typescript
export function validateMcpToolExecution(
  result: unknown,
  expectedEcho: string,
): void {
  // Validate MCP tool execution results match expected format
  // Similar to existing validateMessageSchema patterns
}
```

#### 4. MCP Client Helper

```typescript
export function createMcpTestClient(
  config?: Partial<BridgeConfigSchema>,
): BridgeClient {
  // Create BridgeClient with MCP configuration
  // Based on existing createTestClient patterns
}
```

## Specific Implementation Requirements

### Configuration Integration

- **BridgeConfig Schema**: Use existing BridgeConfigSchema with `tools.mcpServers` array
- **Provider Independence**: Work with any provider configuration
- **Test Isolation**: Each test gets fresh configuration
- **Server URL**: Dynamic server URL from MockMcpServer

### Tool Validation Patterns

- **Response Format**: Validate MCP tool responses match ToolDefinition output schema
- **Metadata Validation**: Check timestamp, testSuccess fields like existing tools
- **Error Scenarios**: Validate error responses follow existing error patterns
- **Schema Compliance**: Ensure responses match expected Zod schemas

### Lifecycle Management

- **Automated Setup**: Helper functions for common setup/teardown patterns
- **Resource Cleanup**: Ensure proper cleanup of servers and clients
- **Port Management**: Handle dynamic port allocation from mock server
- **Error Recovery**: Graceful handling when setup fails

## Detailed Acceptance Criteria

### Functional Requirements

- **MCP Configuration**: `createMcpTestConfig()` creates valid BridgeConfig with MCP servers
- **Server Management**: `setupMcpServer()` starts server and returns cleanup function
- **Tool Validation**: `validateMcpToolExecution()` validates tool results correctly
- **Client Creation**: `createMcpTestClient()` creates working BridgeClient with MCP support

### Integration Requirements

- **Provider Agnostic**: Utilities work with all provider test configurations
- **Existing Patterns**: Follow patterns from `openAIModelHelpers.ts`, `anthropicModelHelpers.ts`
- **Schema Validation**: Use existing validation utilities where possible
- **Error Handling**: Consistent error handling with existing E2E patterns

### Testing Requirements (Unit Tests)

Include unit tests in the same file:

- **Configuration Generation**: Test MCP config creation with various scenarios
- **Server Lifecycle**: Test setup/teardown helpers work correctly
- **Validation Logic**: Test tool execution validation with valid/invalid responses
- **Error Scenarios**: Test helpers handle errors gracefully
- **Cleanup**: Test resource cleanup works properly

## Dependencies on Other Tasks

- **T-create-mock-mcp-server-for**: Requires MockMcpServer implementation
- **Future Provider Tests**: These utilities will be used by all provider-specific tests

## Security Considerations

- **Configuration Validation**: Ensure generated configs pass BridgeConfigSchema validation
- **URL Validation**: Validate mock server URLs are localhost only
- **Input Sanitization**: Validate test inputs to prevent test pollution
- **Resource Limits**: Prevent resource leaks in test setup/teardown

## Implementation Reference Points

Study these existing files for patterns:

- `src/__tests__/e2e/shared/createTestTool.ts` - Tool creation patterns
- `src/__tests__/e2e/shared/testToolHandler.ts` - Tool execution patterns
- `src/__tests__/e2e/shared/openAIModelHelpers.ts` - Client creation patterns
- `src/__tests__/e2e/shared/testHelpers.ts` - Validation patterns
- `src/core/config/bridgeConfigSchema.ts` - Configuration schema

## Out of Scope

- **Provider-Specific Logic**: Keep utilities provider-agnostic
- **Complex Validation**: Basic validation only, not comprehensive testing
- **Production Configuration**: Test-only configurations, not production setups
- **Advanced MCP Features**: Only basic tool discovery/execution support

## Implementation Steps

1. Create `mcpTestHelpers.ts` file following existing shared utility patterns
2. Implement `createMcpTestConfig()` function using BridgeConfigSchema
3. Implement `setupMcpServer()` with MockMcpServer integration
4. Add `validateMcpToolExecution()` function with proper validation
5. Create `createMcpTestClient()` helper following existing client patterns
6. Write comprehensive unit tests for all utilities
7. Add TypeScript types and JSDoc documentation
8. Ensure integration with existing E2E test infrastructure

This task provides the shared foundation that all provider-specific MCP tests will use for consistent testing patterns.
