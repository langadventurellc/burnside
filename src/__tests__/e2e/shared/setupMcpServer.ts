/**
 * Setup mock MCP server with lifecycle management
 *
 * Starts a MockMcpServer and returns the server instance, configuration,
 * and cleanup function. Handles dynamic port allocation and proper resource
 * management following existing E2E test patterns.
 *
 * @returns Promise resolving to server setup details
 *
 * @example
 * ```typescript
 * const { server, config, cleanup } = await setupMcpServer();
 * try {
 *   // Use server and config for testing
 *   const client = createMcpTestClient(config);
 *   // ... perform tests
 * } finally {
 *   await cleanup();
 * }
 * ```
 */

import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import { MockMcpServer } from "./mockMcpServer";
import { createMcpTestConfig } from "./createMcpTestConfig";

export async function setupMcpServer(): Promise<{
  server: MockMcpServer;
  config: BridgeConfig;
  cleanup: () => Promise<void>;
}> {
  const server = new MockMcpServer();

  try {
    const { url } = await server.start();
    const config = createMcpTestConfig(url);

    const cleanup = async (): Promise<void> => {
      try {
        await server.stop();
      } catch (error) {
        // Log but don't throw - cleanup should be resilient
        console.warn("Warning: Error during MCP server cleanup:", error);
      }
    };

    return { server, config, cleanup };
  } catch (error) {
    // Ensure server is stopped if setup fails
    try {
      await server.stop();
    } catch {
      // Ignore cleanup errors during setup failure
    }
    throw error;
  }
}
