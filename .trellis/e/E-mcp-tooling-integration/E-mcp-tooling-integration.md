---
id: E-mcp-tooling-integration
title: MCP Tooling Integration
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/config/bridgeConfigSchema.ts: Extended tools object schema with
    optional mcpServers field including name/URL validation, HTTP/HTTPS protocol
    enforcement, and server name uniqueness constraints
  src/core/config/__tests__/bridgeConfigSchema.test.ts: Added comprehensive unit
    tests for MCP server validation covering valid/invalid configurations,
    protocol validation, duplicate name detection, and integration scenarios
  src/core/config/mcpServerSchema.ts:
    Created Zod schema for individual MCP server
    configuration with name and URL validation including HTTP/HTTPS protocol
    enforcement
  src/core/config/mcpServersArraySchema.ts: Created Zod schema for MCP servers
    array with uniqueness validation and optional handling
  src/core/config/mcpServerConfig.ts: Created TypeScript type for individual MCP
    server configuration derived from Zod schema
  src/core/config/mcpServerConfigs.ts: Created TypeScript type for MCP servers
    array extracted from BridgeConfigSchema tools section
  src/core/config/validateMcpServerConfig.ts: Created type guard function for
    validating MCP server configuration using schema parsing
  src/core/config/validateMcpServerConfigs.ts: Created type guard function for
    validating MCP servers array using schema parsing
  src/core/config/index.ts: Updated to export all new MCP configuration types,
    schemas, and validation functions
  src/core/config/__tests__/mcpServerConfig.test.ts: Created comprehensive test
    suite with 27 test cases covering schema validation, type guards, edge
    cases, and TypeScript type compatibility
  src/core/config/toolsConfig.ts: Updated JSDoc documentation to include
    comprehensive MCP server configuration examples showing name and URL fields
    with realistic usage scenarios
  src/core/config/mcpServerTypes.ts: Created new file exporting McpServerConfig
    type for individual MCP server configuration with proper type inference from
    BridgeConfigSchema
  src/core/runtime/mcpConnectionOptions.ts: Created new interface for MCP
    connection options with AbortSignal support, timeout configuration, and
    custom headers following RequestInit pattern
  src/core/runtime/mcpConnection.ts: Created new interface for JSON-RPC 2.0 MCP
    connections with call, notify, close methods and connection state management
  src/core/runtime/runtimeAdapter.ts: Extended RuntimeAdapter interface with
    createMcpConnection method including comprehensive JSDoc documentation and
    examples
  src/core/runtime/index.ts: Added exports for new MCP types following existing patterns
  src/core/runtime/adapters/nodeRuntimeAdapter.ts:
    Added no-op createMcpConnection
    implementation with proper error handling to prevent breaking changes;
    Implemented complete MCP connection functionality including
    NodeMcpConnection class with JSON-RPC 2.0 support, URL validation with
    Node.js-appropriate restrictions, createMcpConnection method with proper
    error handling, and AbortSignal cancellation support
  src/core/runtime/adapters/electronRuntimeAdapter.ts: Added no-op
    createMcpConnection implementation with proper error handling to prevent
    breaking changes; Implemented complete MCP connection functionality
    including ElectronMcpConnection class with JSON-RPC 2.0 support, security
    URL validation with privileged port blocking, process-aware transport
    configuration, and proper error handling with AbortSignal cancellation
    support
  src/core/runtime/adapters/reactNativeRuntimeAdapter.ts: Added no-op
    createMcpConnection implementation with proper error handling to prevent
    breaking changes; Implemented complete createMcpConnection method with
    HTTP/HTTPS protocol validation and remote-only constraints, replacing the
    previous no-op implementation
  src/core/runtime/__tests__/mcpConnectionOptions.test.ts: Created comprehensive
    test suite with 14 tests covering type safety, optional properties,
    AbortSignal integration, and TypeScript compilation
  src/core/runtime/__tests__/mcpConnection.test.ts: Created comprehensive test
    suite with 16 tests covering interface structure, method signatures,
    JSON-RPC compliance, and real-world usage patterns
  src/core/runtime/__tests__/runtimeAdapterMcp.test.ts:
    Created comprehensive test
    suite with 9 tests covering interface compliance, method integration, type
    safety, and error handling
  src/core/agent/cancellation/__tests__/cancellationManager.test.ts: Added createMcpConnection mock to prevent breaking changes in existing test
  src/core/agent/cancellation/__tests__/streamCancellationHandler.test.ts: Added createMcpConnection mock to prevent breaking changes in existing test
  src/core/runtime/__tests__/adapterRegistry.test.ts: Added createMcpConnection mock to prevent breaking changes in existing test
  src/core/runtime/__tests__/runtimeAdapter.test.ts: Added createMcpConnection
    mock with proper typing to prevent breaking changes in existing test
  src/core/runtime/adapters/__tests__/electronRuntimeAdapter.test.ts:
    Added comprehensive test suite with 38 total tests covering MCP connection
    creation, security validation (URL format, protocol validation, privileged
    port blocking), JSON-RPC operations (call, notify, close), error handling,
    and AbortSignal cancellation support
  src/core/runtime/__tests__/nodeRuntimeAdapter.test.ts:
    Added comprehensive test
    suite with 18 new tests covering MCP connection creation, JSON-RPC protocol
    operations (call/notify/close), URL validation, error handling, and
    AbortSignal cancellation scenarios
  src/core/runtime/adapters/reactNativeMcpConnection.ts: Created new
    ReactNativeMcpConnection class implementing McpConnection interface with
    JSON-RPC 2.0 support, including call, notify, and close methods with proper
    error handling
  src/core/runtime/adapters/__tests__/reactNativeRuntimeAdapter.test.ts:
    Added comprehensive test coverage for MCP functionality with 16 new tests
    covering connection creation, URL validation, JSON-RPC operations, error
    handling, and localhost/private IP acceptance for testing
  src/tools/mcp/mcpError.ts: Created base MCP error class extending BridgeError
    with MCP-specific error codes and context information
  src/tools/mcp/mcpErrorCodes.ts:
    Defined standardized error codes for connection,
    capability, tool, and protocol errors
  src/tools/mcp/mcpConnectionError.ts:
    Implemented connection-specific error class
    with static factory methods for timeout, refusal, loss, and reconnection
    failures
  src/tools/mcp/mcpCapabilityError.ts:
    Created capability negotiation error class
    with tools-only enforcement and rejection of prompts/resources
  src/tools/mcp/mcpToolError.ts: Implemented tool operation error class for
    discovery, execution, and parameter validation failures
  src/tools/mcp/createMcpError.ts:
    Created error factory functions for convenient
    error creation with proper context
  src/tools/mcp/mcpClientOptions.ts: Defined comprehensive client options
    interface extending base connection options with retry, health monitoring,
    and logging configuration
  src/tools/mcp/mcpClientCapabilities.ts: Created client capabilities interface for tools-only MCP requests
  src/tools/mcp/mcpServerCapabilities.ts: Defined server capabilities interface
    for validation and capability negotiation
  src/tools/mcp/mcpInitializeRequest.ts: Created initialize request interface following MCP protocol specification
  src/tools/mcp/mcpInitializeResponse.ts: Defined initialize response interface for capability negotiation validation
  src/tools/mcp/createToolsOnlyRequest.ts: Implemented function to create
    tools-only capability requests with explicit rejection of prompts/resources
  src/tools/mcp/mcpCapabilities.ts:
    Core capability validation function enforcing
    tools-only scope with comprehensive error handling
  src/tools/mcp/validateInitializeResponse.ts: Response validation function
    ensuring protocol compliance and capability requirements
  src/tools/mcp/mcpClient.ts: Main MCP client class with connection lifecycle
    management, capability negotiation, health monitoring, exponential backoff
    reconnection, and tool operations; Enhanced existing McpClient with
    discoverTools() and getToolDefinition() methods for Bridge-compatible tool
    discovery
  src/tools/mcp/index.ts: Barrel export file providing clean API surface for all
    MCP functionality; Updated module exports to include new tool types and
    schema translation functions
  src/tools/index.ts: Updated main tools exports to include MCP module for Model
    Context Protocol integration
  src/tools/mcp/__tests__/mcpError.test.ts: Comprehensive test suite for all MCP
    error classes with 24 test cases covering error creation, serialization, and
    factory methods
  src/tools/mcp/__tests__/mcpCapabilities.test.ts: Thorough test coverage for
    capability negotiation with 16 test cases covering validation, rejection
    scenarios, and response parsing
  src/tools/mcp/__tests__/mcpClient.test.ts: Complete test suite for McpClient
    with 28 test cases covering connection lifecycle, tool operations, health
    monitoring, error handling, and AbortSignal support
  src/tools/mcp/mcpJsonSchema.ts: Created MCP JSON Schema interface aligned with
    ToolDefinition JSON schema format for compatibility
  src/tools/mcp/mcpToolDefinition.ts: Created MCP tool definition interface
    matching MCP protocol specification for tool discovery
  src/tools/mcp/mcpToolCall.ts: Created MCP tool call interface for tool invocation parameters
  src/tools/mcp/mcpToolResultContent.ts: Created MCP tool result content interface for individual content items
  src/tools/mcp/mcpToolResult.ts: Created MCP tool result interface for tool execution responses
  src/tools/mcp/translateMcpToToolDefinition.ts: Implemented function to convert
    MCP tool definitions to Bridge ToolDefinition format with validation
  src/tools/mcp/translateToolDefinitionToMcp.ts: Implemented reverse translation
    function from ToolDefinition to MCP format handling both Zod and JSON
    schemas
  src/tools/mcp/validateMcpToolDefinition.ts:
    Created validation function for MCP
    tool definitions with JSON Schema validation
  src/tools/mcp/__tests__/translateMcpToToolDefinition.test.ts:
    Created comprehensive test suite covering translation scenarios, validation
    errors, and edge cases with 11 passing tests
log: []
schema: v1.0
childrenIds:
  - F-dynamic-tool-registration
  - F-mcp-configuration-schema
  - F-mcp-protocol-core-implementati
  - F-runtime-adapter-mcp-extensions
created: 2025-09-20T19:01:02.627Z
updated: 2025-09-20T19:01:02.627Z
---

# MCP Tooling Integration Epic

## Purpose and Goals

Integrate Model Context Protocol (MCP) tooling support into the LLM Bridge library, enabling dynamic discovery and execution of tools from MCP servers. This epic implements Phase 12 of the implementation plan while maintaining architectural consistency with the existing runtime adapter system and configuration framework.

**Scope Limitation**: This epic supports MCP tools ONLY. MCP prompts and resources are explicitly out of scope and will not be implemented.

## Major Components and Deliverables

### 1. Configuration Schema Extensions

- Extend `BridgeConfigSchema` and `ToolsConfig` to support MCP server definitions
- Add MCP-specific validation with platform constraints (React Native remote-only)
- Include basic connection parameters (no authentication)
- Comprehensive test coverage for new configuration schemas

### 2. Runtime Adapter Extensions

- Extend existing runtime adapters (`NodeRuntimeAdapter`, `ElectronRuntimeAdapter`, `ReactNativeRuntimeAdapter`) with MCP connection capabilities
- Add MCP-specific transport methods that reuse existing fetch/stream facilities
- React Native must use existing lazy-loaded `react-native-sse` for remote connections
- Maintain centralized platform detection and transport choice

### 3. MCP Core Implementation

- JSON-RPC 2.0 communication layer integrated with runtime adapters
- Connection lifecycle management (initialization, capability negotiation, termination)
- Tool discovery and schema translation between MCP and unified `ToolDefinition`
- **Tools only**: No support for MCP prompts or resources

### 4. Dynamic Tool Registration System

- Extend `ToolRouter` and `InMemoryToolRegistry` for dynamic tool discovery
- Integration with existing `BridgeClient.initializeToolSystem` lifecycle
- Tool removal/connection loss handling
- Maintain existing validation and registration guardrails

### 5. Transport Integration

- Reuse existing HTTP transport infrastructure for rate limiting, retries, and AbortSignals
- MCP transport abstraction that leverages `RuntimeAdapter.fetch` and `RuntimeAdapter.stream`
- React Native transport must utilize existing `react-native-sse` lazy-loading mechanism

## Detailed Acceptance Criteria

### Configuration Integration

- [ ] `BridgeConfigSchema` extended with `mcpServers` field supporting server definitions
- [ ] Platform constraints enforced (React Native remote-only) through Zod validation
- [ ] Basic connection parameters integrated into config validation (no authentication)
- [ ] All new configuration schemas have 100% test coverage

### Runtime Adapter Integration

- [ ] All three runtime adapters extended with MCP capabilities without duplicating platform detection logic
- [ ] MCP connections reuse existing `fetch`/`stream` methods for transport policies
- [ ] React Native adapter enforces remote-only constraint and uses existing `react-native-sse` lazy-loading
- [ ] No separate platform-specific MCP layers created outside adapter system

### Tool System Integration

- [ ] `ToolRouter` supports dynamic tool registration and removal
- [ ] MCP tools integrate seamlessly with existing `InMemoryToolRegistry`
- [ ] Tool discovery occurs during `BridgeClient.initializeToolSystem` phase
- [ ] Tool removal on connection loss handled (configurable: immediate unregister vs. mark unhealthy)
- [ ] All existing tool validation and execution guardrails preserved

### MCP Protocol Implementation - Tools Only

- [ ] Complete JSON-RPC 2.0 client implementation with proper error handling
- [ ] Connection lifecycle properly managed (init, capability negotiation, termination)
- [ ] Tool schema translation between MCP format and unified `ToolDefinition`
- [ ] **MCP prompts and resources explicitly rejected/ignored**
- [ ] Only MCP tool definitions processed and registered

### Transport and Performance

- [ ] All MCP connections utilize existing rate limiting and retry policies
- [ ] AbortSignal cancellation propagated through MCP protocol boundaries
- [ ] React Native uses existing `react-native-sse` implementation for SSE connections
- [ ] Remote MCP servers work across Node.js, Electron, and React Native

### Testing and Validation

- [ ] **Unit tests with mock MCP server/client round-trip validation**
- [ ] **Mock MCP server tests verify tool discovery and execution flow**
- [ ] Error handling tests for connection failures and invalid responses
- [ ] Configuration validation tests for all new schema additions

### Error Handling and Reliability

- [ ] MCP-specific errors integrate with existing error taxonomy
- [ ] Connection failures handled gracefully without affecting other tools
- [ ] Comprehensive logging integration with existing logging framework

## Technical Considerations

### Architecture Alignment

- Follows established plugin architecture pattern used by provider implementations
- Leverages existing runtime adapter system without duplication
- Maintains centralized configuration validation and type safety
- Preserves existing tool system guardrails and validation

### Dependencies

- None (standalone epic)
- Builds upon existing tool system foundation
- Requires no breaking changes to current API

### Integration Points

- `BridgeClient.initializeToolSystem()` - Tool registration lifecycle
- `RuntimeAdapter` extensions - Platform-specific transport
- `ToolRouter`/`ToolRegistry` - Dynamic tool management
- `BridgeConfigSchema` - Configuration validation

## User Stories

### As a Developer

- I want to configure MCP servers in my `BridgeConfig` so that tools are automatically discovered and available
- I want MCP tools to work identically to built-in tools in my agent loops
- I want clear error messages when MCP servers are unavailable or tools fail

### As a Platform Maintainer

- I want React Native to enforce remote-only MCP servers using existing `react-native-sse`
- I want Node.js/Electron to support remote MCP servers for flexibility
- I want MCP connections to respect existing rate limiting and retry policies

### As a Tool Consumer

- I want MCP tools to be discoverable through the same `ToolRouter` interface
- I want MCP tool failures to be handled gracefully without breaking agent execution
- I want only MCP tools to be supported (no prompts or resources)

## Non-functional Requirements

### Performance Considerations

- Tool discovery should complete in reasonable time during client initialization
- MCP tool execution should have minimal overhead compared to built-in tools

### Security Considerations

- All MCP connections must validate server certificates (remote connections)

### Reliability Considerations

- Automatic reconnection for failed connections
- Zero impact on non-MCP tools when MCP servers are unavailable

## Open Questions Resolution

### Configuration Representation

MCP configuration will be represented in `BridgeConfig.tools.mcpServers` as an array of server definitions:

```typescript
mcpServers?: Array<{
  name: string;
  url: string;        // Remote server URL
}>
```

Zod validation will enforce React Native constraints (remote-only) at the schema level.

### Tool Removal Lifecycle

Tool removal will be configurable via `tools.mcpToolFailureStrategy`:

- `"immediate_unregister"`: Immediately remove tools from registry on connection loss
- `"mark_unhealthy"`: Keep tools registered but mark unhealthy, return errors on execution

Default strategy will be `"mark_unhealthy"` to provide graceful degradation.

## Estimated Scale

- **4-5 Features** covering configuration, runtime integration, protocol implementation, tool management, and testing
- **Development Time**: 2-3 weeks with 2 developers
- **Testing Requirements**: Unit tests with mock MCP server/client and configuration validation tests
