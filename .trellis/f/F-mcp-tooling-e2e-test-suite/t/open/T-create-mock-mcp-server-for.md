---
id: T-create-mock-mcp-server-for
title: Create Mock MCP Server for E2E Testing
status: open
priority: high
parent: F-mcp-tooling-e2e-test-suite
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T02:41:09.864Z
updated: 2025-09-21T02:41:09.864Z
---

# Create Mock MCP Server for E2E Testing

## Context

Create a lightweight Mock MCP Server to support end-to-end testing of MCP tooling integration. This server will provide predictable responses for MCP protocol testing without requiring external dependencies.

**Related Feature**: F-mcp-tooling-e2e-test-suite - Basic MCP Tooling E2E Validation
**MCP Implementation Reference**: E-mcp-tooling-integration epic (completed)

## Technical Approach

### Implementation Location

- **File**: `src/__tests__/e2e/shared/mockMcpServer.ts`
- **Pattern**: Follow existing shared utility patterns in `src/__tests__/e2e/shared/`
- **Dependencies**: Use Node.js built-in HTTP server, no external dependencies

### JSON-RPC 2.0 Implementation

Based on MCP protocol requirements from existing implementation:

- **Protocol**: Implement basic JSON-RPC 2.0 request/response handling
- **Methods**: Support `tools/list` and `tools/call` methods required by McpClient
- **Initialize**: Support `initialize` method for capability negotiation
- **Error Handling**: Return proper JSON-RPC error responses for invalid requests

### Mock Tool Definition

Create one simple test tool that matches existing E2E patterns:

- **Tool Name**: `mcp_echo_tool` (similar to existing `e2e_echo_tool`)
- **Functionality**: Echo input parameters with timestamp and test metadata
- **Schema**: Input schema with `message: string`, output with `echoed`, `timestamp`, `testSuccess`

## Specific Implementation Requirements

### Server Lifecycle

1. **Start Server**: Bind to localhost with dynamic port allocation
2. **Tool Registry**: Maintain simple in-memory tool registry with one test tool
3. **Connection Handling**: Accept HTTP POST requests for JSON-RPC calls
4. **Shutdown**: Clean shutdown method for test teardown

### JSON-RPC Methods Implementation

```typescript
// tools/list - Return available tools
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [/* tool definitions */]
  }
}

// tools/call - Execute tool
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [/* tool result */]
  }
}

// initialize - Capability negotiation
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "capabilities": { "tools": { "supported": true } },
    "serverInfo": { "name": "MockMcpServer", "version": "1.0.0" }
  }
}
```

### TypeScript Interface

```typescript
export interface MockMcpServerOptions {
  port?: number; // Optional port, defaults to dynamic allocation
  tools?: McpToolDefinition[]; // Allow custom tools for testing
}

export class MockMcpServer {
  start(): Promise<{ port: number; url: string }>;
  stop(): Promise<void>;
  addTool(tool: McpToolDefinition): void;
  clearTools(): void;
}
```

## Detailed Acceptance Criteria

### Functional Requirements

- **JSON-RPC 2.0 Compliance**: All responses must follow JSON-RPC 2.0 specification
- **Tool Discovery**: `tools/list` method returns array of available tools
- **Tool Execution**: `tools/call` method executes tool and returns results
- **Error Handling**: Invalid requests return proper JSON-RPC error responses
- **Dynamic Port**: Server starts on available port and returns URL for client connection

### Integration Requirements

- **McpClient Compatible**: Must work with existing McpClient from `src/tools/mcp/mcpClient.ts`
- **Test Isolation**: Each test can start fresh server instance
- **Clean Shutdown**: Proper resource cleanup when stopped

### Testing Requirements (Unit Tests)

Include comprehensive unit tests in the same file:

- **Server Lifecycle**: Test start/stop functionality
- **JSON-RPC Handling**: Test request parsing and response formatting
- **Tool Operations**: Test tool registration and execution
- **Error Scenarios**: Test invalid requests and error responses
- **Port Allocation**: Test dynamic port allocation works correctly

## Dependencies on Other Tasks

- **None**: This is a foundational task that other tasks will depend on

## Security Considerations

- **Localhost Only**: Server must only bind to localhost (127.0.0.1)
- **No Authentication**: Simple mock server without authentication requirements
- **Input Validation**: Validate JSON-RPC request format to prevent crashes
- **Resource Limits**: Prevent excessive memory usage in tool registry

## Out of Scope

- **Complex MCP Features**: No prompts, resources, or advanced MCP features
- **Production Security**: No TLS, authentication, or production-ready security
- **External Dependencies**: No database, external services, or complex dependencies
- **Performance Optimization**: Basic functionality over performance optimization

## Implementation Steps

1. Create MockMcpServer class with HTTP server setup
2. Implement JSON-RPC 2.0 request/response handling
3. Add tools/list, tools/call, and initialize methods
4. Create default mcp_echo_tool for testing
5. Add server lifecycle management (start/stop)
6. Write comprehensive unit tests
7. Add TypeScript type definitions and documentation

This task creates the foundation for all MCP E2E testing by providing a controlled, predictable MCP server for testing scenarios.
