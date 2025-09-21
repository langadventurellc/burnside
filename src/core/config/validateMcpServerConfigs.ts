import { McpServersArraySchema } from "./mcpServersArraySchema";
import type { McpServerConfig } from "./mcpServerConfig";

/**
 * Type guard that validates MCP servers array using the Zod schema
 *
 * @param arr - Unknown array to validate
 * @returns True if array is a valid MCP servers configuration
 *
 * @example
 * ```typescript
 * if (validateMcpServerConfigs(userConfig.mcpServers)) {
 *   // userConfig.mcpServers is now typed as McpServerConfig[]
 *   userConfig.mcpServers.forEach(server => {
 *     console.log(server.name, server.url);
 *   });
 * }
 * ```
 */
export function validateMcpServerConfigs(
  arr: unknown,
): arr is McpServerConfig[] {
  try {
    McpServersArraySchema.parse(arr);
    return true;
  } catch {
    return false;
  }
}
