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
});
