---
id: T-update-runtimeadapter
title: Update RuntimeAdapter interface for server configuration objects
status: open
priority: high
parent: F-add-nodejs-stdio-mcp-transport
prerequisites:
  - T-extend-mcp-server-configuratio
affectedFiles: {}
log: []
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
