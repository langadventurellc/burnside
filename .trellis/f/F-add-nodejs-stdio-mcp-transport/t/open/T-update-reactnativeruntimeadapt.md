---
id: T-update-reactnativeruntimeadapt
title: Update ReactNativeRuntimeAdapter for STDIO error handling
status: open
priority: medium
parent: F-add-nodejs-stdio-mcp-transport
prerequisites:
  - T-update-runtimeadapter
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T14:16:31.130Z
updated: 2025-09-21T14:16:31.130Z
---

# Update ReactNativeRuntimeAdapter for STDIO Error Handling

## Context

This task updates the `ReactNativeRuntimeAdapter` to implement the new `RuntimeAdapter` interface signature and provide clear error messages when STDIO configurations are attempted on the React Native platform (which doesn't support subprocess operations).

**Related Feature**: F-add-nodejs-stdio-mcp-transport

## Specific Implementation Requirements

### Method Signature Update

- Update `createMcpConnection()` method in `src/core/runtime/adapters/reactNativeRuntimeAdapter.ts`
- Change from: `createMcpConnection(serverUrl: string, options?)`
- Change to: `createMcpConnection(serverConfig: McpServerConfig, options?)`

### Configuration Handling

1. **HTTP Configuration Support**:
   - Continue supporting HTTP configurations with `url` field (existing functionality)
   - Preserve all existing HTTP transport logic and validation
   - Maintain existing remote-only URL validation

2. **STDIO Configuration Rejection**:
   - Detect STDIO configurations (presence of `command` field)
   - Throw clear, helpful error messages for STDIO attempts
   - Explain platform limitations and suggest alternatives

### Error Messaging

- Provide informative error messages that explain React Native limitations
- Suggest using HTTP-based MCP servers as alternative
- Include configuration details in error context for debugging

## Technical Approach

### Transport Detection and Routing

```typescript
createMcpConnection(serverConfig: McpServerConfig, options?: McpConnectionOptions) {
  if (serverConfig.command) {
    // STDIO not supported on React Native
    throw new RuntimeError(
      "STDIO MCP servers are not supported on React Native platform. Use HTTP-based MCP servers instead.",
      "RUNTIME_PLATFORM_UNSUPPORTED",
      {
        serverConfig,
        platform: "react-native",
        supportedTransports: ["http", "https"]
      }
    );
  }

  if (serverConfig.url) {
    // Use existing HTTP transport logic
    return this.createHttpMcpConnection(serverConfig.url, options);
  }

  throw new RuntimeError("Invalid server configuration");
}
```

### HTTP Transport Preservation

- Extract existing HTTP connection logic into private method
- Preserve all existing validation (remote-only URLs)
- Maintain all existing error handling and behavior

### Configuration Validation

- Validate that server configuration is valid for React Native
- Provide helpful error messages for unsupported configurations
- Maintain existing URL validation for HTTP configurations

## Detailed Acceptance Criteria

### Interface Compliance

- ✅ Implements updated `RuntimeAdapter.createMcpConnection()` signature
- ✅ Method accepts `McpServerConfig` parameter correctly
- ✅ Returns `Promise<McpConnection>` for valid configurations
- ✅ Compiles without TypeScript errors

### HTTP Transport Preservation

- ✅ HTTP configurations (with `url`) work identically to existing implementation
- ✅ All existing HTTP transport functionality preserved
- ✅ Remote-only URL validation remains unchanged
- ✅ Existing error messages and behavior maintained

### STDIO Configuration Rejection

- ✅ STDIO configurations (with `command`) are detected and rejected
- ✅ Clear error message explains React Native platform limitations
- ✅ Error suggests using HTTP-based MCP servers as alternative
- ✅ Error includes helpful context (platform, supported transports)

### Error Handling

- ✅ Uses existing `RuntimeError` patterns and error codes
- ✅ Provides helpful error messages without sensitive information
- ✅ Includes appropriate error context for debugging
- ✅ Follows existing error handling conventions

### Configuration Validation

- ✅ Accepts valid HTTP server configurations
- ✅ Rejects STDIO server configurations with clear messages
- ✅ Rejects configurations with neither `url` nor `command`
- ✅ Provides helpful error details for all invalid cases

## Dependencies

**Prerequisites**:

- T-update-runtimeadapter (interface changes must be complete)

**Imports Required**:

- `McpServerConfig` type from configuration schema
- Existing error handling utilities (`RuntimeError`)

## Security Considerations

- Maintain existing URL validation for HTTP configurations
- Ensure error messages don't leak sensitive configuration details
- Preserve existing remote-only validation requirements

## Testing Requirements

### Unit Tests (included in this task)

- Test HTTP configuration routing to existing HTTP connection
- Test STDIO configuration rejection with proper error messages
- Test configuration validation (invalid combinations)
- Test error handling includes appropriate context
- Test backward compatibility with existing URL inputs
- Test that existing HTTP functionality is unchanged

### Test Updates Required

- Update existing `reactNativeRuntimeAdapter.test.ts` tests for new method signature
- Add test cases for STDIO configuration rejection
- Ensure existing HTTP transport tests continue to pass
- Add configuration validation test cases

## Out of Scope

- Adding actual STDIO support (not possible on React Native)
- Changes to HTTP connection implementation (preserve existing)
- Client integration updates (handled by other tasks)

## Files to Modify

- `src/core/runtime/adapters/reactNativeRuntimeAdapter.ts` - Main implementation
- `src/core/runtime/adapters/__tests__/reactNativeRuntimeAdapter.test.ts` - Updated tests

## Implementation Notes

- Preserve all existing HTTP transport functionality exactly
- Use clear, helpful error messages for unsupported STDIO configurations
- Follow existing error handling patterns and message formats
- Ensure no breaking changes to existing HTTP connection behavior
- Consider adding configuration validation helper methods for reusability
