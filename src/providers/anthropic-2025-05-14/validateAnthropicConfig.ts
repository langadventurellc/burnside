import {
  AnthropicMessagesConfigSchema,
  type AnthropicMessagesConfig,
} from "./configSchema.js";

/**
 * Validates an Anthropic configuration object and returns parsed result
 *
 * @param config - The configuration object to validate
 * @returns Parsed and validated configuration with defaults applied
 * @throws ValidationError if configuration is invalid
 */
export function validateAnthropicConfig(
  config: unknown,
): AnthropicMessagesConfig {
  return AnthropicMessagesConfigSchema.parse(config);
}
