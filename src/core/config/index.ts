/**
 * Configuration Interfaces Module
 *
 * This module contains configuration interfaces for the LLM Bridge library,
 * including BridgeConfig and provider configuration types.
 *
 * Future phases will include Zod schemas for type-safe configuration
 * validation and provider-specific configuration interfaces.
 */

export type { BridgeConfig } from "./bridgeConfig";
export type { ProviderConfig } from "./providerConfig";
export type { ModelConfig } from "./modelConfig";
