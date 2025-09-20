---
id: T-create-mcp-client-class-with
title: Create MCP client class with connection lifecycle management
status: open
priority: high
parent: F-mcp-protocol-core-implementati
prerequisites: []
affectedFiles: {}
log: []
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
