/**
 * MCP Server Capabilities Interface
 *
 * TypeScript interface for server capabilities structure from MCP
 * initialize responses. Includes tools, prompts, and resources
 * capabilities that will be validated for tools-only compliance.
 */

/**
 * Server capabilities structure from MCP initialize response
 */
export interface McpServerCapabilities {
  /**
   * Tools capability from server
   */
  tools?: {
    /** Whether the server supports tools */
    supported: boolean;
  };

  /**
   * Prompts capability from server (will be rejected)
   */
  prompts?: {
    /** Whether the server supports prompts */
    supported: boolean;
  };

  /**
   * Resources capability from server (will be rejected)
   */
  resources?: {
    /** Whether the server supports resources */
    supported: boolean;
  };

  /**
   * Additional capabilities that may be present
   */
  [key: string]: unknown;
}
