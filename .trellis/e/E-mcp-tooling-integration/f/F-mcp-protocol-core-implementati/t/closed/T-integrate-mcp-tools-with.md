---
id: T-integrate-mcp-tools-with
title: Integrate MCP tools with ToolRouter and dynamic registration
status: done
priority: high
parent: F-mcp-protocol-core-implementati
prerequisites:
  - T-implement-tool-discovery-and
affectedFiles:
  src/tools/mcp/mcpToolHandler.ts: Created function-based ToolHandler
    implementation for MCP tools with connection validation, error handling, and
    response normalization
  src/tools/mcp/mcpToolRegistry.ts: Created dynamic tool lifecycle management
    class with registration/unregistration, connection handlers, and
    comprehensive error handling
  src/tools/mcp/mcpClientOptions.ts: Added onConnect and onDisconnect lifecycle
    callback options for dynamic tool management
  src/tools/mcp/index.ts: Exported new tool integration classes
    (createMcpToolHandler and McpToolRegistry) for public API
log:
  - Successfully implemented MCP tool integration with ToolRouter and dynamic
    registration. Created function-based MCP tool handlers that bridge MCP tool
    execution with the standard ToolHandler interface, enabling seamless tool
    execution through ToolRouter. Implemented McpToolRegistry for dynamic tool
    lifecycle management with automatic registration on connection and cleanup
    on disconnect. Added lifecycle callbacks to McpClientOptions for connection
    event handling. All MCP tools are namespaced with "mcp:" prefix to prevent
    conflicts. Integration includes comprehensive error handling, response
    normalization, and logging. All quality checks pass with full TypeScript
    compatibility.
schema: v1.0
childrenIds: []
created: 2025-09-20T22:56:01.049Z
updated: 2025-09-20T22:56:01.049Z
---

# Integrate MCP tools with ToolRouter and dynamic registration

## Context

Integrate discovered MCP tools with the existing `ToolRouter` and `InMemoryToolRegistry` systems to enable dynamic tool registration, execution, and lifecycle management. This creates a seamless experience where MCP tools work identically to built-in tools.

**Related Issues:**

- Parent Feature: F-mcp-protocol-core-implementati
- Epic: E-mcp-tooling-integration
- Prerequisites: T-implement-tool-discovery-and (tool discovery and schema translation)

**Existing Infrastructure:**

- `ToolRouter` class in `src/core/tools/toolRouter.ts`
- `InMemoryToolRegistry` in `src/core/tools/inMemoryToolRegistry.ts`
- `ToolHandler` interface in `src/core/tools/toolHandler.ts`
- Tool execution pipeline in `src/core/tools/toolExecutionPipeline.ts`

## Implementation Requirements

### File Locations

- Extend `src/tools/mcp/mcpClient.ts` with tool execution methods
- Create `src/tools/mcp/mcpToolHandler.ts` - MCP-specific tool handler
- Create `src/tools/mcp/mcpToolRegistry.ts` - MCP tool management layer

### MCP Tool Handler Implementation

Create `src/tools/mcp/mcpToolHandler.ts`:

```typescript
export class McpToolHandler implements ToolHandler {
  constructor(
    private mcpClient: McpClient,
    private toolName: string
  )

  async handle(params: unknown, context: ToolExecutionContext): Promise<ToolResult>

  private async executeOnMcpServer(params: unknown): Promise<unknown>
  private normalizeResponse(response: unknown): ToolResult
}
```

### Dynamic Tool Registration

Add to `McpClient` class:

```typescript
export class McpClient {
  // ... existing methods

  // Tool registration integration
  async registerToolsWithRouter(toolRouter: ToolRouter): Promise<void>;
  async unregisterToolsFromRouter(toolRouter: ToolRouter): Promise<void>;

  // Tool execution
  async executeTool(toolName: string, params: unknown): Promise<unknown>;

  // Connection loss handling
  private async handleConnectionLoss(toolRouter: ToolRouter): Promise<void>;
  private async handleReconnection(toolRouter: ToolRouter): Promise<void>;
}
```

### MCP Tool Registry Integration

Create `src/tools/mcp/mcpToolRegistry.ts`:

```typescript
export class McpToolRegistry {
  constructor(private mcpClient: McpClient)

  async discoverAndRegisterTools(toolRouter: ToolRouter): Promise<void>
  async refreshTools(toolRouter: ToolRouter): Promise<void>
  async handleConnectionLoss(toolRouter: ToolRouter): Promise<void>

  private createToolHandler(toolDefinition: ToolDefinition): McpToolHandler
  private generateToolId(serverName: string, toolName: string): string
}
```

### Tool Execution Flow

1. **Tool Call Reception**
   - ToolRouter receives tool call for MCP tool
   - Routes to appropriate McpToolHandler
   - Handler validates parameters using translated schema

2. **MCP Server Execution**
   - Send `tools/call` JSON-RPC request to MCP server
   - Include tool name and validated parameters
   - Handle response according to MCP specification

3. **Response Normalization**
   - Convert MCP response to unified `ToolResult` format
   - Apply response schema validation if available
   - Handle errors and format for tool execution pipeline

### Connection Lifecycle Integration

1. **Tool Registration on Connect**
   - Discover tools after successful connection
   - Register all discovered tools with ToolRouter
   - Handle namespace collisions with clear errors

2. **Connection Loss Handling**
   - Detect connection loss through health monitoring
   - Choose strategy: immediate unregister vs. mark unhealthy
   - Provide clear error messages for unavailable tools

3. **Reconnection Recovery**
   - Attempt reconnection with exponential backoff
   - Re-discover tools after successful reconnection
   - Update tool registrations with any schema changes

## Technical Approach

### Tool Naming Strategy

Generate unique tool names to prevent collisions:

```typescript
// Format: "mcp.{serverName}.{toolName}"
const toolId = `mcp.${serverConfig.name}.${mcpTool.name}`;
```

### Tool Handler Implementation

```typescript
export class McpToolHandler implements ToolHandler {
  async handle(
    params: unknown,
    context: ToolExecutionContext,
  ): Promise<ToolResult> {
    // 1. Validate connection
    if (!this.mcpClient.isConnected()) {
      throw new ToolError("MCP server not connected", "CONNECTION_LOST");
    }

    // 2. Execute on MCP server
    const response = await this.mcpClient.executeTool(this.toolName, params);

    // 3. Normalize response
    return this.normalizeResponse(response);
  }
}
```

### Error Handling Strategy

- Map MCP tool execution errors to `ToolError`
- Handle connection errors gracefully
- Provide actionable error messages
- Integrate with existing error recovery patterns

### Registry Integration Pattern

Follow existing patterns from provider implementations:

- Use dependency injection for testability
- Implement proper resource cleanup
- Follow established registration lifecycles
- Maintain compatibility with existing tool system

## Detailed Acceptance Criteria

### Dynamic Tool Registration

- [ ] Successfully registers MCP tools with ToolRouter during connection
- [ ] Generates unique tool identifiers to prevent naming collisions
- [ ] Handles tool registration failures gracefully
- [ ] Supports tool refresh and re-registration
- [ ] Integrates with existing tool validation guardrails

### Tool Execution Integration

- [ ] **MCP tools execute through standard ToolRouter interface**
- [ ] Tool parameters validated using translated schemas
- [ ] **Tool responses normalized to unified ToolResult format**
- [ ] Error handling integrates with existing tool execution pipeline
- [ ] AbortSignal cancellation propagated through MCP protocol

### Connection Lifecycle Management

- [ ] Tools registered automatically after successful MCP connection
- [ ] Connection loss triggers configurable tool handling strategy
- [ ] **Immediate unregister**: Tools removed from registry on connection loss
- [ ] **Mark unhealthy**: Tools remain registered but return connection errors
- [ ] Reconnection attempts re-register tools with updated schemas

### MCP Protocol Compliance

- [ ] Sends `tools/call` requests according to MCP specification
- [ ] Handles tool execution responses correctly
- [ ] Manages tool execution errors per MCP error format
- [ ] Supports concurrent tool executions without blocking

### Integration with Existing Systems

- [ ] **Maintains compatibility with all existing ToolRouter features**
- [ ] Works seamlessly with tool execution pipeline
- [ ] Integrates with existing cancellation and timeout systems
- [ ] Follows established error handling and logging patterns
- [ ] **Preserves all existing tool validation and execution guardrails**

## Testing Requirements

### Unit Tests

Create comprehensive test suites:

- `src/tools/mcp/__tests__/mcpToolHandler.test.ts`
- `src/tools/mcp/__tests__/mcpToolRegistry.test.ts`
- Extend `src/tools/mcp/__tests__/mcpClient.test.ts` with execution tests

### Integration Tests

- Mock MCP server for tool execution scenarios
- Tool registration and lifecycle testing
- Connection loss and recovery scenarios
- Error handling and error propagation
- Tool execution with various parameter types

### Test Coverage Areas

- **Tool Registration**: Success, failure, and collision scenarios
- **Tool Execution**: Parameter validation, response handling, errors
- **Connection Management**: Loss, recovery, tool availability
- **Error Propagation**: MCP errors to ToolError mapping
- **Lifecycle Integration**: Registration, refresh, cleanup

## Security Considerations

### Tool Execution Security

- Validate all tool parameters before sending to MCP server
- Sanitize tool responses before returning to execution pipeline
- Apply timeout limits to prevent hanging tool executions
- Validate tool names to prevent injection attacks

### Connection Security

- Ensure secure connections through runtime adapter validation
- Apply rate limiting to tool execution requests
- Handle untrusted tool responses safely
- Prevent resource exhaustion through concurrent execution limits

## Performance Requirements

### Tool Execution Performance

- Tool execution overhead minimal compared to built-in tools
- Support concurrent tool executions without blocking
- Tool registration completes during client initialization timeframe
- Efficient tool lookup and routing through existing ToolRouter

### Resource Management

- Memory usage scales linearly with number of registered tools
- Efficient cleanup of tool handlers on connection loss
- Tool execution context properly managed and cleaned up
- No resource leaks during tool registration/unregistration cycles

## Dependencies

- `src/core/tools/toolRouter.ts` - Tool routing and execution
- `src/core/tools/inMemoryToolRegistry.ts` - Tool storage
- `src/core/tools/toolHandler.ts` - Tool execution interface
- `src/core/tools/toolResult.ts` - Result format
- `src/core/errors/toolError.ts` - Error handling

## Out of Scope

- Tool versioning and schema evolution (future enhancement)
- Batch tool execution (future enhancement)
- Tool caching and persistence (future enhancement)
- Custom tool execution strategies (future enhancement)
- Tool dependency management between MCP servers (future enhancement)
