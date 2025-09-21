---
id: T-add-mcp-connection-cleanup-to
title: Add MCP connection cleanup to BridgeClient disposal
status: open
priority: medium
parent: F-dynamic-tool-registration
prerequisites:
  - T-extend-bridgeclientinitializet
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T00:43:01.553Z
updated: 2025-09-21T00:43:01.553Z
---

# Add MCP Connection Cleanup to BridgeClient Disposal

## Context

Implement proper cleanup of MCP connections and tools when BridgeClient is disposed or finalized. This ensures resource cleanup and prevents connection leaks when clients are destroyed.

## Implementation Requirements

### Disposal Method Implementation

- Add `dispose()` method to `BridgeClient` class if not already present
- Implement MCP connection cleanup in disposal workflow
- Ensure all MCP clients are properly disconnected
- Clean up MCP tools from tool registry

### Cleanup Logic

- Iterate through stored MCP clients and call `disconnect()` on each
- Use stored `McpToolRegistry` instances to unregister MCP tools
- Handle cleanup errors gracefully without throwing
- Log cleanup activities for debugging

### Resource Management

- Ensure cleanup is idempotent (safe to call multiple times)
- Clear internal MCP client storage after cleanup
- Handle async cleanup operations properly
- Prevent memory leaks from unclosed connections

### Files to Modify

- `src/client/bridgeClient.ts` - Add or extend disposal method

## Technical Approach

### Disposal Pattern

1. Check if MCP clients exist and are connected
2. For each MCP client, call disconnect() with proper error handling
3. Use McpToolRegistry to unregister tools from ToolRouter
4. Clear internal MCP client storage
5. Log cleanup completion

### Error Handling

- Catch and log disposal errors without re-throwing
- Continue cleanup even if some connections fail
- Ensure partial cleanup doesn't leave system in inconsistent state

## Acceptance Criteria

- [ ] `dispose()` method properly disconnects all MCP clients
- [ ] MCP tools unregistered from tool router during disposal
- [ ] Cleanup errors logged but don't throw exceptions
- [ ] Disposal method is idempotent and safe to call multiple times
- [ ] Internal MCP client storage cleared after cleanup
- [ ] Disposal completes successfully even with connection failures
- [ ] Memory leaks prevented through proper resource cleanup
- [ ] Unit tests verify complete cleanup behavior

## Testing Requirements (Include in Implementation)

- Test successful disposal with connected MCP clients
- Test disposal with disconnected MCP clients
- Test disposal with no MCP clients initialized
- Test idempotent disposal (calling multiple times)
- Test disposal error handling when connections fail
- Mock MCP clients for isolated testing

## Dependencies

- MCP clients stored from initialization task
- McpToolRegistry instances for tool cleanup
- Existing client disposal patterns in BridgeClient

## Technical Notes

- Follow existing disposal patterns if they exist in BridgeClient
- Use async/await pattern for proper cleanup sequencing
- Store cleanup promises to ensure all disconnections complete
- Add disposal method to public interface if not already present

## Implementation Example Structure

```typescript
async dispose(): Promise<void> {
  if (this.mcpClients.length === 0) return;

  try {
    // Disconnect all MCP clients
    const disconnectPromises = this.mcpClients.map(client =>
      client.disconnect().catch(error =>
        logger.warn('MCP client disconnect failed during disposal', { error })
      )
    );

    await Promise.all(disconnectPromises);

    // Clear storage
    this.mcpClients = [];

    logger.info('MCP connections cleaned up during client disposal');
  } catch (error) {
    logger.error('Error during MCP cleanup', { error });
  }
}
```

## Out of Scope

- Automatic garbage collection handling
- Complex connection recovery during disposal
- Disposal of non-MCP resources (handled by existing code)
