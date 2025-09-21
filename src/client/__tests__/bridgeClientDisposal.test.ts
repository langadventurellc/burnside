/**
 * BridgeClient Disposal Tests
 *
 * Comprehensive test suite for BridgeClient disposal functionality,
 * including MCP connection cleanup and tool unregistration.
 */

import { BridgeClient } from "../bridgeClient";
import { McpClient } from "../../tools/mcp/mcpClient";
import { McpToolRegistry } from "../../tools/mcp/mcpToolRegistry";
import { logger } from "../../core/logging";
import type { BridgeConfig } from "../../core/config/bridgeConfig";
import type { RuntimeAdapter } from "../../core/runtime/runtimeAdapter";

// Mock dependencies
jest.mock("../../tools/mcp/mcpClient");
jest.mock("../../tools/mcp/mcpToolRegistry");
jest.mock("../../core/logging");

const MockedMcpClient = McpClient as jest.MockedClass<typeof McpClient>;
const MockedMcpToolRegistry = McpToolRegistry as jest.MockedClass<
  typeof McpToolRegistry
>;

describe("BridgeClient Disposal", () => {
  let client: BridgeClient;
  let mockRuntimeAdapter: jest.Mocked<RuntimeAdapter>;
  let baseConfig: BridgeConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock runtime adapter
    mockRuntimeAdapter = {
      name: "test",
      createHttpClient: jest.fn(),
      createWebSocketClient: jest.fn(),
      setTimeout: jest.fn(),
      clearTimeout: jest.fn(),
      now: jest.fn(() => Date.now()),
    } as unknown as jest.Mocked<RuntimeAdapter>;

    // Base configuration for tests
    baseConfig = {
      defaultProvider: "openai",
      providers: {
        openai: { apiKey: "test-key" },
      },
      defaultModel: "gpt-4",
      tools: {
        enabled: true,
        builtinTools: [],
        mcpServers: [
          { name: "test-server-1", url: "http://localhost:3001" },
          { name: "test-server-2", url: "http://localhost:3002" },
        ],
      },
    };
  });

  describe("Basic Disposal", () => {
    it("should dispose successfully with no MCP connections", async () => {
      // Create client without MCP servers
      const configWithoutMcp: BridgeConfig = {
        defaultProvider: "openai",
        providers: { openai: { apiKey: "test-key" } },
        defaultModel: "gpt-4",
      };

      client = new BridgeClient(configWithoutMcp, {
        runtimeAdapter: mockRuntimeAdapter,
      });
      await client.dispose();

      // Should log disposal start and completion
      expect(logger.info).toHaveBeenCalledWith(
        "Starting BridgeClient disposal and resource cleanup",
      );
      expect(logger.info).toHaveBeenCalledWith(
        "BridgeClient disposal completed successfully",
      );
    });

    it("should be idempotent - safe to call multiple times", async () => {
      const configWithoutMcp: BridgeConfig = {
        defaultProvider: "openai",
        providers: { openai: { apiKey: "test-key" } },
        defaultModel: "gpt-4",
      };

      client = new BridgeClient(configWithoutMcp, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Call dispose multiple times
      await client.dispose();
      await client.dispose();
      await client.dispose();

      // Should complete successfully each time
      expect(logger.info).toHaveBeenCalledTimes(6); // 3 start + 3 completion logs
    });
  });

  describe("MCP Connection Cleanup", () => {
    beforeEach(() => {
      // Mock successful MCP client creation and connection
      MockedMcpClient.prototype.connect = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpClient.prototype.disconnect = jest
        .fn()
        .mockResolvedValue(undefined);

      // Mock successful tool registration
      MockedMcpToolRegistry.prototype.registerMcpTools = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpToolRegistry.prototype.unregisterMcpTools = jest
        .fn()
        .mockReturnValue(undefined);
      MockedMcpToolRegistry.prototype.getRegisteredToolCount = jest
        .fn()
        .mockReturnValueOnce(3) // before cleanup
        .mockReturnValueOnce(0); // after cleanup
    });

    it("should disconnect all MCP clients during disposal", async () => {
      client = new BridgeClient(baseConfig, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Tool system automatically initializes MCP connections when enabled

      // Wait for async MCP connections to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      await client.dispose();

      // Should disconnect both clients
      expect(MockedMcpClient.prototype.disconnect).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith("Disconnecting 2 MCP clients");
      expect(logger.info).toHaveBeenCalledWith(
        "All MCP clients disconnected and cleared",
      );
    });

    it("should handle MCP disconnection errors gracefully", async () => {
      // Mock one client to fail disconnection
      MockedMcpClient.prototype.disconnect = jest
        .fn()
        .mockResolvedValueOnce(undefined) // First client succeeds
        .mockRejectedValueOnce(new Error("Connection timeout")); // Second fails

      client = new BridgeClient(baseConfig, {
        runtimeAdapter: mockRuntimeAdapter,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await client.dispose();

      // Should attempt to disconnect both clients
      expect(MockedMcpClient.prototype.disconnect).toHaveBeenCalledTimes(2);

      // Should log the failure but continue cleanup
      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to disconnect MCP client: test-server-2",
        { error: expect.any(Error) },
      );

      // Should still complete disposal successfully
      expect(logger.info).toHaveBeenCalledWith(
        "BridgeClient disposal completed successfully",
      );
    });
  });

  describe("MCP Tool Unregistration", () => {
    beforeEach(() => {
      // Mock successful MCP operations
      MockedMcpClient.prototype.connect = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpClient.prototype.disconnect = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpToolRegistry.prototype.registerMcpTools = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpToolRegistry.prototype.unregisterMcpTools = jest
        .fn()
        .mockReturnValue(undefined);
    });

    it("should unregister all MCP tools during disposal", async () => {
      // Mock tool counts for each registry
      MockedMcpToolRegistry.prototype.getRegisteredToolCount = jest
        .fn()
        .mockReturnValueOnce(3) // server-1 before
        .mockReturnValueOnce(0) // server-1 after
        .mockReturnValueOnce(2) // server-2 before
        .mockReturnValueOnce(0); // server-2 after

      client = new BridgeClient(baseConfig, {
        runtimeAdapter: mockRuntimeAdapter,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await client.dispose();

      // Should unregister tools from both registries
      expect(
        MockedMcpToolRegistry.prototype.unregisterMcpTools,
      ).toHaveBeenCalledTimes(2);

      // Should log cleanup progress
      expect(logger.info).toHaveBeenCalledWith(
        "Unregistering tools from 2 MCP registries",
      );
      expect(logger.info).toHaveBeenCalledWith(
        "MCP tool cleanup completed: 5 total tools unregistered",
      );
    });

    it("should handle tool unregistration errors gracefully", async () => {
      // Mock one registry to fail unregistration
      MockedMcpToolRegistry.prototype.getRegisteredToolCount = jest
        .fn()
        .mockReturnValueOnce(3) // server-1 before
        .mockReturnValueOnce(0) // server-1 after
        .mockReturnValue(2); // server-2 (no change due to error)

      MockedMcpToolRegistry.prototype.unregisterMcpTools = jest
        .fn()
        .mockReturnValueOnce(undefined) // First registry succeeds
        .mockImplementationOnce(() => {
          throw new Error("Unregistration failed");
        }); // Second fails

      client = new BridgeClient(baseConfig, {
        runtimeAdapter: mockRuntimeAdapter,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await client.dispose();

      // Should attempt both unregistrations
      expect(
        MockedMcpToolRegistry.prototype.unregisterMcpTools,
      ).toHaveBeenCalledTimes(2);

      // Should log the failure
      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to unregister tools from MCP server: test-server-2",
        { error: expect.any(Error) },
      );

      // Should still complete disposal
      expect(logger.info).toHaveBeenCalledWith(
        "BridgeClient disposal completed successfully",
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle disposal errors without throwing", async () => {
      // Mock severe error during disconnection
      MockedMcpClient.prototype.connect = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpClient.prototype.disconnect = jest
        .fn()
        .mockRejectedValue(new Error("Critical failure"));

      client = new BridgeClient(baseConfig, {
        runtimeAdapter: mockRuntimeAdapter,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not throw even with errors
      await expect(client.dispose()).resolves.not.toThrow();

      // Should log individual disconnection warnings rather than top-level error
      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to disconnect MCP client: test-server-1",
        { error: expect.any(Error) },
      );
    });

    it("should handle missing tool router gracefully", async () => {
      // Create config with tools disabled to prevent tool router creation
      const configWithoutTools: BridgeConfig = {
        defaultProvider: "openai",
        providers: { openai: { apiKey: "test-key" } },
        defaultModel: "gpt-4",
        // No tools config means tools are disabled
      };

      client = new BridgeClient(configWithoutTools, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      await client.dispose();

      // Should complete without errors and log that no tool router is available
      expect(logger.debug).toHaveBeenCalledWith(
        "No tool router available for MCP tool cleanup",
      );
      expect(logger.info).toHaveBeenCalledWith(
        "BridgeClient disposal completed successfully",
      );
    });
  });

  describe("Resource Cleanup Verification", () => {
    it("should clear all internal MCP storage after disposal", async () => {
      MockedMcpClient.prototype.connect = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpClient.prototype.disconnect = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpToolRegistry.prototype.registerMcpTools = jest
        .fn()
        .mockResolvedValue(undefined);
      MockedMcpToolRegistry.prototype.unregisterMcpTools = jest
        .fn()
        .mockReturnValue(undefined);
      MockedMcpToolRegistry.prototype.getRegisteredToolCount = jest
        .fn()
        .mockReturnValue(0);

      client = new BridgeClient(baseConfig, {
        runtimeAdapter: mockRuntimeAdapter,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify MCP clients and registries are stored
      expect(MockedMcpClient.prototype.connect).toHaveBeenCalledTimes(2);

      await client.dispose();

      // After disposal, subsequent calls should show empty storage
      await client.dispose(); // Second call
      expect(logger.debug).toHaveBeenCalledWith("No MCP clients to disconnect");
      expect(logger.debug).toHaveBeenCalledWith(
        "No MCP tool registries to clean up",
      );
    });
  });
});
