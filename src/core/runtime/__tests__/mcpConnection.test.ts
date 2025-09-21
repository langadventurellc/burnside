/**
 * Unit tests for McpConnection interface
 *
 * Tests interface compliance, type safety, and TypeScript compilation
 * for MCP connection JSON-RPC 2.0 communication.
 */

import type { McpConnection } from "../mcpConnection";

describe("McpConnection Interface", () => {
  describe("Interface Structure", () => {
    it("should define required properties and methods", () => {
      // Mock implementation to verify interface structure
      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn(),
        close: jest.fn(),
      };

      expect(typeof mockConnection.isConnected).toBe("boolean");
      expect(typeof mockConnection.call).toBe("function");
      expect(typeof mockConnection.notify).toBe("function");
      expect(typeof mockConnection.close).toBe("function");
    });

    it("should have readonly isConnected property", () => {
      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn(),
        close: jest.fn(),
      };

      // Verify readonly property behavior
      expect(mockConnection.isConnected).toBe(true);

      // TypeScript should prevent this assignment (compile-time check)
      // mockConnection.isConnected = false; // Should cause TS error
    });
  });

  describe("Method Signatures", () => {
    let mockConnection: McpConnection;

    beforeEach(() => {
      mockConnection = {
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn(),
        close: jest.fn(),
      };
    });

    it("should support call method with method name only", async () => {
      const mockCall = mockConnection.call as jest.Mock;
      mockCall.mockResolvedValue({ success: true });

      const result = await mockConnection.call("tools/list");

      expect(mockCall).toHaveBeenCalledWith("tools/list");
      expect(result).toEqual({ success: true });
    });

    it("should support call method with method and parameters", async () => {
      const mockCall = mockConnection.call as jest.Mock;
      const expectedResult = { result: "calculated" };
      mockCall.mockResolvedValue(expectedResult);

      const params = { operation: "add", a: 1, b: 2 };
      const result = await mockConnection.call("tools/calculate", params);

      expect(mockCall).toHaveBeenCalledWith("tools/calculate", params);
      expect(result).toEqual(expectedResult);
    });

    it("should support generic typing for call method", async () => {
      interface ToolListResponse {
        tools: Array<{ name: string; description: string }>;
      }

      const mockCall = mockConnection.call as jest.Mock;
      const expectedResponse: ToolListResponse = {
        tools: [{ name: "calculator", description: "Math operations" }],
      };
      mockCall.mockResolvedValue(expectedResponse);

      // Type-safe call with generic
      const result = await mockConnection.call<ToolListResponse>("tools/list");

      expect(result.tools).toBeDefined();
      expect(result.tools[0].name).toBe("calculator");
    });

    it("should support notify method with method name only", async () => {
      const mockNotify = mockConnection.notify as jest.Mock;
      mockNotify.mockResolvedValue(undefined);

      await mockConnection.notify("client/ready");

      expect(mockNotify).toHaveBeenCalledWith("client/ready");
    });

    it("should support notify method with method and parameters", async () => {
      const mockNotify = mockConnection.notify as jest.Mock;
      mockNotify.mockResolvedValue(undefined);

      const params = { operation: "processing", percentage: 50 };
      await mockConnection.notify("client/progress", params);

      expect(mockNotify).toHaveBeenCalledWith("client/progress", params);
    });

    it("should support close method", async () => {
      const mockClose = mockConnection.close as jest.Mock;
      mockClose.mockResolvedValue(undefined);

      await mockConnection.close();

      expect(mockClose).toHaveBeenCalledWith();
    });
  });

  describe("TypeScript Compilation", () => {
    it("should compile with various call patterns", async () => {
      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn().mockResolvedValue({}),
        notify: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      // These should all compile correctly
      await mockConnection.call("method1");
      await mockConnection.call("method2", {});
      await mockConnection.call("method3", { param: "value" });
      await mockConnection.call<{ result: string }>("method4");
      await mockConnection.call<number>("method5", { input: 42 });

      await mockConnection.notify("notification1");
      await mockConnection.notify("notification2", {});
      await mockConnection.notify("notification3", { status: "ready" });

      await mockConnection.close();
    });

    it("should support unknown parameter types", async () => {
      const mockConnection: McpConnection = {
        isConnected: false,
        call: jest.fn().mockResolvedValue("response"),
        notify: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      // Should accept any parameter type
      await mockConnection.call("method", "string");
      await mockConnection.call("method", 42);
      await mockConnection.call("method", true);
      await mockConnection.call("method", [1, 2, 3]);
      await mockConnection.call("method", { complex: { nested: "object" } });

      await mockConnection.notify("event", "string");
      await mockConnection.notify("event", { data: [1, 2, 3] });
    });
  });

  describe("JSON-RPC 2.0 Compliance", () => {
    it("should support JSON-RPC method naming conventions", async () => {
      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn().mockResolvedValue({}),
        notify: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      // JSON-RPC method names with dots and namespaces
      await mockConnection.call("tools.list");
      await mockConnection.call("tools.call");
      await mockConnection.call("server.info");
      await mockConnection.call("client.initialize");

      await mockConnection.notify("tools.progress");
      await mockConnection.notify("client.ready");
    });

    it("should handle error responses in call method", async () => {
      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockCall = mockConnection.call as jest.Mock;
      const jsonRpcError = new Error("Method not found");
      (jsonRpcError as any).code = -32601;
      mockCall.mockRejectedValue(jsonRpcError);

      await expect(mockConnection.call("invalid.method")).rejects.toThrow(
        "Method not found",
      );
    });
  });

  describe("Connection State Management", () => {
    it("should reflect connection status", () => {
      const connectedMock: McpConnection = {
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn(),
        close: jest.fn(),
      };

      const disconnectedMock: McpConnection = {
        isConnected: false,
        call: jest.fn(),
        notify: jest.fn(),
        close: jest.fn(),
      };

      expect(connectedMock.isConnected).toBe(true);
      expect(disconnectedMock.isConnected).toBe(false);
    });

    it("should support lifecycle management patterns", async () => {
      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn().mockResolvedValue({ initialized: true }),
        notify: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      // Common MCP lifecycle pattern
      if (mockConnection.isConnected) {
        await mockConnection.call("server.initialize");
        await mockConnection.notify("client.ready");

        // Use connection...
        await mockConnection.call("tools.list");

        // Clean shutdown
        await mockConnection.notify("client.disconnecting");
        await mockConnection.close();
      }

      expect(mockConnection.call).toHaveBeenCalledWith("server.initialize");
      expect(mockConnection.notify).toHaveBeenCalledWith("client.ready");
      expect(mockConnection.call).toHaveBeenCalledWith("tools.list");
      expect(mockConnection.notify).toHaveBeenCalledWith(
        "client.disconnecting",
      );
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("Real-world Usage Patterns", () => {
    it("should support tool discovery pattern", async () => {
      interface Tool {
        name: string;
        description: string;
        inputSchema: object;
      }

      interface ToolListResponse {
        tools: Tool[];
      }

      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockCall = mockConnection.call as jest.Mock;
      mockCall.mockResolvedValue({
        tools: [
          {
            name: "calculator",
            description: "Performs mathematical calculations",
            inputSchema: { type: "object" },
          },
        ],
      });

      const response =
        await mockConnection.call<ToolListResponse>("tools/list");
      expect(response.tools).toHaveLength(1);
      expect(response.tools[0].name).toBe("calculator");
    });

    it("should support tool execution pattern", async () => {
      const mockConnection: McpConnection = {
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockCall = mockConnection.call as jest.Mock;
      mockCall.mockResolvedValue({
        content: [{ type: "text", text: "Result: 42" }],
      });

      const toolParams = {
        name: "calculator",
        arguments: { operation: "multiply", a: 6, b: 7 },
      };

      const result = await mockConnection.call("tools/call", toolParams);
      expect((result as any).content[0].text).toBe("Result: 42");
    });
  });
});
