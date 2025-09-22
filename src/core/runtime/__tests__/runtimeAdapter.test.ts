/**
 * Runtime Adapter Interface Tests
 *
 * Unit tests for runtime adapter interface type definitions and contracts.
 * Validates interface compliance and type compatibility across platforms.
 */

import type {
  RuntimeAdapter,
  PlatformInfo,
  TimerHandle,
  FileOperationOptions,
  McpConnectionOptions,
  McpConnection,
} from "../index";

describe("RuntimeAdapter Interface", () => {
  // Mock implementation for testing interface compliance
  const mockAdapter: RuntimeAdapter = {
    platformInfo: {
      platform: "node",
      version: "18.0.0",
      capabilities: {
        platform: "node",
        hasHttp: true,
        hasTimers: true,
        hasFileSystem: true,
        features: {},
      },
    },
    fetch(_input: string | URL, _init?: RequestInit): Promise<Response> {
      return Promise.resolve(new Response("mock response"));
    },
    stream(
      _input: string | URL,
      _init?: RequestInit,
    ): Promise<{
      status: number;
      statusText: string;
      headers: Record<string, string>;
      stream: AsyncIterable<Uint8Array>;
    }> {
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/plain" },
        stream: {
          [Symbol.asyncIterator]() {
            let yielded = false;
            return {
              next() {
                if (!yielded) {
                  yielded = true;
                  return Promise.resolve({
                    value: new Uint8Array([109, 111, 99, 107]), // "mock"
                    done: false,
                  });
                }
                return Promise.resolve({ value: undefined, done: true });
              },
            };
          },
        },
      });
    },
    setTimeout(_callback: () => void, _ms: number): TimerHandle {
      return "mock-timer-handle";
    },
    setInterval(_callback: () => void, _ms: number): TimerHandle {
      return "mock-interval-handle";
    },
    clearTimeout(_handle: TimerHandle): void {
      // Mock implementation
    },
    clearInterval(_handle: TimerHandle): void {
      // Mock implementation
    },
    readFile(_path: string, _options?: FileOperationOptions): Promise<string> {
      return Promise.resolve("mock file content");
    },
    writeFile(
      _path: string,
      _content: string,
      _options?: FileOperationOptions,
    ): Promise<void> {
      return Promise.resolve();
    },
    fileExists(_path: string): Promise<boolean> {
      return Promise.resolve(true);
    },
    createMcpConnection(
      _serverConfig: import("../mcpServerConfig").McpServerConfig,
      _options?: McpConnectionOptions,
    ): Promise<McpConnection> {
      return Promise.resolve({
        isConnected: true,
        call: jest.fn(),
        notify: jest.fn(),
        close: jest.fn(),
      });
    },
  };

  describe("Interface Contract", () => {
    it("should have platformInfo property", () => {
      expect(mockAdapter.platformInfo).toBeDefined();
      expect(mockAdapter.platformInfo.platform).toBe("node");
      expect(mockAdapter.platformInfo.capabilities).toBeDefined();
    });

    it("should have HTTP methods", () => {
      expect(typeof mockAdapter.fetch).toBe("function");
    });

    it("should have timer methods", () => {
      expect(typeof mockAdapter.setTimeout).toBe("function");
      expect(typeof mockAdapter.setInterval).toBe("function");
      expect(typeof mockAdapter.clearTimeout).toBe("function");
      expect(typeof mockAdapter.clearInterval).toBe("function");
    });

    it("should have file operation methods", () => {
      expect(typeof mockAdapter.readFile).toBe("function");
      expect(typeof mockAdapter.writeFile).toBe("function");
      expect(typeof mockAdapter.fileExists).toBe("function");
    });
  });

  describe("Method Signatures", () => {
    it("should have correct fetch signature", async () => {
      const response = await mockAdapter.fetch("https://example.com");
      expect(response).toBeInstanceOf(Response);
    });

    it("should have correct timer signatures", () => {
      const timeoutHandle = mockAdapter.setTimeout(() => {}, 1000);
      const intervalHandle = mockAdapter.setInterval(() => {}, 1000);

      expect(timeoutHandle).toBeDefined();
      expect(intervalHandle).toBeDefined();

      // Should not throw
      mockAdapter.clearTimeout(timeoutHandle);
      mockAdapter.clearInterval(intervalHandle);
    });

    it("should have correct file operation signatures", async () => {
      const content = await mockAdapter.readFile("/test/file.txt");
      expect(typeof content).toBe("string");

      await expect(
        mockAdapter.writeFile("/test/file.txt", "content"),
      ).resolves.toBeUndefined();

      const exists = await mockAdapter.fileExists("/test/file.txt");
      expect(typeof exists).toBe("boolean");
    });
  });

  describe("Type Compatibility", () => {
    it("should accept PlatformInfo types", () => {
      const platformInfo: PlatformInfo = {
        platform: "browser",
        version: "1.0.0",
        capabilities: {
          platform: "browser",
          hasHttp: true,
          hasTimers: true,
          hasFileSystem: false,
          features: { hasWindow: true },
        },
      };

      expect(platformInfo.platform).toBe("browser");
      expect(platformInfo.capabilities.hasFileSystem).toBe(false);
    });

    it("should accept FileOperationOptions types", () => {
      const options: FileOperationOptions = {
        encoding: "utf8",
        createDirectories: true,
      };

      expect(options.encoding).toBe("utf8");
      expect(options.createDirectories).toBe(true);
    });

    it("should handle TimerHandle as unknown type", () => {
      const handle: TimerHandle = "string-handle";
      const numericHandle: TimerHandle = 123;
      const objectHandle: TimerHandle = { id: "timer" };

      // All should be valid TimerHandle types
      expect(handle).toBeDefined();
      expect(numericHandle).toBeDefined();
      expect(objectHandle).toBeDefined();
    });
  });
});
