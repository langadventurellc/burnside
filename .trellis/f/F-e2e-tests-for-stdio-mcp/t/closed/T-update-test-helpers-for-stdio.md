---
id: T-update-test-helpers-for-stdio
title: Update test helpers for STDIO transport support
status: done
priority: high
parent: F-e2e-tests-for-stdio-mcp
prerequisites:
  - T-create-stdio-mock-mcp-server
  - T-create-stdio-telemetry-reader
affectedFiles:
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
log:
  - Successfully implemented comprehensive support for both HTTP and STDIO
    transport types in test helpers while maintaining full backward
    compatibility. Extended MCP server schema, created StdioMcpServerManager for
    subprocess management, updated setupMcpServer with transport options, and
    enhanced createMcpTestConfig to support both URL strings and command
    objects. All tests pass and existing functionality remains unchanged.
schema: v1.0
childrenIds: []
created: 2025-09-21T17:15:18.894Z
updated: 2025-09-21T17:15:18.894Z
---

# Update Test Helpers for STDIO Transport Support

## Context

This task updates existing test helper functions to support both HTTP and STDIO MCP server configurations while maintaining backward compatibility. The helpers need to handle subprocess management for STDIO servers and provide a unified interface for both transport types.

**Related Issues:**

- Parent Feature: F-e2e-tests-for-stdio-mcp (E2E Tests for STDIO MCP Transport)
- Prerequisites: T-create-stdio-mock-mcp-server, T-create-stdio-telemetry-reader
- Files to modify: `src/__tests__/e2e/shared/setupMcpServer.ts`, `src/__tests__/e2e/shared/createMcpTestConfig.ts`

**Existing Patterns:**
Current test files use these helpers:

```typescript
// Setup MCP server (HTTP only currently)
const { server, config, cleanup } = await setupMcpServer();

// Create test config with MCP servers
const config = createMcpTestConfig("http://localhost:3000");

// Create client with MCP configuration
const client = createMcpTestClient({
  tools: { mcpServers: config.tools?.mcpServers },
});
```

This task extends these helpers to support STDIO transport while maintaining existing HTTP functionality.

## Specific Implementation Requirements

### 1. **Update setupMcpServer Function**

**Current signature:** `setupMcpServer(): Promise<{ server: MockMcpServer; config: BridgeConfig; cleanup: () => Promise<void> }>`

**New signature:** `setupMcpServer(options?: { transport?: 'http' | 'stdio' }): Promise<{ server: MockMcpServer | StdioMcpServerManager; config: BridgeConfig; cleanup: () => Promise<void> }>`

**Key changes:**

- Add optional `transport` parameter (default: 'http' for backward compatibility)
- When `transport: 'stdio'`, spawn subprocess instead of HTTP server
- Return unified interface that works with both transport types
- Handle process management for STDIO servers

### 2. **Create StdioMcpServerManager Class**

Create new class in `setupMcpServer.ts` to manage STDIO subprocess:

```typescript
class StdioMcpServerManager {
  private childProcess?: ChildProcess;
  private telemetryReader?: StdioTelemetryReader;
  private processId?: number;

  async start(): Promise<{ command: string; args: string[] }> {
    // Spawn STDIO server subprocess
    // Return command configuration for BridgeConfig
  }

  async stop(): Promise<void> {
    // Terminate subprocess gracefully
    // Clean up telemetry files
  }

  // MockMcpServer-compatible methods for test assertions
  wasToolCalled(toolName: string): boolean {}
  getToolCallCount(toolName: string): number {}
  getToolCallsFor(
    toolName: string,
  ): Array<{ arguments: unknown; timestamp: Date }> {}
  clearToolCallHistory(): void {}
}
```

### 3. **Update createMcpTestConfig Function**

**Current signature:** `createMcpTestConfig(serverUrl: string, serverName?: string): BridgeConfig`

**New signature:** `createMcpTestConfig(serverConfig: string | { command: string; args?: string[] }, serverName?: string): BridgeConfig`

**Key changes:**

- Accept either URL string (HTTP) or command config object (STDIO)
- Generate appropriate McpServerConfig based on input type
- Maintain backward compatibility with string URLs

### 4. **Subprocess Management Implementation**

Implement robust subprocess handling:

- Use `child_process.spawn()` to start STDIO server
- Monitor subprocess health and startup
- Handle subprocess communication errors
- Implement graceful shutdown with SIGTERM
- Clean up telemetry files and processes

## Technical Approach

### **Step-by-Step Implementation:**

1. **Import required modules in setupMcpServer.ts**

   ```typescript
   import { spawn, type ChildProcess } from "child_process";
   import {
     createStdioTelemetryReader,
     type StdioTelemetryReader,
   } from "./stdioTelemetryReader";
   import path from "path";
   ```

2. **Create StdioMcpServerManager class**
   - Implement subprocess spawning and management
   - Create telemetry reader interface
   - Handle process lifecycle and cleanup
   - Provide MockMcpServer-compatible methods

3. **Update setupMcpServer function**
   - Add transport options parameter
   - Route to HTTP or STDIO implementation based on transport type
   - Return unified interface for both server types
   - Maintain backward compatibility (default to HTTP)

4. **Create unified server interface**

   ```typescript
   interface McpServerInterface {
     wasToolCalled(toolName: string): boolean;
     getToolCallCount(toolName: string): number;
     getToolCallsFor(
       toolName: string,
     ): Array<{ arguments: unknown; timestamp: Date }>;
     clearToolCallHistory(): void;
   }
   ```

5. **Update createMcpTestConfig function**
   - Add overloaded type definitions
   - Handle both URL strings and command objects
   - Generate appropriate server configurations

6. **Add comprehensive error handling**
   - Handle subprocess spawn failures
   - Manage process communication errors
   - Implement timeout mechanisms
   - Clean up resources on failures

### **Implementation Example:**

```typescript
// Updated setupMcpServer function
export async function setupMcpServer(
  options: { transport?: "http" | "stdio" } = {},
): Promise<{
  server: McpServerInterface;
  config: BridgeConfig;
  cleanup: () => Promise<void>;
}> {
  const transport = options.transport ?? "http";

  if (transport === "stdio") {
    const manager = new StdioMcpServerManager();
    const { command, args } = await manager.start();
    const config = createMcpTestConfig({ command, args });

    return {
      server: manager,
      config,
      cleanup: () => manager.stop(),
    };
  } else {
    // Existing HTTP implementation
    const server = new MockMcpServer();
    const { url } = await server.start();
    const config = createMcpTestConfig(url);

    return {
      server,
      config,
      cleanup: () => server.stop(),
    };
  }
}
```

## Detailed Acceptance Criteria

### **Functional Requirements:**

1. **Backward Compatibility**
   - All existing test files must continue working without changes
   - Default behavior must remain HTTP transport
   - Existing method signatures must work without modification
   - All current assertion patterns must continue functioning

2. **STDIO Transport Support**
   - `setupMcpServer({ transport: 'stdio' })` must spawn subprocess successfully
   - Must return server interface compatible with existing test assertions
   - Must handle subprocess communication and lifecycle properly
   - Must provide same telemetry methods as HTTP MockMcpServer

3. **Configuration Generation**
   - `createMcpTestConfig({ command: 'path', args: ['arg1'] })` must create valid STDIO config
   - Must generate proper McpServerConfig with command and args fields
   - Must maintain compatibility with existing URL-based configs

4. **Process Management**
   - Must start subprocess within 5 seconds
   - Must detect subprocess startup success/failure
   - Must terminate subprocess gracefully on cleanup
   - Must handle process crashes and communication errors
   - Must clean up telemetry files on termination

### **Technical Requirements:**

1. **Files to Modify:**
   - `src/__tests__/e2e/shared/setupMcpServer.ts` - Add STDIO support
   - `src/__tests__/e2e/shared/createMcpTestConfig.ts` - Support command configs

2. **New Classes/Interfaces:**
   - `StdioMcpServerManager` - Manages STDIO subprocess
   - `McpServerInterface` - Unified interface for both transport types

3. **Error Handling:**
   - Subprocess spawn failures → Throw descriptive error
   - Process communication errors → Log and attempt recovery
   - Cleanup failures → Log warnings but don't throw
   - Timeout scenarios → Terminate process and throw error

### **Interface Compatibility Requirements:**

**setupMcpServer return value must support:**

```typescript
// Existing test patterns that must continue working
const { server, config, cleanup } = await setupMcpServer();
expect(server.wasToolCalled("echo_tool")).toBe(true);
expect(server.getToolCallCount("echo_tool")).toBeGreaterThan(0);
server.clearToolCallHistory();
await cleanup();
```

**createMcpTestConfig must support:**

```typescript
// Existing HTTP usage (must continue working)
const config1 = createMcpTestConfig("http://localhost:3000");

// New STDIO usage
const config2 = createMcpTestConfig({
  command: "./src/__tests__/e2e/shared/bin/stdio-mcp-server.js",
  args: ["--test-mode"],
});
```

## Implementation Details

### **StdioMcpServerManager Implementation:**

```typescript
class StdioMcpServerManager implements McpServerInterface {
  private childProcess?: ChildProcess;
  private telemetryReader?: StdioTelemetryReader;
  private isStarted = false;

  async start(): Promise<{ command: string; args: string[] }> {
    const serverPath = path.resolve(__dirname, "bin/stdio-mcp-server.js");

    this.childProcess = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    // Wait for process to start and be ready
    await this.waitForReady();

    this.telemetryReader = createStdioTelemetryReader(this.childProcess.pid!);
    this.isStarted = true;

    return {
      command: "node",
      args: [serverPath],
    };
  }

  async stop(): Promise<void> {
    if (this.childProcess && !this.childProcess.killed) {
      this.childProcess.kill("SIGTERM");
      await this.waitForExit();
    }
    this.telemetryReader?.clearToolCallHistory();
    this.isStarted = false;
  }

  wasToolCalled(toolName: string): boolean {
    return this.telemetryReader?.wasToolCalled(toolName) ?? false;
  }

  // ... other MockMcpServer-compatible methods
}
```

## Dependencies

- **Prerequisites:** T-create-stdio-mock-mcp-server, T-create-stdio-telemetry-reader
- **Requires:** Node.js built-in modules (`child_process`, `path`)
- **Modifies:** Existing test helper functions
- **Provides:** STDIO transport support for test helpers

## Out of Scope

- **Complex process monitoring:** Basic health checking sufficient
- **Advanced error recovery:** Simple error handling for test scenarios
- **Performance optimization:** Focus on correctness over speed
- **Multiple STDIO servers:** Single server per test environment
- **Configuration validation:** Basic validation sufficient for tests
- **Cross-platform process management:** Unix-style signals sufficient

## Testing Requirements

### **Unit Tests to Include:**

1. **Backward compatibility tests**

   ```typescript
   describe("setupMcpServer backward compatibility", () => {
     test("default behavior creates HTTP server", async () => {
       const { server, config } = await setupMcpServer();
       expect(config.tools?.mcpServers?.[0]).toHaveProperty("url");
     });
   });
   ```

2. **STDIO transport tests**

   ```typescript
   test("STDIO transport creates subprocess", async () => {
     const { server, config } = await setupMcpServer({ transport: "stdio" });
     expect(config.tools?.mcpServers?.[0]).toHaveProperty("command");
   });
   ```

3. **Configuration generation tests**
   - Test URL-based config generation
   - Test command-based config generation
   - Test invalid input handling

4. **Process management tests**
   - Test subprocess startup and shutdown
   - Test process health monitoring
   - Test cleanup scenarios

### **Integration Testing:**

1. Verify HTTP tests continue working unchanged
2. Test STDIO server spawning and communication
3. Validate telemetry interface compatibility
4. Test cleanup and resource management

This task enables the test infrastructure to support both HTTP and STDIO MCP transports while maintaining complete backward compatibility with existing test suites.
