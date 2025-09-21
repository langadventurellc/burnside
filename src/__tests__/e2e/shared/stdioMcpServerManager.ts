/**
 * STDIO MCP Server Manager for E2E Testing
 *
 * Manages STDIO MCP server subprocess lifecycle and provides MockMcpServer-compatible
 * interface for test assertions. Integrates with file-based telemetry to track
 * tool executions while maintaining compatibility with existing test patterns.
 */

import { spawn, type ChildProcess } from "child_process";
import { join } from "path";
import { createStdioTelemetryReader } from "./createStdioTelemetryReader";
import type { StdioTelemetryReader } from "./stdioTelemetryReader";

/**
 * STDIO MCP Server Manager that provides MockMcpServer-compatible interface.
 *
 * Manages subprocess lifecycle for STDIO MCP servers while providing the same
 * assertion methods as MockMcpServer through file-based telemetry integration.
 */
export class StdioMcpServerManager {
  private childProcess?: ChildProcess;
  private telemetryReader?: StdioTelemetryReader;
  private isRunning = false;
  private serverPath: string;

  constructor() {
    // Use the existing STDIO server script from the shared directory
    this.serverPath = join(__dirname, "bin", "stdio-mcp-server.js");
  }

  /**
   * Start the STDIO MCP server subprocess.
   *
   * @returns Promise resolving to dummy port/url for compatibility with MockMcpServer
   */
  async start(): Promise<{ port: number; url: string }> {
    if (this.isRunning) {
      throw new Error("STDIO MCP server is already running");
    }

    try {
      // Spawn the STDIO server subprocess
      this.childProcess = spawn("node", [this.serverPath], {
        stdio: ["pipe", "pipe", "inherit"],
      });

      // Wait for process to start successfully
      await this.waitForProcessReady();

      // Create telemetry reader for this process
      this.telemetryReader = createStdioTelemetryReader(this.childProcess.pid!);

      this.isRunning = true;

      // Return dummy values for compatibility - STDIO doesn't use HTTP
      return {
        port: 0,
        url: `stdio://pid-${this.childProcess.pid}`,
      };
    } catch (error) {
      await this.cleanup();
      throw new Error(
        `Failed to start STDIO MCP server: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Stop the STDIO MCP server subprocess.
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.cleanup();
  }

  /**
   * Check if a specific tool was called.
   *
   * @param toolName - Name of the tool to check
   * @returns True if the tool was called at least once
   */
  wasToolCalled(toolName: string): boolean {
    return this.telemetryReader?.wasToolCalled(toolName) ?? false;
  }

  /**
   * Get the number of times a tool was called.
   *
   * @param toolName - Name of the tool to count
   * @returns Number of times the tool was called
   */
  getToolCallCount(toolName: string): number {
    return this.telemetryReader?.getToolCallCount(toolName) ?? 0;
  }

  /**
   * Get all calls for a specific tool.
   *
   * @param toolName - Name of the tool
   * @returns Array of tool call details
   */
  getToolCallsFor(
    toolName: string,
  ): Array<{ arguments: unknown; timestamp: Date }> {
    return this.telemetryReader?.getToolCallsFor(toolName) ?? [];
  }

  /**
   * Clear tool call history by removing telemetry file.
   */
  clearToolCallHistory(): void {
    this.telemetryReader?.clearToolCallHistory();
  }

  /**
   * Get the command configuration for this STDIO server.
   *
   * @returns Command and args for createMcpTestConfig
   */
  getCommandConfig(): { command: string; args: string[] } {
    return {
      command: "node",
      args: [this.serverPath],
    };
  }

  /**
   * Wait for the subprocess to be ready for communication.
   */
  private async waitForProcessReady(): Promise<void> {
    if (!this.childProcess) {
      throw new Error("Child process not spawned");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("STDIO server startup timeout"));
      }, 10000); // 10 second timeout

      // Listen for process startup
      this.childProcess!.on("spawn", () => {
        clearTimeout(timeout);
        // Give the process a moment to initialize
        setTimeout(resolve, 100);
      });

      // Handle spawn errors
      this.childProcess!.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Handle unexpected exit during startup
      this.childProcess!.on("exit", (code, signal) => {
        clearTimeout(timeout);
        reject(
          new Error(
            `STDIO server exited during startup (code: ${code}, signal: ${signal})`,
          ),
        );
      });
    });
  }

  /**
   * Clean up subprocess and telemetry resources.
   */
  private async cleanup(): Promise<void> {
    this.isRunning = false;

    // Clean up telemetry
    if (this.telemetryReader) {
      try {
        this.telemetryReader.clearToolCallHistory();
      } catch (error) {
        // Log but don't throw - cleanup should be resilient
        console.warn("Warning: Error cleaning up telemetry:", error);
      }
      this.telemetryReader = undefined;
    }

    // Terminate subprocess
    if (this.childProcess && !this.childProcess.killed) {
      this.childProcess.kill("SIGTERM");

      // Wait for graceful shutdown or force kill after timeout
      await new Promise<void>((resolve) => {
        const forceKillTimer = setTimeout(() => {
          if (this.childProcess && !this.childProcess.killed) {
            this.childProcess.kill("SIGKILL");
          }
          resolve();
        }, 5000);

        this.childProcess!.on("exit", () => {
          clearTimeout(forceKillTimer);
          resolve();
        });
      });

      this.childProcess = undefined;
    }
  }
}
