---
id: T-create-mcp-client-class-with
title: Create MCP client class with connection lifecycle management
status: done
priority: high
parent: F-mcp-protocol-core-implementati
prerequisites: []
affectedFiles:
  src/tools/mcp/mcpError.ts: Created base MCP error class extending BridgeError
    with MCP-specific error codes and context information
  src/tools/mcp/mcpErrorCodes.ts:
    Defined standardized error codes for connection,
    capability, tool, and protocol errors
  src/tools/mcp/mcpConnectionError.ts:
    Implemented connection-specific error class
    with static factory methods for timeout, refusal, loss, and reconnection
    failures
  src/tools/mcp/mcpCapabilityError.ts:
    Created capability negotiation error class
    with tools-only enforcement and rejection of prompts/resources
  src/tools/mcp/mcpToolError.ts: Implemented tool operation error class for
    discovery, execution, and parameter validation failures
  src/tools/mcp/createMcpError.ts:
    Created error factory functions for convenient
    error creation with proper context
  src/tools/mcp/mcpClientOptions.ts: Defined comprehensive client options
    interface extending base connection options with retry, health monitoring,
    and logging configuration
  src/tools/mcp/mcpClientCapabilities.ts: Created client capabilities interface for tools-only MCP requests
  src/tools/mcp/mcpServerCapabilities.ts: Defined server capabilities interface
    for validation and capability negotiation
  src/tools/mcp/mcpInitializeRequest.ts: Created initialize request interface following MCP protocol specification
  src/tools/mcp/mcpInitializeResponse.ts: Defined initialize response interface for capability negotiation validation
  src/tools/mcp/createToolsOnlyRequest.ts: Implemented function to create
    tools-only capability requests with explicit rejection of prompts/resources
  src/tools/mcp/mcpCapabilities.ts:
    Core capability validation function enforcing
    tools-only scope with comprehensive error handling
  src/tools/mcp/validateInitializeResponse.ts: Response validation function
    ensuring protocol compliance and capability requirements
  src/tools/mcp/mcpClient.ts: Main MCP client class with connection lifecycle
    management, capability negotiation, health monitoring, exponential backoff
    reconnection, and tool operations
  src/tools/mcp/index.ts: Barrel export file providing clean API surface for all MCP functionality
  src/tools/index.ts: Updated main tools exports to include MCP module for Model
    Context Protocol integration
  src/tools/mcp/__tests__/mcpError.test.ts: Comprehensive test suite for all MCP
    error classes with 24 test cases covering error creation, serialization, and
    factory methods
  src/tools/mcp/__tests__/mcpCapabilities.test.ts: Thorough test coverage for
    capability negotiation with 16 test cases covering validation, rejection
    scenarios, and response parsing
  src/tools/mcp/__tests__/mcpClient.test.ts: Complete test suite for McpClient
    with 28 test cases covering connection lifecycle, tool operations, health
    monitoring, error handling, and AbortSignal support
log:
  - Successfully implemented MCP client class with comprehensive connection
    lifecycle management, capability negotiation, and tools-only scope
    enforcement. The implementation includes robust error handling, exponential
    backoff reconnection, health monitoring, and full test coverage. All quality
    checks pass and the module is ready for integration.
schema: v1.0
childrenIds: []
created: 2025-09-20T22:54:34.342Z
updated: 2025-09-20T22:54:34.342Z
---

# Create MCP client class with connection lifecycle management

## Context

Implement the core MCP client class that orchestrates connection lifecycle, capability negotiation, and provides the foundation for tool discovery. This builds on the existing runtime adapter infrastructure with JSON-RPC 2.0 transport already implemented.

**Related Issues:**

- Parent Feature: F-mcp-protocol-core-implementati
- Epic: E-mcp-tooling-integration
- Prerequisite: F-runtime-adapter-mcp-extensions (completed)

**Existing Infrastructure:**

- `McpConnection` interface in `src/core/runtime/mcpConnection.ts`
- Platform-specific connection implementations in runtime adapters
- JSON-RPC 2.0 transport layer already implemented

## Implementation Requirements

### File Location

Create `src/tools/mcp/mcpClient.ts` following the established pattern in `src/tools/` directory.

### Core MCP Client Class

```typescript
export class McpClient {
  // Connection management
  // Capability negotiation
  // Health monitoring
  // Protocol compliance
  // Tools-only scope enforcement
}
```

### Connection Lifecycle Implementation

1. **Connection Initialization**
   - Use runtime adapter's `createMcpConnection()` method
   - Implement MCP handshake protocol per specification
   - Handle connection failures with proper error messages

2. **Capability Negotiation**
   - Send `initialize` request with client capabilities
   - Parse server capabilities response
   - **Explicitly reject servers that advertise prompts/resources**
   - Only proceed with servers that support tools

3. **Health Monitoring**
   - Implement connection status tracking
   - Detect server unavailability
   - Automatic reconnection with exponential backoff (max 3 attempts)

4. **Graceful Termination**
   - Send proper disconnect notifications
   - Clean up resources and close connections

### Protocol Compliance

- Support MCP v1.0 protocol version
- Follow JSON-RPC 2.0 specification (already handled by transport layer)
- Implement proper error handling for protocol violations
- Validate message formats and responses

### Tools-Only Scope Enforcement

- **Reject capability exchanges that include prompts/resources**
- Return clear error messages for unsupported features
- Only process tool-related MCP messages
- Document scope limitations in protocol interactions

### Error Integration

- Map connection errors to existing `TransportError` types
- Map protocol errors to `ProviderError` with MCP context
- Provide actionable error messages for users
- Follow established retry patterns from existing codebase

## Technical Approach

### Class Structure

```typescript
export class McpClient {
  constructor(
    private runtimeAdapter: RuntimeAdapter,
    private serverConfig: McpServerConfig,
    private options: McpClientOptions = {}
  )

  // Connection lifecycle
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  isConnected(): boolean

  // Capability negotiation
  private async negotiateCapabilities(): Promise<ServerCapabilities>
  private validateServerCapabilities(caps: ServerCapabilities): void

  // Health monitoring
  private startHealthMonitoring(): void
  private handleConnectionLoss(): Promise<void>
}
```

### Integration Points

- Use existing `RuntimeAdapter.createMcpConnection()`
- Leverage existing error handling patterns from `src/core/errors/`
- Follow logging patterns from `src/core/logging/`
- Integrate with existing validation framework

## Detailed Acceptance Criteria

### Connection Management

- [ ] Successfully establishes connections using runtime adapter transport
- [ ] Handles connection failures with appropriate error types
- [ ] Implements proper resource cleanup on disconnect
- [ ] Supports AbortSignal cancellation from runtime adapter

### MCP Protocol Compliance

- [ ] Sends correct `initialize` request with client capabilities
- [ ] Parses and validates server capability responses
- [ ] Supports MCP v1.0 protocol version negotiation
- [ ] Handles protocol errors according to specification

### Tools-Only Enforcement

- [ ] **Rejects servers advertising prompt capabilities with clear error**
- [ ] **Rejects servers advertising resource capabilities with clear error**
- [ ] Only accepts servers with tool capabilities
- [ ] Documents scope limitations in error messages

### Health Monitoring

- [ ] Detects connection loss and attempts reconnection
- [ ] Implements exponential backoff (max 3 attempts)
- [ ] Provides connection status through `isConnected()` method
- [ ] Gracefully handles server unavailability

### Error Handling

- [ ] Maps network errors to `TransportError` types
- [ ] Maps protocol errors to `ProviderError` with MCP context
- [ ] Provides actionable error messages for common failures
- [ ] Integrates with existing logging framework

## Testing Requirements

### Unit Tests

Create `src/tools/mcp/__tests__/mcpClient.test.ts` with:

- Connection lifecycle testing (connect, disconnect, status)
- Capability negotiation scenarios (success, rejection)
- Tools-only scope enforcement verification
- Error handling for various failure modes
- Health monitoring and reconnection logic
- Mock runtime adapter and connection implementations

### Test Coverage

- All public methods and error paths
- Protocol compliance scenarios
- Connection failure recovery
- Capability negotiation edge cases

## Security Considerations

- Validate all server responses before processing
- Sanitize error messages to prevent information leakage
- Enforce connection timeouts to prevent resource exhaustion
- Apply rate limiting through existing transport policies

## Performance Requirements

- Connection establishment within 5 seconds
- Capability negotiation within 2 seconds
- Memory usage scales linearly with connections
- Efficient resource cleanup prevents leaks

## Dependencies

- `src/core/runtime/runtimeAdapter.ts` - Transport layer
- `src/core/config/mcpServerConfig.ts` - Server configuration
- `src/core/errors/` - Error handling integration
- `src/core/logging/` - Logging integration

## Out of Scope

- Tool discovery and schema translation (handled by subsequent tasks)
- Tool execution logic (handled by tool registry integration)
- Batch request implementation (future enhancement)
- Authentication support (not in current scope)
