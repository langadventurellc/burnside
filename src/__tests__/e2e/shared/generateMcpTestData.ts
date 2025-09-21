/**
 * Generate MCP Test Data Function
 *
 * Generates consistent test data for MCP testing scenarios.
 */

import type { McpTestData } from "./mcpTestData";

/**
 * Generate consistent test data for MCP testing
 *
 * @param suffix - Optional suffix for unique test data
 * @returns Test data object with predictable values
 */
export function generateMcpTestData(suffix = ""): McpTestData {
  const message = `test message${suffix ? ` ${String(suffix)}` : ""}`;

  return {
    message,
    expectedEcho: message,
    timestampPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  };
}
