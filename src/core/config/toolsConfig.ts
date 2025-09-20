import type { z } from "zod";
import type { BridgeConfigSchema } from "./bridgeConfigSchema";

/**
 * Type for tool system configuration
 *
 * Inferred from the tools section of the BridgeConfig schema to ensure
 * type safety for tool system configuration options including MCP servers.
 *
 * @example
 * ```typescript
 * const toolsConfig: ToolsConfig = {
 *   enabled: true,
 *   builtinTools: ["echo"],
 *   executionTimeoutMs: 5000,
 *   maxConcurrentTools: 1,
 *   mcpServers: [
 *     {
 *       name: "weather-service",
 *       url: "https://api.weather.com/mcp"
 *     },
 *     {
 *       name: "database-tools",
 *       url: "https://internal.company.com/mcp"
 *     }
 *   ]
 * };
 * ```
 */
export type ToolsConfig = z.infer<typeof BridgeConfigSchema>["tools"];
