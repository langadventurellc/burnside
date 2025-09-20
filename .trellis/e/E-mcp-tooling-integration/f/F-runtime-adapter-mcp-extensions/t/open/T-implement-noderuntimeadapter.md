---
id: T-implement-noderuntimeadapter
title: Implement NodeRuntimeAdapter MCP connection transport integration
status: open
priority: high
parent: F-runtime-adapter-mcp-extensions
prerequisites:
  - T-extend-runtimeadapter
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T20:22:31.734Z
updated: 2025-09-20T20:22:31.734Z
---

# Implement NodeRuntimeAdapter MCP Connection Transport Integration

## Context

Implement `createMcpConnection` method in `NodeRuntimeAdapter` that configures Node.js-specific transport primitives and delegates to the shared MCP core implementation. This provides platform-specific transport setup while leveraging centralized protocol handling.

## Implementation Requirements

### Transport Configuration

- Implement `createMcpConnection` method in `src/core/runtime/adapters/nodeRuntimeAdapter.ts`
- Configure transport options using existing `this.fetch` and `this.stream` methods
- Apply existing rate limiting and retry policies through adapter's transport infrastructure
- Integrate AbortSignal support through existing fetch/stream options

### MCP Core Integration

- Import and use shared MCP client/connection from centralized MCP core (to be implemented in separate feature)
- Pass Node.js-specific transport configuration to shared MCP core
- Delegate JSON-RPC 2.0 protocol handling to centralized implementation
- Return MCP connection instance managed by shared core

### Transport Policy Application

- Leverage existing `this.fetch()` method for HTTP transport with Node.js capabilities
- Apply adapter's rate limiting configuration to MCP connections
- Propagate AbortSignal cancellation through fetch options
- Reuse timeout and retry configurations from adapter settings

### Platform Capabilities

- Expose full Node.js networking capabilities to MCP core
- Support both HTTP and streaming connections as needed by protocol
- Validate server URL format and accessibility
- Handle Node.js-specific networking errors appropriately

## Detailed Acceptance Criteria

- [ ] `NodeRuntimeAdapter.createMcpConnection` method implemented with correct signature
- [ ] Method configures transport using existing `this.fetch` and `this.stream` methods
- [ ] Transport configuration passed to shared MCP core client/connection builder
- [ ] Rate limiting and retry policies applied through existing adapter infrastructure
- [ ] AbortSignal support propagated through transport options to core
- [ ] No JSON-RPC 2.0 protocol implementation within adapter (delegated to core)
- [ ] Server URL validation performed before passing to core
- [ ] Node.js platform capabilities properly exposed to MCP core
- [ ] Unit tests with mock MCP core verify transport configuration
- [ ] Error handling for transport setup and core integration

## Technical Approach

### Implementation Steps

1. Add `createMcpConnection` method to `NodeRuntimeAdapter` class
2. Configure transport options object with Node.js-specific settings
3. Apply existing rate limiting and retry policies to transport config
4. Import shared MCP core client/connection builder (placeholder import)
5. Pass transport configuration to core and return connection instance

### Transport Configuration Pattern

```typescript
const transportConfig = {
  fetch: (input: string | URL, init?: RequestInit) => this.fetch(input, init),
  stream: (input: string | URL, init?: RequestInit) => this.stream(input, init),
  platform: this.platformInfo,
  signal: options?.signal,
};
```

### Integration with MCP Core

- Import shared MCP client factory: `import { createMcpClient } from '../mcp/core'`
- Delegate all protocol logic to shared implementation
- Focus adapter responsibility on transport configuration only

## Testing Requirements

- Unit tests mock shared MCP core and verify transport configuration
- Test AbortSignal propagation through transport options
- Test rate limiting policy application to transport config
- Test Node.js platform capability exposure
- Test error handling for invalid URLs and transport failures
- Verify no JSON-RPC protocol logic within adapter

## Integration Points

- Reuse `this.fetch()` and `this.stream()` methods from `NodeRuntimeAdapter`
- Import transport configuration types from runtime module
- Integrate with shared MCP core client/connection builder
- Follow existing adapter patterns for error handling and logging

## Dependencies

- Shared MCP core implementation (will be available from separate feature)
- Transport configuration interfaces from runtime module
- Existing adapter rate limiting and retry infrastructure

## Platform-Specific Considerations

- Expose full Node.js networking capabilities (no restrictions)
- Support both local and remote server connections
- Handle Node.js-specific error types appropriately
- Leverage Node.js performance optimizations where available

## Out of Scope

- JSON-RPC 2.0 protocol implementation (handled by shared MCP core)
- Connection lifecycle management (handled by shared MCP core)
- Capability negotiation logic (handled by shared MCP core)
- Request ID generation and correlation (handled by shared MCP core)
