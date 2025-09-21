/**
 * Tests for MCP Client
 *
 * Comprehensive test suite for MCP client functionality including connection
 * lifecycle, capability negotiation, tool operations, health monitoring,
 * and error handling scenarios.
 */

import { McpClient } from "../mcpClient";
import { McpConnectionError } from "../mcpConnectionError";
import { McpToolError } from "../mcpToolError";
import type { RuntimeAdapter } from "../../../core/runtime/runtimeAdapter";
import type { McpConnection } from "../../../core/runtime/mcpConnection";

// Mock dependencies
jest.mock("../../../core/logging/simpleLogger");
jest.mock("../../../core/transport/retry/exponentialBackoffStrategy");

describe("McpClient", () => {
  let mockRuntimeAdapter: jest.Mocked<RuntimeAdapter>;
  let mockConnection: jest.Mocked<McpConnection>;
  let client: McpClient;

  const serverUrl = "http://localhost:3000";
  const defaultOptions = {
    maxRetries: 3,
    baseRetryDelay: 1000,
    maxRetryDelay: 30000,
    healthCheckInterval: 30000,
    capabilityTimeout: 5000,
    logLevel: "info" as const,
    retryJitter: true,
  };

  beforeEach(() => {
    // Mock McpConnection
    mockConnection = {
      get isConnected() {
        return this._isConnected;
      },
      _isConnected: true,
      call: jest.fn(),
      notify: jest.fn(),
      close: jest.fn(),
    } as any;

    // Mock RuntimeAdapter
    mockRuntimeAdapter = {
      createMcpConnection: jest.fn().mockResolvedValue(mockConnection),
    } as any;

    client = new McpClient(mockRuntimeAdapter, serverUrl);

    // Clear all timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create client with default options", () => {
      const client = new McpClient(mockRuntimeAdapter, serverUrl);

      expect(client.isConnected).toBe(false);
    });

    it("should create client with custom options", () => {
      const customOptions = {
        maxRetries: 5,
        baseRetryDelay: 2000,
        logLevel: "debug" as const,
      };

      const client = new McpClient(
        mockRuntimeAdapter,
        serverUrl,
        customOptions,
      );

      expect(client.isConnected).toBe(false);
    });
  });

  describe("connect", () => {
    it("should successfully connect and negotiate capabilities", async () => {
      // Mock successful capability negotiation
      mockConnection.call.mockResolvedValue({
        capabilities: {
          tools: { supported: true },
        },
        serverInfo: {
          name: "TestServer",
          version: "1.0.0",
        },
        protocolVersion: "2025-06-18",
      });

      await client.connect();

      expect(client.isConnected).toBe(true);
      expect(mockRuntimeAdapter.createMcpConnection).toHaveBeenCalledWith(
        serverUrl,
        expect.objectContaining({
          timeout: defaultOptions.capabilityTimeout,
        }),
      );
      expect(mockConnection.call).toHaveBeenCalledWith(
        "initialize",
        expect.objectContaining({
          protocolVersion: "2025-06-18",
          capabilities: {
            tools: { supported: true },
            prompts: { supported: false },
            resources: { supported: false },
          },
          clientInfo: {
            name: "llm-bridge",
            version: "1.0.0",
          },
        }),
      );
    });

    it("should not reconnect if already connected", async () => {
      // Mock successful first connection
      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });

      await client.connect();
      expect(mockRuntimeAdapter.createMcpConnection).toHaveBeenCalledTimes(1);

      // Try to connect again
      await client.connect();
      expect(mockRuntimeAdapter.createMcpConnection).toHaveBeenCalledTimes(1);
    });

    it("should handle connection timeout", async () => {
      const timeoutError = new Error("Timeout");
      timeoutError.name = "AbortError";
      mockRuntimeAdapter.createMcpConnection.mockRejectedValue(timeoutError);

      await expect(client.connect()).rejects.toThrow(McpConnectionError);
      expect(client.isConnected).toBe(false);
    });

    it("should handle capability negotiation failure", async () => {
      // Mock connection success but capability failure
      mockConnection.call.mockRejectedValue(
        new Error("Capability negotiation failed"),
      );

      await expect(client.connect()).rejects.toThrow(McpConnectionError);
      expect(client.isConnected).toBe(false);
    });

    it("should reject server with unsupported capabilities", async () => {
      // Mock server advertising prompts
      mockConnection.call.mockResolvedValue({
        capabilities: {
          tools: { supported: true },
          prompts: { supported: true }, // This should be rejected
        },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });

      await expect(client.connect()).rejects.toThrow(McpConnectionError);
      expect(client.isConnected).toBe(false);
    });

    it("should start health monitoring when enabled", async () => {
      const client = new McpClient(mockRuntimeAdapter, serverUrl, {
        healthCheckInterval: 5000,
      });

      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });

      await client.connect();

      expect(client.isConnected).toBe(true);
      // Health monitoring timer should be set
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it("should skip health monitoring when disabled", async () => {
      const client = new McpClient(mockRuntimeAdapter, serverUrl, {
        healthCheckInterval: 0,
      });

      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });

      await client.connect();

      expect(client.isConnected).toBe(true);
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe("disconnect", () => {
    beforeEach(async () => {
      // Connect first
      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });
      await client.connect();
    });

    it("should successfully disconnect", async () => {
      await client.disconnect();

      expect(client.isConnected).toBe(false);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should cleanup resources on disconnect", async () => {
      await client.disconnect();

      // All timers should be cleared
      expect(jest.getTimerCount()).toBe(0);
    });

    it("should handle connection close errors gracefully", async () => {
      mockConnection.close.mockRejectedValue(new Error("Close failed"));

      await expect(client.disconnect()).resolves.not.toThrow();
      expect(client.isConnected).toBe(false);
    });
  });

  describe("listTools", () => {
    beforeEach(async () => {
      // Connect first
      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });
      await client.connect();
    });

    it("should successfully list tools", async () => {
      const expectedTools = [
        { name: "calculator", description: "Perform calculations" },
        { name: "weather", description: "Get weather information" },
      ];

      mockConnection.call.mockResolvedValue({ tools: expectedTools });

      const tools = await client.listTools();

      expect(tools).toEqual(expectedTools);
      expect(mockConnection.call).toHaveBeenCalledWith("tools/list");
    });

    it("should throw error when not connected", async () => {
      await client.disconnect();

      await expect(client.listTools()).rejects.toThrow(McpConnectionError);
    });

    it("should handle invalid tools list response", async () => {
      mockConnection.call.mockResolvedValue({ tools: "invalid" });

      await expect(client.listTools()).rejects.toThrow(McpToolError);
    });

    it("should handle missing tools field", async () => {
      mockConnection.call.mockResolvedValue({});

      await expect(client.listTools()).rejects.toThrow(McpToolError);
    });

    it("should handle connection call errors", async () => {
      mockConnection.call.mockRejectedValue(new Error("Connection failed"));

      await expect(client.listTools()).rejects.toThrow(McpToolError);
    });
  });

  describe("callTool", () => {
    beforeEach(async () => {
      // Connect first
      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });
      await client.connect();
    });

    it("should successfully call a tool", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "42" }],
        isError: false,
      };

      mockConnection.call.mockResolvedValue(expectedResult);

      const result = await client.callTool("calculator", {
        operation: "add",
        a: 1,
        b: 2,
      });

      expect(result).toEqual(expectedResult);
      expect(mockConnection.call).toHaveBeenCalledWith("tools/call", {
        name: "calculator",
        arguments: { operation: "add", a: 1, b: 2 },
      });
    });

    it("should throw error when not connected", async () => {
      await client.disconnect();

      await expect(client.callTool("calculator", {})).rejects.toThrow(
        McpConnectionError,
      );
    });

    it("should handle tool not found errors", async () => {
      const error = new Error("Method not found");
      (error as any).code = -32601;
      mockConnection.call.mockRejectedValue(error);

      await expect(client.callTool("nonexistent", {})).rejects.toThrow(
        McpToolError,
      );
    });

    it("should handle invalid parameters errors", async () => {
      const error = new Error("Invalid params");
      (error as any).code = -32602;
      mockConnection.call.mockRejectedValue(error);

      await expect(client.callTool("calculator", {})).rejects.toThrow(
        McpToolError,
      );
    });

    it("should handle generic tool execution errors", async () => {
      mockConnection.call.mockRejectedValue(new Error("Tool execution failed"));

      await expect(client.callTool("calculator", {})).rejects.toThrow(
        McpToolError,
      );
    });
  });

  describe("health monitoring", () => {
    let testClient: McpClient;

    beforeEach(async () => {
      testClient = new McpClient(mockRuntimeAdapter, serverUrl, {
        healthCheckInterval: 1000, // 1 second for testing
        maxRetries: 2,
      });

      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });

      await testClient.connect();
    });

    it("should detect connection loss and attempt reconnection", async () => {
      // Simulate connection loss
      (mockConnection as any)._isConnected = false;

      // Mock the reconnection to succeed to avoid infinite loop
      const newMockConnection: jest.Mocked<McpConnection> = {
        get isConnected() {
          return true;
        },
        call: jest.fn().mockResolvedValue({
          capabilities: { tools: { supported: true } },
          serverInfo: { name: "TestServer", version: "1.0.0" },
          protocolVersion: "2025-06-18",
        }),
        notify: jest.fn(),
        close: jest.fn(),
      } as any;

      mockRuntimeAdapter.createMcpConnection.mockResolvedValueOnce(
        newMockConnection,
      );

      // Advance timer to trigger health check
      jest.advanceTimersByTime(1000);

      // Allow the health check and reconnection to process
      await jest.runOnlyPendingTimersAsync();

      expect(mockRuntimeAdapter.createMcpConnection).toHaveBeenCalledTimes(2); // Initial + reconnection
    });

    it("should give up after max retry attempts", async () => {
      // Simulate connection loss
      (mockConnection as any)._isConnected = false;

      // Make reconnection attempts fail
      mockRuntimeAdapter.createMcpConnection
        .mockRejectedValueOnce(new Error("Reconnection failed"))
        .mockRejectedValueOnce(new Error("Reconnection failed"))
        .mockRejectedValueOnce(new Error("Reconnection failed"));

      // Trigger health checks and allow retries to process
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(1000);
        await jest.runAllTimersAsync();
      }

      // Should have attempted initial connection + 2 retries
      expect(mockRuntimeAdapter.createMcpConnection).toHaveBeenCalledTimes(3);
    });
  });

  describe("isConnected", () => {
    it("should return false when not connected", () => {
      expect(client.isConnected).toBe(false);
    });

    it("should return true when connected", async () => {
      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });

      await client.connect();

      expect(client.isConnected).toBe(true);
    });

    it("should return false when connection is lost", async () => {
      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });

      await client.connect();
      expect(client.isConnected).toBe(true);

      // Simulate connection loss
      (mockConnection as any)._isConnected = false;
      expect(client.isConnected).toBe(false);
    });
  });

  describe("AbortSignal support", () => {
    it("should pass AbortSignal to runtime adapter", async () => {
      const controller = new AbortController();
      const client = new McpClient(mockRuntimeAdapter, serverUrl, {
        signal: controller.signal,
      });

      mockConnection.call.mockResolvedValue({
        capabilities: { tools: { supported: true } },
        serverInfo: { name: "TestServer", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      });

      await client.connect();

      expect(mockRuntimeAdapter.createMcpConnection).toHaveBeenCalledWith(
        serverUrl,
        expect.objectContaining({
          signal: controller.signal,
        }),
      );
    });
  });
});
