---
id: F-e2e-tests-for-stdio-mcp
title: E2E Tests for STDIO MCP Transport
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/bin/stdio-mcp-server.js: Created standalone Node.js
    executable implementing JSON-RPC 2.0 MCP server over stdin/stdout with
    cross-platform telemetry tracking, signal handling, and error management
  src/__tests__/e2e/shared/stdioTelemetryReader.ts: Created main
    StdioTelemetryReader class with file-based telemetry reading, caching, error
    handling, and MockMcpServer-compatible interface
  src/__tests__/e2e/shared/createStdioTelemetryReader.ts:
    Created factory function
    for default OS temp directory telemetry reader instantiation
  src/__tests__/e2e/shared/createStdioTelemetryReaderWithPath.ts:
    Created factory function for custom base directory telemetry reader
    instantiation
  src/__tests__/e2e/shared/__tests__/stdioTelemetryReader.test.ts:
    Added comprehensive unit tests covering all functionality, error scenarios,
    and edge cases
  src/core/config/mcpServerSchema.ts: Extended schema to support both HTTP and
    STDIO transport types using union schema for backward compatibility
  src/core/config/mcpServerConfig.ts: Updated documentation to show both HTTP and STDIO configuration examples
  src/__tests__/e2e/shared/createMcpTestConfig.ts: Enhanced to accept both URL
    strings (HTTP) and command objects (STDIO) while maintaining backward
    compatibility
  src/__tests__/e2e/shared/stdioMcpServerManager.ts: Created new class to manage
    STDIO MCP server subprocess lifecycle with MockMcpServer-compatible
    interface
  src/__tests__/e2e/shared/setupMcpServer.ts: Added optional transport parameter
    with function overloads for type safety, supporting both HTTP and STDIO
    transports
  src/__tests__/e2e/shared/mcpTestHelpers.test.ts: Updated test assertions to
    match new error messages for enhanced functionality
log: []
schema: v1.0
childrenIds:
  - T-create-anthropic-stdio-mcp
  - T-update-test-helpers-for-stdio
  - T-create-stdio-mock-mcp-server
  - T-create-stdio-telemetry-reader
created: 2025-09-21T17:03:53.515Z
updated: 2025-09-21T17:03:53.515Z
---

# E2E Tests for STDIO MCP Transport

## Purpose and Functionality

Implement end-to-end test coverage for the STDIO MCP transport functionality to validate that subprocess-based MCP servers work correctly with the existing LLM Bridge library. This feature creates minimal testing infrastructure to prove STDIO transport works end-to-end using a single provider smoke test, while updating existing test helpers to support both HTTP and STDIO configurations.

## Key Components to Implement

### 1. STDIO Mock MCP Server Script

- **Simple Node.js script** (`src/__tests__/e2e/shared/bin/stdio-mcp-server.js`) that implements JSON-RPC 2.0 over stdin/stdout
- **File-based telemetry** using temporary files to track tool calls for test assertions
- **Basic tool definitions** (echo_tool) matching current HTTP MockMcpServer
- **Graceful shutdown** handling for test cleanup

### 2. Test Helper Updates

- **Update setupMcpServer** to support STDIO server configurations alongside HTTP
- **Update createMcpTestClient** to handle both URL and command-based MCP server configs
- **Create shared telemetry reader** to access file-based tool call tracking from STDIO server
- **Extend cleanup procedures** to handle subprocess termination

### 3. Single Provider STDIO E2E Test

- **One provider test suite** (Anthropic) to validate STDIO transport end-to-end
- **Essential assertions** proving MCP tool execution works via subprocess:
  - Tool discovery through STDIO transport
  - Tool execution via LLM provider
  - Tool call verification through file-based telemetry
- **Transport-agnostic behavior validation** ensuring STDIO works identically to HTTP

## Detailed Acceptance Criteria

### Functional Behavior Requirements

1. **STDIO Server Script**
   - Must accept JSON-RPC 2.0 requests via stdin and respond via stdout
   - Must implement echo_tool with same behavior as HTTP MockMcpServer
   - Must write tool call telemetry to temporary file for test verification
   - Must handle SIGTERM for graceful shutdown and cleanup

2. **Test Helper Integration**
   - `setupMcpServer()` must support optional `transport: 'stdio'` parameter
   - When STDIO transport specified, must spawn subprocess instead of HTTP server
   - Must return same interface for both HTTP and STDIO servers
   - Must provide telemetry access through shared interface

3. **E2E Test Coverage**
   - Single Anthropic test file demonstrating STDIO MCP integration
   - Must validate tool discovery works through subprocess communication
   - Must prove LLM can execute tools via STDIO transport
   - Must verify tool execution through file-based telemetry:
     ```typescript
     const telemetry = await readStdioTelemetry(tempFile);
     expect(telemetry.wasToolCalled("echo_tool")).toBe(true);
     expect(telemetry.getToolCallCount("echo_tool")).toBeGreaterThan(0);
     ```

4. **Existing Helper Compatibility**
   - Current test files using `setupMcpServer()` must continue working unchanged
   - HTTP-based tests must not be affected by STDIO infrastructure additions
   - Shared test utilities must remain transport-agnostic

### Technical Requirements

1. **File Structure**

   ```
   src/__tests__/e2e/
   ├── shared/
   │   ├── bin/
   │   │   └── stdio-mcp-server.js          # STDIO server script
   │   ├── setupMcpServer.ts                # Updated to support STDIO
   │   ├── createMcpTestClient.ts           # Updated for command configs
   │   └── stdioTelemetryReader.ts          # File-based telemetry access
   └── anthropic/
       └── stdioMcpTools.e2e.test.ts        # Single provider STDIO test
   ```

2. **Telemetry Mechanism**
   - STDIO server writes tool calls to temporary JSON file
   - Test helper reads telemetry file to provide same assertion interface
   - Cleanup removes temporary files after test completion

3. **Process Management**
   - Use `child_process.spawn()` for subprocess execution
   - Implement basic process cleanup in test teardown
   - Handle subprocess initialization and communication errors

### Integration Points

1. **Existing Test Infrastructure**
   - Must integrate with current Jest configuration
   - Must use existing Anthropic provider authentication
   - Must leverage existing test message creation and validation
   - Must maintain current CI/CD pipeline compatibility

2. **Helper Function Updates**
   - Update `setupMcpServer` signature to accept transport option
   - Modify `createMcpTestClient` to handle STDIO server configurations
   - Ensure backward compatibility with existing HTTP usage

### Implementation Requirements

1. **Minimal Scope**
   - Focus solely on proving STDIO transport works end-to-end
   - Single provider test (Anthropic) to validate functionality
   - No performance, security, or cross-platform requirements
   - No duplicate test suites for other providers

2. **Practical Telemetry**
   - File-based tool call tracking for subprocess communication
   - Simple JSON format for tool call history
   - Test helper abstracts file access to maintain assertion compatibility

## Implementation Guidance

### Technical Approach

1. **STDIO Server Implementation**
   - Simple Node.js script reading stdin line-by-line
   - JSON-RPC 2.0 message parsing and response generation
   - Tool call logging to temporary file with process ID
   - Basic signal handling for cleanup

2. **Test Helper Updates**
   - Add optional transport parameter to `setupMcpServer`
   - Create subprocess management for STDIO servers
   - Implement telemetry file reader with same interface as MockMcpServer
   - Update type definitions to support both transport types

3. **Test Implementation**
   - Copy existing Anthropic MCP test as template
   - Replace HTTP server setup with STDIO configuration
   - Use file-based telemetry reader for assertions
   - Validate identical behavior between HTTP and STDIO transports

### Code Organization

1. **Minimal File Changes**
   - Extend existing `setupMcpServer.ts` rather than creating new files
   - Add STDIO server script in shared bin directory
   - Create single telemetry reader utility
   - Add one new test file for STDIO validation

2. **Backward Compatibility**
   - All existing tests continue working unchanged
   - Default behavior remains HTTP transport
   - New STDIO functionality is opt-in only

### Testing Requirements

1. **Essential E2E Validation**
   - STDIO subprocess starts and communicates correctly
   - LLM provider can discover and execute tools via STDIO
   - Tool execution telemetry works through file mechanism
   - Process cleanup prevents resource leaks

2. **Compatibility Testing**
   - Existing HTTP tests remain functional
   - Updated helpers work with both transport types
   - No regression in current test suite

### Dependencies

1. **Existing Infrastructure**
   - Requires NodeStdioMcpConnection implementation
   - Uses current McpServerConfig schema
   - Leverages existing Anthropic test configuration
   - No changes to production code required

## Scope Limitations

1. **Single Provider Focus**
   - Only Anthropic E2E test to prove STDIO transport
   - No duplicate test suites for other providers
   - No additional API usage costs

2. **Essential Functionality Only**
   - No performance or security requirements
   - No cross-platform testing mandates
   - No React Native validation
   - No additional integration test types

3. **Practical Implementation**
   - File-based telemetry for subprocess communication
   - Minimal process management
   - Basic error handling sufficient for E2E validation

This focused feature provides essential STDIO MCP transport validation while updating necessary test infrastructure to support both HTTP and STDIO configurations without over-engineering or scope creep.
