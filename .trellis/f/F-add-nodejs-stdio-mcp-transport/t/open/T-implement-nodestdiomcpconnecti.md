---
id: T-implement-nodestdiomcpconnecti
title: Implement NodeStdioMcpConnection class
status: open
priority: high
parent: F-add-nodejs-stdio-mcp-transport
prerequisites:
  - T-update-runtimeadapter
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T14:15:16.548Z
updated: 2025-09-21T14:15:16.548Z
---

# Implement NodeStdioMcpConnection Class

## Context

This task implements the core STDIO MCP connection class that handles subprocess management and JSON-RPC communication over stdin/stdout streams. This class implements the `McpConnection` interface to provide transport-agnostic MCP communication.

**Related Feature**: F-add-nodejs-stdio-mcp-transport

## Specific Implementation Requirements

### Class Structure

- Create `NodeStdioMcpConnection` class in `src/core/runtime/adapters/nodeStdioMcpConnection.ts`
- Implement `McpConnection` interface (`src/core/runtime/mcpConnection.ts`)
- Follow same patterns as existing HTTP connection implementations

### Core Functionality

1. **Subprocess Management**:
   - Use Node.js `child_process.spawn()` to launch MCP server
   - Configure with `stdio: ['pipe', 'pipe', 'inherit']` for stdin/stdout communication
   - Handle subprocess lifecycle (spawn, monitor, terminate)

2. **JSON-RPC Communication**:
   - Send JSON-RPC messages to subprocess stdin (newline-delimited)
   - Receive JSON-RPC responses from subprocess stdout (newline-delimited)
   - Implement request/response correlation using unique request IDs
   - Handle notifications (no response expected)

3. **Connection Lifecycle**:
   - Implement `isConnected` property based on subprocess state
   - Implement `call<T>()` method for JSON-RPC requests
   - Implement `notify()` method for JSON-RPC notifications
   - Implement `close()` method for cleanup

## Technical Approach

### Class Constructor

```typescript
constructor(
  command: string,
  args: string[] = [],
  options?: McpConnectionOptions
)
```

### Subprocess Communication Pattern

- One JSON object per line for both stdin and stdout
- Use `readline` for parsing stdout responses
- Buffer and parse incoming data line by line
- Handle incomplete JSON messages gracefully

### Request Correlation

- Generate unique request IDs for JSON-RPC calls
- Maintain pending request map for response correlation
- Implement timeout handling for unresponsive requests
- Handle out-of-order responses

### Error Handling

- Subprocess spawn failures
- Subprocess unexpected termination (exit, crash)
- JSON parsing errors from subprocess output
- Communication timeouts
- Resource cleanup on errors

## Detailed Acceptance Criteria

### Interface Implementation

- ✅ Implements `McpConnection` interface completely
- ✅ `isConnected` property reflects subprocess state accurately
- ✅ `call<T>()` method returns properly typed responses
- ✅ `notify()` method sends notifications without expecting responses
- ✅ `close()` method terminates subprocess and cleans up resources

### Subprocess Management

- ✅ Successfully spawns subprocess using provided command and args
- ✅ Configures subprocess with proper stdio piping
- ✅ Handles subprocess spawn failures with clear error messages
- ✅ Detects subprocess termination and updates connection state
- ✅ Properly terminates subprocess on connection close

### JSON-RPC Protocol

- ✅ Sends properly formatted JSON-RPC 2.0 messages to stdin
- ✅ Parses JSON-RPC 2.0 responses from stdout correctly
- ✅ Generates unique request IDs for correlation
- ✅ Correlates responses with pending requests
- ✅ Handles JSON-RPC error responses appropriately
- ✅ Supports both requests (with ID) and notifications (without ID)

### Error Handling

- ✅ Handles subprocess spawn failures gracefully
- ✅ Handles subprocess unexpected termination
- ✅ Handles malformed JSON from subprocess
- ✅ Handles communication timeouts
- ✅ Properly cleans up resources on errors

### Stream Processing

- ✅ Processes newline-delimited JSON from stdout
- ✅ Handles partial JSON messages across multiple data chunks
- ✅ Handles multiple JSON messages in single data chunk
- ✅ Properly encodes JSON messages to stdin with newlines

## Dependencies

**Prerequisites**:

- T-update-runtimeadapter (interface changes must be complete)

**Node.js Modules Required**:

- `child_process` for subprocess management
- `readline` for line-by-line stdout processing
- `events` for event handling patterns

## Security Considerations

- Use `child_process.spawn()` with args array to avoid shell injection
- Pass command arguments via the args array parameter when spawning
- Properly handle subprocess stderr appropriately (inherit to parent)
- Clean up subprocess handles to prevent resource leaks

## Testing Requirements

### Unit Tests (included in this task)

- Test successful subprocess spawning with valid command/args
- Test subprocess spawn failure handling
- Test JSON-RPC request/response cycle
- Test JSON-RPC notification sending
- Test request/response correlation with multiple concurrent requests
- Test subprocess termination detection
- Test connection close and cleanup
- Test malformed JSON handling
- Test partial/multiple JSON message parsing
- Test error propagation from subprocess JSON-RPC errors

### Mock Testing Strategy

- Mock `child_process.spawn()` for unit testing
- Mock subprocess stdin/stdout streams for message testing
- Test error scenarios without requiring actual subprocess failures

## Out of Scope

- Integration with runtime adapters (handled by other tasks)
- Client-level error handling and retry logic (handled by other tasks)
- Configuration validation (handled by schema task)

## Files to Create/Modify

- `src/core/runtime/adapters/nodeStdioMcpConnection.ts` - Main implementation
- `src/core/runtime/adapters/__tests__/nodeStdioMcpConnection.test.ts` - Unit tests

## Implementation Notes

- Follow async/await patterns consistent with existing HTTP connection
- Use existing `RuntimeError` classes for error handling
- Reuse JSON-RPC message structures from existing implementation
- Consider readline interface for robust line-by-line parsing
- Implement proper TypeScript typing for all methods
