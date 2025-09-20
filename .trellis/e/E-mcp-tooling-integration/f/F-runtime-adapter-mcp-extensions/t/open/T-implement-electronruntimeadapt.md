---
id: T-implement-electronruntimeadapt
title: Implement ElectronRuntimeAdapter MCP transport with process security
status: open
priority: high
parent: F-runtime-adapter-mcp-extensions
prerequisites:
  - T-extend-runtimeadapter
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T20:22:51.468Z
updated: 2025-09-20T20:22:51.468Z
---

# Implement ElectronRuntimeAdapter MCP Transport with Process Security

## Context

Implement `createMcpConnection` method in `ElectronRuntimeAdapter` that configures Electron-specific transport and security validation, then delegates to shared MCP core. This provides process-aware transport setup and security enforcement while leveraging centralized protocol handling.

## Implementation Requirements

### Process-Aware Transport Configuration

- Implement `createMcpConnection` method in `src/core/runtime/adapters/electronRuntimeAdapter.ts`
- Detect process context (main vs renderer) and configure appropriate transport
- Use existing `this.fetch` method which handles Electron process-specific networking
- Apply Electron security policies and Content Security Policy validation

### Security Validation

- Validate MCP server URLs against Electron security policies
- Apply Content Security Policy considerations for renderer process connections
- Ensure proper sandboxing when connecting from renderer process
- Validate server certificates for remote HTTPS connections

### MCP Core Integration

- Import and use shared MCP client/connection from centralized MCP core
- Pass Electron-specific transport configuration and security context to core
- Delegate all JSON-RPC 2.0 protocol handling to centralized implementation
- Return MCP connection instance managed by shared core

### Transport Policy Application

- Leverage existing `this.fetch()` method for process-appropriate networking
- Apply Electron-specific rate limiting and retry policies
- Propagate AbortSignal cancellation through existing transport infrastructure
- Handle cross-process communication security boundaries

## Detailed Acceptance Criteria

- [ ] `ElectronRuntimeAdapter.createMcpConnection` method implemented with correct signature
- [ ] Process context detection working correctly (main vs renderer)
- [ ] Transport configuration includes Electron security context and process info
- [ ] Security validation performed for server URLs before passing to core
- [ ] Transport setup passed to shared MCP core client/connection builder
- [ ] No JSON-RPC 2.0 protocol implementation within adapter (delegated to core)
- [ ] AbortSignal support propagated through transport options to core
- [ ] Unit tests with mock MCP core verify transport and security configuration
- [ ] Error handling for Electron security policy violations
- [ ] Integration with existing Electron fetch implementation

## Technical Approach

### Implementation Steps

1. Add `createMcpConnection` method to `ElectronRuntimeAdapter` class
2. Implement security validation for MCP server URLs
3. Configure transport options with Electron process context
4. Apply existing security policies and CSP validation
5. Pass transport configuration to shared MCP core and return connection

### Transport Configuration Pattern

```typescript
const transportConfig = {
  fetch: (input: string | URL, init?: RequestInit) => this.fetch(input, init),
  platform: this.platformInfo,
  security: {
    processType: process?.type || "main",
    validateCsp: isRenderer(),
    enforceHttps: true,
  },
  signal: options?.signal,
};
```

### Security Validation Logic

- Validate remote server URLs against Electron security policies
- Check Content Security Policy compliance for renderer process
- Prevent unauthorized localhost access from sandboxed renderer
- Validate HTTPS certificates for remote connections

## Testing Requirements

- Unit tests mock shared MCP core and verify transport configuration
- Test security validation for various URL patterns and process contexts
- Test process detection (main vs renderer) and appropriate transport setup
- Test AbortSignal propagation through Electron transport
- Test error handling for security policy violations
- Verify no JSON-RPC protocol logic within adapter

## Integration Points

- Reuse `this.fetch()` method from `ElectronRuntimeAdapter`
- Import security validation utilities from Electron runtime
- Integrate with shared MCP core client/connection builder
- Follow existing adapter patterns for error handling

## Security Validation Requirements

- Reject localhost connections from sandboxed renderer processes
- Validate HTTPS certificates for remote connections
- Apply URL validation to prevent protocol injection attacks
- Log security violations with appropriate detail level

## Dependencies

- Shared MCP core implementation (will be available from separate feature)
- Electron security and process detection utilities
- Existing adapter transport and security infrastructure

## Platform-Specific Considerations

- Handle main process vs renderer process networking differences
- Apply Electron Content Security Policy validation
- Respect sandboxing restrictions in renderer process
- Leverage Electron-specific security features

## Out of Scope

- IPC-based MCP connections between Electron processes
- JSON-RPC 2.0 protocol implementation (handled by shared MCP core)
- Connection lifecycle management (handled by shared MCP core)
- Advanced Electron sandboxing configuration beyond URL validation
