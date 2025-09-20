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
log: []
schema: v1.0
childrenIds:
  - F-dynamic-tool-registration
  - F-mcp-configuration-schema
  - F-mcp-protocol-core-implementati
  - F-mcp-testing-infrastructure
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
