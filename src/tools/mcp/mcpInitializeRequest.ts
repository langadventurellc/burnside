/**
 * MCP Initialize Request Interface
 *
 * TypeScript interface for the complete MCP initialize request structure
 * sent to servers during capability negotiation.
 */

import type { McpClientCapabilities } from "./mcpClientCapabilities";

/**
 * Complete MCP initialize request structure
 */
export interface McpInitializeRequest {
  /**
   * JSON-RPC method name
   */
  method: "initialize";

  /**
   * Request parameters
   */
  params: {
    /**
     * Protocol version being used
     */
    protocolVersion: string;

    /**
     * Client capabilities declaration
     */
    capabilities: McpClientCapabilities;

    /**
     * Client information
     */
    clientInfo: {
      /** Client name */
      name: string;
      /** Client version */
      version: string;
    };
  };
}
