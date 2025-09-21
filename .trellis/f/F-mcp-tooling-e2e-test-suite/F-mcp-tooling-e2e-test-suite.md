---
id: F-mcp-tooling-e2e-test-suite
title: Basic MCP Tooling E2E Validation
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/mockMcpServer.ts:
    Core Mock MCP Server implementation -
    lightweight JSON-RPC 2.0 compliant server with dynamic port allocation, tool
    registry, and proper error handling
  src/__tests__/e2e/shared/mockMcpServerOptions.ts: Configuration interface for Mock MCP Server options
  src/__tests__/e2e/shared/mcpToolDefinition.ts: MCP tool definition interface for server registry
  src/__tests__/e2e/shared/mockMcpServer.test.ts:
    Comprehensive unit tests with 23
    test cases covering server lifecycle, JSON-RPC protocol compliance, error
    handling, and tool execution
  src/__tests__/e2e/shared/mcpTestEnvironmentInterface.ts: Interface for complete MCP test environment containing server and client
  src/__tests__/e2e/shared/mcpTestEnvironmentOptions.ts: Configuration options for MCP test environment setup
  src/__tests__/e2e/shared/mcpToolResultExpectation.ts: Validation schema interface for MCP tool execution results
  src/__tests__/e2e/shared/mcpTestData.ts: Test data structure interface for consistent MCP testing
  src/__tests__/e2e/shared/createMcpTestEnvironment.ts:
    Helper function to create
    complete MCP test environment with server and connected client
  src/__tests__/e2e/shared/validateMcpToolResult.ts: Validation function for MCP tool execution results against expected criteria
  src/__tests__/e2e/shared/cleanupMcpTestEnvironment.ts: Safe cleanup function for MCP test environments
  src/__tests__/e2e/shared/generateMcpTestData.ts: Test data generation function for consistent MCP testing scenarios
  src/__tests__/e2e/shared/index.ts: Updated barrel export to include all MCP
    testing utilities and type definitions
log: []
schema: v1.0
childrenIds:
  - T-create-anthropic-mcp-tools
  - T-create-google-mcp-tools-e2e
  - T-create-mcp-test-helpers-and
  - T-create-mock-mcp-server-for
  - T-create-openai-mcp-tools-e2e
  - T-create-xai-mcp-tools-e2e-test
created: 2025-09-21T02:33:20.072Z
updated: 2025-09-21T02:33:20.072Z
---

# Basic MCP Tooling End-to-End Validation

## Purpose and Overview

Create basic end-to-end tests to validate that the Model Context Protocol (MCP) tooling integration works across all supported providers (OpenAI, Anthropic, Google, xAI). This is lightweight validation to ensure MCP tools can be discovered and executed through the existing provider APIs, not comprehensive testing.

The MCP implementation from E-mcp-tooling-integration epic has extensive unit tests but needs basic E2E validation to confirm real-world functionality across providers.

## Key Components to Implement

### 1. Simple Mock MCP Server

- **Basic JSON-RPC 2.0 Server**: Minimal implementation for test tool serving
- **Single Test Tool**: One predictable echo-style tool for validation
- **Basic Lifecycle**: Connection and tool discovery only

### 2. Provider Validation Tests

- **Per-Provider Test Files**: `mcpTools.e2e.test.ts` for each provider
- **Single Model Testing**: One representative tool-capable model per provider
- **Basic Tool Execution**: Simple tool call validation matching existing E2E patterns

### 3. Shared Test Utilities

- **Mock Server Helper**: Simple setup/teardown for mock MCP server
- **MCP Configuration Builder**: Helper for creating test MCP configurations
- **Reuse Existing Utilities**: Leverage current E2E shared helpers where possible

## Detailed Acceptance Criteria

### Functional Behavior

- **Mock MCP Server**:
  - Must implement basic JSON-RPC 2.0 with tools/list and tools/call methods
  - Must provide one simple test tool (echo-style) for validation
  - Must handle basic connection establishment

- **Provider Integration**:
  - Each provider (OpenAI, Anthropic, Google, xAI) must have basic MCP tool validation
  - Tests must verify MCP tools can be discovered and executed once per provider
  - MCP tool execution must produce valid response formats
  - Tool registration must work with existing ToolRouter system

- **Configuration Testing**:
  - Must validate basic `mcpServers` configuration works
  - Must test that MCP tools appear in tool registry after initialization

### Error Handling Criteria

- **Basic Connection Handling**: Tests should handle mock server unavailable gracefully
- **Standard Error Integration**: MCP errors should integrate with existing error patterns

### Integration Points

- **BridgeClient Integration**: Tests must validate MCP tools work through normal BridgeClient usage
- **Existing E2E Patterns**: Follow existing provider E2E test structure and timeouts

## Technical Requirements

### Test Structure Organization

```
src/__tests__/e2e/
├── shared/
│   ├── mockMcpServer.ts          # Simple mock MCP server
│   └── mcpTestHelpers.ts         # Basic MCP test utilities
├── openai/
│   └── mcpTools.e2e.test.ts      # OpenAI + MCP basic validation
├── anthropic/
│   └── mcpTools.e2e.test.ts      # Anthropic + MCP basic validation
├── google/
│   └── mcpTools.e2e.test.ts      # Google + MCP basic validation
└── xai/
    └── mcpTools.e2e.test.ts      # xAI + MCP basic validation
```

### Technology Stack Alignment

- **Testing Framework**: Jest with existing E2E configuration
- **Mock Server**: Simple Node.js HTTP server
- **Test Patterns**: Follow existing E2E patterns from provider tests
- **Environment Setup**: Integrate with existing globalSetup.ts

## Dependencies on Other Features

### Prerequisites

- **Completed MCP Implementation**: Requires E-mcp-tooling-integration epic completion (✅ done)
- **Existing E2E Infrastructure**: Builds upon current provider E2E test structure

## Implementation Guidance

### Mock MCP Server Design

- **Keep It Simple**: Minimal JSON-RPC 2.0 implementation with one test tool
- **Single Tool**: Echo-style tool that returns input parameters for validation
- **Local Server**: Bind to localhost with dynamic port allocation

### Test Pattern Consistency

- **Follow Existing Patterns**: Mirror structure from existing provider E2E tests
- **Single Model Testing**: Use one representative model per provider (not all models)
- **Standard Timeouts**: Use existing timeout patterns (25-30 seconds for provider tests)
- **Reuse Validation**: Use existing message schema validation utilities

### Basic Testing Strategy

- **Simple Validation**: Verify MCP tool discovery and single execution per provider
- **Standard Integration**: Test through normal BridgeClient patterns
- **Minimal Configuration**: Basic MCP server configuration without edge cases

## Testing Requirements

### Test Categories

1. **Basic Integration**: Simple MCP tool discovery and execution per provider
2. **Configuration**: Basic MCP server configuration validation
3. **Tool Registration**: Verify MCP tools appear in ToolRouter

### Validation Criteria

- **Tool Discovery**: Verify MCP tools appear in registry after client initialization
- **Tool Execution**: Validate one MCP tool call works per provider
- **Standard Behavior**: Ensure MCP tools work like existing tools

### Test Environment

- **E2E_TEST_ENABLED**: Must respect existing E2E test enablement flag
- **API Keys**: Integrate with existing provider API key validation
- **Mock Server**: Simple local server for testing

This feature provides basic validation that MCP tooling works across all providers without comprehensive testing or additional infrastructure requirements.
