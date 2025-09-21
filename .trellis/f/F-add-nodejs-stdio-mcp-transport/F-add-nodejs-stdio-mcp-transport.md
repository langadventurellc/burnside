---
id: F-add-nodejs-stdio-mcp-transport
title: Add Node.js STDIO MCP Transport
status: open
priority: medium
parent: none
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T13:54:00.163Z
updated: 2025-09-21T13:54:00.163Z
---

# Add Node.js STDIO MCP Transport Support

## Purpose and Functionality

Add STDIO (Standard Input/Output) transport support for MCP servers in Node.js environments. This enables communication with local MCP servers running as subprocesses through JSON-RPC messages over stdin/stdout streams, complementing the existing HTTP transport.

## Key Components to Implement

### 1. Runtime Adapter Interface Updates

- Update `RuntimeAdapter` interface (`src/core/runtime/runtimeAdapter.ts:138`) to accept server configuration objects
- Change `createMcpConnection()` signature from `(serverUrl: string, options?)` to `(serverConfig: object, options?)`
- Update all adapter implementations to handle both URL and STDIO configurations:
  - `NodeRuntimeAdapter`: Route to HTTP or STDIO connection based on config
  - `ElectronRuntimeAdapter`: Same as Node (shared logic)
  - `ReactNativeRuntimeAdapter`: Handle URL configs only, error on STDIO configs

### 2. STDIO MCP Connection Class

- `NodeStdioMcpConnection` implementing `McpConnection` interface
- Spawns subprocess using Node.js `child_process.spawn()`
- Handles JSON-RPC communication over stdin/stdout (newline-delimited JSON)
- Request/response correlation with unique IDs

### 3. Extended Configuration Schema

- Extend MCP server configuration in `src/core/config/bridgeConfigSchema.ts` (around line 120)
- Add optional `command` (string) and `args` (string[]) fields
- Make `url` field optional when `command` is provided
- Validate that either `url` OR `command` is present

### 4. Client Integration Updates

- Update `McpClient` (`src/tools/mcp/mcpClient.ts`) to accept server configuration objects
- Modify `McpClient` constructor to pass full config to `RuntimeAdapter.createMcpConnection()`
- Update `BridgeClient` (`src/client/bridgeClient.ts`) to pass complete server configurations
- Adapt retry/health monitoring logic to work with server name identifiers instead of URLs

## Detailed Acceptance Criteria

### Runtime Interface Changes

- `RuntimeAdapter.createMcpConnection()` accepts server configuration objects with either `url` or `command` fields
- `NodeRuntimeAdapter` routes to appropriate connection implementation based on config type
- `ElectronRuntimeAdapter` uses same logic as Node (shared adapter)
- `ReactNativeRuntimeAdapter` handles URL configs only, throws clear error for STDIO configs

### Transport Detection and Routing

- `NodeRuntimeAdapter` correctly identifies STDIO servers when `command` field is present
- Routes to `NodeStdioMcpConnection` for STDIO, existing HTTP connection for URL-based configs
- Maintains backward compatibility with existing URL string parameters (internally convert to config object)

### STDIO Communication

- Successfully spawns subprocess using configured `command` and `args`
- Sends JSON-RPC messages to subprocess stdin (one JSON object per line)
- Receives JSON-RPC responses from subprocess stdout (newline-delimited)
- Correlates requests and responses using JSON-RPC request IDs

### Configuration Compatibility

- Existing URL-based MCP server configurations continue working unchanged
- New STDIO configurations with `command` field are accepted and validated
- Schema validation prevents configurations with both `url` and `command`
- Schema validation prevents configurations with neither `url` nor `command`

### Client Integration

- `McpClient` accepts server configuration objects instead of just URL strings
- `BridgeClient` passes complete server configurations to `McpClient`
- Tool discovery (`listTools`) and execution (`callTool`) work identically for both transports
- Connection health monitoring uses server name or command identifier instead of URL

### Basic Error Handling

- Handle subprocess spawn failures with clear error messages
- Handle subprocess unexpected termination
- Parse JSON-RPC errors from subprocess and propagate appropriately
- Clean up subprocess on connection close
- Clear error messages for STDIO on unsupported platforms (React Native)

### Platform Scope

- **Supported**: Node.js runtime and Electron main process (shared `NodeRuntimeAdapter`)
- **Excluded**: Electron renderer, React Native (graceful error handling)

## Implementation Guidance

### Technical Approach

- Use `child_process.spawn()` with `stdio: ['pipe', 'pipe', 'inherit']`
- Implement newline-delimited JSON parsing for stdio streams
- Reuse existing JSON-RPC message structures and error handling patterns
- Follow existing async/await patterns from HTTP implementation

### Code Organization

- Update `RuntimeAdapter` interface in `src/core/runtime/runtimeAdapter.ts`
- Create `NodeStdioMcpConnection` in `src/core/runtime/adapters/nodeStdioMcpConnection.ts`
- Extend configuration schema in `src/core/config/bridgeConfigSchema.ts`
- Update `NodeRuntimeAdapter.createMcpConnection()` method
- Update `ReactNativeRuntimeAdapter.createMcpConnection()` for error handling
- Update `McpClient` constructor and related methods
- Update `BridgeClient` MCP integration points

### Test Updates Required

- Update existing adapter tests (`src/core/runtime/__tests__/nodeRuntimeAdapter.test.ts`) to handle new configuration format
- Update URL validation tests to work with new interface
- Add configuration validation tests for STDIO format
- Update React Native adapter tests to verify STDIO rejection

## Testing Requirements

### Unit Tests Only

- Configuration schema validation for STDIO configurations
- `RuntimeAdapter` interface changes work across all adapters
- `NodeStdioMcpConnection` implements `McpConnection` interface correctly
- JSON-RPC message serialization/parsing over stdio
- Basic error handling scenarios
- Resource cleanup on connection close
- Platform-specific error handling (React Native STDIO rejection)

## Dependencies

- Node.js `child_process` module
- Existing `McpConnection` interface and JSON-RPC infrastructure
- Configuration system in `bridgeConfigSchema.ts`
- `RuntimeAdapter` interface and all adapter implementations
- `McpClient` and `BridgeClient` classes

## Platform Coverage

- **Node.js**: Full STDIO support
- **Electron Main**: Same as Node.js (shared adapter)
- **Electron Renderer**: Excluded (no changes)
- **React Native**: Graceful error handling for STDIO configs
