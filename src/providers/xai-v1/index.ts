/**
 * xAI v1 Provider Module
 *
 * Main export module for the xAI v1 provider plugin.
 * Provides the complete provider implementation and related types
 * for integration with the LLM Bridge library.
 */

export { XAIV1Provider, XAI_PROVIDER_INFO } from "./xaiV1Provider";
export type { XAIV1Config } from "./configSchema";

// Default export for easy registration
export { XAIV1Provider as default } from "./xaiV1Provider";
