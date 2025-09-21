import { z } from "zod";
import { McpServerSchema } from "./mcpServerSchema";

/**
 * TypeScript type for individual MCP server configuration
 *
 * Derived directly from the Zod schema to ensure type-schema synchronization.
 * Represents a single MCP server with name and remote URL.
 *
 * @example
 * ```typescript
 * const server: McpServerConfig = {
 *   name: "github-api",
 *   url: "https://api.github.com/mcp"
 * };
 * ```
 */
export type McpServerConfig = z.infer<typeof McpServerSchema>;
