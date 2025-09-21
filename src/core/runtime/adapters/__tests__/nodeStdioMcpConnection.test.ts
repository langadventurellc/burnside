/**
 * Unit tests for NodeStdioMcpConnection
 */

import { EventEmitter } from "events";
import { spawn } from "child_process";
import { createInterface } from "readline";
import { NodeStdioMcpConnection } from "../nodeStdioMcpConnection";
import { RuntimeError } from "../../runtimeError";

// Mock Node.js modules
jest.mock("child_process");
jest.mock("readline");

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockCreateInterface = createInterface as jest.MockedFunction<
  typeof createInterface
>;

interface MockChildProcess extends EventEmitter {
  stdin: MockWritableStream;
  stdout: MockReadableStream;
  stderr: MockReadableStream;
  killed: boolean;
  exitCode: number | null;
  kill: jest.Mock;
  pid?: number;
}

interface MockWritableStream extends EventEmitter {
  write: jest.Mock;
  end: jest.Mock;
  writable: boolean;
}

interface MockReadableStream extends EventEmitter {
  readable: boolean;
  read: jest.Mock;
}

interface MockReadlineInterface extends EventEmitter {
  close: jest.Mock;
}

describe("NodeStdioMcpConnection", () => {
  let mockChildProcess: MockChildProcess;
  let mockReadlineInterface: MockReadlineInterface;
  let connection: NodeStdioMcpConnection;

  beforeEach(() => {
    // Create mock child process
    mockChildProcess = new EventEmitter() as MockChildProcess;
    mockChildProcess.stdin = new EventEmitter() as MockWritableStream;
    mockChildProcess.stdout = new EventEmitter() as MockReadableStream;
    mockChildProcess.stderr = new EventEmitter() as MockReadableStream;
    mockChildProcess.killed = false;
    mockChildProcess.exitCode = null;
    mockChildProcess.kill = jest.fn();
    mockChildProcess.pid = 12345;

    // Mock stdin methods
    mockChildProcess.stdin.write = jest.fn().mockReturnValue(true);
    mockChildProcess.stdin.end = jest.fn();
    mockChildProcess.stdin.writable = true;

    // Mock stdout/stderr
    mockChildProcess.stdout.readable = true;
    mockChildProcess.stdout.read = jest.fn();
    mockChildProcess.stderr.readable = true;
    mockChildProcess.stderr.read = jest.fn();

    // Create mock readline interface
    mockReadlineInterface = new EventEmitter() as MockReadlineInterface;
    mockReadlineInterface.close = jest.fn();

    // Mock spawn to return our mock child process
    mockSpawn.mockReturnValue(
      mockChildProcess as unknown as ReturnType<typeof spawn>,
    );

    // Mock createInterface to return our mock readline
    mockCreateInterface.mockReturnValue(
      mockReadlineInterface as unknown as ReturnType<typeof createInterface>,
    );

    // Create connection instance
    connection = new NodeStdioMcpConnection("test-command", ["--test"]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create connection with command and args", () => {
      const conn = new NodeStdioMcpConnection("my-command", ["arg1", "arg2"]);
      expect(conn).toBeInstanceOf(NodeStdioMcpConnection);
    });

    it("should create connection with default empty args", () => {
      const conn = new NodeStdioMcpConnection("my-command");
      expect(conn).toBeInstanceOf(NodeStdioMcpConnection);
    });

    it("should create connection with options", () => {
      const conn = new NodeStdioMcpConnection("my-command", [], {
        timeout: 5000,
      });
      expect(conn).toBeInstanceOf(NodeStdioMcpConnection);
    });
  });

  describe("initialize", () => {
    it("should successfully spawn subprocess and set up stdio", async () => {
      const initPromise = connection.initialize();

      // Simulate successful spawn
      process.nextTick(() => {
        mockChildProcess.emit("spawn");
      });

      await initPromise;

      expect(mockSpawn).toHaveBeenCalledWith("test-command", ["--test"], {
        stdio: ["pipe", "pipe", "inherit"],
      });
      expect(mockCreateInterface).toHaveBeenCalledWith({
        input: mockChildProcess.stdout,
        terminal: false,
      });
      expect(connection.isConnected).toBe(true);
    });

    it("should throw RuntimeError on spawn failure", async () => {
      const spawnError = new Error("Command not found");
      const initPromise = connection.initialize();

      // Simulate spawn error
      process.nextTick(() => {
        mockChildProcess.emit("error", spawnError);
      });

      await expect(initPromise).rejects.toThrow(RuntimeError);
      await expect(initPromise).rejects.toThrow(
        "Failed to spawn MCP server subprocess",
      );
    });

    it("should handle spawn exceptions", async () => {
      mockSpawn.mockImplementation(() => {
        throw new Error("Spawn failed");
      });

      await expect(connection.initialize()).rejects.toThrow(RuntimeError);
      await expect(connection.initialize()).rejects.toThrow(
        "Subprocess spawn error",
      );
    });
  });

  describe("isConnected", () => {
    beforeEach(async () => {
      const initPromise = connection.initialize();
      process.nextTick(() => mockChildProcess.emit("spawn"));
      await initPromise;
    });

    it("should return true when connection is active and subprocess is running", () => {
      expect(connection.isConnected).toBe(true);
    });

    it("should return false when subprocess is killed", () => {
      mockChildProcess.killed = true;
      expect(connection.isConnected).toBe(false);
    });

    it("should return false when subprocess has exited", () => {
      mockChildProcess.exitCode = 0;
      expect(connection.isConnected).toBe(false);
    });

    it("should return false after close is called", async () => {
      const closePromise = connection.close();

      // Simulate subprocess exit to resolve close promise
      process.nextTick(() => {
        mockChildProcess.emit("exit", 0, null);
      });

      await closePromise;
      expect(connection.isConnected).toBe(false);
    });
  });

  describe("call", () => {
    beforeEach(async () => {
      const initPromise = connection.initialize();
      process.nextTick(() => mockChildProcess.emit("spawn"));
      await initPromise;
    });

    it("should send JSON-RPC request and receive response", async () => {
      const callPromise = connection.call("test/method", { param: "value" });

      // Verify request was sent to stdin
      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"jsonrpc":"2.0"'),
      );
      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"method":"test/method"'),
      );
      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"params":{"param":"value"}'),
      );

      // Simulate response from stdout
      const requestData = mockChildProcess.stdin.write.mock
        .calls[0][0] as string;
      const request = JSON.parse(requestData.trim());
      const response = {
        jsonrpc: "2.0",
        id: request.id,
        result: { success: true },
      };

      process.nextTick(() => {
        mockReadlineInterface.emit("line", JSON.stringify(response));
      });

      const result = await callPromise;
      expect(result).toEqual({ success: true });
    });

    it("should handle JSON-RPC error responses", async () => {
      const callPromise = connection.call("test/method");

      // Get the request ID
      const requestData = mockChildProcess.stdin.write.mock
        .calls[0][0] as string;
      const request = JSON.parse(requestData.trim());

      // Simulate error response
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32601,
          message: "Method not found",
          data: { method: "test/method" },
        },
      };

      process.nextTick(() => {
        mockReadlineInterface.emit("line", JSON.stringify(errorResponse));
      });

      await expect(callPromise).rejects.toThrow("Method not found");
    });

    it("should handle timeout", async () => {
      const connWithTimeout = new NodeStdioMcpConnection("test-command", [], {
        timeout: 100,
      });
      const initPromise = connWithTimeout.initialize();
      process.nextTick(() => mockChildProcess.emit("spawn"));
      await initPromise;

      const callPromise = connWithTimeout.call("test/method");

      await expect(callPromise).rejects.toThrow(RuntimeError);
      await expect(callPromise).rejects.toThrow("request timeout");
    });

    it("should throw error when connection is inactive", async () => {
      const closePromise = connection.close();

      // Simulate subprocess exit to resolve close promise
      process.nextTick(() => {
        mockChildProcess.emit("exit", 0, null);
      });

      await closePromise;

      await expect(connection.call("test/method")).rejects.toThrow(
        RuntimeError,
      );
      await expect(connection.call("test/method")).rejects.toThrow(
        "inactive STDIO MCP connection",
      );
    });

    it("should handle multiple concurrent requests", async () => {
      const call1Promise = connection.call("method1");
      const call2Promise = connection.call("method2");

      // Get both request IDs
      const request1Data = mockChildProcess.stdin.write.mock
        .calls[0][0] as string;
      const request2Data = mockChildProcess.stdin.write.mock
        .calls[1][0] as string;
      const request1 = JSON.parse(request1Data.trim());
      const request2 = JSON.parse(request2Data.trim());

      // Respond to both requests (out of order)
      process.nextTick(() => {
        mockReadlineInterface.emit(
          "line",
          JSON.stringify({
            jsonrpc: "2.0",
            id: request2.id,
            result: { response: 2 },
          }),
        );
        mockReadlineInterface.emit(
          "line",
          JSON.stringify({
            jsonrpc: "2.0",
            id: request1.id,
            result: { response: 1 },
          }),
        );
      });

      const [result1, result2] = await Promise.all([
        call1Promise,
        call2Promise,
      ]);
      expect(result1).toEqual({ response: 1 });
      expect(result2).toEqual({ response: 2 });
    });
  });

  describe("notify", () => {
    beforeEach(async () => {
      const initPromise = connection.initialize();
      process.nextTick(() => mockChildProcess.emit("spawn"));
      await initPromise;
    });

    it("should send JSON-RPC notification without ID", async () => {
      await connection.notify("test/notification", { status: "ready" });

      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringMatching(
          /"jsonrpc":"2\.0".*"method":"test\/notification".*"params":\{"status":"ready"\}/,
        ),
      );

      // Verify no ID field in notification
      const notificationData = mockChildProcess.stdin.write.mock
        .calls[0][0] as string;
      const notification = JSON.parse(notificationData.trim());
      expect(notification.id).toBeUndefined();
    });

    it("should throw error when connection is inactive", async () => {
      const closePromise = connection.close();

      // Simulate subprocess exit to resolve close promise
      process.nextTick(() => {
        mockChildProcess.emit("exit", 0, null);
      });

      await closePromise;

      await expect(connection.notify("test/notification")).rejects.toThrow(
        RuntimeError,
      );
      await expect(connection.notify("test/notification")).rejects.toThrow(
        "inactive STDIO MCP connection",
      );
    });
  });

  describe("close", () => {
    beforeEach(async () => {
      const initPromise = connection.initialize();
      process.nextTick(() => mockChildProcess.emit("spawn"));
      await initPromise;
    });

    it("should close readline and terminate subprocess", async () => {
      const closePromise = connection.close();

      // Simulate subprocess exit to resolve close promise
      process.nextTick(() => {
        mockChildProcess.emit("exit", 0, null);
      });

      await closePromise;

      expect(mockReadlineInterface.close).toHaveBeenCalled();
      expect(mockChildProcess.kill).toHaveBeenCalled();
      expect(connection.isConnected).toBe(false);
    });

    it("should reject pending requests on close", async () => {
      const callPromise = connection.call("test/method");

      // Close while request is pending
      const closePromise = connection.close();

      // Simulate subprocess exit to resolve close promise
      process.nextTick(() => {
        mockChildProcess.emit("exit", 0, null);
      });

      await closePromise;

      await expect(callPromise).rejects.toThrow(RuntimeError);
      await expect(callPromise).rejects.toThrow(
        "Connection closed while request was pending",
      );
    });

    it("should force kill subprocess if it doesn't exit gracefully", async () => {
      // Use fake timers for this test
      jest.useFakeTimers();

      // Mock kill to not trigger exit event immediately on first call
      let killCount = 0;
      mockChildProcess.kill.mockImplementation(() => {
        killCount++;
        if (killCount === 2) {
          // Second kill (SIGKILL) - emit exit immediately
          process.nextTick(() => {
            mockChildProcess.emit("exit", null, "SIGKILL");
          });
        }
        // First kill (SIGTERM) - don't emit exit, will trigger force kill timer
      });

      const closePromise = connection.close();

      // Advance time to trigger the force kill timer (5 seconds)
      jest.advanceTimersByTime(5000);

      await closePromise;
      expect(mockChildProcess.kill).toHaveBeenCalledTimes(2); // First SIGTERM, then SIGKILL

      // Restore real timers
      jest.useRealTimers();
    });
  });

  describe("subprocess lifecycle", () => {
    beforeEach(async () => {
      const initPromise = connection.initialize();
      process.nextTick(() => mockChildProcess.emit("spawn"));
      await initPromise;
    });

    it("should handle subprocess exit and reject pending requests", async () => {
      const callPromise = connection.call("test/method");

      // Simulate subprocess exit
      mockChildProcess.emit("exit", 1, null);

      await expect(callPromise).rejects.toThrow(RuntimeError);
      await expect(callPromise).rejects.toThrow("MCP server subprocess exited");
      expect(connection.isConnected).toBe(false);
    });

    it("should handle subprocess killed by signal", async () => {
      const callPromise = connection.call("test/method");

      // Simulate subprocess killed by signal
      mockChildProcess.emit("exit", null, "SIGTERM");

      await expect(callPromise).rejects.toThrow("subprocess exited");
      expect(connection.isConnected).toBe(false);
    });
  });

  describe("JSON parsing", () => {
    beforeEach(async () => {
      const initPromise = connection.initialize();
      process.nextTick(() => mockChildProcess.emit("spawn"));
      await initPromise;
    });

    it("should ignore empty lines", async () => {
      const callPromise = connection.call("test/method");

      // Send empty lines (should be ignored)
      mockReadlineInterface.emit("line", "");
      mockReadlineInterface.emit("line", "   ");

      // Send valid response
      const requestData = mockChildProcess.stdin.write.mock
        .calls[0][0] as string;
      const request = JSON.parse(requestData.trim());
      const response = {
        jsonrpc: "2.0",
        id: request.id,
        result: { success: true },
      };

      process.nextTick(() => {
        mockReadlineInterface.emit("line", JSON.stringify(response));
      });

      const result = await callPromise;
      expect(result).toEqual({ success: true });
    });

    it("should handle malformed JSON gracefully", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      // Send malformed JSON
      mockReadlineInterface.emit("line", "{ invalid json }");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to parse JSON"),
        expect.any(SyntaxError),
      );

      consoleSpy.mockRestore();
    });

    it("should ignore notification responses", () => {
      // Send a response without ID (notification response)
      mockReadlineInterface.emit(
        "line",
        JSON.stringify({
          jsonrpc: "2.0",
          result: { ignored: true },
        }),
      );

      // Should not throw or cause issues
      expect(connection.isConnected).toBe(true);
    });
  });

  describe("stdin write handling", () => {
    beforeEach(async () => {
      const initPromise = connection.initialize();
      process.nextTick(() => mockChildProcess.emit("spawn"));
      await initPromise;
    });

    it("should handle stdin write backpressure", async () => {
      // Mock write to return false (backpressure)
      mockChildProcess.stdin.write.mockReturnValue(false);

      const callPromise = connection.call("test/method");

      // Simulate drain event
      process.nextTick(() => {
        mockChildProcess.stdin.emit("drain");
      });

      // Should not throw error
      expect(mockChildProcess.stdin.write).toHaveBeenCalled();

      // Clean up the promise to avoid hanging test
      process.nextTick(() => {
        const requestData = mockChildProcess.stdin.write.mock
          .calls[0][0] as string;
        const request = JSON.parse(requestData.trim());
        mockReadlineInterface.emit(
          "line",
          JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: { success: true },
          }),
        );
      });

      await callPromise;
    });

    it("should handle stdin write timeout", async () => {
      // Use fake timers for this test
      jest.useFakeTimers();

      // Mock write to return false and never emit drain
      mockChildProcess.stdin.write.mockReturnValue(false);

      const callPromise = connection.call("test/method");

      // Advance time to trigger the timeout
      jest.advanceTimersByTime(5000);

      await expect(callPromise).rejects.toThrow(RuntimeError);
      await expect(callPromise).rejects.toThrow("stdin write timeout");

      // Restore real timers
      jest.useRealTimers();
    });

    it("should handle stdin write error", async () => {
      // Mock write to return false
      mockChildProcess.stdin.write.mockReturnValue(false);

      const callPromise = connection.call("test/method");

      // Simulate stdin error
      process.nextTick(() => {
        mockChildProcess.stdin.emit("error", new Error("Write failed"));
      });

      await expect(callPromise).rejects.toThrow(RuntimeError);
      await expect(callPromise).rejects.toThrow("stdin write error");
    });
  });
});
