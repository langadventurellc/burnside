/**
 * MCP Initialize Response Interface
 *
 * TypeScript interface for the complete MCP initialize response structure
 * received from servers during capability negotiation.
 */

import type { McpServerCapabilities } from "./mcpServerCapabilities";

/**
 * Complete MCP initialize response structure
 */
export interface McpInitializeResponse {
  /**
   * Server capabilities declaration
   */
  capabilities: McpServerCapabilities;

  /**
   * Server information
   */
  serverInfo: {
    /** Server name */
    name: string;
    /** Server version */
    version: string;
  };

  /**
   * Protocol version supported by server
   */
  protocolVersion: string;
}
