---
id: F-mcp-protocol-core-implementati
title: MCP Protocol Core Implementation
status: in-progress
priority: medium
parent: E-mcp-tooling-integration
prerequisites:
  - F-runtime-adapter-mcp-extensions
affectedFiles:
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
  - T-implement-mcp-error-handling
  - T-implement-tool-discovery-and
  - T-integrate-mcp-tools-with
  - T-create-mcp-client-class-with
created: 2025-09-20T19:18:00.028Z
updated: 2025-09-20T19:18:00.028Z
---

# MCP Protocol Core Implementation

## Purpose and Functionality

Implement the core Model Context Protocol (MCP) communication layer with JSON-RPC 2.0 support, connection lifecycle management, and tool schema translation. This feature provides the foundation for MCP server communication while explicitly supporting tools only (no prompts or resources).

## Key Components to Implement

### 1. JSON-RPC 2.0 Communication Layer

- Complete JSON-RPC 2.0 client implementation with proper message formatting
- Request/response handling with correlation ID management
- Error handling according to JSON-RPC 2.0 specification
- Integration with runtime adapter transport methods

### 2. Connection Lifecycle Management

- Connection initialization with capability negotiation
- Server capability discovery and validation
- Connection health monitoring and reconnection logic
- Graceful connection termination and cleanup

### 3. Tool Schema Translation

- Bidirectional mapping between MCP tool schemas and unified `ToolDefinition`
- JSON Schema validation for MCP tool definitions
- Parameter validation and type conversion
- Response normalization between MCP and unified formats

### 4. Protocol Filtering

- Explicit rejection of MCP prompts and resources
- Tools-only processing with clear error messages for unsupported features
- Protocol compliance while maintaining scope limitations

## Detailed Acceptance Criteria

### JSON-RPC 2.0 Implementation

- [ ] Complete JSON-RPC 2.0 client supporting request, response, and notification messages
- [ ] Proper correlation ID management for request/response matching
- [ ] Error handling follows JSON-RPC 2.0 error object specification
- [ ] Batch request support for efficient communication
- [ ] Message validation ensures JSON-RPC 2.0 compliance

### Connection Lifecycle

- [ ] Connection initialization follows MCP handshake protocol
- [ ] Capability negotiation identifies supported protocol versions
- [ ] Server capability discovery retrieves available tools (ignoring prompts/resources)
- [ ] Connection health monitoring detects server unavailability
- [ ] Automatic reconnection with exponential backoff for failed connections
- [ ] Graceful termination sends proper disconnect notifications

### MCP Protocol Compliance

- [ ] Protocol version negotiation supports MCP v1.0
- [ ] Capability exchange correctly identifies tool support
- [ ] Tool listing requests retrieve available tools from server
- [ ] Tool execution requests follow MCP tool call specification
- [ ] Server notifications properly handled (tool updates, connection events)

### Tools-Only Implementation

- [ ] **MCP prompts explicitly rejected with clear error messages**
- [ ] **MCP resources explicitly ignored during capability negotiation**
- [ ] Only tool-related MCP messages processed and responded to
- [ ] Unsupported feature requests return appropriate error responses
- [ ] Tools-only scope clearly documented in protocol interactions

### Schema Translation

- [ ] MCP tool schemas correctly mapped to unified `ToolDefinition` format
- [ ] JSON Schema parameters converted to Zod schemas where possible
- [ ] Tool parameter validation using translated schemas
- [ ] Tool response formatting follows unified response structure
- [ ] Bidirectional translation maintains data integrity

### Error Handling Integration

- [ ] MCP-specific errors integrate with existing error taxonomy
- [ ] Network errors mapped to appropriate `TransportError` types
- [ ] Protocol errors categorized as `ProviderError` with MCP context
- [ ] Connection errors provide actionable user guidance
- [ ] Error recovery attempts follow established retry patterns

### Transport Integration

- [ ] MCP connections utilize runtime adapter transport methods
- [ ] AbortSignal cancellation propagated through protocol operations
- [ ] Rate limiting applied to MCP requests through existing policies
- [ ] Connection timeouts respect runtime adapter configuration
- [ ] Streaming support for real-time tool updates (if supported by server)

## Implementation Guidance

### Technical Approach

- Create dedicated MCP client class with clean separation of concerns
- Use existing transport infrastructure through runtime adapters
- Follow established patterns from provider implementations
- Implement proper resource cleanup and connection management

### Architecture Integration

- Place core implementation in `src/tools/mcp/` directory
- Integrate with existing validation framework using Zod
- Leverage established error handling and logging patterns
- Maintain testability through dependency injection

### Protocol Design

- Design protocol layer to be transport-agnostic
- Separate connection management from message handling
- Create clear interfaces for extending protocol support
- Implement proper state management for connection lifecycle

## Testing Requirements

### Unit Tests with Mock Servers

- **Mock MCP server implementation for testing protocol interactions**
- **Round-trip validation of tool discovery and execution flow**
- Connection lifecycle testing (connect, negotiate, disconnect)
- Error handling for malformed responses and network failures
- Schema translation accuracy verification

### Protocol Compliance Testing

- JSON-RPC 2.0 message format validation
- MCP handshake sequence verification
- Tool listing and execution protocol compliance
- Capability negotiation accuracy
- Error response format validation

### Tools-Only Scope Testing

- Verification that prompts are rejected with appropriate errors
- Confirmation that resources are ignored during negotiation
- Testing that only tool-related messages are processed
- Error handling for unsupported feature requests

## Security Considerations

### Protocol Security

- Validate all incoming JSON-RPC messages against specification
- Prevent injection attacks through parameter validation
- Limit message size to prevent DoS attacks
- Validate server responses before processing

### Connection Security

- Enforce secure connection requirements through runtime adapters
- Validate server certificates for remote connections
- Implement connection timeout limits to prevent resource exhaustion
- Apply rate limiting to prevent abuse

### Data Validation

- Validate all MCP tool schemas before translation
- Sanitize tool parameters to prevent code injection
- Validate response data types and formats
- Apply schema validation consistently across all interactions

## Performance Requirements

### Protocol Performance

- Connection establishment completes within 5 seconds
- Tool discovery completes within 2 seconds for typical servers
- Message processing overhead less than 10ms per operation
- Support concurrent tool executions without blocking

### Resource Efficiency

- Memory usage scales linearly with number of active connections
- Connection cleanup prevents resource leaks
- Message queue management prevents memory growth
- Efficient schema caching for repeated validations

## Dependencies

- **Prerequisites**: F-runtime-adapter-mcp-extensions (transport capabilities required)
- **Builds Upon**: Configuration schema, runtime adapters, existing validation framework
- **Integration Points**: Tool registry, error handling, logging systems
- **Required By**: Dynamic Tool Registration System

## Error Recovery Strategy

### Connection Failures

- Exponential backoff for reconnection attempts (max 3 attempts)
- Graceful degradation when servers become unavailable
- Clear error messages distinguishing temporary vs permanent failures
- Automatic cleanup of failed connection resources

### Protocol Errors

- Proper JSON-RPC error responses for malformed requests
- Clear error messages for unsupported features (prompts/resources)
- Recovery from partial message corruption
- Validation error reporting with actionable guidance

## Definition of Done

- [ ] All acceptance criteria met with comprehensive test coverage
- [ ] Mock MCP server round-trip testing validates protocol implementation
- [ ] Tools-only scope properly enforced with appropriate error handling
- [ ] Schema translation maintains data integrity in both directions
- [ ] Integration with runtime adapters follows established patterns
- [ ] Performance requirements met under normal operation conditions
- [ ] Security review completed for protocol implementation
- [ ] Documentation includes protocol compliance and scope limitations
