import { z } from "zod";

/**
 * Zod schema for individual MCP server configuration
 *
 * Provides runtime validation for MCP server definitions including
 * remote-only URL constraints and proper naming validation.
 */
export const McpServerSchema = z.object({
  name: z.string().min(1, "MCP server name cannot be empty"),
  url: z
    .string()
    .url("MCP server URL must be valid")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "MCP server URL must use HTTP or HTTPS protocol",
    ),
});
