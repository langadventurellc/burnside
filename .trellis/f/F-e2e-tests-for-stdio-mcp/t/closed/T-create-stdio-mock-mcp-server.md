---
id: T-create-stdio-mock-mcp-server
title: Create STDIO mock MCP server executable
status: done
priority: high
parent: F-e2e-tests-for-stdio-mcp
prerequisites: []
affectedFiles:
  src/__tests__/e2e/shared/bin/stdio-mcp-server.js: Created standalone Node.js
    executable implementing JSON-RPC 2.0 MCP server over stdin/stdout with
    cross-platform telemetry tracking, signal handling, and error management
log:
  - >-
    Successfully implemented STDIO mock MCP server executable with complete
    JSON-RPC 2.0 protocol compliance. The server provides identical tool
    behavior to the HTTP MockMcpServer but adapted for subprocess-based testing
    with cross-platform file-based telemetry tracking.


    Key features implemented:

    - JSON-RPC 2.0 protocol compliance over stdin/stdout

    - Echo tool matching MockMcpServer behavior exactly

    - Cross-platform telemetry file management using os.tmpdir()

    - Signal handlers for graceful shutdown and cleanup

    - Comprehensive error handling with proper JSON-RPC error responses

    - Atomic file operations for telemetry updates


    The server successfully handles initialize, tools/list, and tools/call
    methods, records tool executions in telemetry files, and provides proper
    error responses for malformed requests. All quality checks pass and the
    script is executable with proper permissions.
schema: v1.0
childrenIds: []
created: 2025-09-21T17:13:24.968Z
updated: 2025-09-21T17:13:24.968Z
---

# Create STDIO Mock MCP Server Executable

## Context

This task implements a standalone Node.js script that functions as a mock MCP server communicating via JSON-RPC 2.0 over stdin/stdout. This executable will be spawned as a subprocess during E2E tests to validate STDIO MCP transport functionality.

**Related Issues:**

- Parent Feature: F-e2e-tests-for-stdio-mcp (E2E Tests for STDIO MCP Transport)
- Existing Reference: `src/__tests__/e2e/shared/mockMcpServer.ts` (HTTP-based mock server)

**Existing Patterns:**
The current HTTP MockMcpServer in `src/__tests__/e2e/shared/mockMcpServer.ts` provides the behavioral template. This task creates a subprocess-compatible version that maintains identical tool execution behavior while using file-based telemetry instead of in-memory tracking.

## Specific Implementation Requirements

### 1. **Executable Script Creation**

Create `src/__tests__/e2e/shared/bin/stdio-mcp-server.js` with:

- Shebang line: `#!/usr/bin/env node`
- Make file executable: `chmod +x`
- Import necessary Node.js modules: `readline`, `fs`, `path`, `process`, `os`

### 2. **JSON-RPC 2.0 Protocol Implementation**

Implement complete JSON-RPC 2.0 protocol compliance:

- Read newline-delimited JSON from `process.stdin`
- Parse each line as separate JSON-RPC request
- Validate required fields: `jsonrpc: "2.0"`, `method`, `id`
- Send responses via `process.stdout` with newline termination
- Handle both request/response and notification patterns

### 3. **MCP Protocol Methods**

Implement these MCP protocol methods matching HTTP MockMcpServer behavior:

**initialize method:**

```javascript
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": { "capabilities": {} }
}

// Response:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": { "tools": { "supported": true } },
    "serverInfo": { "name": "StdioMockMcpServer", "version": "1.0.0" }
  }
}
```

**tools/list method:**

```javascript
// Response:
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "echo_tool",
        "description": "Echo tool for MCP E2E testing - returns input data with test metadata",
        "inputSchema": {
          "type": "object",
          "properties": {
            "message": { "type": "string", "description": "Message to echo back" }
          },
          "required": ["message"]
        }
      }
    ]
  }
}
```

**tools/call method:**

```javascript
// Request:
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": { "name": "echo_tool", "arguments": { "message": "test" } }
}

// Response:
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"echoed\":\"test\",\"timestamp\":\"2024-01-01T00:00:00.000Z\",\"testSuccess\":true}"
      }
    ]
  }
}
```

### 4. **Cross-Platform File-based Telemetry Implementation**

Implement telemetry tracking for test assertions using cross-platform paths:

**Use Node.js os.tmpdir() for cross-platform compatibility:**

```javascript
const { tmpdir } = require("os");
const path = require("path");

// Create cross-platform telemetry file path
const telemetryFile = path.join(
  tmpdir(),
  `stdio-mcp-telemetry-${process.pid}.json`,
);
```

**Write tool call data immediately upon execution:**

```javascript
{
  "toolCalls": {
    "echo_tool": [
      {
        "arguments": { "message": "test" },
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

- Update file atomically using `fs.writeFileSync()` with temp file + rename pattern
- Include cleanup on process termination

### 5. **Signal Handling and Cleanup**

Implement graceful shutdown:

- Listen for `SIGTERM` and `SIGINT` signals
- Clean up telemetry file on shutdown using cross-platform path
- Exit with code 0 on successful shutdown
- Handle unexpected errors and exit gracefully

### 6. **Error Handling**

Implement robust error handling:

- Catch and handle JSON parsing errors from stdin
- Send proper JSON-RPC error responses for invalid requests
- Log errors to stderr (never stdout to avoid protocol contamination)
- Handle malformed MCP method calls

## Technical Approach

### **Step-by-Step Implementation:**

1. **Create executable script file**

   ```bash
   mkdir -p src/__tests__/e2e/shared/bin
   touch src/__tests__/e2e/shared/bin/stdio-mcp-server.js
   chmod +x src/__tests__/e2e/shared/bin/stdio-mcp-server.js
   ```

2. **Set up basic script structure with cross-platform support**

   ```javascript
   #!/usr/bin/env node
   const readline = require("readline");
   const fs = require("fs");
   const path = require("path");
   const { tmpdir } = require("os");
   const process = require("process");

   // Cross-platform telemetry file path
   const telemetryFile = path.join(
     tmpdir(),
     `stdio-mcp-telemetry-${process.pid}.json`,
   );
   ```

3. **Implement telemetry file management**
   - Use os.tmpdir() + path.join() for cross-platform file paths
   - Create atomic write operations
   - Set up cleanup handlers

4. **Create readline interface for stdin processing**

   ```javascript
   const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout,
     terminal: false,
   });
   ```

5. **Implement JSON-RPC message processing pipeline**
   - Parse incoming lines as JSON
   - Route to appropriate MCP method handlers
   - Generate compliant responses
   - Handle errors gracefully

6. **Add signal handlers for cleanup**

### **Testing Within Implementation:**

- Unit test the script manually by running it and feeding JSON-RPC commands
- Verify telemetry file creation and content in platform-appropriate temp directory
- Test graceful shutdown with SIGTERM
- Validate JSON-RPC compliance with sample requests

## Detailed Acceptance Criteria

### **Functional Requirements:**

1. **Script Execution**
   - Must be executable as `node src/__tests__/e2e/shared/bin/stdio-mcp-server.js`
   - Must accept JSON-RPC 2.0 requests via stdin
   - Must output only JSON-RPC 2.0 responses to stdout (no other output)
   - Must log errors and debug info to stderr only

2. **MCP Protocol Compliance**
   - Must implement `initialize`, `tools/list`, and `tools/call` methods
   - Must return identical tool execution results as HTTP MockMcpServer
   - Must validate request format and send proper error responses
   - Must handle both request/response and notification patterns

3. **Cross-Platform Telemetry Tracking**
   - Must create telemetry file at `${os.tmpdir()}/stdio-mcp-telemetry-${process.pid}.json`
   - Must record all tool executions with arguments and timestamps
   - Must update telemetry file atomically on each tool call
   - Must clean up telemetry file on process termination
   - Must work on Windows, macOS, and Linux

4. **Process Management**
   - Must handle SIGTERM and SIGINT for graceful shutdown
   - Must exit with code 0 on successful shutdown
   - Must exit with non-zero code on unrecoverable errors
   - Must not leave orphaned telemetry files

### **Technical Requirements:**

1. **File Location:** `src/__tests__/e2e/shared/bin/stdio-mcp-server.js`
2. **Executable:** Must have executable permissions and proper shebang
3. **Dependencies:** Use only Node.js built-in modules (no external dependencies)
4. **Platform:** Must work cross-platform (Windows, macOS, Linux)

### **Error Scenarios to Handle:**

1. Invalid JSON on stdin → Send JSON-RPC parse error response
2. Missing required fields → Send JSON-RPC invalid request error
3. Unknown method → Send JSON-RPC method not found error
4. File system errors → Log to stderr, continue operation
5. Unexpected signals → Clean up and exit gracefully

## Dependencies

- **None** - This task is independent and foundational for other tasks
- **Requires:** Node.js built-in modules only
- **Provides:** Executable that subsequent tasks will use for subprocess testing

## Out of Scope

- **Complex MCP features:** Only implement basic tool execution (echo_tool)
- **Performance optimization:** Focus on correctness, not speed
- **Extensive error recovery:** Basic error handling sufficient for testing
- **Configuration options:** Hard-coded test configuration only
- **Multiple tool definitions:** Only implement echo_tool for testing

## Testing Requirements

### **Manual Testing Commands:**

```bash
# Test basic execution
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node src/__tests__/e2e/shared/bin/stdio-mcp-server.js

# Test tool execution
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"echo_tool","arguments":{"message":"test"}}}' | node src/__tests__/e2e/shared/bin/stdio-mcp-server.js

# Verify telemetry file creation (cross-platform)
# On Unix: ls $(node -pe "require('os').tmpdir()")/stdio-mcp-telemetry-*.json
# On Windows: dir %TEMP%\stdio-mcp-telemetry-*.json
# Check content: node -pe "JSON.stringify(require('fs').readFileSync(require('path').join(require('os').tmpdir(), 'stdio-mcp-telemetry-XXXX.json'), 'utf8'), null, 2)"
```

### **Cross-Platform Validation:**

```javascript
// Verify telemetry path generation
const { tmpdir } = require("os");
const path = require("path");
console.log(
  "Telemetry path:",
  path.join(tmpdir(), `stdio-mcp-telemetry-${process.pid}.json`),
);
```

### **Validation Criteria:**

- JSON-RPC responses are properly formatted and valid
- Telemetry file contains expected tool call data in OS-appropriate temp directory
- Process exits cleanly with SIGTERM
- No unexpected output on stdout (only JSON-RPC messages)
- Error messages (if any) appear only on stderr
- Works identically on Windows, macOS, and Linux

This task provides the foundation for STDIO MCP testing by creating a subprocess-compatible mock server that maintains compatibility with existing test assertion patterns through cross-platform file-based telemetry.
