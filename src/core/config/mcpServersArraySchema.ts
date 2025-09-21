import { z } from "zod";
import { McpServerSchema } from "./mcpServerSchema";

/**
 * Zod schema for MCP servers array with uniqueness validation
 */
export const McpServersArraySchema = z
  .array(McpServerSchema)
  .optional()
  .refine((servers) => {
    const names = servers?.map((s) => s.name) || [];
    return names.length === new Set(names).size;
  }, "MCP server names must be unique");
