import { z } from "zod";

/**
 * Zod schema for individual MCP server configuration
 *
 * Provides runtime validation for MCP server definitions supporting both
 * HTTP and STDIO transport types. Maintains backward compatibility for
 * configurations without explicit transport field.
 */
export const McpServerSchema = z.union([
  // Legacy HTTP configuration (backward compatibility)
  z.object({
    name: z.string().min(1, "MCP server name cannot be empty"),
    url: z
      .string()
      .url("MCP server URL must be valid")
      .refine(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
        "MCP server URL must use HTTP or HTTPS protocol",
      ),
  }),
  // Explicit HTTP transport configuration
  z.object({
    transport: z.literal("http"),
    name: z.string().min(1, "MCP server name cannot be empty"),
    url: z
      .string()
      .url("MCP server URL must be valid")
      .refine(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
        "MCP server URL must use HTTP or HTTPS protocol",
      ),
  }),
  // STDIO transport configuration
  z.object({
    transport: z.literal("stdio"),
    name: z.string().min(1, "MCP server name cannot be empty"),
    command: z.string().min(1, "MCP server command cannot be empty"),
    args: z.array(z.string()).optional(),
  }),
]);
