/**
 * Tests for StdioTelemetryReader
 *
 * Tests the file-based telemetry reading functionality for STDIO MCP servers,
 * ensuring compatibility with MockMcpServer interface and proper error handling.
 */

import { writeFileSync, unlinkSync, existsSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { StdioTelemetryReader } from "../stdioTelemetryReader";
import { createStdioTelemetryReader } from "../createStdioTelemetryReader";
import { createStdioTelemetryReaderWithPath } from "../createStdioTelemetryReaderWithPath";

describe("StdioTelemetryReader", () => {
  let testDir: string;
  let telemetryFile: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "stdio-telemetry-test-"));
    telemetryFile = join(testDir, "stdio-mcp-telemetry-12345.json");
  });

  afterEach(() => {
    if (existsSync(telemetryFile)) {
      unlinkSync(telemetryFile);
    }
  });

  describe("with valid telemetry file", () => {
    beforeEach(() => {
      const telemetryData = {
        toolCalls: {
          echo_tool: [
            {
              arguments: { message: "test message" },
              timestamp: "2024-01-01T00:00:00.000Z",
            },
            {
              arguments: { message: "second message" },
              timestamp: "2024-01-01T00:01:00.000Z",
            },
          ],
          other_tool: [
            {
              arguments: { data: "some data" },
              timestamp: "2024-01-01T00:02:00.000Z",
            },
          ],
        },
      };
      writeFileSync(telemetryFile, JSON.stringify(telemetryData, null, 2));
    });

    test("wasToolCalled returns true for existing tools", () => {
      const reader = new StdioTelemetryReader(telemetryFile);
      expect(reader.wasToolCalled("echo_tool")).toBe(true);
      expect(reader.wasToolCalled("other_tool")).toBe(true);
    });

    test("wasToolCalled returns false for non-existing tools", () => {
      const reader = new StdioTelemetryReader(telemetryFile);
      expect(reader.wasToolCalled("nonexistent_tool")).toBe(false);
    });

    test("getToolCallCount returns correct counts", () => {
      const reader = new StdioTelemetryReader(telemetryFile);
      expect(reader.getToolCallCount("echo_tool")).toBe(2);
      expect(reader.getToolCallCount("other_tool")).toBe(1);
      expect(reader.getToolCallCount("nonexistent_tool")).toBe(0);
    });

    test("getToolCallsFor returns tool calls with Date objects", () => {
      const reader = new StdioTelemetryReader(telemetryFile);
      const calls = reader.getToolCallsFor("echo_tool");

      expect(calls).toHaveLength(2);
      expect(calls[0].arguments).toEqual({ message: "test message" });
      expect(calls[0].timestamp).toBeInstanceOf(Date);
      expect(calls[0].timestamp.toISOString()).toBe("2024-01-01T00:00:00.000Z");

      expect(calls[1].arguments).toEqual({ message: "second message" });
      expect(calls[1].timestamp).toBeInstanceOf(Date);
      expect(calls[1].timestamp.toISOString()).toBe("2024-01-01T00:01:00.000Z");
    });

    test("getToolCallsFor returns empty array for non-existing tools", () => {
      const reader = new StdioTelemetryReader(telemetryFile);
      expect(reader.getToolCallsFor("nonexistent_tool")).toEqual([]);
    });

    test("getToolCalls returns all tool calls", () => {
      const reader = new StdioTelemetryReader(telemetryFile);
      const allCalls = reader.getToolCalls();

      expect(Object.keys(allCalls)).toEqual(["echo_tool", "other_tool"]);
      expect(allCalls.echo_tool).toHaveLength(2);
      expect(allCalls.other_tool).toHaveLength(1);
      expect(allCalls.echo_tool[0].timestamp).toBeInstanceOf(Date);
    });

    test("clearToolCallHistory removes file and clears cache", () => {
      const reader = new StdioTelemetryReader(telemetryFile);

      // Verify file exists and has data
      expect(reader.wasToolCalled("echo_tool")).toBe(true);
      expect(existsSync(telemetryFile)).toBe(true);

      // Clear history
      reader.clearToolCallHistory();

      // Verify file is removed and cache is cleared
      expect(existsSync(telemetryFile)).toBe(false);
      expect(reader.wasToolCalled("echo_tool")).toBe(false);
      expect(reader.getToolCallCount("echo_tool")).toBe(0);
    });
  });

  describe("with missing file", () => {
    test("returns empty results for all methods", () => {
      const nonExistentFile = join(testDir, "nonexistent.json");
      const reader = new StdioTelemetryReader(nonExistentFile);

      expect(reader.wasToolCalled("echo_tool")).toBe(false);
      expect(reader.getToolCallCount("echo_tool")).toBe(0);
      expect(reader.getToolCallsFor("echo_tool")).toEqual([]);
      expect(reader.getToolCalls()).toEqual({});
    });

    test("clearToolCallHistory handles missing file gracefully", () => {
      const nonExistentFile = join(testDir, "nonexistent.json");
      const reader = new StdioTelemetryReader(nonExistentFile);

      expect(() => reader.clearToolCallHistory()).not.toThrow();
    });
  });

  describe("with malformed JSON", () => {
    beforeEach(() => {
      writeFileSync(telemetryFile, "invalid json");
    });

    test("returns empty results and logs warning", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const reader = new StdioTelemetryReader(telemetryFile);

      expect(reader.wasToolCalled("echo_tool")).toBe(false);
      expect(reader.getToolCallCount("echo_tool")).toBe(0);
      expect(reader.getToolCallsFor("echo_tool")).toEqual([]);
      expect(reader.getToolCalls()).toEqual({});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Malformed JSON in telemetry file"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("with invalid structure", () => {
    beforeEach(() => {
      writeFileSync(telemetryFile, JSON.stringify({ invalid: "structure" }));
    });

    test("returns empty results and logs warning", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const reader = new StdioTelemetryReader(telemetryFile);

      expect(reader.wasToolCalled("echo_tool")).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid telemetry file structure"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("factory functions", () => {
    test("createStdioTelemetryReader uses OS temp directory", () => {
      const reader = createStdioTelemetryReader(12345);
      expect(reader).toBeInstanceOf(StdioTelemetryReader);
      // Note: We can't easily test the exact path without exposing internals,
      // but we can verify it creates a functional reader
      expect(reader.wasToolCalled("nonexistent")).toBe(false);
    });

    test("createStdioTelemetryReaderWithPath uses custom directory", () => {
      const reader = createStdioTelemetryReaderWithPath(testDir, 12345);
      expect(reader).toBeInstanceOf(StdioTelemetryReader);
      expect(reader.wasToolCalled("nonexistent")).toBe(false);
    });
  });

  describe("caching behavior", () => {
    test("caches data between method calls", () => {
      const telemetryData = {
        toolCalls: {
          echo_tool: [
            {
              arguments: { message: "test" },
              timestamp: "2024-01-01T00:00:00.000Z",
            },
          ],
        },
      };
      writeFileSync(telemetryFile, JSON.stringify(telemetryData));

      const reader = new StdioTelemetryReader(telemetryFile);

      // Multiple calls should use cached data
      expect(reader.wasToolCalled("echo_tool")).toBe(true);
      expect(reader.getToolCallCount("echo_tool")).toBe(1);
      expect(reader.getToolCallsFor("echo_tool")).toHaveLength(1);

      // Verify all calls return consistent results
      expect(reader.wasToolCalled("echo_tool")).toBe(true);
    });
  });
});
