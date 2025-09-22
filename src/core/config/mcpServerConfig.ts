import { z } from "zod";
import { McpServerSchema } from "./mcpServerSchema";

/**
 * TypeScript type for individual MCP server configuration
 *
 * Derived directly from the Zod schema to ensure type-schema synchronization.
 * Supports both HTTP and STDIO transport types for MCP server connections.
 *
 * @example
 * ```typescript
 * // HTTP transport (legacy format - transport field optional)
 * const httpServer: McpServerConfig = {
 *   name: "github-api",
 *   url: "https://api.github.com/mcp"
 * };
 *
 * // STDIO transport
 * const stdioServer: McpServerConfig = {
 *   transport: "stdio",
 *   name: "local-tools",
 *   command: "node",
 *   args: ["./mcp-server.js"]
 * };
 * ```
 */
export type McpServerConfig = z.infer<typeof McpServerSchema>;
