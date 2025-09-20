---
id: T-implement-mcp-error-handling
title: Implement MCP error handling and integration with existing error taxonomy
status: open
priority: medium
parent: F-mcp-protocol-core-implementati
prerequisites:
  - T-create-mcp-client-class-with
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T22:57:37.463Z
updated: 2025-09-20T22:57:37.463Z
---

# Implement MCP error handling and integration with existing error taxonomy

## Context

Implement comprehensive error handling for the MCP protocol implementation, integrating MCP-specific errors with the existing error taxonomy. This ensures consistent error handling patterns across the library and provides actionable error messages for developers.

**Related Issues:**

- Parent Feature: F-mcp-protocol-core-implementati
- Epic: E-mcp-tooling-integration
- Prerequisites: T-create-mcp-client-class-with (MCP client foundation)

**Existing Infrastructure:**

- Error taxonomy in `src/core/errors/`
- `BridgeError`, `TransportError`, `ProviderError`, `ToolError` base classes
- Error normalization and serialization framework

## Implementation Requirements

### File Locations

- Create `src/tools/mcp/errors/mcpError.ts` - MCP-specific error types
- Create `src/tools/mcp/errors/mcpErrorNormalizer.ts` - Error mapping logic
- Extend `src/tools/mcp/mcpClient.ts` with error handling

### MCP Error Types

Create `src/tools/mcp/errors/mcpError.ts`:

```typescript
export class McpConnectionError extends TransportError {
  constructor(message: string, serverUrl: string, cause?: Error);
}

export class McpProtocolError extends ProviderError {
  constructor(
    message: string,
    jsonRpcError?: JsonRpcError,
    context?: Record<string, unknown>,
  );
}

export class McpCapabilityError extends ProviderError {
  constructor(
    message: string,
    serverCapabilities: any,
    rejectedFeatures: string[],
  );
}

export class McpToolError extends ToolError {
  constructor(
    message: string,
    toolName: string,
    serverName: string,
    cause?: Error,
  );
}

export class McpSchemaTranslationError extends BridgeError {
  constructor(
    message: string,
    originalSchema: any,
    translationContext?: string,
  );
}
```

### Error Classification

Map various error sources to appropriate error types:

1. **Connection Errors → TransportError**
   - Network failures, timeouts, connection refused
   - TLS/certificate validation failures
   - HTTP-level errors (404, 500, etc.)

2. **Protocol Errors → ProviderError**
   - JSON-RPC 2.0 specification violations
   - MCP protocol handshake failures
   - Invalid message formats and responses

3. **Capability Errors → ProviderError**
   - Server advertising unsupported features (prompts/resources)
   - Protocol version mismatches
   - Missing required capabilities

4. **Tool Errors → ToolError**
   - Tool execution failures on MCP server
   - Invalid tool parameters or responses
   - Tool not found or unavailable

5. **Schema Translation Errors → BridgeError**
   - JSON Schema to Zod conversion failures
   - Invalid or unsupported schema patterns
   - Schema validation failures

### Error Normalizer Implementation

Create `src/tools/mcp/errors/mcpErrorNormalizer.ts`:

```typescript
export class McpErrorNormalizer {
  static normalizeConnectionError(
    error: Error,
    serverUrl: string,
  ): McpConnectionError;

  static normalizeJsonRpcError(
    error: JsonRpcError,
    context: string,
  ): McpProtocolError;

  static normalizeToolExecutionError(
    error: any,
    toolName: string,
    serverName: string,
  ): McpToolError;

  static normalizeCapabilityError(
    capabilities: any,
    rejectedFeatures: string[],
  ): McpCapabilityError;

  static normalizeSchemaError(
    originalSchema: any,
    context: string,
  ): McpSchemaTranslationError;
}
```

### Integration with MCP Client

Extend `McpClient` with comprehensive error handling:

```typescript
export class McpClient {
  // ... existing methods

  private handleConnectionError(error: Error): never {
    throw McpErrorNormalizer.normalizeConnectionError(
      error,
      this.serverConfig.url,
    );
  }

  private handleProtocolError(
    jsonRpcError: JsonRpcError,
    context: string,
  ): never {
    throw McpErrorNormalizer.normalizeJsonRpcError(jsonRpcError, context);
  }

  private handleToolExecutionError(error: any, toolName: string): never {
    throw McpErrorNormalizer.normalizeToolExecutionError(
      error,
      toolName,
      this.serverConfig.name,
    );
  }
}
```

### Error Recovery Strategies

Implement error recovery patterns:

1. **Connection Failures**
   - Exponential backoff for reconnection attempts (max 3 attempts)
   - Graceful degradation when servers become unavailable
   - Clear distinction between temporary vs permanent failures

2. **Protocol Errors**
   - Proper JSON-RPC error responses for malformed requests
   - Recovery from partial message corruption
   - Validation error reporting with actionable guidance

3. **Tool Execution Errors**
   - Retry transient tool execution failures
   - Fallback to alternative tools if available
   - Clear error messages for parameter validation failures

## Technical Approach

### Error Context Enhancement

Enrich errors with MCP-specific context:

```typescript
export interface McpErrorContext {
  serverName: string;
  serverUrl: string;
  protocolVersion?: string;
  requestMethod?: string;
  toolName?: string;
  connectionState: "connecting" | "connected" | "disconnected" | "failed";
}
```

### JSON-RPC Error Mapping

Map JSON-RPC error codes to appropriate error types:

```typescript
const JSON_RPC_ERROR_MAPPING = {
  [-32700]: "Parse error - Invalid JSON received",
  [-32600]: "Invalid Request - JSON-RPC request object is invalid",
  [-32601]: "Method not found - Requested method does not exist",
  [-32602]: "Invalid params - Invalid method parameters",
  [-32603]: "Internal error - Server encountered internal error",
  // Custom MCP error codes
  [-32000]: "Tool execution failed",
  [-32001]: "Tool not found",
  [-32002]: "Invalid tool parameters",
};
```

### Error Message Guidelines

Create consistent, actionable error messages:

- Include server name and URL for connection context
- Specify tool name for tool-related errors
- Provide suggestions for common error scenarios
- Include error codes for programmatic handling
- Maintain user-friendly language while preserving technical details

### Integration with Existing Error Framework

- Follow established error serialization patterns
- Integrate with existing logging framework
- Maintain compatibility with error normalization pipeline
- Preserve error context through async boundaries

## Detailed Acceptance Criteria

### Error Type Integration

- [ ] **MCP-specific errors integrate with existing error taxonomy**
- [ ] All error types extend appropriate base classes (`TransportError`, `ProviderError`, etc.)
- [ ] Error serialization works with existing error framework
- [ ] Error context includes MCP-specific information (server, tool, protocol)

### Error Classification

- [ ] **Network errors mapped to appropriate `TransportError` types**
- [ ] **Protocol errors categorized as `ProviderError` with MCP context**
- [ ] Connection errors provide actionable user guidance
- [ ] Tool execution errors preserve tool and server context
- [ ] Schema translation errors include original schema information

### JSON-RPC Error Handling

- [ ] All JSON-RPC error codes properly mapped to error types
- [ ] JSON-RPC error objects preserved in error context
- [ ] Custom MCP error codes handled appropriately
- [ ] Error correlation IDs maintained for debugging

### Error Recovery Implementation

- [ ] **Error recovery attempts follow established retry patterns**
- [ ] Connection failures trigger exponential backoff (max 3 attempts)
- [ ] Transient errors distinguished from permanent failures
- [ ] Recovery attempts logged for debugging
- [ ] Graceful degradation when recovery is not possible

### Error Message Quality

- [ ] Error messages are actionable and user-friendly
- [ ] Technical details preserved for debugging
- [ ] Server and tool context included in error messages
- [ ] Common error scenarios include suggested resolutions
- [ ] Error codes provided for programmatic handling

## Testing Requirements

### Unit Tests

Create comprehensive test suites:

- `src/tools/mcp/errors/__tests__/mcpError.test.ts`
- `src/tools/mcp/errors/__tests__/mcpErrorNormalizer.test.ts`
- Add error handling tests to existing MCP test suites

### Error Scenario Testing

- **Connection Errors**: Network failures, timeouts, certificate issues
- **Protocol Errors**: Malformed JSON-RPC, invalid responses, version mismatches
- **Tool Errors**: Execution failures, parameter validation, tool not found
- **Schema Errors**: Translation failures, invalid schemas, unsupported features
- **Recovery Scenarios**: Reconnection attempts, error retry logic

### Integration Testing

- Error propagation through tool execution pipeline
- Error handling in concurrent tool executions
- Error context preservation across async boundaries
- Integration with existing error logging and monitoring

## Security Considerations

### Error Information Disclosure

- Sanitize error messages to prevent information leakage
- Avoid exposing internal server details in error messages
- Validate error context to prevent injection attacks
- Limit error message size to prevent DoS attacks

### Error Handling Security

- Prevent error handling paths from becoming attack vectors
- Validate error responses from MCP servers before processing
- Apply rate limiting to error scenarios (prevent error spam)
- Ensure error recovery doesn't bypass security checks

## Performance Requirements

### Error Handling Performance

- Error creation and normalization overhead minimal (<1ms)
- Error recovery attempts don't block other operations
- Error context gathering efficient and non-blocking
- Memory usage for error objects reasonable and bounded

### Error Recovery Performance

- Reconnection attempts complete within reasonable timeframes
- Exponential backoff prevents server overload
- Error recovery doesn't impact healthy connections
- Failed recovery attempts cleaned up promptly

## Dependencies

- `src/core/errors/` - Base error classes and framework
- `src/core/logging/` - Error logging integration
- JSON-RPC 2.0 error specification
- Existing retry and backoff utilities

## Out of Scope

- Custom error recovery strategies beyond standard patterns
- Error analytics and monitoring beyond existing framework
- Complex error correlation across multiple MCP servers
- Error persistence and historical tracking
- User-customizable error messages and translations
