/**
 * MCP Client Capabilities Interface
 *
 * TypeScript interface for client capabilities structure used in MCP
 * initialize requests. Declares tools-only support with explicit
 * rejection of prompts and resources.
 */

/**
 * Client capabilities structure for MCP initialize request
 */
export interface McpClientCapabilities {
  /**
   * Tools capability declaration
   */
  tools?: {
    /** Whether the client supports tool execution */
    supported: boolean;
  };

  /**
   * Prompts capability declaration (explicitly not supported)
   */
  prompts?: {
    /** Always false - prompts not supported by this client */
    supported: false;
  };

  /**
   * Resources capability declaration (explicitly not supported)
   */
  resources?: {
    /** Always false - resources not supported by this client */
    supported: false;
  };
}
