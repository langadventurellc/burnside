/**
 * Mock MCP Server Unit Tests
 *
 * Comprehensive tests for MockMcpServer ensuring JSON-RPC 2.0 compliance,
 * MCP protocol correctness, and reliable behavior for E2E testing scenarios.
 */

import { MockMcpServer } from "./mockMcpServer";
import type { MockMcpServerOptions } from "./mockMcpServerOptions";
import type { McpToolDefinition } from "./mcpToolDefinition";

describe("MockMcpServer", () => {
  let server: MockMcpServer;

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe("Server Lifecycle", () => {
    test("should start on dynamic port by default", async () => {
      server = new MockMcpServer();
      const { port, url } = await server.start();

      expect(port).toBeGreaterThan(0);
      expect(url).toBe(`http://127.0.0.1:${port}`);
      expect(server.getPort()).toBe(port);
      expect(server.getUrl()).toBe(url);
    });

    test("should start on specified port", async () => {
      const options: MockMcpServerOptions = { port: 0 }; // 0 = dynamic
      server = new MockMcpServer(options);
      const { port } = await server.start();

      expect(port).toBeGreaterThan(0);
    });

    test("should stop gracefully", async () => {
      server = new MockMcpServer();
      await server.start();
      await server.stop();

      // Should be able to stop multiple times without error
      await server.stop();
    });

    test("should throw error when starting already running server", async () => {
      server = new MockMcpServer();
      await server.start();

      await expect(server.start()).rejects.toThrow(
        "Mock MCP server is already running",
      );
    });

    test("should throw error when getting port before starting", () => {
      server = new MockMcpServer();

      expect(() => server.getPort()).toThrow("Server is not running");
      expect(() => server.getUrl()).toThrow("Server is not running");
    });
  });

  describe("Tool Management", () => {
    beforeEach(() => {
      server = new MockMcpServer();
    });

    test("should register default echo tool", () => {
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(1);
      expect(tools[0]).toEqual({
        name: "mcp_echo_tool",
        description:
          "Echo tool for MCP E2E testing - returns input data with test metadata",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Message to echo back",
            },
          },
          required: ["message"],
        },
      });
    });

    test("should register custom tools", () => {
      const customTool: McpToolDefinition = {
        name: "custom_tool",
        description: "Custom test tool",
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
          required: ["input"],
        },
      };

      const options: MockMcpServerOptions = {
        tools: [customTool],
      };

      server = new MockMcpServer(options);
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(1);
      expect(tools[0]).toEqual(customTool);
    });

    test("should add and remove tools dynamically", () => {
      const newTool: McpToolDefinition = {
        name: "dynamic_tool",
        description: "Dynamically added tool",
      };

      server.addTool(newTool);
      expect(server.getRegisteredTools()).toHaveLength(2);

      server.removeTool("dynamic_tool");
      expect(server.getRegisteredTools()).toHaveLength(1);

      server.clearTools();
      expect(server.getRegisteredTools()).toHaveLength(0);
    });
  });

  describe("JSON-RPC 2.0 Protocol", () => {
    beforeEach(async () => {
      server = new MockMcpServer();
      await server.start();
    });

    test("should handle valid initialize request", async () => {
      const response = await makeJsonRpcRequest(server, {
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          capabilities: { tools: { supported: true } },
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
        id: 1,
      });

      expect(response).toEqual({
        jsonrpc: "2.0",
        result: {
          capabilities: { tools: { supported: true } },
          serverInfo: { name: "MockMcpServer", version: "1.0.0" },
        },
        id: 1,
      });
    });

    test("should handle tools/list request", async () => {
      const response = await makeJsonRpcRequest(server, {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 2,
      });

      expect(response).toEqual({
        jsonrpc: "2.0",
        result: {
          tools: [
            {
              name: "mcp_echo_tool",
              description:
                "Echo tool for MCP E2E testing - returns input data with test metadata",
              inputSchema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    description: "Message to echo back",
                  },
                },
                required: ["message"],
              },
            },
          ],
        },
        id: 2,
      });
    });

    test("should handle tools/call request", async () => {
      const response = await makeJsonRpcRequest(server, {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "mcp_echo_tool",
          arguments: { message: "test message" },
        },
        id: 3,
      });

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(3);
      expect(response.result).toBeDefined();

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");

      const parsedText = JSON.parse(result.content[0].text);
      expect(parsedText.echoed).toBe("test message");
      expect(parsedText.testSuccess).toBe(true);
      expect(parsedText.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    test("should return method not found for unknown methods", async () => {
      const response = await makeJsonRpcRequest(server, {
        jsonrpc: "2.0",
        method: "unknown/method",
        id: 4,
      });

      expect(response).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32601,
          message: "Method not found",
          data: { method: "unknown/method" },
        },
        id: 4,
      });
    });

    test("should return tool not found for unknown tools", async () => {
      const response = await makeJsonRpcRequest(server, {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "unknown_tool",
          arguments: { input: "test" },
        },
        id: 5,
      });

      expect(response).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32601,
          message: "Method not found",
          data: { details: "Tool 'unknown_tool' not found" },
        },
        id: 5,
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      server = new MockMcpServer();
      await server.start();
    });

    test("should handle invalid JSON", async () => {
      const response = await makeRawRequest(server, "invalid json");

      expect(response).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32700,
          message: "Parse error",
          data: { details: "Invalid JSON" },
        },
        id: null,
      });
    });

    test("should handle invalid JSON-RPC version", async () => {
      const response = await makeRawRequest(
        server,
        JSON.stringify({
          jsonrpc: "1.0",
          method: "test",
          id: 1,
        }),
      );

      expect(response).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Invalid Request",
          data: { details: "jsonrpc must be '2.0'" },
        },
        id: 1,
      });
    });

    test("should handle missing method", async () => {
      const response = await makeRawRequest(
        server,
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
        }),
      );

      expect(response).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Invalid Request",
          data: { details: "method must be a string" },
        },
        id: 1,
      });
    });

    test("should handle invalid initialize params", async () => {
      const response = await makeJsonRpcRequest(server, {
        jsonrpc: "2.0",
        method: "initialize",
        params: "invalid",
        id: 1,
      });

      expect(response).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Invalid params",
          data: { details: "initialize requires capabilities parameter" },
        },
        id: 1,
      });
    });

    test("should handle invalid tools/call params", async () => {
      const response = await makeJsonRpcRequest(server, {
        jsonrpc: "2.0",
        method: "tools/call",
        params: { arguments: { test: true } }, // missing name
        id: 1,
      });

      expect(response).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Invalid params",
          data: { details: "name parameter is required and must be a string" },
        },
        id: 1,
      });
    });

    test("should reject non-POST requests", async () => {
      const url = server.getUrl();
      const response = await fetch(url, { method: "GET" });

      expect(response.status).toBe(405);
      const result = await response.json();
      expect(result).toEqual({ error: "Method not allowed" });
    });

    test("should reject non-JSON content type", async () => {
      const url = server.getUrl();
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "test",
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toEqual({
        jsonrpc: "2.0",
        error: {
          code: -32700,
          message: "Parse error",
          data: { details: "Content-Type must be application/json" },
        },
        id: null,
      });
    });

    test("should handle OPTIONS requests for CORS", async () => {
      const url = server.getUrl();
      const response = await fetch(url, { method: "OPTIONS" });

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "POST, OPTIONS",
      );
    });
  });

  describe("JSON-RPC Notifications", () => {
    beforeEach(async () => {
      server = new MockMcpServer();
      await server.start();
    });

    test("should handle notifications without response", async () => {
      const url = server.getUrl();
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notification/test",
          params: { data: "test" },
          // No id field = notification
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe(""); // No response body for notifications
    });
  });

  describe("Custom Tool Execution", () => {
    beforeEach(async () => {
      const customTool: McpToolDefinition = {
        name: "custom_calculator",
        description: "Custom calculator tool",
        inputSchema: {
          type: "object",
          properties: {
            operation: { type: "string" },
            a: { type: "number" },
            b: { type: "number" },
          },
          required: ["operation", "a", "b"],
        },
      };

      server = new MockMcpServer({ tools: [customTool] });
      await server.start();
    });

    test("should execute custom tools with generic response", async () => {
      const response = await makeJsonRpcRequest(server, {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "custom_calculator",
          arguments: { operation: "add", a: 5, b: 3 },
        },
        id: 1,
      });

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();

      const result = response.result as {
        content: Array<{ type: string; text: string }>;
      };
      const parsedText = JSON.parse(result.content[0].text);

      expect(parsedText.tool).toBe("custom_calculator");
      expect(parsedText.result).toBe("Mock tool execution successful");
      expect(parsedText.arguments).toEqual({ operation: "add", a: 5, b: 3 });
      expect(parsedText.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});

/**
 * Helper function to make JSON-RPC requests to the mock server
 */
async function makeJsonRpcRequest(
  server: MockMcpServer,
  request: object,
): Promise<any> {
  const url = server.getUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return response.json();
}

/**
 * Helper function to make raw requests to the mock server
 */
async function makeRawRequest(
  server: MockMcpServer,
  body: string,
): Promise<any> {
  const url = server.getUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  return response.json();
}
