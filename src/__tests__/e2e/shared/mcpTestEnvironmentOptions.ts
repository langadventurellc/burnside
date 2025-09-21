/**
 * MCP Test Environment Options Interface
 *
 * Configuration options for creating MCP test environments.
 */

import type { MockMcpServerOptions } from "./mockMcpServerOptions";

/**
 * Options for creating MCP test environment
 */
export interface McpTestEnvironmentOptions {
  /** Custom server options */
  serverOptions?: MockMcpServerOptions;
  /** Enable logging for debugging */
  enableLogging?: boolean;
  /** Timeout for connection establishment */
  connectionTimeout?: number;
}
