/**
 * Setup mock MCP server with lifecycle management
 *
 * Starts a MockMcpServer (HTTP) or StdioMcpServerManager (STDIO) and returns
 * the server instance, configuration, and cleanup function. Supports both
 * transport types while maintaining backward compatibility.
 *
 * @param options - Optional configuration including transport type
 * @returns Promise resolving to server setup details
 *
 * @example
 * ```typescript
 * // HTTP transport (default, backward compatible)
 * const { server, config, cleanup } = await setupMcpServer();
 *
 * // STDIO transport
 * const { server, config, cleanup } = await setupMcpServer({ transport: 'stdio' });
 *
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
import { StdioMcpServerManager } from "./stdioMcpServerManager";
import { createMcpTestConfig } from "./createMcpTestConfig";

// Function overloads for backward compatibility
export async function setupMcpServer(): Promise<{
  server: MockMcpServer;
  config: BridgeConfig;
  cleanup: () => Promise<void>;
}>;

export async function setupMcpServer(options: { transport: "http" }): Promise<{
  server: MockMcpServer;
  config: BridgeConfig;
  cleanup: () => Promise<void>;
}>;

export async function setupMcpServer(options: { transport: "stdio" }): Promise<{
  server: StdioMcpServerManager;
  config: BridgeConfig;
  cleanup: () => Promise<void>;
}>;

export async function setupMcpServer(
  options: {
    transport?: "http" | "stdio";
  } = {},
): Promise<{
  server: MockMcpServer | StdioMcpServerManager;
  config: BridgeConfig;
  cleanup: () => Promise<void>;
}> {
  const transport = options.transport ?? "http";

  if (transport === "stdio") {
    // STDIO transport
    const stdioServer = new StdioMcpServerManager();

    try {
      await stdioServer.start();
      const commandConfig = stdioServer.getCommandConfig();
      const config = createMcpTestConfig(commandConfig);

      const cleanup = async (): Promise<void> => {
        try {
          await stdioServer.stop();
        } catch (error) {
          // Log but don't throw - cleanup should be resilient
          console.warn("Warning: Error during MCP server cleanup:", error);
        }
      };

      return { server: stdioServer, config, cleanup };
    } catch (error) {
      // Ensure server is stopped if setup fails
      try {
        await stdioServer.stop();
      } catch {
        // Ignore cleanup errors during setup failure
      }
      throw error;
    }
  } else {
    // HTTP transport (default)
    const httpServer = new MockMcpServer();

    try {
      const { url } = await httpServer.start();
      const config = createMcpTestConfig(url);

      const cleanup = async (): Promise<void> => {
        try {
          await httpServer.stop();
        } catch (error) {
          // Log but don't throw - cleanup should be resilient
          console.warn("Warning: Error during MCP server cleanup:", error);
        }
      };

      return { server: httpServer, config, cleanup };
    } catch (error) {
      // Ensure server is stopped if setup fails
      try {
        await httpServer.stop();
      } catch {
        // Ignore cleanup errors during setup failure
      }
      throw error;
    }
  }
}
