---
id: T-extend-bridgeclientinitializet
title: Extend BridgeClient.initializeToolSystem with MCP tool discovery
status: done
priority: high
parent: F-dynamic-tool-registration
prerequisites:
  - T-add-failure-strategy
affectedFiles:
  src/client/bridgeClient.ts:
    Extended initializeToolSystem() method to integrate
    MCP tool discovery. Added imports for McpClient and McpToolRegistry. Added
    private mcpClients field for connection management. Implemented
    initializeMcpTools() and connectToMcpServer() methods with graceful error
    handling and warning-level logging for connection failures.
  src/client/__tests__/bridgeClientMcpIntegration.test.ts: Created comprehensive
    test suite covering MCP integration scenarios including successful
    initialization, graceful error handling, mixed success/failure scenarios,
    backward compatibility, and proper cleanup. All tests pass with proper
    mocking of MCP components.
log:
  - Successfully extended BridgeClient.initializeToolSystem() method to
    automatically discover and register MCP tools from configured servers during
    client initialization. Implementation includes graceful error handling,
    maintains backward compatibility, and integrates seamlessly with existing
    tool system architecture. All quality checks and comprehensive test suite
    pass.
schema: v1.0
childrenIds: []
created: 2025-09-21T00:42:42.587Z
updated: 2025-09-21T00:42:42.587Z
---

# Extend BridgeClient Initialization with MCP Tool Discovery

## Context

Modify the existing `BridgeClient.initializeToolSystem()` method to automatically discover and register MCP tools from configured servers during client initialization. This integrates MCP tool discovery into the established client lifecycle.

## Implementation Requirements

### BridgeClient Extension

- Extend `initializeToolSystem()` method in `src/client/bridgeClient.ts` (around line 819)
- Add MCP server connection establishment during tool system initialization
- Integrate MCP tool discovery and registration workflow
- Maintain backward compatibility with existing tool system initialization

### MCP Integration Logic

- Check for `config.tools.mcpServers` configuration during initialization
- Create `McpClient` instances for each configured server
- Use existing `McpToolRegistry` class for tool registration workflow
- Handle connection failures gracefully without breaking client initialization
- Apply configured failure strategy from schema

### Error Handling

- MCP connection failures should not prevent client initialization
- Log connection failures as warnings, not errors
- Continue with remaining MCP servers if some fail
- Graceful degradation when no MCP servers are available

### Files to Modify

- `src/client/bridgeClient.ts` - Extend `initializeToolSystem()` method
- Import required MCP classes: `McpClient`, `McpToolRegistry`

## Technical Approach

### Integration Pattern

1. After existing tool registry and router initialization
2. Check if `config.tools.mcpServers` exists and has servers
3. For each server, create `McpClient` and attempt connection
4. Use `McpToolRegistry.registerMcpTools()` for tool discovery
5. Store MCP clients for cleanup on disposal

### Connection Management

- Store active MCP clients as private field for cleanup
- Implement connection lifecycle in initialization sequence
- Handle AbortSignal cancellation properly
- Use existing runtime adapter for MCP connections

## Acceptance Criteria

- [ ] `initializeToolSystem()` checks for MCP server configuration
- [ ] MCP clients created and connected for each configured server
- [ ] MCP tools discovered and registered using existing `McpToolRegistry`
- [ ] Connection failures logged but don't prevent client initialization
- [ ] Tool system initialization completes successfully with or without MCP servers
- [ ] MCP clients stored for proper cleanup on client disposal
- [ ] Existing tool system initialization behavior preserved completely
- [ ] AbortSignal cancellation handled properly throughout MCP initialization
- [ ] Unit tests verify MCP integration in tool system initialization

## Testing Requirements (Include in Implementation)

- Test successful MCP tool discovery and registration
- Test graceful handling of MCP server connection failures
- Test initialization with no MCP servers configured
- Test initialization with empty MCP servers array
- Test that existing tool system functionality remains unchanged
- Mock MCP clients and servers for isolated testing

## Dependencies

- Existing `McpClient` class with connection management
- Existing `McpToolRegistry` class with tool registration logic
- Configured MCP servers in tools configuration schema
- Runtime adapter MCP connection capabilities

## Technical Notes

- Follow existing patterns in `initializeToolSystem()` for consistency
- Use existing logging infrastructure for MCP-related messages
- Maintain the same error handling patterns as existing tool initialization
- Store MCP clients as private field: `private mcpClients: McpClient[] = []`

## Out of Scope

- MCP client implementation (already exists)
- Tool registry implementation (already exists)
- Configuration schema changes (handled by separate task)
- Client disposal logic (handled by separate task)
