/**
 * MCP Test Environment Interface
 *
 * Type definition for MCP test environment containing server and client.
 */

import type { MockMcpServer } from "./mockMcpServer";
import { McpClient } from "../../../tools/mcp/mcpClient";

/**
 * MCP test environment containing server and client
 */
export interface McpTestEnvironment {
  server: MockMcpServer;
  client: McpClient;
  serverUrl: string;
  serverPort: number;
}
