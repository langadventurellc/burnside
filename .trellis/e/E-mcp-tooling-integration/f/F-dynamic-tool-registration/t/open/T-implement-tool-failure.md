---
id: T-implement-tool-failure
title: Implement tool failure strategy logic in McpToolRegistry
status: open
priority: medium
parent: F-dynamic-tool-registration
prerequisites:
  - T-add-failure-strategy
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T00:43:22.960Z
updated: 2025-09-21T00:43:22.960Z
---

# Implement Tool Failure Strategy Logic in McpToolRegistry

## Context

Extend the existing `McpToolRegistry` class to support configurable failure strategies when MCP connections are lost. This implements the business logic for handling tool unavailability based on user configuration.

## Implementation Requirements

### Strategy Implementation

- Modify `McpToolRegistry` constructor to accept failure strategy configuration
- Implement `"immediate_unregister"` strategy: remove tools immediately on connection loss
- Implement `"mark_unavailable"` strategy: keep tools registered but return connection errors
- Update connection event handlers to apply configured strategy

### Tool Handler Modification

- For `"mark_unavailable"` strategy, modify tool handlers to check connection status
- Return clear error messages when tools are called but connection is lost
- Maintain tool registration in router while preventing execution
- Ensure error messages indicate tool is temporarily unavailable

### Files to Modify

- `src/tools/mcp/mcpToolRegistry.ts` - Add strategy logic and connection event handling
- `src/tools/mcp/mcpToolHandler.ts` - Update to handle unavailable tools for mark_unavailable strategy

## Technical Approach

### Constructor Enhancement

```typescript
constructor(
  mcpClient: McpClient,
  failureStrategy: 'immediate_unregister' | 'mark_unavailable' = 'immediate_unregister'
)
```

### Strategy Logic Implementation

- For `immediate_unregister`: use existing `unregisterMcpTools()` on disconnect
- For `mark_unavailable`: track disconnected state and modify tool handlers
- Update `createConnectionHandlers()` to implement strategy-specific behavior

### Connection State Tracking

- Track connection state in registry for `mark_unavailable` strategy
- Update tool handlers to check connection before execution
- Provide clear error responses when tools are unavailable

## Acceptance Criteria

- [ ] `McpToolRegistry` constructor accepts failure strategy parameter
- [ ] `immediate_unregister` strategy removes tools on connection loss
- [ ] `mark_unavailable` strategy keeps tools but returns connection errors
- [ ] Tool handlers check connection status before execution for unavailable strategy
- [ ] Clear error messages returned when tools are temporarily unavailable
- [ ] Connection event handlers implement strategy-specific behavior
- [ ] Default strategy is `immediate_unregister` when not specified
- [ ] Strategy behavior is consistent and predictable
- [ ] Unit tests verify both strategy implementations

## Testing Requirements (Include in Implementation)

- Test immediate unregister strategy removes tools on disconnect
- Test mark unavailable strategy keeps tools but returns errors
- Test tool execution with both strategies during connection loss
- Test connection recovery restores tool availability
- Test error messages are clear and informative
- Mock connection events for isolated testing

## Dependencies

- Existing `McpToolRegistry` class structure
- Existing `createMcpToolHandler` function
- MCP client connection state management
- Tool router integration for registration/unregistration

## Technical Notes

- Keep existing public interface compatible
- Use existing error types (`McpConnectionError`) for unavailable tools
- Follow established patterns for connection event handling
- Ensure strategy logic is thread-safe for concurrent access

## Error Message Examples

For `mark_unavailable` strategy:

```typescript
throw new McpConnectionError(
  `MCP tool '${toolName}' is temporarily unavailable due to connection loss`,
  { toolName, strategy: "mark_unavailable" },
);
```

## Out of Scope

- Health status tracking (removed per requirements)
- Complex reconnection logic (handled by MCP client)
- Performance monitoring or metrics collection
