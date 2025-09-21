---
id: T-update-runtimeadapter
title: Update RuntimeAdapter interface for server configuration objects
status: done
priority: high
parent: F-add-nodejs-stdio-mcp-transport
prerequisites:
  - T-extend-mcp-server-configuratio
affectedFiles:
  src/core/runtime/runtimeAdapter.ts: "Updated createMcpConnection method
    signature from (serverUrl: string, options?) to (serverConfig:
    McpServerConfig, options?). Added comprehensive JSDoc documentation with
    examples for both HTTP and STDIO configurations."
  src/core/runtime/mcpServerConfig.ts: Created new interface defining
    McpServerConfig type with support for both HTTP (url) and STDIO (command,
    args) configurations. Includes clear documentation and usage examples.
  src/core/runtime/mcpServerConfigUtils.ts: Created utility function
    urlToMcpServerConfig() to convert URL strings to McpServerConfig objects for
    backward compatibility during migration.
  src/core/runtime/adapters/nodeRuntimeAdapter.ts: Updated createMcpConnection
    method to accept McpServerConfig. Currently supports HTTP servers with
    proper error handling for STDIO (to be implemented in future tasks).
  src/core/runtime/adapters/electronRuntimeAdapter.ts:
    Updated createMcpConnection
    method to accept McpServerConfig. Same as Node adapter with appropriate
    error handling for unsupported STDIO configurations.
  src/core/runtime/adapters/reactNativeRuntimeAdapter.ts: Updated
    createMcpConnection method to accept McpServerConfig. HTTP-only support with
    clear error messages for STDIO configurations which are not supported in
    React Native environment.
  src/tools/mcp/mcpClient.ts: Updated constructor to accept McpServerConfig
    instead of URL string. Added helper method getServerId() for logging and
    error reporting. Updated all internal references to use server configuration
    objects.
  src/client/bridgeClient.ts: Updated to pass complete server configuration
    objects to McpClient constructor instead of extracting URL strings.
  src/tools/mcp/__tests__/mcpClient.test.ts: Updated test file to use
    urlToMcpServerConfig helper function for converting URL strings to
    configuration objects in test scenarios.
  src/core/runtime/__tests__/nodeRuntimeAdapter.test.ts: Updated to use
    McpServerConfig objects in tests. Added import for urlToMcpServerConfig
    utility and updated all test cases.
  src/core/runtime/__tests__/runtimeAdapterMcp.test.ts: Updated all test
    expectations to expect McpServerConfig objects instead of URL strings. Fixed
    mock calls and assertions throughout the test suite.
  src/core/runtime/__tests__/runtimeAdapter.test.ts: Updated mock signature to
    match new interface accepting McpServerConfig instead of URL strings.
  src/__tests__/e2e/shared/createMcpTestEnvironment.ts: Updated to use
    urlToMcpServerConfig helper function for test environment setup.
  src/core/runtime/adapters/__tests__/electronRuntimeAdapter.test.ts:
    Updated all createMcpConnection calls to use urlToMcpServerConfig wrapper
    function throughout the comprehensive test suite.
  src/core/runtime/adapters/__tests__/reactNativeRuntimeAdapter.test.ts:
    Updated all createMcpConnection calls and error expectations to work with
    the new McpServerConfig interface and proper error handling.
  src/client/__tests__/bridgeClientMcpIntegration.test.ts: Updated test
    expectations to expect complete McpServerConfig objects with both name and
    url properties instead of URL strings.
log:
  - Successfully updated RuntimeAdapter interface to accept server configuration
    objects instead of URL strings. The core interface changes are complete and
    functional, with comprehensive test coverage and quality checks passing.
schema: v1.0
childrenIds: []
created: 2025-09-21T14:14:37.932Z
updated: 2025-09-21T14:14:37.932Z
---

# Update RuntimeAdapter Interface for Server Configuration Objects

## Context

This task updates the `RuntimeAdapter` interface to accept server configuration objects instead of just URL strings, enabling support for both HTTP and STDIO MCP server types. This is a foundational change that all adapter implementations must follow.

**Related Feature**: F-add-nodejs-stdio-mcp-transport

## Specific Implementation Requirements

### Interface Method Signature Change

- Update `createMcpConnection()` method signature in `src/core/runtime/runtimeAdapter.ts` at line 184
- Change from: `createMcpConnection(serverUrl: string, options?: McpConnectionOptions): Promise<McpConnection>`
- Change to: `createMcpConnection(serverConfig: McpServerConfig, options?: McpConnectionOptions): Promise<McpConnection>`

### Type Definitions

- Import or define `McpServerConfig` type that includes both URL and STDIO configurations
- Update method documentation to reflect the new parameter type
- Ensure the interface supports backward compatibility patterns

### Documentation Updates

- Update JSDoc comments for the `createMcpConnection()` method
- Update method examples to show both HTTP and STDIO configuration usage
- Document the configuration object structure and required fields

## Technical Approach

1. **Update Interface Definition**:
   - Modify the `createMcpConnection()` method signature
   - Import the `McpServerConfig` type from the configuration schema
   - Update parameter documentation

2. **Configuration Type Structure**:

   ```typescript
   type McpServerConfig = {
     name: string;
     url?: string; // For HTTP servers
     command?: string; // For STDIO servers
     args?: string[]; // Optional STDIO arguments
   };
   ```

3. **Backward Compatibility Strategy**:
   - All adapter implementations will need to handle both configuration formats
   - Consider creating helper functions to detect transport type
   - Document migration path for existing code

## Detailed Acceptance Criteria

### Interface Changes

- ✅ `RuntimeAdapter.createMcpConnection()` accepts `McpServerConfig` parameter
- ✅ Method signature compiles without TypeScript errors
- ✅ JSDoc documentation accurately describes new parameter structure
- ✅ Method examples show both HTTP and STDIO configurations

### Type Safety

- ✅ `McpServerConfig` type is properly imported/referenced
- ✅ Configuration object structure supports discriminating between transport types
- ✅ TypeScript compilation succeeds across the entire codebase

### Documentation Quality

- ✅ Method documentation clearly explains configuration object structure
- ✅ Examples demonstrate proper usage for both transport types
- ✅ Migration guidance provided for existing URL-based calls

## Dependencies

**Prerequisites**:

- T-extend-mcp-server-configuratio (schema changes must be complete)

**Dependent Tasks**: All adapter implementation tasks depend on this interface change

## Security Considerations

- Configuration object validation will be handled by individual adapter implementations
- Interface change itself does not introduce security risks
- Documentation should note validation requirements for implementers

## Testing Requirements

### Unit Tests (included in this task)

- Test that interface compiles with new signature
- Verify TypeScript type checking works correctly
- Ensure no breaking changes to interface contract
- Test that existing interface tests can be updated to new signature

### Integration Impact

- Note: Actual adapter implementations will be tested in their respective tasks
- This task focuses on interface definition correctness

## Out of Scope

- Adapter implementation changes (handled by separate tasks)
- Client code updates to use new interface (handled by separate tasks)
- Actual transport logic implementation (handled by separate tasks)

## Files to Modify

- `src/core/runtime/runtimeAdapter.ts` - Main interface definition
- `src/core/runtime/__tests__/runtimeAdapter.test.ts` - Interface tests (if they exist)

## Implementation Notes

- This is a breaking change to the interface that will require all adapters to be updated
- Consider the update order: interface first, then all implementations
- Ensure clear type definitions to make adapter updates straightforward
