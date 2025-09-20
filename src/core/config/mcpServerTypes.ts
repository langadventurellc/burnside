import type { z } from "zod";
import type { BridgeConfigSchema } from "./bridgeConfigSchema";

/**
 * Type for individual MCP server configuration
 *
 * Extracted from the BridgeConfig schema to provide type safety
 * for MCP server definitions including name and URL validation.
 *
 * @example
 * ```typescript
 * const mcpServer: McpServerConfig = {
 *   name: "weather-service",
 *   url: "https://api.weather.com/mcp"
 * };
 * ```
 */
export type McpServerConfig = NonNullable<
  NonNullable<z.infer<typeof BridgeConfigSchema>["tools"]>["mcpServers"]
>[number];
