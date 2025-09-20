import { z } from "zod";
import { BridgeConfigSchema } from "./bridgeConfigSchema";

/**
 * TypeScript type for MCP servers array configuration
 *
 * Extracted from the tools section of BridgeConfigSchema to maintain
 * synchronization with the main configuration schema.
 */
export type McpServerConfigs = NonNullable<
  z.infer<typeof BridgeConfigSchema>["tools"]
>["mcpServers"];
