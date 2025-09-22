---
id: F-add-nodejs-stdio-mcp-transport
title: Add Node.js STDIO MCP Transport
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/config/bridgeConfigSchema.ts: Extended MCP server schema to support
    optional 'url', 'command', and 'args' fields with XOR validation ensuring
    exactly one of 'url' or 'command' is present. Updated JSDoc comments and
    error messages.
  src/core/config/__tests__/bridgeConfigSchema.test.ts: Added comprehensive test
    suite for STDIO MCP server configurations including valid scenarios
    (command-only, command+args, mixed HTTP/STDIO), invalid scenarios
    (conflicting fields, validation errors), and type inference tests.
  src/client/bridgeClient.ts: "Updated connectToMcpServer method signature to
    handle new optional fields and added temporary filtering to only process
    HTTP servers until STDIO implementation is added in future tasks.; Updated
    to pass complete server configuration objects to McpClient constructor
    instead of extracting URL strings.; Updated disconnectMcpClients() and
    unregisterMcpTools() methods to use server names instead of serverUrl
    variable names in logging. Removed temporary HTTP-only filtering in
    initializeMcpTools() and connectToMcpServer() methods to support both HTTP
    and STDIO transport types. Updated logging to show appropriate transport
    information (HTTP: URL or STDIO: command)."
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
    proper error handling for STDIO (to be implemented in future tasks).;
    Updated to support STDIO MCP connections by adding NodeStdioMcpConnection
    import and replacing STDIO placeholder error with actual STDIO connection
    creation logic
  src/core/runtime/adapters/electronRuntimeAdapter.ts:
    Updated createMcpConnection
    method to accept McpServerConfig. Same as Node adapter with appropriate
    error handling for unsupported STDIO configurations.
  src/core/runtime/adapters/reactNativeRuntimeAdapter.ts: Updated
    createMcpConnection method to accept McpServerConfig. HTTP-only support with
    clear error messages for STDIO configurations which are not supported in
    React Native environment.; Added explicit STDIO configuration detection by
    checking serverConfig.command field. Throws RuntimeError with clear error
    message 'STDIO MCP servers are not supported on React Native platform. Use
    HTTP-based MCP servers instead.' using error code
    RUNTIME_MCP_STDIO_NOT_SUPPORTED. Enhanced invalid configuration error
    handling with descriptive message and RUNTIME_MCP_INVALID_CONFIG error code.
    Both errors include comprehensive context with serverConfig, platform, and
    supportedTransports for debugging.
  src/tools/mcp/mcpClient.ts: Updated constructor to accept McpServerConfig
    instead of URL string. Added helper method getServerId() for logging and
    error reporting. Updated all internal references to use server configuration
    objects.; Updated JSDoc examples to show both HTTP and STDIO server
    configurations. Improved getServerId() method to prioritize server name and
    include transport details in parentheses for better identification
    consistency across transport types.
  src/tools/mcp/__tests__/mcpClient.test.ts: Updated test file to use
    urlToMcpServerConfig helper function for converting URL strings to
    configuration objects in test scenarios.; Removed dependency on
    urlToMcpServerConfig utility and updated all tests to use McpServerConfig
    objects directly. Added separate HTTP and STDIO server configurations, new
    test case for STDIO server creation and connection, ensuring both transport
    types work identically through the client interface.
  src/core/runtime/__tests__/nodeRuntimeAdapter.test.ts: Updated to use
    McpServerConfig objects in tests. Added import for urlToMcpServerConfig
    utility and updated all test cases.; Added 5 new test cases for STDIO
    functionality including connection creation, options passing, error
    handling, and validation that neither url nor command scenarios are properly
    handled
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
    "Updated all createMcpConnection calls and error expectations to work with
    the new McpServerConfig interface and proper error handling.; Added 4 new
    comprehensive test cases for STDIO detection functionality: 1) STDIO
    configuration rejection with full error validation including message, code,
    and context, 2) STDIO command-only configuration rejection, 3) HTTP
    configuration preservation verification, 4) Invalid configuration (neither
    url nor command) error handling. Tests validate proper error wrapping by
    outer catch block and use toMatchObject for context validation."
  src/client/__tests__/bridgeClientMcpIntegration.test.ts: "Updated test
    expectations to expect complete McpServerConfig objects with both name and
    url properties instead of URL strings.; Added comprehensive test suite for
    MCP server configuration integration including 7 new test cases: STDIO
    server configurations with and without args, mixed HTTP/STDIO scenarios,
    STDIO connection failure handling, mixed success/failure scenarios,
    transport-agnostic behavior verification, and backward compatibility
    validation. All tests verify correct McpServerConfig objects are passed to
    McpClient constructor."
  src/core/runtime/adapters/nodeStdioMcpConnection.ts: Created complete
    NodeStdioMcpConnection class implementing McpConnection interface with
    subprocess management, JSON-RPC over stdin/stdout, request/response
    correlation, and comprehensive error handling
  src/core/runtime/adapters/__tests__/nodeStdioMcpConnection.test.ts:
    Created comprehensive unit test suite with 28 tests covering all
    functionality including subprocess lifecycle, JSON-RPC communication, error
    scenarios, and timeout handling using Jest fake timers
log:
  - "Auto-completed: All child tasks are complete"
schema: v1.0
childrenIds:
  - T-extend-mcp-server-configuratio
  - T-implement-nodestdiomcpconnecti
  - T-update-bridgeclient-for-mcp
  - T-update-mcpclient-for-server
  - T-update-noderuntimeadapter-for
  - T-update-reactnativeruntimeadapt
  - T-update-runtimeadapter
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
