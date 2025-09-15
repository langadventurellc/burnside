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
export {
  BridgeConfigSchema,
  type ValidatedBridgeConfig,
} from "./bridgeConfigSchema";
