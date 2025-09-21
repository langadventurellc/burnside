/**
 * Cleanup MCP Test Environment Function
 *
 * Safely cleans up MCP test environments.
 */

import type { McpTestEnvironment } from "./mcpTestEnvironmentInterface";

/**
 * Clean up MCP test environment
 *
 * @param env - Test environment to clean up
 * @returns Promise resolving when cleanup is complete
 */
export async function cleanupMcpTestEnvironment(
  env: McpTestEnvironment,
): Promise<void> {
  try {
    if (env.client?.isConnected) {
      await env.client.disconnect();
    }
  } catch (error) {
    // Log but don't throw - cleanup should be best effort
    console.warn(
      "Warning: Error disconnecting MCP client during cleanup:",
      error,
    );
  }

  try {
    if (env.server) {
      await env.server.stop();
    }
  } catch (error) {
    // Log but don't throw - cleanup should be best effort
    console.warn("Warning: Error stopping MCP server during cleanup:", error);
  }
}
