/**
 * Node.js Runtime Adapter Tests
 *
 * Unit tests for Node.js runtime adapter implementation covering all adapter
 * methods with mocked dependencies and error handling scenarios.
 */

import { NodeRuntimeAdapter } from "../adapters/nodeRuntimeAdapter.js";
import { RuntimeError } from "../runtimeError.js";

// Mock fs/promises
jest.mock("node:fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn(),
  },
}));

// Mock node:path
jest.mock("node:path", () => ({
  dirname: jest.fn(),
}));

describe("NodeRuntimeAdapter", () => {
  let adapter: NodeRuntimeAdapter;

  beforeEach(() => {
    adapter = new NodeRuntimeAdapter();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with Node.js platform info", () => {
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
    const { promises: fs } = require("node:fs");

    describe("readFile", () => {
      it("should read file with default encoding", async () => {
        fs.readFile.mockResolvedValue("file content");

        const content = await adapter.readFile("/test/file.txt");

        expect(fs.readFile).toHaveBeenCalledWith("/test/file.txt", {
          encoding: "utf8",
        });
        expect(content).toBe("file content");
      });

      it("should read file with custom encoding", async () => {
        fs.readFile.mockResolvedValue("file content");

        await adapter.readFile("/test/file.txt", { encoding: "base64" });

        expect(fs.readFile).toHaveBeenCalledWith("/test/file.txt", {
          encoding: "base64",
        });
      });

      it("should throw RuntimeError when readFile fails", async () => {
        const mockError = new Error("File not found");
        fs.readFile.mockRejectedValue(mockError);

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
        fs.writeFile.mockResolvedValue(undefined);

        await adapter.writeFile("/test/file.txt", "content");

        expect(fs.writeFile).toHaveBeenCalledWith("/test/file.txt", "content", {
          encoding: "utf8",
        });
      });

      it("should write file with custom encoding", async () => {
        fs.writeFile.mockResolvedValue(undefined);

        await adapter.writeFile("/test/file.txt", "content", {
          encoding: "base64",
        });

        expect(fs.writeFile).toHaveBeenCalledWith("/test/file.txt", "content", {
          encoding: "base64",
        });
      });

      it("should create directories when requested", async () => {
        const { dirname } = require("node:path");
        dirname.mockReturnValue("/test");
        fs.mkdir.mockResolvedValue(undefined);
        fs.writeFile.mockResolvedValue(undefined);

        await adapter.writeFile("/test/file.txt", "content", {
          createDirectories: true,
        });

        expect(dirname).toHaveBeenCalledWith("/test/file.txt");
        expect(fs.mkdir).toHaveBeenCalledWith("/test", { recursive: true });
        expect(fs.writeFile).toHaveBeenCalledWith("/test/file.txt", "content", {
          encoding: "utf8",
        });
      });

      it("should throw RuntimeError when writeFile fails", async () => {
        const mockError = new Error("Permission denied");
        fs.writeFile.mockRejectedValue(mockError);

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
        fs.access.mockResolvedValue(undefined);

        const exists = await adapter.fileExists("/test/file.txt");

        expect(fs.access).toHaveBeenCalledWith("/test/file.txt");
        expect(exists).toBe(true);
      });

      it("should return false when file does not exist", async () => {
        fs.access.mockRejectedValue(new Error("File not found"));

        const exists = await adapter.fileExists("/test/file.txt");

        expect(fs.access).toHaveBeenCalledWith("/test/file.txt");
        expect(exists).toBe(false);
      });
    });
  });
});
