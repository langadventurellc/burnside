---
id: T-update-mcpclient-for-server
title: Update McpClient for server configuration objects
status: open
priority: high
parent: F-add-nodejs-stdio-mcp-transport
prerequisites:
  - T-update-noderuntimeadapter-for
  - T-update-reactnativeruntimeadapt
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T14:17:11.323Z
updated: 2025-09-21T14:17:11.323Z
---

# Update McpClient for Server Configuration Objects

## Context

This task updates the `McpClient` class to accept server configuration objects instead of URL strings and to work with both HTTP and STDIO transport types. The client needs to pass full configuration objects to the runtime adapter while maintaining its existing API for tool discovery and execution.

**Related Feature**: F-add-nodejs-stdio-mcp-transport

## Specific Implementation Requirements

### Constructor and Configuration Changes

- Update `McpClient` constructor in `src/tools/mcp/mcpClient.ts` (around line 97)
- Change from: `constructor(runtimeAdapter, serverUrl: string, options)`
- Change to: `constructor(runtimeAdapter, serverConfig: McpServerConfig, options)`
- Update internal storage to use configuration object instead of URL string

### Runtime Adapter Integration

- Pass full `serverConfig` object to `runtimeAdapter.createMcpConnection()`
- Remove URL string parameter from runtime adapter calls
- Maintain all existing connection lifecycle management

### Health Monitoring and Retry Logic Updates

- Update connection health monitoring to work without URL identifiers
- Use server name or command for connection identification in logs and errors
- Adapt retry logic to work with server configuration objects
- Update error messages to reference server name instead of URL

### Server Identification

- Use `serverConfig.name` for connection identification in logs and errors
- Create helper methods to generate human-readable server identifiers
- Update all internal logging and error messages to use server names

## Technical Approach

### Constructor Update

```typescript
constructor(
  runtimeAdapter: RuntimeAdapter,
  serverConfig: McpServerConfig,
  options: McpClientOptions = {},
) {
  this.runtimeAdapter = runtimeAdapter;
  this.serverConfig = serverConfig;
  this.serverIdentifier = this.createServerIdentifier(serverConfig);
  // ... rest of initialization
}
```

### Server Identification Helper

```typescript
private createServerIdentifier(config: McpServerConfig): string {
  if (config.url) {
    return `${config.name} (${config.url})`;
  } else if (config.command) {
    return `${config.name} (${config.command})`;
  }
  return config.name;
}
```

### Connection Creation Update

- Pass `serverConfig` directly to `runtimeAdapter.createMcpConnection()`
- Remove URL-based connection logic
- Maintain all existing connection options and error handling

### Monitoring and Logging Updates

- Replace URL references in log messages with server identifiers
- Update health check logging to use server names
- Update error messages to reference server configuration details
- Maintain existing log levels and error reporting patterns

## Detailed Acceptance Criteria

### Constructor and Configuration

- ✅ Constructor accepts `McpServerConfig` parameter instead of URL string
- ✅ Stores server configuration object internally
- ✅ Creates appropriate server identifier for logging and errors
- ✅ Maintains all existing client options and functionality

### Runtime Adapter Integration

- ✅ Passes full server configuration to `runtimeAdapter.createMcpConnection()`
- ✅ Works correctly with both HTTP and STDIO server configurations
- ✅ Connection establishment works identically for both transport types
- ✅ All existing connection lifecycle methods continue working

### Tool Operations

- ✅ `listTools()` method works identically for HTTP and STDIO transports
- ✅ `callTool()` method works identically for HTTP and STDIO transports
- ✅ `discoverTools()` method works identically for both transport types
- ✅ Tool execution results are identical regardless of transport

### Health Monitoring and Retry Logic

- ✅ Connection health monitoring works without URL dependencies
- ✅ Retry logic functions correctly with server configuration objects
- ✅ Health check logging uses server names instead of URLs
- ✅ Reconnection attempts work for both transport types

### Error Handling and Logging

- ✅ Error messages reference server names instead of URLs
- ✅ Log messages use appropriate server identifiers
- ✅ Error context includes relevant configuration details
- ✅ Existing error handling patterns are maintained

### Transport Agnostic Behavior

- ✅ Client behavior is identical for HTTP and STDIO transports
- ✅ No transport-specific logic exposed in client API
- ✅ Connection management abstracts transport details
- ✅ All existing client features work with both transport types

## Dependencies

**Prerequisites**:

- T-update-noderuntimeadapter-for (Node adapter must support new interface)
- T-update-reactnativeruntimeadapt (React Native adapter must support new interface)

**Type Dependencies**:

- `McpServerConfig` type from configuration schema
- Updated `RuntimeAdapter` interface

## Security Considerations

- Ensure server configuration validation is handled by runtime adapters
- Don't log sensitive configuration details in plain text
- Maintain existing connection security patterns
- Preserve existing error handling security practices

## Testing Requirements

### Unit Tests (included in this task)

- Test client initialization with HTTP server configurations
- Test client initialization with STDIO server configurations
- Test tool discovery and execution for both transport types
- Test health monitoring and retry logic with both configurations
- Test error handling and logging with server names
- Test connection lifecycle management for both transports

### Test Updates Required

- Update existing `mcpClient.test.ts` tests for new constructor signature
- Add test cases for STDIO server configurations
- Test server identification and logging functions
- Ensure existing functionality tests pass with both transport types

## Out of Scope

- Changes to tool execution logic (transport-agnostic)
- Runtime adapter implementation details (handled by other tasks)
- Bridge client integration (handled by separate task)

## Files to Modify

- `src/tools/mcp/mcpClient.ts` - Main client implementation
- `src/tools/mcp/__tests__/mcpClient.test.ts` - Updated tests

## Implementation Notes

- Maintain existing public API behavior exactly
- Ensure transport-agnostic client behavior
- Use server names consistently for identification
- Follow existing async/await and error handling patterns
- Preserve all existing client features and functionality
