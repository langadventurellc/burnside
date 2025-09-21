/**
 * Create MCP Test Environment Function
 *
 * Creates a complete MCP test environment with server and connected client.
 */

import { MockMcpServer } from "./mockMcpServer";
import type { McpTestEnvironment } from "./mcpTestEnvironmentInterface";
import type { McpTestEnvironmentOptions } from "./mcpTestEnvironmentOptions";
import { McpClient } from "../../../tools/mcp/mcpClient";
import type { RuntimeAdapter } from "../../../core/runtime/runtimeAdapter";

/**
 * Create a complete MCP test environment with server and connected client
 *
 * Sets up a mock MCP server and creates a connected McpClient for testing.
 * Handles server startup, client connection, and capability negotiation.
 *
 * @param adapter - Runtime adapter for creating MCP connection
 * @param options - Configuration options for test environment
 * @returns Promise resolving to test environment with server and client
 *
 * @example
 * ```typescript
 * const adapter = new NodeRuntimeAdapter();
 * const env = await createMcpTestEnvironment(adapter);
 *
 * // Use env.client for testing
 * const tools = await env.client.listTools();
 * expect(tools).toHaveLength(1);
 *
 * await cleanupMcpTestEnvironment(env);
 * ```
 */
export async function createMcpTestEnvironment(
  adapter: RuntimeAdapter,
  options: McpTestEnvironmentOptions = {},
): Promise<McpTestEnvironment> {
  const {
    serverOptions = {},
    enableLogging = false,
    connectionTimeout = 5000,
  } = options;

  // Create and start mock server
  const server = new MockMcpServer({
    enableLogging,
    ...serverOptions,
  });

  const { port, url } = await server.start();

  try {
    // Create and connect client
    const client = new McpClient(adapter, url, {
      capabilityTimeout: connectionTimeout,
      logLevel: enableLogging ? "debug" : "error",
    });

    await client.connect();

    return {
      server,
      client,
      serverUrl: url,
      serverPort: port,
    };
  } catch (error) {
    // Cleanup server if client connection fails
    await server.stop();
    throw error;
  }
}
