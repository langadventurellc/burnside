---
id: F-runtime-adapter-mcp-extensions
title: Runtime Adapter MCP Extensions
status: in-progress
priority: medium
parent: E-mcp-tooling-integration
prerequisites:
  - F-mcp-configuration-schema
affectedFiles:
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
    implementation with proper error handling to prevent breaking changes
  src/core/runtime/adapters/electronRuntimeAdapter.ts: Added no-op
    createMcpConnection implementation with proper error handling to prevent
    breaking changes
  src/core/runtime/adapters/reactNativeRuntimeAdapter.ts: Added no-op
    createMcpConnection implementation with proper error handling to prevent
    breaking changes
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
log: []
schema: v1.0
childrenIds:
  - T-extend-runtimeadapter
  - T-implement-electronruntimeadapt
  - T-implement-noderuntimeadapter
  - T-implement-reactnativeruntimead
created: 2025-09-20T19:17:20.522Z
updated: 2025-09-20T19:17:20.522Z
---

# Runtime Adapter MCP Extensions

## Purpose and Functionality

Extend the existing runtime adapter system to support MCP connections while maintaining centralized platform detection and transport choice. This feature adds MCP-specific capabilities to all three runtime adapters without duplicating platform logic or creating separate MCP transport layers.

## Key Components to Implement

### 1. Runtime Adapter Interface Extensions

- Extend `RuntimeAdapter` interface with MCP connection methods
- Add MCP transport capabilities that reuse existing `fetch`/`stream` facilities
- Maintain interface consistency across all platforms

### 2. Platform-Specific Implementations

- **NodeRuntimeAdapter**: Full MCP server support using Node.js capabilities
- **ElectronRuntimeAdapter**: MCP server support with Electron-specific considerations
- **ReactNativeRuntimeAdapter**: Remote-only MCP servers using existing `react-native-sse`

### 3. Transport Integration

- Leverage existing HTTP transport for rate limiting and retry policies
- Integrate MCP connections with existing AbortSignal cancellation
- Ensure MCP transport follows established patterns

## Detailed Acceptance Criteria

### Interface Extensions

- [ ] `RuntimeAdapter` interface extended with `createMcpConnection` method
- [ ] MCP connection method signature accepts server URL and connection options
- [ ] Method returns MCP connection instance compatible with JSON-RPC 2.0
- [ ] Interface maintains backward compatibility with existing methods
- [ ] New methods follow established naming and signature conventions

### Node.js Runtime Adapter

- [ ] `NodeRuntimeAdapter` implements MCP connection using Node.js HTTP capabilities
- [ ] Connections utilize existing `fetch` method for HTTP transport
- [ ] Streaming support uses existing `stream` method infrastructure
- [ ] Rate limiting and retry policies applied to MCP connections
- [ ] AbortSignal cancellation propagated through connection lifecycle

### Electron Runtime Adapter

- [ ] `ElectronRuntimeAdapter` implements MCP connection for both main and renderer processes
- [ ] Adapter detects process context and uses appropriate transport method
- [ ] Connections reuse existing Electron-specific fetch implementations
- [ ] Security considerations for cross-process communication addressed
- [ ] Process isolation maintained for MCP connections

### React Native Runtime Adapter

- [ ] `ReactNativeRuntimeAdapter` enforces remote-only MCP server constraint
- [ ] Adapter uses existing lazy-loaded `react-native-sse` for SSE connections
- [ ] Local server connection attempts are rejected with clear error messages
- [ ] Remote connections follow React Native security and performance guidelines
- [ ] Integration with React Native networking stack maintained

### Transport Policy Integration

- [ ] All MCP connections utilize existing rate limiting infrastructure
- [ ] Retry policies applied consistently across all MCP connections
- [ ] AbortSignal cancellation works correctly for MCP operations
- [ ] Connection timeouts respect existing timeout configurations
- [ ] Error handling follows established error taxonomy

### Platform Detection Consistency

- [ ] No duplication of platform detection logic in MCP-specific code
- [ ] All platform decisions flow through existing `RuntimeAdapter` system
- [ ] MCP capabilities properly reflect platform constraints
- [ ] Centralized platform information used for MCP feature availability

## Implementation Guidance

### Technical Approach

- Extend existing adapter classes rather than creating new MCP-specific adapters
- Follow established patterns for adding new capabilities to runtime adapters
- Leverage dependency injection for testability
- Maintain adapter registry pattern for platform selection

### Architecture Alignment

- Use existing adapter factory pattern for MCP capability discovery
- Integrate with current platform capability detection system
- Follow established error handling and logging patterns
- Maintain separation of concerns between transport and protocol layers

### Integration Points

- Extend `src/core/runtime/runtimeAdapter.ts` interface
- Update all three adapter implementations in `src/core/runtime/adapters/`
- Integrate with existing adapter registry in `src/core/runtime/adapterRegistry.ts`
- Maintain compatibility with current adapter selection logic

## Testing Requirements

### Unit Tests

- MCP connection creation for each runtime adapter
- Platform constraint enforcement (React Native remote-only)
- Transport policy integration (rate limiting, retries, cancellation)
- Error handling for connection failures
- Adapter interface compliance verification

### Platform-Specific Testing

- Node.js adapter MCP connection functionality
- Electron adapter cross-process communication
- React Native adapter SSE integration and constraint enforcement
- Platform detection accuracy for MCP capabilities

### Mock Testing

- Mock MCP server responses for connection testing
- Simulated network failures and recovery
- AbortSignal cancellation during connection operations
- Rate limiting behavior verification

## Security Considerations

### Connection Security

- Validate MCP server URLs before connection attempts
- Enforce HTTPS for remote connections where applicable
- Prevent connection to localhost/private IPs on restricted platforms
- Validate server certificates for remote connections

### Platform Security

- React Native: Enforce remote-only constraint to prevent local access
- Electron: Validate cross-process communication security
- Node.js: Apply appropriate connection validation and limits

### Data Protection

- Ensure no sensitive data leakage through connection metadata
- Apply existing logging redaction rules to MCP connections
- Validate connection parameters to prevent injection attacks

## Performance Requirements

### Connection Performance

- MCP connection establishment completes within 5 seconds
- Connection overhead minimal compared to direct HTTP requests
- Multiple concurrent connections supported (up to 10)
- Connection pooling considerations for repeated server access

### Resource Management

- Proper cleanup of connection resources on adapter disposal
- Memory usage remains stable with multiple active connections
- Network resource limits respected per platform capabilities

## Dependencies

- **Prerequisites**: F-mcp-configuration-schema (configuration schema must exist)
- **Builds Upon**: Existing runtime adapter system
- **Integration Points**: Configuration validation, transport policies
- **Required By**: MCP Core Implementation and Dynamic Tool Registration

## Error Handling Strategy

### Connection Errors

- Clear error messages for connection failures
- Differentiate between network errors and protocol errors
- Provide actionable guidance for configuration issues
- Graceful degradation when MCP servers are unavailable

### Platform Constraint Violations

- Specific error messages for React Native local server attempts
- Clear guidance on supported connection types per platform
- Helpful error context for unsupported operations

## Definition of Done

- [ ] All acceptance criteria met with comprehensive test coverage
- [ ] Interface extensions maintain backward compatibility
- [ ] Platform-specific implementations follow established patterns
- [ ] Transport policy integration verified through testing
- [ ] Security review completed for connection handling
- [ ] Performance benchmarks meet specified requirements
- [ ] Documentation updated for new adapter capabilities
