/**
 * Factory Function for STDIO Telemetry Reader
 *
 * Creates StdioTelemetryReader instances with cross-platform file path
 * generation for E2E testing using the default system temp directory.
 */

import { tmpdir } from "os";
import { join } from "path";
import { StdioTelemetryReader } from "./stdioTelemetryReader";

/**
 * Creates a StdioTelemetryReader for the default system temp directory.
 *
 * Uses the OS temp directory with cross-platform path generation to read
 * telemetry files created by STDIO MCP servers.
 *
 * @param processId - Process ID of the STDIO MCP server
 * @returns StdioTelemetryReader instance
 *
 * @example
 * ```typescript
 * const reader = createStdioTelemetryReader(12345);
 * expect(reader.wasToolCalled("echo_tool")).toBe(true);
 * ```
 */
export function createStdioTelemetryReader(
  processId: number,
): StdioTelemetryReader {
  const telemetryFile = join(tmpdir(), `stdio-mcp-telemetry-${processId}.json`);
  return new StdioTelemetryReader(telemetryFile);
}
