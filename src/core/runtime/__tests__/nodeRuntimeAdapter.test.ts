/**
 * Node Runtime Adapter Tests
 *
 * Unit tests for Node runtime adapter implementation covering all adapter
 * methods with mocked dependencies and error handling scenarios.
 */

import { NodeRuntimeAdapter } from "../adapters/nodeRuntimeAdapter";
import { RuntimeError } from "../runtimeError";
import { urlToMcpServerConfig } from "../mcpServerConfigUtils";
import { NodeStdioMcpConnection } from "../adapters/nodeStdioMcpConnection";

// Mock NodeStdioMcpConnection
jest.mock("../adapters/nodeStdioMcpConnection");
const MockedNodeStdioMcpConnection = NodeStdioMcpConnection as jest.MockedClass<
  typeof NodeStdioMcpConnection
>;

// Mock fs/promises for dynamic imports
const mockFs = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn(),
};

jest.mock("node:fs", () => ({
  promises: mockFs,
}));

// Mock node:path for dynamic imports
const mockPath = {
  dirname: jest.fn(),
};

jest.mock("node:path", () => mockPath);

describe("NodeRuntimeAdapter", () => {
  let adapter: NodeRuntimeAdapter;

  beforeEach(() => {
    adapter = new NodeRuntimeAdapter();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with Node platform info", () => {
      expect(adapter.platformInfo.platform).toBe("node");
      expect(adapter.platformInfo.version).toBe(process.version);
      expect(adapter.platformInfo.capabilities.hasHttp).toBe(true);
      expect(adapter.platformInfo.capabilities.hasTimers).toBe(true);
      expect(adapter.platformInfo.capabilities.hasFileSystem).toBe(true);
    });
  });

  describe("HTTP Operations", () => {
    describe("fetch", () => {
      it("should call globalThis.fetch", async () => {
        const mockResponse = new Response("test");
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

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
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        const init = { method: "POST", body: "data" };
        await adapter.fetch("https://example.com", init);

        expect(mockFetch).toHaveBeenCalledWith("https://example.com", init);
      });

      it("should throw RuntimeError when fetch fails", async () => {
        const mockError = new Error("Network error");
        const mockFetch = jest.fn().mockRejectedValue(mockError);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        await expect(adapter.fetch("https://example.com")).rejects.toThrow(
          RuntimeError,
        );
        await expect(adapter.fetch("https://example.com")).rejects.toThrow(
          "HTTP fetch failed",
        );
      });
    });

    describe("stream", () => {
      const createMockResponse = (body: ReadableStream | null) => ({
        status: 200,
        statusText: "OK",
        headers: new Map([
          ["content-type", "text/event-stream"],
          ["cache-control", "no-cache"],
        ]),
        body,
      });

      const createMockStream = (
        chunks: Uint8Array[],
      ): ReadableStream<Uint8Array> => {
        let index = 0;
        return new ReadableStream({
          start(controller) {
            const pump = () => {
              if (index < chunks.length) {
                controller.enqueue(chunks[index++]);
                pump();
              } else {
                controller.close();
              }
            };
            pump();
          },
        });
      };

      it("should return stream response with HTTP metadata", async () => {
        const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
        const mockStream = createMockStream(chunks);
        const mockResponse = createMockResponse(mockStream);

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        const result = await adapter.stream("https://example.com/stream");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/stream",
          undefined,
        );
        expect(result.status).toBe(200);
        expect(result.statusText).toBe("OK");
        expect(result.headers).toEqual({
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
        });

        // Collect stream chunks
        const receivedChunks = [];
        for await (const chunk of result.stream) {
          receivedChunks.push(chunk);
        }

        expect(receivedChunks).toHaveLength(2);
        expect(receivedChunks[0]).toEqual(new Uint8Array([1, 2, 3]));
        expect(receivedChunks[1]).toEqual(new Uint8Array([4, 5, 6]));
      });

      it("should pass init options to fetch", async () => {
        const mockStream = createMockStream([new Uint8Array([1, 2, 3])]);
        const mockResponse = createMockResponse(mockStream);
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        const init = {
          method: "POST",
          headers: { Accept: "text/event-stream" },
        };

        await adapter.stream("https://example.com/stream", init);

        expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/stream",
          init,
        );
      });

      it("should support AbortSignal cancellation", async () => {
        const controller = new AbortController();
        const chunks = [
          new Uint8Array([1, 2, 3]),
          new Uint8Array([4, 5, 6]),
          new Uint8Array([7, 8, 9]),
        ];

        // Create a stream that will be cancelled
        let _streamController: ReadableStreamDefaultController<Uint8Array>;
        const mockStream = new ReadableStream<Uint8Array>({
          start(controller) {
            _streamController = controller;
            controller.enqueue(chunks[0]);
          },
        });

        const mockResponse = createMockResponse(mockStream);
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        const init = { signal: controller.signal };
        const result = await adapter.stream("https://example.com/stream", init);

        // Start consuming stream
        const iterator = result.stream[Symbol.asyncIterator]();

        // Get first chunk
        const firstChunk = await iterator.next();
        expect(firstChunk.value).toEqual(chunks[0]);
        expect(firstChunk.done).toBe(false);

        // Cancel the signal
        controller.abort();

        // Next iteration should throw error
        await expect(iterator.next()).rejects.toThrow("Stream was aborted");
      });

      it("should throw RuntimeError when response body is null", async () => {
        const mockResponse = createMockResponse(null);
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        await expect(
          adapter.stream("https://example.com/stream"),
        ).rejects.toThrow(RuntimeError);
        await expect(
          adapter.stream("https://example.com/stream"),
        ).rejects.toThrow("Response body is null for streaming request");
      });

      it("should throw RuntimeError when fetch fails", async () => {
        const mockError = new Error("Network error");
        const mockFetch = jest.fn().mockRejectedValue(mockError);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        await expect(
          adapter.stream("https://example.com/stream"),
        ).rejects.toThrow(RuntimeError);
        await expect(
          adapter.stream("https://example.com/stream"),
        ).rejects.toThrow("HTTP stream failed: Network error");
      });

      it("should handle empty stream correctly", async () => {
        const mockStream = createMockStream([]);
        const mockResponse = createMockResponse(mockStream);
        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        const result = await adapter.stream("https://example.com/stream");

        const receivedChunks = [];
        for await (const chunk of result.stream) {
          receivedChunks.push(chunk);
        }

        expect(receivedChunks).toHaveLength(0);
      });

      it("should properly extract headers from Response", async () => {
        const mockStream = createMockStream([new Uint8Array([1])]);
        const headers = new Map([
          ["content-type", "application/json"],
          ["x-custom-header", "custom-value"],
          ["authorization", "Bearer token123"],
        ]);

        const mockResponse = {
          ...createMockResponse(mockStream),
          headers,
        };

        const mockFetch = jest.fn().mockResolvedValue(mockResponse);
        (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;

        const result = await adapter.stream("https://example.com/stream");

        expect(result.headers).toEqual({
          "content-type": "application/json",
          "x-custom-header": "custom-value",
          authorization: "Bearer token123",
        });
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
        const handle = adapter.setTimeout(callback, 1000);

        expect(handle).toBeDefined();
        jest.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalled();
      });

      it("should throw RuntimeError when setTimeout fails", () => {
        const originalSetTimeout = globalThis.setTimeout;
        (globalThis as unknown as { setTimeout: unknown }).setTimeout = () => {
          throw new Error("Timer error");
        };

        expect(() => adapter.setTimeout(() => {}, 1000)).toThrow(RuntimeError);
        expect(() => adapter.setTimeout(() => {}, 1000)).toThrow(
          "Failed to set timeout",
        );

        (globalThis as unknown as { setTimeout: unknown }).setTimeout =
          originalSetTimeout;
      });
    });

    describe("setInterval", () => {
      it("should call globalThis.setInterval", () => {
        const callback = jest.fn();
        const handle = adapter.setInterval(callback, 1000);

        expect(handle).toBeDefined();
        jest.advanceTimersByTime(2000);
        expect(callback).toHaveBeenCalledTimes(2);
      });

      it("should throw RuntimeError when setInterval fails", () => {
        const originalSetInterval = globalThis.setInterval;
        (globalThis as unknown as { setInterval: unknown }).setInterval =
          () => {
            throw new Error("Timer error");
          };

        expect(() => adapter.setInterval(() => {}, 1000)).toThrow(RuntimeError);
        expect(() => adapter.setInterval(() => {}, 1000)).toThrow(
          "Failed to set interval",
        );

        (globalThis as unknown as { setInterval: unknown }).setInterval =
          originalSetInterval;
      });
    });

    describe("clearTimeout", () => {
      it("should call globalThis.clearTimeout", () => {
        const handle = adapter.setTimeout(() => {}, 1000);

        expect(() => adapter.clearTimeout(handle)).not.toThrow();
      });

      it("should throw RuntimeError when clearTimeout fails", () => {
        const originalClearTimeout = globalThis.clearTimeout;
        (globalThis as unknown as { clearTimeout: unknown }).clearTimeout =
          () => {
            throw new Error("Clear timer error");
          };

        expect(() => adapter.clearTimeout("handle")).toThrow(RuntimeError);
        expect(() => adapter.clearTimeout("handle")).toThrow(
          "Failed to clear timeout",
        );

        (globalThis as unknown as { clearTimeout: unknown }).clearTimeout =
          originalClearTimeout;
      });
    });

    describe("clearInterval", () => {
      it("should call globalThis.clearInterval", () => {
        const handle = adapter.setInterval(() => {}, 1000);

        expect(() => adapter.clearInterval(handle)).not.toThrow();
      });

      it("should throw RuntimeError when clearInterval fails", () => {
        const originalClearInterval = globalThis.clearInterval;
        (globalThis as unknown as { clearInterval: unknown }).clearInterval =
          () => {
            throw new Error("Clear timer error");
          };

        expect(() => adapter.clearInterval("handle")).toThrow(RuntimeError);
        expect(() => adapter.clearInterval("handle")).toThrow(
          "Failed to clear interval",
        );

        (globalThis as unknown as { clearInterval: unknown }).clearInterval =
          originalClearInterval;
      });
    });
  });

  describe("File Operations", () => {
    describe("readFile", () => {
      it("should read file with default encoding", async () => {
        mockFs.readFile.mockResolvedValue("file content");

        const content = await adapter.readFile("/test/file.txt");

        expect(mockFs.readFile).toHaveBeenCalledWith("/test/file.txt", {
          encoding: "utf8",
        });
        expect(content).toBe("file content");
      });

      it("should read file with custom encoding", async () => {
        mockFs.readFile.mockResolvedValue("file content");

        await adapter.readFile("/test/file.txt", { encoding: "base64" });

        expect(mockFs.readFile).toHaveBeenCalledWith("/test/file.txt", {
          encoding: "base64",
        });
      });

      it("should throw RuntimeError when readFile fails", async () => {
        const mockError = new Error("File not found");
        mockFs.readFile.mockRejectedValue(mockError);

        await expect(adapter.readFile("/test/file.txt")).rejects.toThrow(
          RuntimeError,
        );
        await expect(adapter.readFile("/test/file.txt")).rejects.toThrow(
          "Failed to read file",
        );
      });
    });

    describe("writeFile", () => {
      it("should write file with default encoding", async () => {
        mockFs.writeFile.mockResolvedValue(undefined);

        await adapter.writeFile("/test/file.txt", "content");

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          "/test/file.txt",
          "content",
          {
            encoding: "utf8",
          },
        );
      });

      it("should write file with custom encoding", async () => {
        mockFs.writeFile.mockResolvedValue(undefined);

        await adapter.writeFile("/test/file.txt", "content", {
          encoding: "base64",
        });

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          "/test/file.txt",
          "content",
          {
            encoding: "base64",
          },
        );
      });

      it("should create directories when requested", async () => {
        mockPath.dirname.mockReturnValue("/test");
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);

        await adapter.writeFile("/test/file.txt", "content", {
          createDirectories: true,
        });

        expect(mockPath.dirname).toHaveBeenCalledWith("/test/file.txt");
        expect(mockFs.mkdir).toHaveBeenCalledWith("/test", { recursive: true });
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          "/test/file.txt",
          "content",
          {
            encoding: "utf8",
          },
        );
      });

      it("should throw RuntimeError when writeFile fails", async () => {
        const mockError = new Error("Permission denied");
        mockFs.writeFile.mockRejectedValue(mockError);

        await expect(
          adapter.writeFile("/test/file.txt", "content"),
        ).rejects.toThrow(RuntimeError);
        await expect(
          adapter.writeFile("/test/file.txt", "content"),
        ).rejects.toThrow("Failed to write file");
      });
    });

    describe("fileExists", () => {
      it("should return true when file exists", async () => {
        mockFs.access.mockResolvedValue(undefined);

        const exists = await adapter.fileExists("/test/file.txt");

        expect(mockFs.access).toHaveBeenCalledWith("/test/file.txt");
        expect(exists).toBe(true);
      });

      it("should return false when file does not exist", async () => {
        mockFs.access.mockRejectedValue(new Error("File not found"));

        const exists = await adapter.fileExists("/test/file.txt");

        expect(mockFs.access).toHaveBeenCalledWith("/test/file.txt");
        expect(exists).toBe(false);
      });
    });
  });

  describe("MCP Operations", () => {
    describe("createMcpConnection", () => {
      const mockFetch = jest.fn();
      const validServerUrl = "http://localhost:3000/mcp";
      const httpsServerUrl = "https://example.com/mcp";

      beforeEach(() => {
        // Replace adapter's fetch method with mock
        adapter.fetch = mockFetch;
        mockFetch.mockClear();
      });

      it("should create and initialize MCP connection successfully", async () => {
        // Mock successful initialization response
        mockFetch.mockResolvedValue({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                jsonrpc: "2.0",
                result: { initialized: true },
                id: "node_123_1",
              }),
            ),
        });

        const connection = await adapter.createMcpConnection(
          urlToMcpServerConfig(validServerUrl),
        );

        expect(connection).toBeDefined();
        expect(connection.isConnected).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          validServerUrl,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining("initialize"),
          }),
        );
      });

      it("should support HTTPS URLs", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                jsonrpc: "2.0",
                result: { initialized: true },
                id: "node_123_1",
              }),
            ),
        });

        const connection = await adapter.createMcpConnection(
          urlToMcpServerConfig(httpsServerUrl),
        );

        expect(connection).toBeDefined();
        expect(connection.isConnected).toBe(true);
      });

      it("should pass connection options to MCP connection", async () => {
        const options = {
          headers: { "X-Custom": "test" },
          signal: new AbortController().signal,
        };

        mockFetch.mockResolvedValue({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                jsonrpc: "2.0",
                result: { initialized: true },
                id: "node_123_1",
              }),
            ),
        });

        const connection = await adapter.createMcpConnection(
          urlToMcpServerConfig(validServerUrl),
          options,
        );

        expect(connection).toBeDefined();
        expect(mockFetch).toHaveBeenCalledWith(
          validServerUrl,
          expect.objectContaining({
            headers: expect.objectContaining({
              "Content-Type": "application/json",
              "X-Custom": "test",
            }),
            signal: options.signal,
          }),
        );
      });

      it("should throw RuntimeError for invalid URL format", async () => {
        await expect(
          adapter.createMcpConnection(urlToMcpServerConfig("invalid-url")),
        ).rejects.toThrow(RuntimeError);
      });

      it("should throw RuntimeError for unsupported protocol", async () => {
        await expect(
          adapter.createMcpConnection(
            urlToMcpServerConfig("ftp://example.com/mcp"),
          ),
        ).rejects.toThrow(RuntimeError);
      });

      it("should throw RuntimeError when initialization fails", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        await expect(
          adapter.createMcpConnection(urlToMcpServerConfig(validServerUrl)),
        ).rejects.toThrow(RuntimeError);
      });

      it("should handle network errors during connection", async () => {
        mockFetch.mockRejectedValue(new Error("Network error"));

        await expect(
          adapter.createMcpConnection(urlToMcpServerConfig(validServerUrl)),
        ).rejects.toThrow(RuntimeError);
      });

      it("should support AbortSignal cancellation", async () => {
        const controller = new AbortController();
        const promise = adapter.createMcpConnection(
          urlToMcpServerConfig(validServerUrl),
          {
            signal: controller.signal,
          },
        );

        controller.abort();

        await expect(promise).rejects.toThrow();
      });

      describe("STDIO server support", () => {
        const mockStdioConnection = {
          initialize: jest.fn(),
          isConnected: true,
          call: jest.fn(),
          notify: jest.fn(),
          close: jest.fn(),
        };

        beforeEach(() => {
          MockedNodeStdioMcpConnection.mockClear();
          MockedNodeStdioMcpConnection.mockImplementation(
            () => mockStdioConnection as any,
          );
          mockStdioConnection.initialize.mockClear();
          mockStdioConnection.call.mockClear();
          mockStdioConnection.notify.mockClear();
          mockStdioConnection.close.mockClear();
        });

        it("should create STDIO connection when command is provided", async () => {
          mockStdioConnection.initialize.mockResolvedValue(undefined);

          const serverConfig = {
            name: "test-stdio-server",
            command: "/usr/local/bin/mcp-server",
            args: ["--config", "test.json"],
          };

          const connection = await adapter.createMcpConnection(serverConfig);

          expect(MockedNodeStdioMcpConnection).toHaveBeenCalledWith(
            "/usr/local/bin/mcp-server",
            ["--config", "test.json"],
            {},
          );
          expect(mockStdioConnection.initialize).toHaveBeenCalled();
          expect(connection).toBe(mockStdioConnection);
        });

        it("should create STDIO connection with default empty args", async () => {
          mockStdioConnection.initialize.mockResolvedValue(undefined);

          const serverConfig = {
            name: "test-stdio-server",
            command: "/usr/local/bin/mcp-server",
          };

          const connection = await adapter.createMcpConnection(serverConfig);

          expect(MockedNodeStdioMcpConnection).toHaveBeenCalledWith(
            "/usr/local/bin/mcp-server",
            [],
            {},
          );
          expect(mockStdioConnection.initialize).toHaveBeenCalled();
          expect(connection).toBe(mockStdioConnection);
        });

        it("should pass options to STDIO connection", async () => {
          mockStdioConnection.initialize.mockResolvedValue(undefined);

          const serverConfig = {
            name: "test-stdio-server",
            command: "/usr/local/bin/mcp-server",
            args: ["--verbose"],
          };

          const options = {
            timeout: 10000,
            headers: { "X-Custom": "test" },
          };

          const connection = await adapter.createMcpConnection(
            serverConfig,
            options,
          );

          expect(MockedNodeStdioMcpConnection).toHaveBeenCalledWith(
            "/usr/local/bin/mcp-server",
            ["--verbose"],
            options,
          );
          expect(mockStdioConnection.initialize).toHaveBeenCalled();
          expect(connection).toBe(mockStdioConnection);
        });

        it("should throw error when neither url nor command is provided", async () => {
          const serverConfig = {
            name: "invalid-server",
          };

          await expect(
            adapter.createMcpConnection(serverConfig),
          ).rejects.toThrow(RuntimeError);
          await expect(
            adapter.createMcpConnection(serverConfig),
          ).rejects.toThrow(
            "Server configuration must specify either 'url' or 'command'",
          );
        });

        it("should handle STDIO connection initialization failure", async () => {
          const initError = new Error("Failed to spawn subprocess");
          mockStdioConnection.initialize.mockRejectedValue(initError);

          const serverConfig = {
            name: "test-stdio-server",
            command: "/invalid/path/mcp-server",
          };

          await expect(
            adapter.createMcpConnection(serverConfig),
          ).rejects.toThrow(RuntimeError);
          await expect(
            adapter.createMcpConnection(serverConfig),
          ).rejects.toThrow("Failed to create MCP connection");

          expect(MockedNodeStdioMcpConnection).toHaveBeenCalledWith(
            "/invalid/path/mcp-server",
            [],
            {},
          );
          expect(mockStdioConnection.initialize).toHaveBeenCalled();
        });
      });
    });

    describe("NodeMcpConnection", () => {
      let connection: any;
      const mockFetch = jest.fn();
      const serverUrl = "http://localhost:3000/mcp";

      beforeEach(async () => {
        adapter.fetch = mockFetch;
        mockFetch.mockClear();

        // Mock successful initialization
        mockFetch.mockResolvedValue({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                jsonrpc: "2.0",
                result: { initialized: true },
                id: "node_123_1",
              }),
            ),
        });

        connection = await adapter.createMcpConnection(
          urlToMcpServerConfig(serverUrl),
        );
      });

      describe("call", () => {
        it("should make JSON-RPC request and return result", async () => {
          const expectedResult = { tools: ["calculator", "weather"] };
          mockFetch.mockResolvedValue({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  jsonrpc: "2.0",
                  result: expectedResult,
                  id: "node_123_2",
                }),
              ),
          });

          const result = await connection.call("tools/list");

          expect(result).toEqual(expectedResult);
          expect(mockFetch).toHaveBeenCalledWith(
            serverUrl,
            expect.objectContaining({
              method: "POST",
              body: expect.stringContaining("tools/list"),
            }),
          );
        });

        it("should make JSON-RPC request with parameters", async () => {
          const params = { name: "calculator", operation: "add" };
          const expectedResult = { result: 5 };

          mockFetch.mockResolvedValue({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  jsonrpc: "2.0",
                  result: expectedResult,
                  id: "node_123_2",
                }),
              ),
          });

          const result = await connection.call("tools/call", params);

          expect(result).toEqual(expectedResult);

          const callArgs = mockFetch.mock.calls[1]?.[1] as { body: string };
          const callBody = JSON.parse(callArgs.body);
          expect(callBody.params).toEqual(params);
        });

        it("should throw error for JSON-RPC error response", async () => {
          const errorResponse = {
            jsonrpc: "2.0",
            error: {
              code: -32601,
              message: "Method not found",
              data: { method: "invalid/method" },
            },
            id: "node_123_2",
          };

          mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(JSON.stringify(errorResponse)),
          });

          await expect(connection.call("invalid/method")).rejects.toThrow(
            "Method not found",
          );
        });

        it("should throw RuntimeError when not connected", async () => {
          await connection.close();

          await expect(connection.call("test")).rejects.toThrow(RuntimeError);
        });
      });

      describe("notify", () => {
        it("should send JSON-RPC notification without expecting response", async () => {
          mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(""),
          });

          await connection.notify("client/ready");

          expect(mockFetch).toHaveBeenCalledWith(
            serverUrl,
            expect.objectContaining({
              method: "POST",
              body: expect.stringContaining("client/ready"),
            }),
          );

          const callArgs = mockFetch.mock.calls[1]?.[1] as { body: string };
          const callBody = JSON.parse(callArgs.body);
          expect(callBody.id).toBeUndefined();
        });

        it("should send notification with parameters", async () => {
          const params = { status: "processing", progress: 50 };

          mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(""),
          });

          await connection.notify("client/progress", params);

          const callArgs = mockFetch.mock.calls[1]?.[1] as { body: string };
          const callBody = JSON.parse(callArgs.body);
          expect(callBody.params).toEqual(params);
        });

        it("should throw RuntimeError when not connected", async () => {
          await connection.close();

          await expect(connection.notify("test")).rejects.toThrow(RuntimeError);
        });
      });

      describe("close", () => {
        it("should close connection and set isConnected to false", async () => {
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

      describe("error handling", () => {
        it("should handle HTTP errors from server", async () => {
          mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: "Not Found",
          });

          await expect(connection.call("test")).rejects.toThrow(RuntimeError);
        });

        it("should handle invalid JSON responses", async () => {
          mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("invalid json"),
          });

          await expect(connection.call("test")).rejects.toThrow(RuntimeError);
        });

        it("should handle non-JSON-RPC 2.0 responses", async () => {
          mockFetch.mockResolvedValue({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  jsonrpc: "1.0",
                  result: {},
                  id: "test",
                }),
              ),
          });

          await expect(connection.call("test")).rejects.toThrow(RuntimeError);
        });

        it("should handle network failures", async () => {
          mockFetch.mockRejectedValue(new Error("Network error"));

          await expect(connection.call("test")).rejects.toThrow(RuntimeError);
        });
      });
    });
  });
});
