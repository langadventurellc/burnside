import { McpServerSchema } from "./mcpServerSchema";
import type { McpServerConfig } from "./mcpServerConfig";

/**
 * Type guard that validates MCP server configuration using the Zod schema
 *
 * Provides proper validation that aligns exactly with schema rules
 * rather than loose type checking.
 *
 * @param obj - Unknown object to validate
 * @returns True if object is a valid MCP server configuration
 *
 * @example
 * ```typescript
 * if (validateMcpServerConfig(userInput)) {
 *   // userInput is now typed as McpServerConfig
 *   console.log(userInput.name, userInput.url);
 * }
 * ```
 */
export function validateMcpServerConfig(obj: unknown): obj is McpServerConfig {
  try {
    McpServerSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}
