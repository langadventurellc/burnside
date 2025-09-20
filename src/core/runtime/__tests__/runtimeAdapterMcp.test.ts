/**
 * Unit tests for RuntimeAdapter MCP extension
 *
 * Tests the extended RuntimeAdapter interface with createMcpConnection method
 * while maintaining compatibility with existing adapter patterns.
 */

import type { RuntimeAdapter } from "../runtimeAdapter";
import type { McpConnectionOptions } from "../mcpConnectionOptions";
import type { McpConnection } from "../mcpConnection";
import type { PlatformInfo } from "../platformInfo";
import type { TimerHandle } from "../timerHandle";

describe("RuntimeAdapter MCP Extension", () => {
  describe("Interface Compliance", () => {
    it("should compile with complete RuntimeAdapter implementation including MCP method", () => {
      // Create a complete mock implementation that includes the new MCP method
      const mockAdapter: RuntimeAdapter = {
        platformInfo: {
          platform: "node",
          version: "20.0.0",
          capabilities: {
            platform: "node",
            hasHttp: true,
            hasTimers: true,
            hasFileSystem: true,
            features: {},
          },
        },
        fetch: jest.fn().mockResolvedValue(new Response()),
        stream: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: {},
          stream: (function* () {
            yield new Uint8Array([]);
          })(),
        }),
        createMcpConnection: jest.fn().mockResolvedValue({
          isConnected: true,
          call: jest.fn(),
          notify: jest.fn(),
          close: jest.fn(),
        } as McpConnection),
        setTimeout: jest.fn().mockReturnValue({} as TimerHandle),
        setInterval: jest.fn().mockReturnValue({} as TimerHandle),
        clearTimeout: jest.fn(),
        clearInterval: jest.fn(),
        readFile: jest.fn().mockResolvedValue(""),
        writeFile: jest.fn().mockResolvedValue(undefined),
        fileExists: jest.fn().mockResolvedValue(true),
      };

      // Verify all methods exist and have correct types
      expect(typeof mockAdapter.createMcpConnection).toBe("function");
      expect(typeof mockAdapter.fetch).toBe("function");
      expect(typeof mockAdapter.stream).toBe("function");
      expect(typeof mockAdapter.platformInfo).toBe("object");
    });

    it("should support createMcpConnection method signature", async () => {
      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn(),
        close: jest.fn(),
      };

      const mockAdapter: RuntimeAdapter = {
        platformInfo: {} as PlatformInfo,
        fetch: jest.fn(),
        stream: jest.fn(),
        createMcpConnection: jest.fn().mockResolvedValue(mockConnection),
        setTimeout: jest.fn(),
        setInterval: jest.fn(),
        clearTimeout: jest.fn(),
        clearInterval: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        fileExists: jest.fn(),
      };

      // Test method signature with URL only
      const connection1 = await mockAdapter.createMcpConnection(
        "http://localhost:3000",
      );
      expect(mockAdapter.createMcpConnection).toHaveBeenCalledWith(
        "http://localhost:3000",
      );
      expect(connection1).toBe(mockConnection);

      // Test method signature with URL and options
      const options: McpConnectionOptions = {
        signal: new AbortController().signal,
        timeout: 30000,
      };
      const connection2 = await mockAdapter.createMcpConnection(
        "http://localhost:3000",
        options,
      );
      expect(mockAdapter.createMcpConnection).toHaveBeenCalledWith(
        "http://localhost:3000",
        options,
      );
      expect(connection2).toBe(mockConnection);
    });
  });

  describe("Method Integration", () => {
    let mockAdapter: RuntimeAdapter;
    let mockConnection: McpConnection;

    beforeEach(() => {
      mockConnection = {
        isConnected: true,
        call: jest.fn().mockResolvedValue({ success: true }),
        notify: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockAdapter = {
        platformInfo: {
          platform: "node",
          version: "20.0.0",
          capabilities: {
            platform: "node",
            hasHttp: true,
            hasTimers: true,
            hasFileSystem: true,
            features: {},
          },
        },
        fetch: jest.fn(),
        stream: jest.fn(),
        createMcpConnection: jest.fn().mockResolvedValue(mockConnection),
        setTimeout: jest.fn(),
        setInterval: jest.fn(),
        clearTimeout: jest.fn(),
        clearInterval: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        fileExists: jest.fn(),
      };
    });

    it("should support MCP connection creation alongside existing methods", async () => {
      // Use existing HTTP method
      await mockAdapter.fetch("https://api.example.com");
      expect(mockAdapter.fetch).toHaveBeenCalledWith("https://api.example.com");

      // Use new MCP method
      const connection = await mockAdapter.createMcpConnection(
        "http://localhost:3000",
      );
      expect(mockAdapter.createMcpConnection).toHaveBeenCalledWith(
        "http://localhost:3000",
      );
      expect(connection).toBe(mockConnection);

      // Use file operations
      await mockAdapter.readFile("/path/to/file");
      expect(mockAdapter.readFile).toHaveBeenCalledWith("/path/to/file");
    });

    it("should support AbortSignal integration consistent with other methods", async () => {
      const controller = new AbortController();
      const options: McpConnectionOptions = {
        signal: controller.signal,
      };

      // MCP connection with cancellation
      await mockAdapter.createMcpConnection("http://localhost:3000", options);
      expect(mockAdapter.createMcpConnection).toHaveBeenCalledWith(
        "http://localhost:3000",
        options,
      );

      // Verify signal is the same instance
      const [, receivedOptions] = (mockAdapter.createMcpConnection as jest.Mock)
        .mock.calls[0];
      expect(receivedOptions.signal).toBe(controller.signal);
    });

    it("should maintain platform-specific behavior patterns", async () => {
      // Node.js adapter should support both local and remote
      const nodeAdapter = { ...mockAdapter };
      nodeAdapter.platformInfo = {
        platform: "node",
        version: "20.0.0",
        capabilities: {
          platform: "node",
          hasHttp: true,
          hasTimers: true,
          hasFileSystem: true,
          features: {},
        },
      };

      await nodeAdapter.createMcpConnection("http://localhost:3000");
      await nodeAdapter.createMcpConnection("https://remote-server.com");

      expect(nodeAdapter.createMcpConnection).toHaveBeenCalledTimes(2);

      // React Native adapter should enforce remote-only (implementation detail)
      const reactNativeAdapter = { ...mockAdapter };
      reactNativeAdapter.platformInfo = {
        platform: "react-native",
        version: "0.72.0",
        capabilities: {
          platform: "react-native",
          hasHttp: true,
          hasTimers: true,
          hasFileSystem: false,
          features: {},
        },
      };

      // Interface allows the call, implementation would handle constraint
      await reactNativeAdapter.createMcpConnection("https://remote-server.com");
      expect(reactNativeAdapter.createMcpConnection).toHaveBeenCalledWith(
        "https://remote-server.com",
      );
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct parameter types", async () => {
      const mockAdapter: RuntimeAdapter = {
        platformInfo: {} as PlatformInfo,
        fetch: jest.fn(),
        stream: jest.fn(),
        createMcpConnection: jest.fn().mockResolvedValue({} as McpConnection),
        setTimeout: jest.fn(),
        setInterval: jest.fn(),
        clearTimeout: jest.fn(),
        clearInterval: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        fileExists: jest.fn(),
      };

      // TypeScript should enforce string for serverUrl
      await mockAdapter.createMcpConnection("http://valid-url.com");

      // TypeScript should enforce McpConnectionOptions type for options
      const validOptions: McpConnectionOptions = {
        signal: new AbortController().signal,
        timeout: 5000,
        headers: { Authorization: "Bearer token" },
      };
      await mockAdapter.createMcpConnection(
        "http://valid-url.com",
        validOptions,
      );

      // Return type should be Promise<McpConnection>
      const connection = await mockAdapter.createMcpConnection(
        "http://valid-url.com",
      );
      expect(typeof connection).toBe("object");
    });

    it("should support optional parameters correctly", async () => {
      const mockAdapter: RuntimeAdapter = {
        platformInfo: {} as PlatformInfo,
        fetch: jest.fn(),
        stream: jest.fn(),
        createMcpConnection: jest.fn().mockResolvedValue({} as McpConnection),
        setTimeout: jest.fn(),
        setInterval: jest.fn(),
        clearTimeout: jest.fn(),
        clearInterval: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        fileExists: jest.fn(),
      };

      // Should work without options
      await mockAdapter.createMcpConnection("http://example.com");
      expect(mockAdapter.createMcpConnection).toHaveBeenCalledWith(
        "http://example.com",
      );

      // Should work with empty options
      await mockAdapter.createMcpConnection("http://example.com", {});
      expect(mockAdapter.createMcpConnection).toHaveBeenCalledWith(
        "http://example.com",
        {},
      );

      // Should work with partial options
      await mockAdapter.createMcpConnection("http://example.com", {
        timeout: 1000,
      });
      expect(mockAdapter.createMcpConnection).toHaveBeenCalledWith(
        "http://example.com",
        { timeout: 1000 },
      );
    });
  });

  describe("Error Handling Integration", () => {
    it("should support RuntimeError patterns", async () => {
      const mockAdapter: RuntimeAdapter = {
        platformInfo: {} as PlatformInfo,
        fetch: jest.fn(),
        stream: jest.fn(),
        createMcpConnection: jest
          .fn()
          .mockRejectedValue(new Error("Connection failed")),
        setTimeout: jest.fn(),
        setInterval: jest.fn(),
        clearTimeout: jest.fn(),
        clearInterval: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        fileExists: jest.fn(),
      };

      // Should propagate errors correctly
      await expect(
        mockAdapter.createMcpConnection("invalid-url"),
      ).rejects.toThrow("Connection failed");
    });

    it("should support AbortError for cancellation", async () => {
      const mockAdapter: RuntimeAdapter = {
        platformInfo: {} as PlatformInfo,
        fetch: jest.fn(),
        stream: jest.fn(),
        createMcpConnection: jest
          .fn()
          .mockRejectedValue(new DOMException("AbortError", "AbortError")),
        setTimeout: jest.fn(),
        setInterval: jest.fn(),
        clearTimeout: jest.fn(),
        clearInterval: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        fileExists: jest.fn(),
      };

      const controller = new AbortController();
      controller.abort();

      await expect(
        mockAdapter.createMcpConnection("http://example.com", {
          signal: controller.signal,
        }),
      ).rejects.toThrow("AbortError");
    });
  });
});
