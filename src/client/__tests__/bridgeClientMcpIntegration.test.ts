/**
 * @jest-environment node
 */

import { BridgeClient } from "../bridgeClient";
import { McpClient } from "../../tools/mcp/mcpClient";
import { McpToolRegistry } from "../../tools/mcp/mcpToolRegistry";
import type { BridgeConfig } from "../../core/config/bridgeConfig";
import type { RuntimeAdapter } from "../../core/runtime/runtimeAdapter";

// Mock dependencies
jest.mock("../../tools/mcp/mcpClient");
jest.mock("../../tools/mcp/mcpToolRegistry");
jest.mock("../../core/logging", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const MockedMcpClient = McpClient as jest.MockedClass<typeof McpClient>;
const MockedMcpToolRegistry = McpToolRegistry as jest.MockedClass<
  typeof McpToolRegistry
>;

describe("BridgeClient MCP Integration", () => {
  let mockRuntimeAdapter: RuntimeAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRuntimeAdapter = {
      createMcpConnection: jest.fn(),
      setTimeout: jest.fn(),
      clearTimeout: jest.fn(),
    } as any;

    // Setup default mock behavior
    const mockMcpClientInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: true,
    };
    MockedMcpClient.mockImplementation(() => mockMcpClientInstance as any);

    const mockMcpToolRegistryInstance = {
      registerMcpTools: jest.fn().mockResolvedValue(undefined),
      unregisterMcpTools: jest.fn(),
    };
    MockedMcpToolRegistry.mockImplementation(
      () => mockMcpToolRegistryInstance as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("MCP Tool Discovery Integration", () => {
    it("should successfully initialize with MCP server configuration", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            { name: "test-server", url: "http://localhost:3000" },
            { name: "another-server", url: "http://localhost:3001" },
          ],
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledTimes(2);
      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "test-server",
        url: "http://localhost:3000",
      });
      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "another-server",
        url: "http://localhost:3001",
      });

      expect(MockedMcpToolRegistry).toHaveBeenCalledTimes(2);
    });

    it("should handle graceful degradation when MCP servers fail to connect", async () => {
      const mockMcpClientInstance = {
        connect: jest.fn().mockRejectedValue(new Error("Connection failed")),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: false,
      };
      MockedMcpClient.mockImplementation(() => mockMcpClientInstance as any);

      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            { name: "failing-server", url: "http://localhost:9999" },
          ],
        },
      };

      // Should not throw during client initialization
      expect(() => {
        new BridgeClient(config, {
          runtimeAdapter: mockRuntimeAdapter,
        });
      }).not.toThrow();

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "failing-server",
        url: "http://localhost:9999",
      });
      expect(mockMcpClientInstance.connect).toHaveBeenCalled();
      // Registry should not be called when connection fails
      expect(MockedMcpToolRegistry).not.toHaveBeenCalled();
    });

    it("should handle mixed success/failure scenarios with multiple servers", async () => {
      let callCount = 0;
      const mockMcpClientInstance = {
        connect: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(); // First server succeeds
          }
          return Promise.reject(new Error("Second server fails")); // Second server fails
        }),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: true,
      };
      MockedMcpClient.mockImplementation(() => mockMcpClientInstance as any);

      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            { name: "good-server", url: "http://localhost:3000" },
            { name: "bad-server", url: "http://localhost:9999" },
          ],
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledTimes(2);
      expect(mockMcpClientInstance.connect).toHaveBeenCalledTimes(2);
      // Only one registry call should succeed
      expect(MockedMcpToolRegistry).toHaveBeenCalledTimes(1);
    });

    it("should not attempt MCP initialization when no servers configured", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          // No mcpServers configured
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      expect(MockedMcpClient).not.toHaveBeenCalled();
      expect(MockedMcpToolRegistry).not.toHaveBeenCalled();
    });

    it("should not attempt MCP initialization when mcpServers is empty array", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [], // Empty array
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      expect(MockedMcpClient).not.toHaveBeenCalled();
      expect(MockedMcpToolRegistry).not.toHaveBeenCalled();
    });

    it("should not attempt MCP initialization when tools are disabled", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        // No tools configuration - tools disabled
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      expect(MockedMcpClient).not.toHaveBeenCalled();
      expect(MockedMcpToolRegistry).not.toHaveBeenCalled();
    });

    it("should store successful MCP clients for cleanup", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [{ name: "test-server", url: "http://localhost:3000" }],
        },
      };

      const client = new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify MCP client is stored (access private field via type assertion for testing)
      const mcpClients = (client as any).mcpClients;
      expect(mcpClients.size).toBe(1);
      expect(mcpClients.has("test-server")).toBe(true);
    });

    it("should preserve existing tool system initialization behavior", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [{ name: "test-server", url: "http://localhost:3000" }],
        },
      };

      const client = new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Verify tool system components are still initialized
      expect((client as any).toolRouter).toBeDefined();
      expect((client as any).agentLoop).toBeDefined();
      expect((client as any).config.toolSystemInitialized).toBe(true);
    });

    it("should call registerMcpTools with the tool router", async () => {
      const mockRegisterMcpTools = jest.fn().mockResolvedValue(undefined);
      const mockMcpToolRegistryInstance = {
        registerMcpTools: mockRegisterMcpTools,
        unregisterMcpTools: jest.fn(),
      };
      MockedMcpToolRegistry.mockImplementation(
        () => mockMcpToolRegistryInstance as any,
      );

      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [{ name: "test-server", url: "http://localhost:3000" }],
        },
      };

      const client = new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRegisterMcpTools).toHaveBeenCalledTimes(1);
      expect(mockRegisterMcpTools).toHaveBeenCalledWith(
        (client as any).toolRouter,
      );
    });
  });

  describe("MCP Server Configuration Integration", () => {
    it("should handle STDIO MCP server configurations", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            {
              name: "stdio-server",
              command: "/usr/local/bin/mcp-tools",
              args: ["--config", "dev.json"],
            },
          ],
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledTimes(1);
      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "stdio-server",
        command: "/usr/local/bin/mcp-tools",
        args: ["--config", "dev.json"],
      });
    });

    it("should handle STDIO server configuration without args", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            {
              name: "simple-stdio-server",
              command: "/usr/local/bin/simple-mcp",
            },
          ],
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledTimes(1);
      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "simple-stdio-server",
        command: "/usr/local/bin/simple-mcp",
      });
    });

    it("should handle mixed HTTP and STDIO server configurations", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            { name: "http-server", url: "https://api.example.com/mcp" },
            {
              name: "stdio-server",
              command: "/usr/local/bin/mcp-tools",
              args: ["--verbose"],
            },
            { name: "local-http", url: "http://localhost:3000" },
          ],
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledTimes(3);
      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "http-server",
        url: "https://api.example.com/mcp",
      });
      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "stdio-server",
        command: "/usr/local/bin/mcp-tools",
        args: ["--verbose"],
      });
      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "local-http",
        url: "http://localhost:3000",
      });
    });

    it("should handle STDIO server connection failures gracefully", async () => {
      const mockMcpClientInstance = {
        connect: jest
          .fn()
          .mockRejectedValue(new Error("STDIO connection failed")),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: false,
      };
      MockedMcpClient.mockImplementation(() => mockMcpClientInstance as any);

      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            {
              name: "failing-stdio-server",
              command: "/invalid/path/mcp-tools",
            },
          ],
        },
      };

      // Should not throw during client initialization
      expect(() => {
        new BridgeClient(config, {
          runtimeAdapter: mockRuntimeAdapter,
        });
      }).not.toThrow();

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "failing-stdio-server",
        command: "/invalid/path/mcp-tools",
      });
      expect(mockMcpClientInstance.connect).toHaveBeenCalled();
      // Registry should not be called when connection fails
      expect(MockedMcpToolRegistry).not.toHaveBeenCalled();
    });

    it("should handle mixed success/failure with different transport types", async () => {
      let callCount = 0;
      const mockMcpClientInstance = {
        connect: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(); // HTTP server succeeds
          } else if (callCount === 2) {
            return Promise.reject(new Error("STDIO server fails")); // STDIO server fails
          }
          return Promise.resolve(); // Second HTTP server succeeds
        }),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: true,
      };
      MockedMcpClient.mockImplementation(() => mockMcpClientInstance as any);

      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            { name: "success-http", url: "http://localhost:3000" },
            {
              name: "failing-stdio",
              command: "/invalid/path/mcp-tools",
            },
            { name: "success-http-2", url: "http://localhost:3001" },
          ],
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledTimes(3);
      expect(mockMcpClientInstance.connect).toHaveBeenCalledTimes(3);
      // Only successful connections should create registries (2 out of 3)
      expect(MockedMcpToolRegistry).toHaveBeenCalledTimes(2);
    });

    it("should preserve transport-agnostic behavior for tool discovery", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            { name: "http-server", url: "https://api.example.com/mcp" },
            {
              name: "stdio-server",
              command: "/usr/local/bin/mcp-tools",
              args: ["--config", "production.json"],
            },
          ],
        },
      };

      const _client = new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledTimes(2);
      expect(MockedMcpToolRegistry).toHaveBeenCalledTimes(2);

      // Both HTTP and STDIO servers should be processed identically
      expect(MockedMcpClient).toHaveBeenNthCalledWith(1, mockRuntimeAdapter, {
        name: "http-server",
        url: "https://api.example.com/mcp",
      });
      expect(MockedMcpClient).toHaveBeenNthCalledWith(2, mockRuntimeAdapter, {
        name: "stdio-server",
        command: "/usr/local/bin/mcp-tools",
        args: ["--config", "production.json"],
      });
    });

    it("should maintain backward compatibility with existing HTTP configurations", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "test-key" },
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: [
            { name: "legacy-server", url: "http://legacy.example.com/mcp" },
          ],
        },
      };

      new BridgeClient(config, {
        runtimeAdapter: mockRuntimeAdapter,
      });

      // Allow async MCP initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockedMcpClient).toHaveBeenCalledTimes(1);
      expect(MockedMcpClient).toHaveBeenCalledWith(mockRuntimeAdapter, {
        name: "legacy-server",
        url: "http://legacy.example.com/mcp",
      });

      // Should work identically to previous behavior
      expect(MockedMcpToolRegistry).toHaveBeenCalledTimes(1);
    });
  });
});
