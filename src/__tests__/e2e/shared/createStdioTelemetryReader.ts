/**
 * Factory Function for STDIO Telemetry Reader
 *
 * Creates StdioTelemetryReader instances with cross-platform file path
 * generation for E2E testing using the default system temp directory.
 */

import { join, resolve } from "path";
import { StdioTelemetryReader } from "./stdioTelemetryReader";

/**
 * Creates a StdioTelemetryReader for the project temp directory.
 *
 * Uses the project-relative temp directory with cross-platform path generation
 * to read telemetry files created by STDIO MCP servers.
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
  // Project-relative temp directory - match the exact same logic as the server
  // From current file: src/__tests__/e2e/shared/createStdioTelemetryReader.ts
  // To project root: ../../../.. (up 4 levels)
  const projectRoot = resolve(__dirname, "../../../..");
  const tempDir = join(projectRoot, "temp");

  const telemetryFile = join(tempDir, `stdio-mcp-telemetry-${processId}.json`);
  return new StdioTelemetryReader(telemetryFile);
}
