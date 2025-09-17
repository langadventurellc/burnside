/**
 * Anthropic Messages API v2023-06-01 Provider Module
 *
 * Main export module for the Anthropic Messages API provider plugin.
 * Provides the complete provider implementation and related types
 * for integration with the LLM Bridge library.
 */

export { AnthropicMessagesV1Provider } from "./anthropicMessagesV1Provider";
export { parseAnthropicResponse } from "./responseParser";
export { translateToolDefinitions } from "./toolTranslator";
export { parseAnthropicToolCalls } from "./toolCallParser";
export { formatToolResultMessage } from "./toolResultFormatter";
export type { AnthropicMessagesConfigType as AnthropicMessagesConfig } from "./configSchema";

// Export schemas for advanced usage
export { AnthropicMessagesConfigSchema } from "./configSchema";
export type { AnthropicMessagesConfigType } from "./configSchema";

export { AnthropicMessagesRequestSchema } from "./requestSchema";
export type { AnthropicMessagesRequestType } from "./requestSchema";

export {
  AnthropicMessagesResponseSchema,
  AnthropicStreamingResponseSchema,
  AnthropicErrorResponseSchema,
} from "./responseSchema";
export type { AnthropicMessagesResponseType } from "./responseSchema";

// Default export for easy registration
export { AnthropicMessagesV1Provider as default } from "./anthropicMessagesV1Provider";

/**
 * Provider plugin metadata for identification
 */
export const ANTHROPIC_PROVIDER_INFO = {
  id: "anthropic",
  version: "2023-06-01",
  name: "Anthropic Messages Provider",
} as const;
