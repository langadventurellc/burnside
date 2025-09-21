/**
 * STDIO Telemetry Reader for E2E Testing
 *
 * Reads file-based telemetry from STDIO MCP servers and provides the same
 * interface as MockMcpServer for test assertions. Maintains compatibility
 * with existing test patterns while enabling subprocess-based testing.
 */

import { readFileSync, unlinkSync, existsSync, statSync } from "fs";

interface TelemetryData {
  toolCalls: Record<string, Array<{ arguments: unknown; timestamp: string }>>;
}

interface ToolCall {
  arguments: unknown;
  timestamp: Date;
}

export class StdioTelemetryReader {
  private telemetryFile: string;
  private cachedData: Record<string, ToolCall[]> | null = null;
  private lastModified: number = 0;

  constructor(telemetryFile: string) {
    this.telemetryFile = telemetryFile;
  }

  private loadData(): Record<string, ToolCall[]> {
    try {
      // Check if file exists
      if (!existsSync(this.telemetryFile)) {
        this.cachedData = {};
        this.lastModified = 0;
        return {};
      }

      // Get file modification time
      const stats = statSync(this.telemetryFile);
      const currentModified = stats.mtimeMs;

      // Return cached data if file hasn't been modified
      if (this.cachedData !== null && currentModified === this.lastModified) {
        return this.cachedData;
      }

      // Read and parse the file
      const fileContent = readFileSync(this.telemetryFile, "utf8");
      const telemetryData: TelemetryData = JSON.parse(fileContent);

      // Validate structure
      if (
        !telemetryData ||
        typeof telemetryData !== "object" ||
        !telemetryData.toolCalls ||
        typeof telemetryData.toolCalls !== "object"
      ) {
        console.warn(`Invalid telemetry file structure: ${this.telemetryFile}`);
        this.cachedData = {};
        this.lastModified = currentModified;
        return {};
      }

      // Convert timestamp strings to Date objects
      const convertedData: Record<string, ToolCall[]> = {};
      for (const [toolName, calls] of Object.entries(telemetryData.toolCalls)) {
        if (Array.isArray(calls)) {
          convertedData[toolName] = calls.map((call) => ({
            arguments: call.arguments,
            timestamp: new Date(call.timestamp),
          }));
        } else {
          console.warn(`Invalid tool calls format for tool: ${toolName}`);
          convertedData[toolName] = [];
        }
      }

      // Cache the result
      this.cachedData = convertedData;
      this.lastModified = currentModified;

      return convertedData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.warn(`Malformed JSON in telemetry file: ${this.telemetryFile}`);
        this.cachedData = {};
        return {};
      }

      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new Error(
          `Permission denied accessing telemetry file: ${this.telemetryFile}`,
        );
      }

      console.warn(
        `Error reading telemetry file: ${this.telemetryFile}`,
        error,
      );
      this.cachedData = {};
      return {};
    }
  }

  wasToolCalled(toolName: string): boolean {
    const data = this.loadData();
    const toolCalls = data[toolName];
    return toolCalls ? toolCalls.length > 0 : false;
  }

  getToolCallCount(toolName: string): number {
    const data = this.loadData();
    const toolCalls = data[toolName];
    return toolCalls ? toolCalls.length : 0;
  }

  getToolCallsFor(toolName: string): ToolCall[] {
    const data = this.loadData();
    return data[toolName] || [];
  }

  clearToolCallHistory(): void {
    try {
      if (existsSync(this.telemetryFile)) {
        unlinkSync(this.telemetryFile);
      }
      // Clear cache
      this.cachedData = null;
      this.lastModified = 0;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new Error(
          `Permission denied deleting telemetry file: ${this.telemetryFile}`,
        );
      }
      console.warn(
        `Error deleting telemetry file: ${this.telemetryFile}`,
        error,
      );
    }
  }

  getToolCalls(): Record<string, ToolCall[]> {
    return this.loadData();
  }
}
