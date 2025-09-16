/**
 * Anthropic Messages API v2023-06-01 Provider Module
 *
 * Main export module for the Anthropic Messages API provider plugin.
 * Provides the complete provider implementation and related types
 * for integration with the LLM Bridge library.
 */

export { AnthropicMessagesV1Provider } from "./anthropicMessagesV1Provider.js";
export type { AnthropicMessagesConfigType as AnthropicMessagesConfig } from "./configSchema.js";

// Export schemas for advanced usage
export { AnthropicMessagesConfigSchema } from "./configSchema.js";
export type { AnthropicMessagesConfigType } from "./configSchema.js";

export { AnthropicMessagesRequestSchema } from "./requestSchema.js";
export type { AnthropicMessagesRequestType } from "./requestSchema.js";

export {
  AnthropicMessagesResponseSchema,
  AnthropicStreamingResponseSchema,
  AnthropicErrorResponseSchema,
} from "./responseSchema.js";
export type { AnthropicMessagesResponseType } from "./responseSchema.js";

// Default export for easy registration
export { AnthropicMessagesV1Provider as default } from "./anthropicMessagesV1Provider.js";

/**
 * Provider plugin metadata for identification
 */
export const ANTHROPIC_PROVIDER_INFO = {
  id: "anthropic",
  version: "2023-06-01",
  name: "Anthropic Messages Provider",
} as const;
