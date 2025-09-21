/**
 * Mock MCP Server for E2E Testing
 *
 * Lightweight Mock MCP Server that provides JSON-RPC 2.0 compliant responses
 * for testing MCP tooling integration. Supports core MCP methods with predictable
 * responses without requiring external dependencies.
 *
 * @example Basic usage
 * ```typescript
 * const server = new MockMcpServer();
 * const { port, url } = await server.start();
 *
 * // Create McpClient and connect to mock server
 * const client = new McpClient(adapter, url);
 * await client.connect();
 *
 * // Test tool discovery and execution
 * const tools = await client.listTools();
 * const result = await client.callTool('mcp_echo_tool', { message: 'test' });
 *
 * await client.disconnect();
 * await server.stop();
 * ```
 */

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import type { AddressInfo } from "net";
import type { MockMcpServerOptions } from "./mockMcpServerOptions";
import type { McpToolDefinition } from "./mcpToolDefinition";

/**
 * JSON-RPC 2.0 request structure
 */
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id?: string | number | null;
}

/**
 * JSON-RPC 2.0 response structure
 */
interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: JsonRpcError;
  id: string | number | null;
}

/**
 * JSON-RPC 2.0 error structure
 */
interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * MCP tool execution result
 */
interface McpToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

/**
 * MCP initialize response structure
 */
interface McpInitializeResponse {
  protocolVersion: string;
  capabilities: {
    tools?: { supported: boolean };
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

/**
 * Lightweight Mock MCP Server for E2E testing
 *
 * Provides JSON-RPC 2.0 compliant MCP protocol responses with predictable
 * tool behavior for testing MCP tooling integration across providers.
 * Supports dynamic port allocation for parallel test execution.
 */
export class MockMcpServer {
  private readonly server = createServer();
  private readonly options: Required<MockMcpServerOptions>;
  private readonly tools = new Map<string, McpToolDefinition>();
  private readonly toolCalls = new Map<
    string,
    Array<{ arguments: unknown; timestamp: Date }>
  >();
  private isRunning = false;

  constructor(options: MockMcpServerOptions = {}) {
    this.options = {
      port: options.port ?? 0, // 0 = dynamic allocation
      tools: options.tools ?? [],
      enableLogging: options.enableLogging ?? false,
    };

    // Register default test tool if no custom tools provided
    if (this.options.tools.length === 0) {
      this.addTool(this.createDefaultEchoTool());
    } else {
      this.options.tools.forEach((tool) => this.addTool(tool));
    }

    // Setup HTTP request handler
    this.server.on("request", (req, res) => {
      void this.handleRequest(req, res);
    });
  }

  /**
   * Start the mock MCP server on available port
   *
   * @returns Promise resolving to server connection details
   */
  async start(): Promise<{ port: number; url: string }> {
    if (this.isRunning) {
      throw new Error("Mock MCP server is already running");
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.options.port, "127.0.0.1", () => {
        const address = this.server.address() as AddressInfo;
        const port = address.port;
        const url = `http://127.0.0.1:${port}`;

        this.isRunning = true;

        if (this.options.enableLogging) {
          console.log(`Mock MCP Server started on ${url}`);
        }

        resolve({ port, url });
      });

      this.server.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop the mock MCP server and cleanup resources
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          this.isRunning = false;
          if (this.options.enableLogging) {
            console.log("Mock MCP Server stopped");
          }
          resolve();
        }
      });
    });
  }

  /**
   * Get the current server port (only available after start())
   */
  getPort(): number {
    if (!this.isRunning) {
      throw new Error("Server is not running");
    }
    const address = this.server.address() as AddressInfo;
    return address.port;
  }

  /**
   * Get the current server URL (only available after start())
   */
  getUrl(): string {
    const port = this.getPort();
    return `http://127.0.0.1:${port}`;
  }

  /**
   * Add a custom tool to the server registry
   */
  addTool(tool: McpToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Remove a tool from the server registry
   */
  removeTool(toolName: string): void {
    this.tools.delete(toolName);
  }

  /**
   * Clear all tools from the server registry
   */
  clearTools(): void {
    this.tools.clear();
  }

  /**
   * Get list of currently registered tools
   */
  getRegisteredTools(): McpToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tool calls made to this server
   */
  getToolCalls(): Record<
    string,
    Array<{ arguments: unknown; timestamp: Date }>
  > {
    return Object.fromEntries(this.toolCalls);
  }

  /**
   * Get calls for a specific tool
   */
  getToolCallsFor(
    toolName: string,
  ): Array<{ arguments: unknown; timestamp: Date }> {
    return this.toolCalls.get(toolName) || [];
  }

  /**
   * Check if a tool has been called
   */
  wasToolCalled(toolName: string): boolean {
    return this.getToolCallsFor(toolName).length > 0;
  }

  /**
   * Get the number of times a tool was called
   */
  getToolCallCount(toolName: string): number {
    return this.getToolCallsFor(toolName).length;
  }

  /**
   * Clear all tool call history
   */
  clearToolCallHistory(): void {
    this.toolCalls.clear();
  }

  /**
   * Handle incoming HTTP requests with JSON-RPC 2.0 processing
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    // Set CORS headers for testing
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // Only accept POST requests for JSON-RPC
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    try {
      // Read request body
      const body = await this.readRequestBody(req);
      const contentType = req.headers["content-type"] || "";

      if (!contentType.includes("application/json")) {
        this.sendJsonRpcError(res, null, -32700, "Parse error", {
          details: "Content-Type must be application/json",
        });
        return;
      }

      // Parse JSON-RPC request
      let jsonRpcRequest: JsonRpcRequest;
      try {
        jsonRpcRequest = JSON.parse(body) as JsonRpcRequest;
      } catch {
        this.sendJsonRpcError(res, null, -32700, "Parse error", {
          details: "Invalid JSON",
        });
        return;
      }

      // Validate JSON-RPC format
      if (jsonRpcRequest.jsonrpc !== "2.0") {
        this.sendJsonRpcError(
          res,
          jsonRpcRequest.id ?? null,
          -32600,
          "Invalid Request",
          { details: "jsonrpc must be '2.0'" },
        );
        return;
      }

      if (typeof jsonRpcRequest.method !== "string") {
        this.sendJsonRpcError(
          res,
          jsonRpcRequest.id ?? null,
          -32600,
          "Invalid Request",
          { details: "method must be a string" },
        );
        return;
      }

      if (this.options.enableLogging) {
        console.log(
          `Mock MCP Server: Received ${jsonRpcRequest.method} request`,
          jsonRpcRequest.params,
        );
      }

      // Handle JSON-RPC notification (no id field)
      if (jsonRpcRequest.id === undefined) {
        // Notifications don't get responses
        res.writeHead(200);
        res.end();
        return;
      }

      // Process the request
      const response = this.processJsonRpcRequest(jsonRpcRequest);

      // Send response
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response));

      if (this.options.enableLogging) {
        console.log(
          `Mock MCP Server: Sent response for ${jsonRpcRequest.method}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      this.sendJsonRpcError(res, null, -32603, "Internal error", {
        details: message,
      });
    }
  }

  /**
   * Process a JSON-RPC request and return appropriate response
   */
  private processJsonRpcRequest(request: JsonRpcRequest): JsonRpcResponse {
    const { method, params, id } = request;
    const responseId = id ?? null;

    try {
      switch (method) {
        case "initialize":
          return this.handleInitialize(responseId, params);

        case "tools/list":
          return this.handleToolsList(responseId);

        case "tools/call":
          return this.handleToolsCall(responseId, params);

        default:
          return {
            jsonrpc: "2.0",
            error: {
              code: -32601,
              message: "Method not found",
              data: { method },
            },
            id: responseId,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error",
          data: { details: message },
        },
        id: responseId,
      };
    }
  }

  /**
   * Handle MCP initialize method
   */
  private handleInitialize(
    id: string | number | null,
    params: unknown,
  ): JsonRpcResponse {
    // Basic validation - MCP initialize should have capabilities
    if (!params || typeof params !== "object") {
      return {
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Invalid params",
          data: { details: "initialize requires capabilities parameter" },
        },
        id,
      };
    }

    const response: McpInitializeResponse = {
      protocolVersion: "2025-06-18",
      capabilities: {
        tools: { supported: true },
      },
      serverInfo: {
        name: "MockMcpServer",
        version: "1.0.0",
      },
    };

    return {
      jsonrpc: "2.0",
      result: response,
      id,
    };
  }

  /**
   * Handle MCP tools/list method
   */
  private handleToolsList(id: string | number | null): JsonRpcResponse {
    const tools = Array.from(this.tools.values());

    return {
      jsonrpc: "2.0",
      result: { tools },
      id,
    };
  }

  /**
   * Handle MCP tools/call method
   */
  private handleToolsCall(
    id: string | number | null,
    params: unknown,
  ): JsonRpcResponse {
    if (!params || typeof params !== "object") {
      return {
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Invalid params",
          data: { details: "tools/call requires name and arguments" },
        },
        id,
      };
    }

    const callParams = params as { name?: string; arguments?: unknown };

    if (!callParams.name || typeof callParams.name !== "string") {
      return {
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Invalid params",
          data: { details: "name parameter is required and must be a string" },
        },
        id,
      };
    }

    const tool = this.tools.get(callParams.name);
    if (!tool) {
      return {
        jsonrpc: "2.0",
        error: {
          code: -32601,
          message: "Method not found",
          data: { details: `Tool '${callParams.name}' not found` },
        },
        id,
      };
    }

    // Execute the tool (simplified for mock server)
    const result = this.executeTool(tool, callParams.arguments);

    return {
      jsonrpc: "2.0",
      result,
      id,
    };
  }

  /**
   * Execute a tool and return mock result
   */
  private executeTool(tool: McpToolDefinition, args: unknown): McpToolResult {
    // Record the tool call
    const toolCalls = this.toolCalls.get(tool.name) || [];
    toolCalls.push({
      arguments: args,
      timestamp: new Date(),
    });
    this.toolCalls.set(tool.name, toolCalls);
    // For echo_tool, return predictable echo response
    if (tool.name === "echo_tool") {
      const params = (args as { message?: string }) || {};
      const message = params.message || "default message";

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              echoed: message,
              timestamp: new Date().toISOString(),
              testSuccess: true,
            }),
          },
        ],
      };
    }

    // Generic tool execution response
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            tool: tool.name,
            result: "Mock tool execution successful",
            arguments: args,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  /**
   * Create the default echo tool for testing
   */
  private createDefaultEchoTool(): McpToolDefinition {
    return {
      name: "echo_tool",
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
    };
  }

  /**
   * Send a JSON-RPC error response
   */
  private sendJsonRpcError(
    res: ServerResponse,
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown,
  ): void {
    const errorResponse: JsonRpcResponse = {
      jsonrpc: "2.0",
      error: { code, message, data },
      id,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(errorResponse));
  }

  /**
   * Read the full request body from IncomingMessage
   */
  private readRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.setEncoding("utf8");

      req.on("data", (chunk: string) => {
        body += chunk;
      });

      req.on("end", () => {
        resolve(body);
      });

      req.on("error", (error: Error) => {
        reject(error);
      });
    });
  }
}
