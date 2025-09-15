/**
 * OpenAI Responses v1 Provider Module
 *
 * Main export module for the OpenAI Responses v1 provider plugin.
 * Provides the complete provider implementation and related types
 * for integration with the LLM Bridge library.
 */

export { OpenAIResponsesV1Provider } from "./openAIResponsesV1Provider.js";
export type { OpenAIResponsesV1Config } from "./configSchema.js";

// Default export for easy registration
export { OpenAIResponsesV1Provider as default } from "./openAIResponsesV1Provider.js";
