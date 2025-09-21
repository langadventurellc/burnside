/**
 * Tests for MCP Tool Registry
 *
 * Comprehensive test suite for MCP tool registry functionality including
 * tool registration/unregistration, failure strategy handling, connection
 * event management, and tool handler behavior.
 */

import { McpToolRegistry } from "../mcpToolRegistry";
import { McpConnectionError } from "../mcpConnectionError";
import { McpToolError } from "../mcpToolError";
import type { McpClient } from "../mcpClient";
import type { ToolRouter } from "../../../core/tools/toolRouter";
import type { ToolDefinition } from "../../../core/tools/toolDefinition";

// Mock dependencies
jest.mock("../../../core/logging");
jest.mock("../mcpToolHandler");

// Import mocked functions
import { createMcpToolHandler } from "../mcpToolHandler";

describe("McpToolRegistry", () => {
  let mockMcpClient: jest.Mocked<McpClient>;
  let mockToolRouter: jest.Mocked<ToolRouter>;
  let registry: McpToolRegistry;

  const mockToolDefinitions: ToolDefinition[] = [
    {
      name: "calculator",
      description: "A simple calculator",
      inputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          a: { type: "number" },
          b: { type: "number" },
        },
        required: ["operation", "a", "b"],
      },
    },
    {
      name: "weather",
      description: "Get weather information",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string" },
        },
        required: ["location"],
      },
    },
  ];

  beforeEach(() => {
    // Mock McpClient
    mockMcpClient = {
      isConnected: true,
      discoverTools: jest.fn().mockResolvedValue(mockToolDefinitions),
    } as any;

    // Mock ToolRouter
    mockToolRouter = {
      register: jest.fn(),
      hasTool: jest.fn().mockReturnValue(true),
    } as any;

    // Mock createMcpToolHandler
    (createMcpToolHandler as jest.Mock).mockImplementation(
      (client: McpClient, toolName: string) => {
        return jest.fn().mockImplementation((_params: any) => {
          if (!client.isConnected) {
            throw new McpConnectionError("MCP server not connected", {
              toolName,
            });
          }
          return Promise.resolve({
            success: true,
            result: `mocked result for ${toolName}`,
          });
        });
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create registry with default immediate_unregister strategy", () => {
      registry = new McpToolRegistry(mockMcpClient);
      expect(registry).toBeInstanceOf(McpToolRegistry);
    });

    it("should create registry with immediate_unregister strategy", () => {
      registry = new McpToolRegistry(mockMcpClient, "immediate_unregister");
      expect(registry).toBeInstanceOf(McpToolRegistry);
    });

    it("should create registry with mark_unavailable strategy", () => {
      registry = new McpToolRegistry(mockMcpClient, "mark_unavailable");
      expect(registry).toBeInstanceOf(McpToolRegistry);
    });
  });

  describe("Tool Registration", () => {
    beforeEach(() => {
      registry = new McpToolRegistry(mockMcpClient, "immediate_unregister");
    });

    it("should register MCP tools successfully", async () => {
      await registry.registerMcpTools(mockToolRouter);

      expect(mockMcpClient.discoverTools).toHaveBeenCalledTimes(1);
      expect(mockToolRouter.register).toHaveBeenCalledTimes(2);
      expect(mockToolRouter.register).toHaveBeenCalledWith(
        "mcp:calculator",
        mockToolDefinitions[0],
        expect.any(Function),
      );
      expect(mockToolRouter.register).toHaveBeenCalledWith(
        "mcp:weather",
        mockToolDefinitions[1],
        expect.any(Function),
      );
      expect(registry.getRegisteredToolCount()).toBe(2);
    });

    it("should skip already registered tools", async () => {
      await registry.registerMcpTools(mockToolRouter);
      const initialCallCount = mockToolRouter.register.mock.calls.length;

      await registry.registerMcpTools(mockToolRouter);

      // Should not have been called again
      expect(mockToolRouter.register.mock.calls.length).toBe(initialCallCount);
      expect(registry.getRegisteredToolCount()).toBe(2);
    });

    it("should handle tool registration errors gracefully", async () => {
      mockToolRouter.register.mockImplementationOnce(() => {
        throw new Error("Registration failed");
      });

      await registry.registerMcpTools(mockToolRouter);

      expect(registry.getRegisteredToolCount()).toBe(1); // Only one tool registered
    });

    it("should throw error if no tools are registered when discovery returns tools", async () => {
      mockToolRouter.register.mockImplementation(() => {
        throw new Error("All registrations failed");
      });

      await expect(registry.registerMcpTools(mockToolRouter)).rejects.toThrow(
        McpToolError,
      );
    });
  });

  describe("Tool Unregistration", () => {
    beforeEach(async () => {
      registry = new McpToolRegistry(mockMcpClient, "immediate_unregister");
      await registry.registerMcpTools(mockToolRouter);
    });

    it("should unregister all MCP tools", () => {
      registry.unregisterMcpTools(mockToolRouter);

      expect(registry.getRegisteredToolCount()).toBe(0);
      expect(registry.getRegisteredToolIds()).toEqual([]);
    });

    it("should handle unregistration errors gracefully", () => {
      mockToolRouter.hasTool.mockImplementationOnce(() => {
        throw new Error("Router error");
      });

      expect(() => registry.unregisterMcpTools(mockToolRouter)).not.toThrow();
    });
  });

  describe("Connection Event Handlers", () => {
    describe("immediate_unregister strategy", () => {
      beforeEach(() => {
        registry = new McpToolRegistry(mockMcpClient, "immediate_unregister");
      });

      it("should register tools on connect", async () => {
        const handlers = registry.createConnectionHandlers(mockToolRouter);

        await handlers.onConnect();

        expect(mockMcpClient.discoverTools).toHaveBeenCalledTimes(1);
        expect(mockToolRouter.register).toHaveBeenCalledTimes(2);
      });

      it("should unregister tools on disconnect", async () => {
        // First register tools
        await registry.registerMcpTools(mockToolRouter);
        expect(registry.getRegisteredToolCount()).toBe(2);

        // Then disconnect
        const handlers = registry.createConnectionHandlers(mockToolRouter);
        await handlers.onDisconnect();

        expect(registry.getRegisteredToolCount()).toBe(0);
      });
    });

    describe("mark_unavailable strategy", () => {
      beforeEach(() => {
        registry = new McpToolRegistry(mockMcpClient, "mark_unavailable");
      });

      it("should keep tools registered on disconnect", async () => {
        // First register tools
        await registry.registerMcpTools(mockToolRouter);
        expect(registry.getRegisteredToolCount()).toBe(2);

        // Then disconnect
        const handlers = registry.createConnectionHandlers(mockToolRouter);
        await handlers.onDisconnect();

        // Tools should still be registered
        expect(registry.getRegisteredToolCount()).toBe(2);
      });
    });
  });

  describe("Tool Handler Behavior", () => {
    describe("immediate_unregister strategy", () => {
      beforeEach(async () => {
        registry = new McpToolRegistry(mockMcpClient, "immediate_unregister");
        await registry.registerMcpTools(mockToolRouter);
      });

      it("should use standard tool handlers", () => {
        expect(createMcpToolHandler).toHaveBeenCalledWith(
          mockMcpClient,
          "calculator",
        );
        expect(createMcpToolHandler).toHaveBeenCalledWith(
          mockMcpClient,
          "weather",
        );
      });
    });

    describe("mark_unavailable strategy", () => {
      beforeEach(async () => {
        registry = new McpToolRegistry(mockMcpClient, "mark_unavailable");
        await registry.registerMcpTools(mockToolRouter);
      });

      it("should execute tools when connected", async () => {
        const registeredHandler = mockToolRouter.register.mock.calls[0][2];

        const result = await registeredHandler(
          { operation: "add", a: 1, b: 2 },
          {},
        );

        expect(result).toEqual({
          success: true,
          result: "mocked result for calculator",
        });
      });

      it("should throw connection error when disconnected", async () => {
        // Simulate connection loss
        const handlers = registry.createConnectionHandlers(mockToolRouter);
        await handlers.onDisconnect();

        const registeredHandler = mockToolRouter.register.mock.calls[0][2];

        await expect(
          registeredHandler({ operation: "add", a: 1, b: 2 }, {}),
        ).rejects.toThrow(McpConnectionError);

        await expect(
          registeredHandler({ operation: "add", a: 1, b: 2 }, {}),
        ).rejects.toThrow("temporarily unavailable due to connection loss");
      });

      it("should resume normal operation after reconnection", async () => {
        // Get the original handler before disconnect
        const originalRegisteredHandler =
          mockToolRouter.register.mock.calls[0][2];
        const initialRegisterCallCount =
          mockToolRouter.register.mock.calls.length;

        // Simulate disconnect
        const handlers = registry.createConnectionHandlers(mockToolRouter);
        await handlers.onDisconnect();

        // Verify we can't execute during disconnection
        await expect(
          originalRegisteredHandler({ operation: "add", a: 1, b: 2 }, {}),
        ).rejects.toThrow("temporarily unavailable");

        // Simulate reconnect - this will try to register tools again
        // But since tools are already registered, it should skip registration
        await handlers.onConnect();

        // Verify tools weren't re-registered (call count should remain the same)
        expect(mockToolRouter.register.mock.calls.length).toBe(
          initialRegisterCallCount,
        );

        // Now the handler should work again
        const result = await originalRegisteredHandler(
          { operation: "add", a: 1, b: 2 },
          {},
        );

        expect(result).toEqual({
          success: true,
          result: "mocked result for calculator",
        });
      });
    });
  });

  describe("Registry Information Methods", () => {
    beforeEach(async () => {
      registry = new McpToolRegistry(mockMcpClient, "immediate_unregister");
      await registry.registerMcpTools(mockToolRouter);
    });

    it("should return correct registered tool count", () => {
      expect(registry.getRegisteredToolCount()).toBe(2);
    });

    it("should return correct registered tool IDs", () => {
      const toolIds = registry.getRegisteredToolIds();
      expect(toolIds).toHaveLength(2);
      expect(toolIds).toContain("mcp:calculator");
      expect(toolIds).toContain("mcp:weather");
    });

    it("should check if tool is registered", () => {
      expect(registry.isToolRegistered("mcp:calculator")).toBe(true);
      expect(registry.isToolRegistered("mcp:weather")).toBe(true);
      expect(registry.isToolRegistered("mcp:nonexistent")).toBe(false);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      registry = new McpToolRegistry(mockMcpClient, "immediate_unregister");
    });

    it("should handle tool discovery errors", async () => {
      mockMcpClient.discoverTools.mockRejectedValueOnce(
        new Error("Discovery failed"),
      );

      await expect(registry.registerMcpTools(mockToolRouter)).rejects.toThrow(
        McpToolError,
      );
    });

    it("should handle unknown failure strategy gracefully", async () => {
      // Create registry with unknown strategy (this shouldn't happen in real code)
      const registryWithUnknownStrategy = new (class extends McpToolRegistry {
        constructor() {
          super(mockMcpClient, "immediate_unregister");
          // Force unknown strategy for testing
          (this as any).failureStrategy = "unknown_strategy";
        }
      })();

      await registryWithUnknownStrategy.registerMcpTools(mockToolRouter);

      const handlers =
        registryWithUnknownStrategy.createConnectionHandlers(mockToolRouter);

      // Should default to immediate_unregister behavior
      await handlers.onDisconnect();
      expect(registryWithUnknownStrategy.getRegisteredToolCount()).toBe(0);
    });
  });
});
