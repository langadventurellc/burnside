---
id: T-extend-runtimeadapter
title: Extend RuntimeAdapter interface with createMcpConnection method
status: done
priority: high
parent: F-runtime-adapter-mcp-extensions
prerequisites: []
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
log:
  - Successfully extended RuntimeAdapter interface with createMcpConnection
    method and supporting types. Created comprehensive type definitions for MCP
    connection options and connection interface following established patterns.
    Added no-op implementations to all existing adapters to prevent breaking
    changes. Implemented extensive unit test coverage with 39 passing tests
    covering interface compliance, type safety, error handling, and real-world
    usage patterns. All quality checks (lint, format, type-check) pass
    successfully.
schema: v1.0
childrenIds: []
created: 2025-09-20T20:22:10.976Z
updated: 2025-09-20T20:22:10.976Z
---

# Extend RuntimeAdapter Interface with MCP Connection Method

## Context

Add MCP connection capabilities to the existing RuntimeAdapter interface while maintaining backward compatibility and following established patterns. This extends the core runtime abstraction layer to support MCP protocol connections with proper URL and options handling.

## Implementation Requirements

### Interface Extension

- Add `createMcpConnection` method to `RuntimeAdapter` interface in `src/core/runtime/runtimeAdapter.ts`
- Method signature: `createMcpConnection(serverUrl: string, options?: McpConnectionOptions): Promise<McpConnection>`
- Define `McpConnectionOptions` interface with `signal?: AbortSignal` and other connection parameters
- Add comprehensive JSDoc documentation following existing patterns

### Connection Options Interface

- Create `McpConnectionOptions` interface in new file `src/core/runtime/mcpConnectionOptions.ts`
- Include `signal?: AbortSignal` for cancellation support
- Add optional timeout and retry configuration
- Follow existing RequestInit pattern for consistency

### MCP Connection Type Definition

- Create `McpConnection` interface in new file `src/core/runtime/mcpConnection.ts`
- Include methods for JSON-RPC 2.0 communication with options parameter: `request(method: string, params?: any, options?: { signal?: AbortSignal }): Promise<any>`
- Add connection lifecycle management: `isConnected`, `capabilities`, `disconnect(options?: { signal?: AbortSignal })`
- Support AbortSignal cancellation in all methods

### Type Integration

- Export new types from `src/core/runtime/index.ts`
- Ensure TypeScript type inference works correctly
- Maintain existing import patterns and naming conventions

## Detailed Acceptance Criteria

- [ ] `RuntimeAdapter` interface extended with `createMcpConnection(serverUrl: string, options?: McpConnectionOptions)` method
- [ ] `McpConnectionOptions` interface includes `signal?: AbortSignal` and follows RequestInit pattern
- [ ] Method accepts server URL string and optional connection options with AbortSignal support
- [ ] Method returns `Promise<McpConnection>` with complete interface
- [ ] `McpConnection` interface supports JSON-RPC 2.0 operations with cancellation options
- [ ] All connection methods accept options parameter with `signal?: AbortSignal`
- [ ] Comprehensive JSDoc documentation added for all new methods
- [ ] Types exported from runtime module index
- [ ] Unit tests verify interface compliance and type safety
- [ ] No breaking changes to existing RuntimeAdapter interface

## Technical Approach

### Step-by-step Implementation

1. Define `McpConnectionOptions` interface with AbortSignal support
2. Define `McpConnection` interface with options parameters for cancellation
3. Add `createMcpConnection` method to `RuntimeAdapter` interface with URL/options signature
4. Add comprehensive documentation following existing fetch/stream patterns
5. Export new types from module index
6. Create unit tests for interface compliance

### Integration Points

- Follow existing RequestInit pattern from fetch method (src/core/runtime/runtimeAdapter.ts:44-48)
- Match AbortSignal handling from existing stream method (src/core/runtime/runtimeAdapter.ts:111-119)
- Maintain consistent error handling approach with other adapter methods

## Testing Requirements

- Unit tests verify interface type safety and signature compliance
- Mock implementations test method signatures with options parameters
- TypeScript compilation tests ensure proper type inference
- Documentation examples compile correctly
- AbortSignal parameter typing verified through tests

## Out of Scope

- Implementation of MCP connection logic (handled by platform-specific tasks)
- JSON-RPC protocol implementation details (handled by MCP core)
- Transport layer implementation (delegated to existing fetch/stream)
- Error handling implementation beyond interface definition
