/**
 * MCP server configuration object
 *
 * Supports both HTTP and STDIO transport configurations with mutual exclusivity.
 * Either 'url' for HTTP servers or 'command' for STDIO servers must be provided.
 *
 * @example HTTP server configuration
 * ```typescript
 * const httpServer: McpServerConfig = {
 *   name: "github-api",
 *   url: "https://api.github.com/mcp"
 * };
 * ```
 *
 * @example STDIO server configuration
 * ```typescript
 * const stdioServer: McpServerConfig = {
 *   name: "local-tools",
 *   command: "/usr/local/bin/mcp-tools",
 *   args: ["--config", "dev.json"]
 * };
 * ```
 */
export interface McpServerConfig {
  /** MCP server name identifier */
  name: string;
  /** MCP server URL for HTTP-based servers (optional when using STDIO) */
  url?: string;
  /** MCP server command for STDIO-based servers (optional when using HTTP) */
  command?: string;
  /** MCP server command arguments for STDIO-based servers (optional) */
  args?: string[];
}
