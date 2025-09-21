/**
 * React Native Runtime Adapter Tests
 *
 * Unit tests for React Native runtime adapter implementation covering all
 * adapter methods with mocked React Native APIs and error handling scenarios.
 */

import { ReactNativeRuntimeAdapter } from "../reactNativeRuntimeAdapter";
import { RuntimeError } from "../../runtimeError";
import { urlToMcpServerConfig } from "../../mcpServerConfigUtils";

// Mock platform detection to return react-native
jest.mock("../../detectPlatform", () => ({
  detectPlatform: jest.fn().mockReturnValue("react-native"),
}));

describe("ReactNativeRuntimeAdapter", () => {
  let adapter: ReactNativeRuntimeAdapter;
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

    adapter = new ReactNativeRuntimeAdapter();
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
    it("should initialize with React Native platform info", () => {
      expect(adapter.platformInfo.platform).toBe("react-native");
      expect(adapter.platformInfo.version).toBe("react-native");
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

    describe("stream", () => {
      let mockReadableStream: ReadableStream<Uint8Array>;
      let mockReader: ReadableStreamDefaultReader<Uint8Array>;

      beforeEach(() => {
        // Mock ReadableStream and reader
        mockReader = {
          read: jest.fn(),
          releaseLock: jest.fn(),
        } as any;

        mockReadableStream = {
          getReader: jest.fn().mockReturnValue(mockReader),
        } as any;
      });

      describe("standard streaming (non-SSE)", () => {
        it("should create standard stream when no SSE headers", async () => {
          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map([["content-type", "application/json"]]),
            body: mockReadableStream,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          // Mock reader to yield some data then end
          (mockReader.read as jest.Mock)
            .mockResolvedValueOnce({
              done: false,
              value: new Uint8Array([1, 2, 3]),
            })
            .mockResolvedValueOnce({ done: true, value: undefined });

          const result = await adapter.stream("https://example.com");

          expect(result.status).toBe(200);
          expect(result.statusText).toBe("OK");
          expect(result.headers).toEqual({
            "content-type": "application/json",
          });

          // Consume the stream
          const chunks: Uint8Array[] = [];
          for await (const chunk of result.stream) {
            chunks.push(chunk);
          }

          expect(chunks).toHaveLength(1);
          expect(chunks[0]).toEqual(new Uint8Array([1, 2, 3]));
          expect(mockReader.releaseLock).toHaveBeenCalled();
        });

        it("should handle URL objects for standard streaming", async () => {
          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map([["content-type", "text/plain"]]),
            body: mockReadableStream,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          (mockReader.read as jest.Mock).mockResolvedValueOnce({
            done: true,
            value: undefined,
          });

          const url = new URL("https://example.com");
          const result = await adapter.stream(url);

          expect(mockFetch).toHaveBeenCalledWith(url, undefined);
          expect(result.status).toBe(200);
        });

        it("should throw RuntimeError when response body is null", async () => {
          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map(),
            body: null,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          await expect(adapter.stream("https://example.com")).rejects.toThrow(
            RuntimeError,
          );
          await expect(adapter.stream("https://example.com")).rejects.toThrow(
            "Response body is null for streaming request",
          );

          try {
            await adapter.stream("https://example.com");
          } catch (error) {
            const runtimeError = error as RuntimeError;
            expect(runtimeError.code).toBe("RUNTIME_HTTP_ERROR");
            expect(runtimeError.context?.input).toBe("https://example.com");
            expect(runtimeError.context?.platform).toBe("react-native");
          }
        });

        it("should handle AbortSignal cancellation in standard streaming", async () => {
          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map(),
            body: mockReadableStream,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          const abortController = new AbortController();
          abortController.abort();

          // Mock reader to check for cancellation
          (mockReader.read as jest.Mock).mockImplementation(() => {
            // Should throw when signal is aborted
            throw new RuntimeError("Stream was aborted", "RUNTIME_HTTP_ERROR", {
              platform: "react-native",
            });
          });

          const result = await adapter.stream("https://example.com", {
            signal: abortController.signal,
          });

          // Try to consume the stream - should throw due to cancellation
          await expect(async () => {
            for await (const _chunk of result.stream) {
              // Should not reach here
            }
          }).rejects.toThrow("Stream was aborted");

          expect(mockReader.releaseLock).toHaveBeenCalled();
        });
      });

      describe("SSE streaming", () => {
        it("should fallback to standard streaming when react-native-sse import fails", async () => {
          // Since react-native-sse is not available in the test environment,
          // this test verifies the fallback behavior which is the expected behavior
          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map([["content-type", "text/event-stream"]]),
            body: mockReadableStream,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          (mockReader.read as jest.Mock).mockResolvedValueOnce({
            done: true,
            value: undefined,
          });

          const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

          const result = await adapter.stream("https://example.com", {
            headers: { accept: "text/event-stream" },
          });

          expect(result.status).toBe(200);
          expect(consoleSpy).toHaveBeenCalledWith(
            "react-native-sse not available, falling back to standard streaming",
          );

          // Verify it fell back to standard fetch streaming
          expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
            headers: { accept: "text/event-stream" },
          });

          consoleSpy.mockRestore();
        });

        it("should detect SSE request from Accept headers (object format)", () => {
          // Test the private isSSERequest method behavior through public interface
          const headers = { accept: "text/event-stream" };

          // This will attempt SSE but fall back to standard streaming
          // We can verify the behavior by checking the console warning
          const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map([["content-type", "text/event-stream"]]),
            body: mockReadableStream,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          (mockReader.read as jest.Mock).mockResolvedValueOnce({
            done: true,
            value: undefined,
          });

          return adapter.stream("https://example.com", { headers }).then(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
              "react-native-sse not available, falling back to standard streaming",
            );
            consoleSpy.mockRestore();
          });
        });

        it("should detect SSE request from Accept headers (Headers object format)", () => {
          const headers = new Headers();
          headers.set("Accept", "text/event-stream");

          const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map([["content-type", "text/event-stream"]]),
            body: mockReadableStream,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          (mockReader.read as jest.Mock).mockResolvedValueOnce({
            done: true,
            value: undefined,
          });

          return adapter.stream("https://example.com", { headers }).then(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
              "react-native-sse not available, falling back to standard streaming",
            );
            consoleSpy.mockRestore();
          });
        });

        it("should detect SSE request from Accept headers (array format)", () => {
          const headers: [string, string][] = [["accept", "text/event-stream"]];

          const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map([["content-type", "text/event-stream"]]),
            body: mockReadableStream,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          (mockReader.read as jest.Mock).mockResolvedValueOnce({
            done: true,
            value: undefined,
          });

          return adapter.stream("https://example.com", { headers }).then(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
              "react-native-sse not available, falling back to standard streaming",
            );
            consoleSpy.mockRestore();
          });
        });

        it("should not attempt SSE when Accept headers don't include text/event-stream", async () => {
          const mockResponse = {
            status: 200,
            statusText: "OK",
            headers: new Map([["content-type", "application/json"]]),
            body: mockReadableStream,
          };
          const mockFetch = jest.fn().mockResolvedValue(mockResponse);
          globalThis.fetch = mockFetch;

          (mockReader.read as jest.Mock).mockResolvedValueOnce({
            done: true,
            value: undefined,
          });

          const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

          await adapter.stream("https://example.com", {
            headers: { accept: "application/json" },
          });

          // Should not log SSE fallback warning since it never attempted SSE
          expect(consoleSpy).not.toHaveBeenCalledWith(
            "react-native-sse not available, falling back to standard streaming",
          );

          consoleSpy.mockRestore();
        });
      });

      it("should throw RuntimeError when stream method fails", async () => {
        const mockError = new Error("Network error");
        const mockFetch = jest.fn().mockRejectedValue(mockError);
        globalThis.fetch = mockFetch;

        await expect(adapter.stream("https://example.com")).rejects.toThrow(
          RuntimeError,
        );
        await expect(adapter.stream("https://example.com")).rejects.toThrow(
          "HTTP stream failed",
        );

        try {
          await adapter.stream("https://example.com");
        } catch (error) {
          const runtimeError = error as RuntimeError;
          expect(runtimeError.code).toBe("RUNTIME_HTTP_ERROR");
          expect(runtimeError.context?.input).toBe("https://example.com");
          expect(runtimeError.context?.platform).toBe("react-native");
          expect(runtimeError.context?.originalError).toBe(mockError);
        }
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
          expect(runtimeError.context?.platform).toBe("react-native");
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
          expect(runtimeError.context?.platform).toBe("react-native");
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
          expect(runtimeError.context?.platform).toBe("react-native");
        }
      });
    });
  });

  describe("MCP Operations", () => {
    describe("createMcpConnection", () => {
      it("should create MCP connection for valid remote URLs", async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest
            .fn()
            .mockResolvedValue({ jsonrpc: "2.0", id: 1, result: {} }),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        const connection = await adapter.createMcpConnection(
          urlToMcpServerConfig("https://example.com/mcp"),
        );

        expect(connection).toBeDefined();
        expect(connection.isConnected).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/mcp",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining('"method":"ping"'),
          }),
        );
      });

      it("should accept localhost URLs for testing", async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest
            .fn()
            .mockResolvedValue({ jsonrpc: "2.0", id: 1, result: {} }),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        const connection = await adapter.createMcpConnection(
          urlToMcpServerConfig("http://localhost:3000"),
        );

        expect(connection).toBeDefined();
        expect(connection.isConnected).toBe(true);
      });

      it("should accept private IP addresses for testing", async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest
            .fn()
            .mockResolvedValue({ jsonrpc: "2.0", id: 1, result: {} }),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        const connection = await adapter.createMcpConnection(
          urlToMcpServerConfig("http://192.168.1.100:3000"),
        );

        expect(connection).toBeDefined();
        expect(connection.isConnected).toBe(true);
      });

      it("should reject invalid protocols", async () => {
        const testUrls = [
          "ftp://example.com",
          "file://example.com",
          "ws://example.com",
          "custom://example.com",
        ];

        for (const url of testUrls) {
          await expect(
            adapter.createMcpConnection(urlToMcpServerConfig(url)),
          ).rejects.toThrow(
            "Invalid MCP server URL. Must be HTTP/HTTPS remote server",
          );
        }
      });

      it("should reject invalid URL formats", async () => {
        const testUrls = ["not-a-url", "://invalid", "", "http://"];

        for (const url of testUrls) {
          await expect(
            adapter.createMcpConnection(urlToMcpServerConfig(url)),
          ).rejects.toThrow("Failed to create MCP connection");
        }
      });

      it("should pass custom headers to connection", async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest
            .fn()
            .mockResolvedValue({ jsonrpc: "2.0", id: 1, result: {} }),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        const customHeaders = { Authorization: "Bearer token123" };
        await adapter.createMcpConnection(
          urlToMcpServerConfig("https://example.com/mcp"),
          {
            headers: customHeaders,
          },
        );

        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/mcp",
          expect.objectContaining({
            headers: expect.objectContaining({
              "Content-Type": "application/json",
              Authorization: "Bearer token123",
            }),
          }),
        );
      });

      it("should support AbortSignal cancellation", async () => {
        const controller = new AbortController();
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest
            .fn()
            .mockResolvedValue({ jsonrpc: "2.0", id: 1, result: {} }),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        await adapter.createMcpConnection(
          urlToMcpServerConfig("https://example.com/mcp"),
          {
            signal: controller.signal,
          },
        );

        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/mcp",
          expect.objectContaining({
            signal: controller.signal,
          }),
        );
      });

      it("should handle connection initialization failures", async () => {
        const mockFetch = jest
          .fn()
          .mockRejectedValue(new Error("Network error"));
        globalThis.fetch = mockFetch;

        await expect(
          adapter.createMcpConnection(
            urlToMcpServerConfig("https://example.com/mcp"),
          ),
        ).rejects.toThrow("Failed to create MCP connection");
      });
    });

    describe("MCP Connection Operations", () => {
      let connection: any;

      beforeEach(async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest
            .fn()
            .mockResolvedValue({ jsonrpc: "2.0", id: 1, result: {} }),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;
        connection = await adapter.createMcpConnection(
          urlToMcpServerConfig("https://example.com/mcp"),
        );
      });

      it("should make successful JSON-RPC calls", async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest.fn().mockResolvedValue({
            jsonrpc: "2.0",
            id: "test-id",
            result: { tools: ["tool1", "tool2"] },
          }),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        const result = await connection.call("tools/list");

        expect(result).toEqual({ tools: ["tool1", "tool2"] });
        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/mcp",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"method":"tools/list"'),
          }),
        );
      });

      it("should handle JSON-RPC error responses", async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest.fn().mockResolvedValue({
            jsonrpc: "2.0",
            id: "test-id",
            error: { code: -32601, message: "Method not found" },
          }),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        await expect(connection.call("invalid/method")).rejects.toThrow(
          "MCP call failed: Method not found",
        );
      });

      it("should send JSON-RPC notifications", async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest.fn().mockResolvedValue({}),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        await connection.notify("client/ready", { status: "connected" });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/mcp",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"method":"client/ready"'),
          }),
        );
      });

      it("should handle HTTP errors", async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          headers: { get: jest.fn().mockReturnValue("application/json") },
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        await expect(connection.call("test/method")).rejects.toThrow(
          "HTTP error: 500 Internal Server Error",
        );
      });

      it("should handle invalid content type", async () => {
        const mockResponse = {
          ok: true,
          headers: { get: jest.fn().mockReturnValue("text/plain") },
          json: jest.fn().mockResolvedValue({}),
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        globalThis.fetch = mockFetch;

        await expect(connection.call("test/method")).rejects.toThrow(
          "Invalid response content type. Expected application/json",
        );
      });

      it("should close connection properly", async () => {
        expect(connection.isConnected).toBe(true);

        await connection.close();

        expect(connection.isConnected).toBe(false);

        await expect(connection.call("test/method")).rejects.toThrow(
          "MCP connection is not active",
        );
      });
    });
  });
});
