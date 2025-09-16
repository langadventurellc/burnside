import type { z } from "zod";
import type { BridgeConfigSchema } from "./bridgeConfigSchema.js";

/**
 * Type for tool system configuration
 *
 * Inferred from the tools section of the BridgeConfig schema to ensure
 * type safety for tool system configuration options.
 *
 * @example
 * ```typescript
 * const toolsConfig: ToolsConfig = {
 *   enabled: true,
 *   builtinTools: ["echo"],
 *   executionTimeoutMs: 5000,
 *   maxConcurrentTools: 1
 * };
 * ```
 */
export type ToolsConfig = z.infer<typeof BridgeConfigSchema>["tools"];
