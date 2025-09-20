/**
 * Electron Renderer Runtime Adapter Tests
 *
 * Unit tests for Electron renderer runtime adapter implementation covering all
 * adapter methods with mocked browser APIs and error handling scenarios.
 */

import { ElectronRuntimeAdapter } from "../electronRuntimeAdapter";
import { RuntimeError } from "../../runtimeError";

// Mock platform detection to return electron-renderer
jest.mock("../../detectPlatform", () => ({
  detectPlatform: jest.fn().mockReturnValue("electron-renderer"),
}));

// Mock process.versions for Electron version
const mockProcessVersions = {
  electron: "13.1.7",
  node: "14.17.0",
  v8: "9.1.269.39",
};

Object.defineProperty(process, "versions", {
  value: mockProcessVersions,
  writable: false,
});

describe("ElectronRuntimeAdapter", () => {
  let adapter: ElectronRuntimeAdapter;
  let originalFetch: typeof globalThis.fetch;
  let originalSetTimeout: typeof globalThis.setTimeout;
  let originalSetInterval: typeof globalThis.setInterval;
  let originalClearTimeout: typeof globalThis.clearTimeout;
  let originalClearInterval: typeof globalThis.clearInterval;

  beforeEach(() => {
    // Store original functions
    originalFetch = globalThis.fetch;
    originalSetTimeout = globalThis.setTimeout;
    originalSetInterval = globalThis.setInterval;
    originalClearTimeout = globalThis.clearTimeout;
    originalClearInterval = globalThis.clearInterval;

    adapter = new ElectronRuntimeAdapter();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original functions
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.setInterval = originalSetInterval;
    globalThis.clearTimeout = originalClearTimeout;
    globalThis.clearInterval = originalClearInterval;
  });

  describe("Constructor", () => {
    it("should initialize with Electron renderer platform info", () => {
      expect(adapter.platformInfo.platform).toBe("electron-renderer");
      expect(adapter.platformInfo.version).toBe("13.1.7");
      expect(adapter.platformInfo.capabilities.hasHttp).toBe(true);
      expect(adapter.platformInfo.capabilities.hasTimers).toBe(true);
      expect(adapter.platformInfo.capabilities.hasFileSystem).toBe(false);
    });
  });

  describe("HTTP Operations", () => {
    describe("fetch", () => {
      it("should call globalThis.fetch", async () => {
        const mockResponse = new Response("test");
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        const result = await adapter.fetch("https://example.com");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com",
          undefined,
        );
        expect(result).toBe(mockResponse);
      });

      it("should pass init options to fetch", async () => {
        const mockResponse = new Response("test");
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        const init = { method: "POST", body: "data" };
        await adapter.fetch("https://example.com", init);

        expect(mockFetch).toHaveBeenCalledWith("https://example.com", init);
      });

      it("should throw RuntimeError when fetch fails", async () => {
        const mockError = new Error("Network error");
        const mockFetch = jest.fn().mockRejectedValue(mockError);
        globalThis.fetch = mockFetch;

        await expect(adapter.fetch("https://example.com")).rejects.toThrow(
          RuntimeError,
        );
        await expect(adapter.fetch("https://example.com")).rejects.toThrow(
          "HTTP fetch failed",
        );

        try {
          await adapter.fetch("https://example.com");
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_HTTP_ERROR");
          expect(runtimeError.context?.input).toBe("https://example.com");
          expect(runtimeError.context?.originalError).toBe(mockError);
        }
      });

      it("should handle URL objects", async () => {
        const mockResponse = new Response("test");
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        const url = new URL("https://example.com");
        await adapter.fetch(url);

        expect(mockFetch).toHaveBeenCalledWith(url, undefined);
      });
    });
  });

  describe("Timer Operations", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe("setTimeout", () => {
      it("should call globalThis.setTimeout", () => {
        const callback = jest.fn();
        const mockHandle = 123;
        const mockSetTimeout = jest.fn().mockReturnValue(mockHandle) as any;
        globalThis.setTimeout = mockSetTimeout;

        const result = adapter.setTimeout(callback, 1000);

        expect(mockSetTimeout).toHaveBeenCalledWith(callback, 1000);
        expect(result).toBe(mockHandle);
      });

      it("should execute callback after delay", () => {
        const callback = jest.fn();
        adapter.setTimeout(callback, 1000);

        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it("should throw RuntimeError when setTimeout fails", () => {
        const mockError = new Error("Timer error");
        const mockSetTimeout = jest.fn().mockImplementation(() => {
          throw mockError;
        }) as any;
        globalThis.setTimeout = mockSetTimeout;

        expect(() => adapter.setTimeout(jest.fn(), 1000)).toThrow(RuntimeError);

        try {
          adapter.setTimeout(jest.fn(), 1000);
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_TIMER_ERROR");
          expect(runtimeError.context?.operation).toBe("setTimeout");
          expect(runtimeError.context?.delay).toBe(1000);
          expect(runtimeError.context?.originalError).toBe(mockError);
        }
      });
    });

    describe("setInterval", () => {
      it("should call globalThis.setInterval", () => {
        const callback = jest.fn();
        const mockHandle = 456;
        const mockSetInterval = jest.fn().mockReturnValue(mockHandle) as any;
        globalThis.setInterval = mockSetInterval;

        const result = adapter.setInterval(callback, 500);

        expect(mockSetInterval).toHaveBeenCalledWith(callback, 500);
        expect(result).toBe(mockHandle);
      });

      it("should execute callback repeatedly", () => {
        const callback = jest.fn();
        adapter.setInterval(callback, 500);

        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(500);
        expect(callback).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(500);
        expect(callback).toHaveBeenCalledTimes(2);
      });

      it("should throw RuntimeError when setInterval fails", () => {
        const mockError = new Error("Timer error");
        const mockSetInterval = jest.fn().mockImplementation(() => {
          throw mockError;
        });
        globalThis.setInterval = mockSetInterval;

        expect(() => adapter.setInterval(jest.fn(), 500)).toThrow(RuntimeError);

        try {
          adapter.setInterval(jest.fn(), 500);
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_TIMER_ERROR");
          expect(runtimeError.context?.operation).toBe("setInterval");
          expect(runtimeError.context?.interval).toBe(500);
          expect(runtimeError.context?.originalError).toBe(mockError);
        }
      });
    });

    describe("clearTimeout", () => {
      it("should call globalThis.clearTimeout", () => {
        const mockHandle = 123;
        const mockClearTimeout = jest.fn();
        globalThis.clearTimeout = mockClearTimeout;

        adapter.clearTimeout(mockHandle);

        expect(mockClearTimeout).toHaveBeenCalledWith(mockHandle);
      });

      it("should throw RuntimeError when clearTimeout fails", () => {
        const mockError = new Error("Clear error");
        const mockClearTimeout = jest.fn().mockImplementation(() => {
          throw mockError;
        });
        globalThis.clearTimeout = mockClearTimeout;

        const mockHandle = 123;
        expect(() => adapter.clearTimeout(mockHandle)).toThrow(RuntimeError);

        try {
          adapter.clearTimeout(mockHandle);
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_TIMER_ERROR");
          expect(runtimeError.context?.operation).toBe("clearTimeout");
          expect(runtimeError.context?.handle).toBe(mockHandle);
          expect(runtimeError.context?.originalError).toBe(mockError);
        }
      });
    });

    describe("clearInterval", () => {
      it("should call globalThis.clearInterval", () => {
        const mockHandle = 456;
        const mockClearInterval = jest.fn();
        globalThis.clearInterval = mockClearInterval;

        adapter.clearInterval(mockHandle);

        expect(mockClearInterval).toHaveBeenCalledWith(mockHandle);
      });

      it("should throw RuntimeError when clearInterval fails", () => {
        const mockError = new Error("Clear error");
        const mockClearInterval = jest.fn().mockImplementation(() => {
          throw mockError;
        });
        globalThis.clearInterval = mockClearInterval;

        const mockHandle = 456;
        expect(() => adapter.clearInterval(mockHandle)).toThrow(RuntimeError);

        try {
          adapter.clearInterval(mockHandle);
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_TIMER_ERROR");
          expect(runtimeError.context?.operation).toBe("clearInterval");
          expect(runtimeError.context?.handle).toBe(mockHandle);
          expect(runtimeError.context?.originalError).toBe(mockError);
        }
      });
    });
  });

  describe("File Operations", () => {
    describe("readFile", () => {
      it("should throw RuntimeError with unsupported platform message", async () => {
        await expect(adapter.readFile("/path/to/file")).rejects.toThrow(
          RuntimeError,
        );
        await expect(adapter.readFile("/path/to/file")).rejects.toThrow(
          "File operations not supported on this platform",
        );

        try {
          await adapter.readFile("/path/to/file", { encoding: "utf8" });
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_FILE_ERROR");
          expect(runtimeError.context?.operation).toBe("readFile");
          expect(runtimeError.context?.path).toBe("/path/to/file");
          expect(runtimeError.context?.platform).toBe("electron-renderer");
          expect(runtimeError.context?.options).toEqual({ encoding: "utf8" });
        }
      });
    });

    describe("writeFile", () => {
      it("should throw RuntimeError with unsupported platform message", async () => {
        await expect(
          adapter.writeFile("/path/to/file", "content"),
        ).rejects.toThrow(RuntimeError);
        await expect(
          adapter.writeFile("/path/to/file", "content"),
        ).rejects.toThrow("File operations not supported on this platform");

        try {
          await adapter.writeFile("/path/to/file", "test content", {
            encoding: "utf8",
          });
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_FILE_ERROR");
          expect(runtimeError.context?.operation).toBe("writeFile");
          expect(runtimeError.context?.path).toBe("/path/to/file");
          expect(runtimeError.context?.contentLength).toBe(12);
          expect(runtimeError.context?.platform).toBe("electron-renderer");
          expect(runtimeError.context?.options).toEqual({ encoding: "utf8" });
        }
      });
    });

    describe("fileExists", () => {
      it("should throw RuntimeError with unsupported platform message", async () => {
        await expect(adapter.fileExists("/path/to/file")).rejects.toThrow(
          RuntimeError,
        );
        await expect(adapter.fileExists("/path/to/file")).rejects.toThrow(
          "File operations not supported on this platform",
        );

        try {
          await adapter.fileExists("/path/to/file");
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_FILE_ERROR");
          expect(runtimeError.context?.operation).toBe("fileExists");
          expect(runtimeError.context?.path).toBe("/path/to/file");
          expect(runtimeError.context?.platform).toBe("electron-renderer");
        }
      });
    });
  });

  describe("MCP Operations", () => {
    describe("createMcpConnection", () => {
      beforeEach(() => {
        // Mock console.warn to avoid noise in tests
        jest.spyOn(console, "warn").mockImplementation(() => {});
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should create MCP connection with valid HTTPS URL", async () => {
        // Mock successful fetch responses for initialization
        const mockInitResponse = {
          ok: true,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              jsonrpc: "2.0",
              result: { protocolVersion: "2024-11-05", capabilities: {} },
              id: 1,
            }),
          ),
        };
        const mockFetch = jest.fn().mockResolvedValue(mockInitResponse);
        globalThis.fetch = mockFetch;

        const connection = await adapter.createMcpConnection(
          "https://example.com/mcp",
        );

        expect(connection.isConnected).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/mcp",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining('"method":"initialize"'),
          }),
        );
      });

      it("should create MCP connection with HTTP localhost URL", async () => {
        const mockInitResponse = {
          ok: true,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              jsonrpc: "2.0",
              result: { protocolVersion: "2024-11-05", capabilities: {} },
              id: 1,
            }),
          ),
        };
        const mockFetch = jest.fn().mockResolvedValue(mockInitResponse);
        globalThis.fetch = mockFetch;

        const connection = await adapter.createMcpConnection(
          "http://localhost:3000/mcp",
        );

        expect(connection.isConnected).toBe(true);
      });

      it("should warn about HTTP usage for remote servers", async () => {
        const mockInitResponse = {
          ok: true,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              jsonrpc: "2.0",
              result: { protocolVersion: "2024-11-05", capabilities: {} },
              id: 1,
            }),
          ),
        };
        const mockFetch = jest.fn().mockResolvedValue(mockInitResponse);
        globalThis.fetch = mockFetch;

        await adapter.createMcpConnection("http://example.com/mcp");

        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining(
            "Warning: Using HTTP for remote MCP server. HTTPS is recommended",
          ),
        );
      });

      it("should throw error for invalid URL format", async () => {
        await expect(
          adapter.createMcpConnection("invalid-url"),
        ).rejects.toThrow(RuntimeError);
        await expect(
          adapter.createMcpConnection("invalid-url"),
        ).rejects.toThrow("Invalid MCP server URL format");
      });

      it("should throw error for invalid protocol", async () => {
        await expect(
          adapter.createMcpConnection("ftp://example.com/mcp"),
        ).rejects.toThrow(RuntimeError);
        await expect(
          adapter.createMcpConnection("ftp://example.com/mcp"),
        ).rejects.toThrow("MCP server URL must use HTTP or HTTPS protocol");
      });

      it("should block privileged ports on localhost", async () => {
        // Test multiple privileged ports
        const privilegedPorts = ["80", "443", "22", "25"];

        for (const port of privilegedPorts) {
          await expect(
            adapter.createMcpConnection(`http://localhost:${port}/mcp`),
          ).rejects.toThrow(RuntimeError);

          try {
            await adapter.createMcpConnection(`http://localhost:${port}/mcp`);
          } catch (error) {
            const runtimeError = error as RuntimeError;
            expect(runtimeError.message).toContain(
              "Failed to create MCP connection",
            );
            expect(runtimeError.context?.originalError).toBeInstanceOf(
              RuntimeError,
            );
            const originalError = runtimeError.context
              ?.originalError as RuntimeError;
            expect(originalError.message).toBe(
              "MCP server on privileged port blocked for security",
            );
            expect(originalError.code).toBe("RUNTIME_MCP_SECURITY_VIOLATION");
          }
        }
      });

      it("should allow non-privileged ports on localhost", async () => {
        const mockInitResponse = {
          ok: true,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              jsonrpc: "2.0",
              result: { protocolVersion: "2024-11-05", capabilities: {} },
              id: 1,
            }),
          ),
        };
        const mockFetch = jest.fn().mockResolvedValue(mockInitResponse);
        globalThis.fetch = mockFetch;

        const connection = await adapter.createMcpConnection(
          "http://localhost:3000/mcp",
        );

        expect(connection.isConnected).toBe(true);
      });

      it("should handle connection failure during initialization", async () => {
        const mockFetch = jest
          .fn()
          .mockRejectedValue(new Error("Network error"));
        globalThis.fetch = mockFetch;

        await expect(
          adapter.createMcpConnection("https://example.com/mcp"),
        ).rejects.toThrow(RuntimeError);
        await expect(
          adapter.createMcpConnection("https://example.com/mcp"),
        ).rejects.toThrow("Failed to create MCP connection");
      });

      it("should handle HTTP error during initialization", async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        };
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        await expect(
          adapter.createMcpConnection("https://example.com/mcp"),
        ).rejects.toThrow(RuntimeError);
        await expect(
          adapter.createMcpConnection("https://example.com/mcp"),
        ).rejects.toThrow("Failed to create MCP connection");
      });

      it("should propagate AbortSignal to connection", async () => {
        const controller = new AbortController();
        const mockFetch = jest.fn().mockImplementation(() => {
          return new Promise((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              reject(new Error("Aborted"));
            });
          });
        });
        globalThis.fetch = mockFetch;

        const connectionPromise = adapter.createMcpConnection(
          "https://example.com/mcp",
          { signal: controller.signal },
        );

        controller.abort();

        await expect(connectionPromise).rejects.toThrow(
          "Failed to create MCP connection",
        );
      });

      it("should include custom headers in connection options", async () => {
        const mockInitResponse = {
          ok: true,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              jsonrpc: "2.0",
              result: { protocolVersion: "2024-11-05", capabilities: {} },
              id: 1,
            }),
          ),
        };
        const mockFetch = jest.fn().mockResolvedValue(mockInitResponse);
        globalThis.fetch = mockFetch;

        const customHeaders = {
          Authorization: "Bearer token123",
          "User-Agent": "TestClient/1.0",
        };

        await adapter.createMcpConnection("https://example.com/mcp", {
          headers: customHeaders,
        });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/mcp",
          expect.objectContaining({
            headers: expect.objectContaining(customHeaders),
          }),
        );
      });
    });

    describe("MCP Connection Operations", () => {
      let connection: Awaited<ReturnType<typeof adapter.createMcpConnection>>;
      let mockFetch: jest.Mock;

      beforeEach(async () => {
        // Mock successful initialization
        const mockInitResponse = {
          ok: true,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              jsonrpc: "2.0",
              result: { protocolVersion: "2024-11-05", capabilities: {} },
              id: 1,
            }),
          ),
        };
        mockFetch = jest.fn().mockResolvedValue(mockInitResponse);
        globalThis.fetch = mockFetch;

        connection = await adapter.createMcpConnection(
          "https://example.com/mcp",
        );
        jest.clearAllMocks();
      });

      describe("call", () => {
        it("should make JSON-RPC request and return result", async () => {
          const mockResponse = {
            ok: true,
            text: jest.fn().mockResolvedValue(
              JSON.stringify({
                jsonrpc: "2.0",
                result: { tools: [{ name: "calculator" }] },
                id: 2,
              }),
            ),
          };
          mockFetch.mockResolvedValue(mockResponse);

          const result = await connection.call("tools/list");

          expect(result).toEqual({ tools: [{ name: "calculator" }] });
          expect(mockFetch).toHaveBeenCalledWith(
            "https://example.com/mcp",
            expect.objectContaining({
              method: "POST",
              body: expect.stringContaining('"method":"tools/list"'),
            }),
          );
        });

        it("should make JSON-RPC request with parameters", async () => {
          const mockResponse = {
            ok: true,
            text: jest.fn().mockResolvedValue(
              JSON.stringify({
                jsonrpc: "2.0",
                result: { success: true },
                id: 2,
              }),
            ),
          };
          mockFetch.mockResolvedValue(mockResponse);

          const params = { name: "calculator", arguments: { a: 1, b: 2 } };
          await connection.call("tools/call", params);

          expect(mockFetch).toHaveBeenCalledWith(
            "https://example.com/mcp",
            expect.objectContaining({
              body: expect.stringContaining('"params":{"name":"calculator"'),
            }),
          );
        });

        it("should throw error for JSON-RPC error response", async () => {
          const mockResponse = {
            ok: true,
            text: jest.fn().mockResolvedValue(
              JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32601, message: "Method not found" },
                id: 2,
              }),
            ),
          };
          mockFetch.mockResolvedValue(mockResponse);

          await expect(connection.call("invalid/method")).rejects.toThrow(
            "Method not found",
          );
        });

        it("should throw error when connection is not active", async () => {
          await connection.close();

          await expect(connection.call("tools/list")).rejects.toThrow(
            RuntimeError,
          );
          await expect(connection.call("tools/list")).rejects.toThrow(
            "MCP connection is not active",
          );
        });
      });

      describe("notify", () => {
        it("should send JSON-RPC notification without expecting response", async () => {
          const mockResponse = {
            ok: true,
            text: jest.fn().mockResolvedValue(""),
          };
          mockFetch.mockResolvedValue(mockResponse);

          await connection.notify("client/ready");

          expect(mockFetch).toHaveBeenCalledWith(
            "https://example.com/mcp",
            expect.objectContaining({
              method: "POST",
              body: expect.stringContaining('"method":"client/ready"'),
            }),
          );

          // Should not contain ID for notifications
          const requestBody = JSON.parse(
            mockFetch.mock.calls[0][1].body as string,
          );
          expect(requestBody.id).toBeUndefined();
        });

        it("should send notification with parameters", async () => {
          const mockResponse = {
            ok: true,
            text: jest.fn().mockResolvedValue(""),
          };
          mockFetch.mockResolvedValue(mockResponse);

          const params = { operation: "processing", percentage: 50 };
          await connection.notify("client/progress", params);

          expect(mockFetch).toHaveBeenCalledWith(
            "https://example.com/mcp",
            expect.objectContaining({
              body: expect.stringContaining(
                '"params":{"operation":"processing"',
              ),
            }),
          );
        });

        it("should throw error when connection is not active", async () => {
          await connection.close();

          await expect(connection.notify("client/ready")).rejects.toThrow(
            RuntimeError,
          );
          await expect(connection.notify("client/ready")).rejects.toThrow(
            "MCP connection is not active",
          );
        });
      });

      describe("close", () => {
        it("should mark connection as inactive", async () => {
          expect(connection.isConnected).toBe(true);

          await connection.close();

          expect(connection.isConnected).toBe(false);
        });

        it("should allow multiple close calls", async () => {
          await connection.close();
          await connection.close();

          expect(connection.isConnected).toBe(false);
        });
      });
    });
  });
});
