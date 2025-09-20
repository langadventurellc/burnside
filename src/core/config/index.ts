/**
 * Configuration Interfaces Module
 *
 * This module contains configuration interfaces for the LLM Bridge library,
 * including BridgeConfig and provider configuration types, along with
 * Zod schemas for runtime validation.
 */

export type { BridgeConfig } from "./bridgeConfig";
export type { ProviderConfig } from "./providerConfig";
export type { ModelConfig } from "./modelConfig";
export type { ToolsConfig } from "./toolsConfig";
export type { McpServerConfig } from "./mcpServerConfig";
export type { McpServerConfigs } from "./mcpServerConfigs";
export {
  BridgeConfigSchema,
  type ValidatedBridgeConfig,
} from "./bridgeConfigSchema";
export { McpServerSchema } from "./mcpServerSchema";
export { McpServersArraySchema } from "./mcpServersArraySchema";
export { validateMcpServerConfig } from "./validateMcpServerConfig";
export { validateMcpServerConfigs } from "./validateMcpServerConfigs";
export { loggingConfigHelpers } from "./loggingConfigHelpers";
