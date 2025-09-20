/**
 * Node Runtime Adapter Tests
 *
 * Unit tests for Node runtime adapter implementation covering all adapter
 * methods with mocked dependencies and error handling scenarios.
 */

import { NodeRuntimeAdapter } from "../adapters/nodeRuntimeAdapter";
import { RuntimeError } from "../runtimeError";

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
});
