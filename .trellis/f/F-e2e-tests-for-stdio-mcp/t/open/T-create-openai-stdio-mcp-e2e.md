---
id: T-create-openai-stdio-mcp-e2e
title: Create OpenAI STDIO MCP E2E test
status: open
priority: medium
parent: F-e2e-tests-for-stdio-mcp
prerequisites:
  - T-update-test-helpers-for-stdio
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T18:08:17.612Z
updated: 2025-09-21T18:08:17.612Z
---

# Create OpenAI STDIO MCP E2E Test

## Context

This task creates a comprehensive end-to-end test for STDIO MCP transport using the OpenAI provider. The test validates that subprocess-based MCP servers work identically to HTTP servers and that LLM providers can discover and execute tools through STDIO transport.

**Related Issues:**

- Parent Feature: F-e2e-tests-for-stdio-mcp (E2E Tests for STDIO MCP Transport)
- Prerequisites: T-update-test-helpers-for-stdio (provides STDIO test infrastructure)
- Reference: `src/__tests__/e2e/openai/mcpTools.e2e.test.ts` (existing HTTP-based test)
- Pattern: T-create-anthropic-stdio-mcp (Anthropic STDIO test implementation)

**Existing Patterns:**
This test follows the exact same structure as existing OpenAI MCP tests but uses STDIO transport:

```typescript
// Current HTTP pattern
const { server, config } = await setupMcpServer();

// New STDIO pattern
const { server, config } = await setupMcpServer({ transport: "stdio" });

// Same assertions work for both
expect(server.wasToolCalled("echo_tool")).toBe(true);
```

## Specific Implementation Requirements

### 1. **File Creation**

Create `src/__tests__/e2e/openai/stdioMcpTools.e2e.test.ts` following the exact structure of the existing HTTP test but with STDIO transport configuration.

### 2. **Test Structure**

Implement identical test structure to HTTP version:

- Same test setup and teardown patterns
- Same provider authentication and initialization
- Same tool discovery and execution tests
- Same assertion patterns and expectations
- Different only in transport configuration

### 3. **STDIO Transport Configuration**

Use updated test helpers for STDIO support:

```typescript
// Setup STDIO MCP server instead of HTTP
const mcpSetup = await setupMcpServer({ transport: "stdio" });
mcpServer = mcpSetup.server;
mcpConfig = mcpSetup.config;
cleanup = mcpSetup.cleanup;
```

### 4. **Identical Test Cases**

Implement same test cases as HTTP version:

- **MCP Tool Discovery:** Validate STDIO server configuration in client
- **MCP Tool Execution:** Execute echo_tool through OpenAI model via STDIO
- **Tool Call Verification:** Use telemetry to verify tool execution
- **Transport Behavior:** Ensure STDIO works identically to HTTP

### 5. **Subprocess Management**

Handle STDIO-specific concerns:

- Wait for subprocess initialization
- Handle process communication timeouts
- Ensure proper cleanup of subprocess and telemetry files
- Validate subprocess health during test execution

## Technical Approach

### **Step-by-Step Implementation:**

1. **Copy existing HTTP test as template**

   ```bash
   cp src/__tests__/e2e/openai/mcpTools.e2e.test.ts src/__tests__/e2e/openai/stdioMcpTools.e2e.test.ts
   ```

2. **Update test description and imports**
   - Change test suite name to indicate STDIO transport
   - Ensure all necessary imports are present
   - Add any STDIO-specific imports if needed

3. **Modify server setup to use STDIO transport**

   ```typescript
   // Replace HTTP setup
   const mcpSetup = await setupMcpServer();

   // With STDIO setup
   const mcpSetup = await setupMcpServer({ transport: "stdio" });
   ```

4. **Update configuration validation**
   - Verify MCP server config has `command` field instead of `url`
   - Validate subprocess-based configuration
   - Ensure same tool discovery behavior

5. **Add STDIO-specific timeout handling**
   - Account for subprocess startup time
   - Handle potential subprocess communication delays
   - Maintain same overall test timeouts

6. **Validate identical behavior**
   - Ensure tool execution produces same results
   - Verify assertion patterns work identically
   - Confirm transport independence of LLM provider

### **Test Implementation Template:**

```typescript
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { getOpenAiTestModel } from "../shared/getOpenAiTestModel";
import { loadOpenAiTestConfig } from "../shared/openAiTestConfig";
import { validateMessageSchema } from "../shared/testHelpers";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { setupMcpServer } from "../shared/setupMcpServer";
import { createMcpTestClient } from "../shared/createMcpTestClient";
import type { McpServerInterface } from "../shared/setupMcpServer";
import type { BridgeConfig } from "../../../core/config/bridgeConfig";

describe("OpenAI STDIO MCP Tool E2E", () => {
  let client: BridgeClient;
  let mcpServer: McpServerInterface;
  let testModel: string;
  let cleanup: () => Promise<void>;
  let mcpConfig: BridgeConfig;

  beforeAll(async () => {
    try {
      // Setup STDIO MCP server (key difference from HTTP test)
      const mcpSetup = await setupMcpServer({ transport: "stdio" });
      mcpServer = mcpSetup.server;
      mcpConfig = mcpSetup.config;
      cleanup = mcpSetup.cleanup;

      // Rest identical to HTTP test...
      const testConfig = loadOpenAiTestConfig();
      client = createMcpTestClient({
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: testConfig.openAiApiKey },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: mcpConfig.tools?.mcpServers || [],
        },
      });

      // ... identical provider setup and registration
    } catch (error) {
      console.error("Error in STDIO MCP test setup:", error);
      throw error;
    }
  });

  // ... identical test cases with same assertions
});
```

## Detailed Acceptance Criteria

### **Functional Requirements:**

1. **STDIO Transport Validation**
   - Must use STDIO transport configuration (command-based, not URL)
   - Must spawn subprocess successfully and maintain communication
   - Must validate MCP server config has `command` field instead of `url`
   - Must handle subprocess initialization within test timeout

2. **Tool Discovery and Execution**
   - Must discover echo_tool through STDIO subprocess communication
   - Must execute tool through OpenAI model via STDIO transport
   - Must receive identical tool execution results as HTTP transport
   - Must validate tool call telemetry through file-based mechanism

3. **Test Assertions**
   - Must use identical assertion patterns as HTTP test:
     ```typescript
     expect(mcpServer.wasToolCalled("echo_tool")).toBe(true);
     expect(mcpServer.getToolCallCount("echo_tool")).toBeGreaterThan(0);
     const toolCalls = mcpServer.getToolCallsFor("echo_tool");
     expect(toolCalls[0].arguments).toMatchObject({ message: testInput });
     ```
   - Must validate same message schema and response structure
   - Must confirm transport-agnostic LLM provider behavior

4. **Process Management**
   - Must clean up subprocess and telemetry files in afterAll
   - Must handle subprocess communication errors gracefully
   - Must complete test execution within reasonable timeouts
   - Must not leave orphaned processes or temporary files

### **Technical Requirements:**

1. **File Location:** `src/__tests__/e2e/openai/stdioMcpTools.e2e.test.ts`
2. **Test Structure:** Identical to existing HTTP test with transport configuration change
3. **Dependencies:** Uses updated test helpers with STDIO support
4. **Provider:** OpenAI only (single provider focus per feature requirements)

### **Test Cases to Implement:**

**1. MCP Tool Discovery Test**

```typescript
describe("MCP Tool Discovery", () => {
  test("should discover MCP tools through STDIO transport", () => {
    expect(client.getConfig().tools?.mcpServers).toBeDefined();
    const mcpServers = client.getConfig().tools?.mcpServers || [];
    expect(mcpServers).toHaveLength(1);
    expect(mcpServers[0]).toHaveProperty("command"); // Key difference: command not url
    expect(mcpServers[0]).not.toHaveProperty("url");
  });
});
```

**2. MCP Tool Execution Test**

```typescript
describe("MCP Tool Execution", () => {
  test("should execute MCP tool through STDIO subprocess", async () => {
    mcpServer.clearToolCallHistory();

    const testInput = "Hello MCP from OpenAI via STDIO";
    const messages = createTestMessages(
      `Please use the mcp_echo_tool to echo this message: "${testInput}"`,
    );

    const response = await withTimeout(
      client.chat({
        model: testModel,
        messages,
        maxTokens: 100,
      }),
      25000,
    );

    // Identical assertions as HTTP test
    validateMessageSchema(response);
    expect(response.role).toBe("assistant");
    expect(mcpServer.wasToolCalled("echo_tool")).toBe(true);
    expect(mcpServer.getToolCallCount("echo_tool")).toBeGreaterThan(0);

    const toolCalls = mcpServer.getToolCallsFor("echo_tool");
    expect(toolCalls[0].arguments).toMatchObject({ message: testInput });
  });
});
```

### **Error Handling Requirements:**

1. **Subprocess Failures**
   - Handle subprocess spawn failures with descriptive errors
   - Detect subprocess crashes during test execution
   - Timeout subprocess startup if taking too long

2. **Communication Errors**
   - Handle JSON-RPC communication failures
   - Detect malformed responses from subprocess
   - Manage subprocess unresponsiveness

3. **Cleanup Requirements**
   - Always terminate subprocess in afterAll, even on test failures
   - Clean up telemetry files regardless of test outcome
   - Log cleanup warnings but don't fail tests on cleanup errors

## Implementation Checklist

### **Pre-Implementation:**

- [ ] Verify prerequisite tasks are complete
- [ ] Review existing HTTP test structure
- [ ] Understand STDIO test helper interface

### **Implementation Steps:**

- [ ] Copy existing HTTP test as template
- [ ] Update imports and test suite naming
- [ ] Modify server setup for STDIO transport
- [ ] Update configuration validation logic
- [ ] Add subprocess-specific error handling
- [ ] Validate identical assertion patterns
- [ ] Test subprocess cleanup scenarios

### **Validation Steps:**

- [ ] Run test against STDIO mock server
- [ ] Verify subprocess spawning and communication
- [ ] Confirm tool execution through OpenAI model
- [ ] Validate telemetry file-based assertions
- [ ] Test cleanup and resource management
- [ ] Ensure no process or file leaks

## Dependencies

- **Prerequisites:** T-update-test-helpers-for-stdio (STDIO transport support)
- **Requires:** OpenAI API key for provider testing
- **Uses:** Updated setupMcpServer, createMcpTestClient with STDIO support
- **Validates:** Complete STDIO MCP transport functionality

## Out of Scope

- **Multiple provider tests:** Only OpenAI as specified in this task
- **Complex tool scenarios:** Only basic echo_tool execution
- **Performance testing:** Focus on functional validation
- **Error recovery scenarios:** Basic error handling sufficient
- **Concurrent subprocess testing:** Single subprocess per test
- **Advanced MCP features:** Basic tool execution only

## Success Criteria

### **Test Execution:**

1. Test passes consistently in CI/CD environment
2. Subprocess starts and communicates successfully
3. OpenAI model executes tools via STDIO transport
4. All assertions pass with identical results to HTTP test
5. Cleanup completes without resource leaks

### **Validation:**

1. STDIO transport proven to work end-to-end with OpenAI
2. Transport-agnostic behavior confirmed for OpenAI provider
3. File-based telemetry system validated
4. Subprocess management patterns established for future tests

This test validates that STDIO MCP transport works correctly with OpenAI provider, extending the feature's coverage beyond Anthropic while maintaining the same implementation patterns.
