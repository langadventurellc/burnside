---
id: T-extend-runtimeadapter
title: Extend RuntimeAdapter interface with createMcpConnection method
status: open
priority: high
parent: F-runtime-adapter-mcp-extensions
prerequisites: []
affectedFiles: {}
log: []
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
