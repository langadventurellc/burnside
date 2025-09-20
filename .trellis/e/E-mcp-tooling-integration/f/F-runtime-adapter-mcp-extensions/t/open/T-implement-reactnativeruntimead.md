---
id: T-implement-reactnativeruntimead
title: Implement ReactNativeRuntimeAdapter remote-only transport constraints
status: open
priority: high
parent: F-runtime-adapter-mcp-extensions
prerequisites:
  - T-extend-runtimeadapter
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T20:23:21.061Z
updated: 2025-09-20T20:23:21.061Z
---

# Implement ReactNativeRuntimeAdapter Remote-Only Transport Constraints

## Context

Implement `createMcpConnection` method in `ReactNativeRuntimeAdapter` that enforces remote-only constraints and configures React Native transport, then delegates to shared MCP core. This provides platform-specific URL validation and SSE integration while leveraging centralized protocol handling.

## Implementation Requirements

### Remote-Only Constraint Enforcement

- Implement `createMcpConnection` method in `src/core/runtime/adapters/reactNativeRuntimeAdapter.ts`
- Validate server URLs to reject localhost, private IP, and local network connections
- Throw clear, actionable error messages for rejected connection attempts
- Allow only remote HTTP/HTTPS server connections

### Transport Configuration and SSE Integration

- Configure transport using existing `this.fetch` method and React Native networking
- Integrate with existing lazy-loaded `react-native-sse` for streaming capabilities
- Apply React Native-specific performance optimizations and networking policies
- Handle React Native networking constraints and mobile-specific considerations

### URL Validation Logic

- Reject localhost patterns: `localhost`, `127.0.0.1`, `::1`
- Reject private IP ranges: `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`
- Reject local network addresses and file:// protocols
- Provide specific error messages with guidance for each rejection type

### MCP Core Integration

- Import and use shared MCP client/connection from centralized MCP core
- Pass React Native transport configuration and constraints to core
- Delegate all JSON-RPC 2.0 protocol handling to centralized implementation
- Return MCP connection instance managed by shared core

## Detailed Acceptance Criteria

- [ ] `ReactNativeRuntimeAdapter.createMcpConnection` method implemented with correct signature
- [ ] URL validation rejects localhost and private IP connections with clear error messages
- [ ] Remote HTTPS/HTTP connections properly configured and passed to core
- [ ] Transport configuration includes React Native networking capabilities
- [ ] Integration with existing `react-native-sse` lazy-loading mechanism
- [ ] No JSON-RPC 2.0 protocol implementation within adapter (delegated to core)
- [ ] AbortSignal support propagated through transport options to core
- [ ] Unit tests with mock MCP core verify constraint enforcement and transport config
- [ ] Error handling for React Native networking failures
- [ ] Platform constraint documentation and error guidance

## Technical Approach

### Implementation Steps

1. Add `createMcpConnection` method to `ReactNativeRuntimeAdapter` class
2. Implement comprehensive URL validation with remote-only constraint
3. Configure React Native transport options with SSE integration
4. Apply existing networking policies and mobile optimizations
5. Pass validated transport configuration to shared MCP core

### URL Validation Implementation

```typescript
function validateRemoteOnly(serverUrl: string): void {
  const url = new URL(serverUrl);

  // Check for localhost patterns
  if (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1"
  ) {
    throw new Error(
      "MCP connections to localhost are not allowed in React Native. Use a remote server URL.",
    );
  }

  // Check for private IP ranges
  if (isPrivateIP(url.hostname)) {
    throw new Error(
      "MCP connections to private IP addresses are not allowed in React Native. Use a public remote server.",
    );
  }

  // Check for valid protocols
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(
      "Invalid MCP server URL. Must be HTTP/HTTPS remote server.",
    );
  }
}
```

### Transport Configuration Pattern

```typescript
const transportConfig = {
  fetch: (input: string | URL, init?: RequestInit) => this.fetch(input, init),
  platform: this.platformInfo,
  constraints: {
    remoteOnly: true,
    allowedProtocols: ["http:", "https:"],
    validateRemoteUrl: true,
  },
  signal: options?.signal,
};
```

## Testing Requirements

- Unit tests for URL validation with various invalid patterns (localhost, private IPs)
- Test specific error messages for different rejection scenarios
- Test successful remote connection configuration with mock core
- Test integration with existing React Native networking infrastructure
- Test AbortSignal propagation through transport options
- Verify no JSON-RPC protocol logic within adapter

## Error Messages and User Guidance

- **Localhost rejection**: "MCP connections to localhost are not allowed in React Native. Use a remote server URL."
- **Private IP rejection**: "MCP connections to private IP addresses are not allowed in React Native. Use a public remote server."
- **Invalid protocol**: "Invalid MCP server URL. Must be HTTP/HTTPS remote server."
- **Network failure**: "Failed to connect to MCP server. Check network connectivity and server availability."

## Integration Points

- Reuse `this.fetch()` method from `ReactNativeRuntimeAdapter`
- Import and use existing `react-native-sse` lazy-loading pattern
- Integrate with shared MCP core client/connection builder
- Follow existing React Native networking and error handling patterns

## Security and Performance Considerations

- Enforce remote-only constraint to prevent local network access
- Validate server certificates for HTTPS connections
- Apply React Native security guidelines for network requests
- Optimize for mobile networking conditions and battery usage

## Dependencies

- Shared MCP core implementation (will be available from separate feature)
- Existing `react-native-sse` lazy-loading mechanism
- React Native networking infrastructure and policies

## Platform-Specific Considerations

- Handle React Native networking limitations and mobile constraints
- Integrate with React Native's network info and connectivity detection
- Apply mobile-specific timeout and retry policies
- Respect React Native security model for network access

## Out of Scope

- Local MCP server support (explicitly forbidden by platform constraints)
- JSON-RPC 2.0 protocol implementation (handled by shared MCP core)
- Connection lifecycle management (handled by shared MCP core)
- Custom React Native networking protocols beyond standard HTTP/HTTPS
