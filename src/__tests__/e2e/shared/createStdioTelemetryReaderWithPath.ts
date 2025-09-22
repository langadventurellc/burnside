/**
 * Factory Function for STDIO Telemetry Reader with Custom Path
 *
 * Creates StdioTelemetryReader instances with custom base directory
 * for E2E testing scenarios requiring specific file locations.
 */

import { join } from "path";
import { StdioTelemetryReader } from "./stdioTelemetryReader";

/**
 * Creates a StdioTelemetryReader for a custom base directory.
 *
 * Allows specifying a custom directory path for telemetry files, useful
 * for testing scenarios with different file locations.
 *
 * @param baseDir - Base directory where telemetry files are stored
 * @param processId - Process ID of the STDIO MCP server
 * @returns StdioTelemetryReader instance
 *
 * @example
 * ```typescript
 * const reader = createStdioTelemetryReaderWithPath("/tmp/test", 12345);
 * expect(reader.getToolCallCount("echo_tool")).toBeGreaterThan(0);
 * ```
 */
export function createStdioTelemetryReaderWithPath(
  baseDir: string,
  processId: number,
): StdioTelemetryReader {
  const telemetryFile = join(baseDir, `stdio-mcp-telemetry-${processId}.json`);
  return new StdioTelemetryReader(telemetryFile);
}
