---
id: T-update-bridgeclient-for-mcp
title: Update BridgeClient for MCP server configuration integration
status: open
priority: high
parent: F-add-nodejs-stdio-mcp-transport
prerequisites:
  - T-update-mcpclient-for-server
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T14:17:46.586Z
updated: 2025-09-21T14:17:46.586Z
---

# Update BridgeClient for MCP Server Configuration Integration

## Context

This task updates the `BridgeClient` class to pass complete MCP server configuration objects to `McpClient` instances instead of just URL strings. This enables the bridge client to support both HTTP and STDIO MCP servers seamlessly.

**Related Feature**: F-add-nodejs-stdio-mcp-transport

## Specific Implementation Requirements

### MCP Client Instantiation Updates

- Update `BridgeClient` MCP integration points in `src/client/bridgeClient.ts`
- Locate MCP client creation logic and update to pass full server configurations
- Replace URL string parameters with complete `McpServerConfig` objects
- Maintain all existing MCP client functionality and lifecycle management

### Configuration Source Integration

- Ensure BridgeClient accesses extended MCP server configurations from bridge config
- Support both HTTP (URL-based) and STDIO (command-based) server configurations
- Maintain configuration validation and error handling for both types

### Client Lifecycle Management

- Update MCP client initialization to work with server configuration objects
- Preserve all existing client lifecycle patterns (creation, connection, cleanup)
- Maintain error handling and logging for MCP client operations
- Ensure tool discovery and execution work with both transport types

### Error Handling Updates

- Update error messages to reference server names instead of URLs
- Maintain existing error context and logging patterns
- Ensure clear error messages for both HTTP and STDIO configuration issues

## Technical Approach

### Configuration Object Passing

```typescript
// Before
const mcpClient = new McpClient(runtimeAdapter, serverUrl, options);

// After
const mcpClient = new McpClient(runtimeAdapter, serverConfig, options);
```

### Server Configuration Access

- Access MCP server configurations from bridge configuration
- Handle both HTTP and STDIO configuration formats
- Validate configurations before passing to MCP clients

### Error Message Updates

- Replace URL references in error messages with server names
- Maintain existing error reporting and logging levels
- Include relevant configuration details in error context

## Detailed Acceptance Criteria

### MCP Client Integration

- ✅ BridgeClient passes complete server configuration objects to McpClient
- ✅ MCP client instantiation works with both HTTP and STDIO configurations
- ✅ All existing MCP client functionality is preserved
- ✅ Tool discovery and execution work identically for both transport types

### Configuration Handling

- ✅ BridgeClient reads extended MCP server configurations correctly
- ✅ Both HTTP and STDIO server configurations are supported
- ✅ Configuration validation works for both transport types
- ✅ Invalid configurations produce clear error messages

### Client Lifecycle Management

- ✅ MCP client creation and initialization work with new configuration format
- ✅ Client connection management works for both transport types
- ✅ Client cleanup and disposal function correctly
- ✅ All existing client lifecycle patterns are maintained

### Error Handling and Logging

- ✅ Error messages reference server names instead of URLs where appropriate
- ✅ Log messages use appropriate server identifiers
- ✅ Error context includes relevant configuration details
- ✅ Existing error handling and reporting patterns are preserved

### Backward Compatibility

- ✅ Existing HTTP-based MCP server configurations continue working unchanged
- ✅ Bridge client behavior is identical for HTTP transport
- ✅ No breaking changes to existing bridge client API
- ✅ All existing bridge client tests continue to pass

### Transport Transparency

- ✅ BridgeClient behavior is identical for HTTP and STDIO transports
- ✅ No transport-specific logic exposed in bridge client API
- ✅ MCP operations work seamlessly regardless of transport type
- ✅ Tool integration patterns work for both transport types

## Dependencies

**Prerequisites**:

- T-update-mcpclient-for-server (McpClient must accept configuration objects)

**Configuration Dependencies**:

- Extended MCP server configuration schema
- Access to bridge configuration with MCP server definitions

## Security Considerations

- Ensure configuration validation is properly delegated to lower layers
- Don't expose sensitive configuration details in client-level logs
- Maintain existing security patterns for MCP client operations
- Preserve existing error handling security practices

## Testing Requirements

### Unit Tests (included in this task)

- Test bridge client initialization with HTTP MCP server configurations
- Test bridge client initialization with STDIO MCP server configurations
- Test MCP tool discovery and execution through bridge client
- Test error handling for invalid MCP server configurations
- Test client lifecycle management for both transport types
- Test backward compatibility with existing HTTP configurations

### Test Updates Required

- Update existing `bridgeClient.test.ts` tests to cover new configuration handling
- Add test cases for STDIO MCP server integration
- Test configuration validation and error handling
- Ensure existing MCP integration tests pass with updated implementation

## Out of Scope

- Changes to bridge client core functionality (preserve existing)
- Runtime adapter or MCP client implementation details (handled by other tasks)
- Configuration schema changes (handled by other tasks)

## Files to Modify

- `src/client/bridgeClient.ts` - Main bridge client implementation
- `src/client/__tests__/bridgeClient.test.ts` - Updated tests for MCP integration
- Additional MCP integration test files if they exist

## Implementation Notes

- Locate existing MCP client instantiation points in BridgeClient
- Update to pass server configuration objects instead of URL strings
- Preserve all existing bridge client functionality and patterns
- Follow existing error handling and logging conventions
- Maintain transport-agnostic bridge client behavior
- Ensure no breaking changes to existing bridge client API
