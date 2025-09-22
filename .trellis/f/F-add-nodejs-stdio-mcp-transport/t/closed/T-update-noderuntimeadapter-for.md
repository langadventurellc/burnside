---
id: T-update-noderuntimeadapter-for
title: Update NodeRuntimeAdapter for transport routing
status: done
priority: high
parent: F-add-nodejs-stdio-mcp-transport
prerequisites:
  - T-implement-nodestdiomcpconnecti
affectedFiles: {}
log:
  - "Task was already completed - verified that NodeRuntimeAdapter correctly
    implements transport routing for both HTTP and STDIO MCP connections. The
    implementation includes: updated method signature to accept McpServerConfig,
    proper transport detection based on url vs command fields, routing to
    appropriate connection implementations (NodeMcpConnection for HTTP,
    NodeStdioMcpConnection for STDIO), configuration validation with clear error
    messages, and comprehensive test coverage. All requirements from the task
    description have been fulfilled."
schema: v1.0
childrenIds: []
created: 2025-09-21T14:15:55.343Z
updated: 2025-09-21T14:15:55.343Z
---

# Update NodeRuntimeAdapter for Transport Routing

## Context

This task updates the `NodeRuntimeAdapter` implementation to route MCP connections based on server configuration type (HTTP vs STDIO) and implements the new `RuntimeAdapter` interface signature. This adapter serves both Node.js and Electron main process environments.

**Related Feature**: F-add-nodejs-stdio-mcp-transport

## Specific Implementation Requirements

### Method Signature Update

- Update `createMcpConnection()` method in `src/core/runtime/adapters/nodeRuntimeAdapter.ts`
- Change from: `createMcpConnection(serverUrl: string, options?)`
- Change to: `createMcpConnection(serverConfig: McpServerConfig, options?)`

### Transport Detection and Routing

1. **Configuration Analysis**:
   - Detect transport type based on presence of `url` vs `command` fields
   - Route to appropriate connection implementation
   - Maintain backward compatibility with URL string inputs

2. **HTTP Transport Routing**:
   - Use existing `NodeMcpConnection` for configurations with `url` field
   - Preserve all existing HTTP transport functionality
   - Pass URL and options to existing HTTP connection implementation

3. **STDIO Transport Routing**:
   - Use new `NodeStdioMcpConnection` for configurations with `command` field
   - Extract command, args, and options for STDIO connection
   - Handle STDIO-specific connection lifecycle

### Configuration Validation

- Validate that server configuration has either `url` OR `command` (not both/neither)
- Provide clear error messages for invalid configurations
- Maintain existing URL validation for HTTP configurations
- Add basic command validation for STDIO configurations

## Technical Approach

### Transport Detection Logic

```typescript
createMcpConnection(serverConfig: McpServerConfig, options?: McpConnectionOptions) {
  if (serverConfig.url) {
    // Route to HTTP transport
    return this.createHttpMcpConnection(serverConfig.url, options);
  } else if (serverConfig.command) {
    // Route to STDIO transport
    return this.createStdioMcpConnection(serverConfig.command, serverConfig.args, options);
  } else {
    // Invalid configuration
    throw new RuntimeError("Server configuration must specify either 'url' or 'command'");
  }
}
```

### HTTP Connection Wrapper

- Extract existing HTTP connection logic into private method
- Preserve all existing functionality and error handling
- Maintain compatibility with existing validation logic

### STDIO Connection Integration

- Import and instantiate `NodeStdioMcpConnection`
- Pass command, args, and options to STDIO connection
- Handle STDIO-specific initialization and error cases

### Backward Compatibility

- Support legacy URL string inputs by converting to configuration objects
- Maintain existing method behavior for URL-only cases
- Preserve all existing error messages and validation

## Detailed Acceptance Criteria

### Interface Compliance

- ✅ Implements updated `RuntimeAdapter.createMcpConnection()` signature
- ✅ Method accepts `McpServerConfig` parameter correctly
- ✅ Returns `Promise<McpConnection>` as specified in interface
- ✅ Compiles without TypeScript errors

### Transport Routing

- ✅ Correctly routes HTTP configurations (with `url`) to existing HTTP connection
- ✅ Correctly routes STDIO configurations (with `command`) to new STDIO connection
- ✅ HTTP transport functionality remains unchanged from existing implementation
- ✅ STDIO transport uses `NodeStdioMcpConnection` class correctly

### Configuration Validation

- ✅ Accepts valid HTTP server configurations
- ✅ Accepts valid STDIO server configurations
- ✅ Rejects configurations with both `url` and `command`
- ✅ Rejects configurations with neither `url` nor `command`
- ✅ Provides clear error messages for invalid configurations

### Error Handling

- ✅ HTTP connection errors are handled identically to existing implementation
- ✅ STDIO connection errors are properly propagated with context
- ✅ Configuration validation errors include helpful details
- ✅ All errors use existing `RuntimeError` patterns

### Platform Coverage

- ✅ Works correctly in Node.js runtime environment
- ✅ Works correctly in Electron main process (shared implementation)
- ✅ Maintains existing platform validation and constraints

## Dependencies

**Prerequisites**:

- T-implement-nodestdiomcpconnecti (STDIO connection class must exist)

**Imports Required**:

- `NodeStdioMcpConnection` from new implementation
- `McpServerConfig` type from configuration schema
- Existing error handling and validation utilities

## Security Considerations

- Validate server configurations to prevent malicious inputs
- Preserve existing HTTP security validations
- Add basic command path validation for STDIO configurations
- Ensure error messages don't leak sensitive information

## Testing Requirements

### Unit Tests (included in this task)

- Test HTTP configuration routing to existing HTTP connection
- Test STDIO configuration routing to new STDIO connection
- Test configuration validation (invalid combinations)
- Test error handling for both transport types
- Test backward compatibility with existing URL inputs
- Test platform-specific behavior (Node.js vs Electron main)

### Test Updates Required

- Update existing `nodeRuntimeAdapter.test.ts` tests for new method signature
- Add new test cases for STDIO transport routing
- Ensure existing HTTP transport tests continue to pass
- Add configuration validation test cases

## Out of Scope

- Changes to HTTP connection implementation (preserve existing)
- Client integration updates (handled by other tasks)
- Electron renderer considerations (not supported)

## Files to Modify

- `src/core/runtime/adapters/nodeRuntimeAdapter.ts` - Main implementation
- `src/core/runtime/adapters/__tests__/nodeRuntimeAdapter.test.ts` - Updated tests

## Implementation Notes

- Preserve all existing HTTP transport functionality exactly
- Use factory pattern for clean transport type routing
- Follow existing error handling patterns and message formats
- Ensure no breaking changes to existing HTTP connection behavior
- Consider helper methods for transport detection and validation
