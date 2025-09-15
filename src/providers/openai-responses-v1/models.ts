/**
 * OpenAI Responses v1 Model Definitions
 *
 * Model capabilities and metadata for supported OpenAI models in the
 * Responses v1 provider. Defines which models are supported and their
 * specific capabilities for features like streaming, tool calls, and content types.
 */

import type { ModelCapabilities } from "../../core/providers/modelCapabilities.js";

/**
 * Model capabilities for OpenAI GPT-4o models
 */
const GPT_4O_CAPABILITIES: ModelCapabilities = {
  streaming: true,
  toolCalls: false, // Phase 4 scope - non-tool chat only
  images: true,
  documents: true,
  maxTokens: 128000,
  supportedContentTypes: ["text", "image"],
};

/**
 * Model capabilities for OpenAI GPT-5 models
 */
const GPT_5_CAPABILITIES: ModelCapabilities = {
  streaming: true,
  toolCalls: false, // Phase 4 scope - non-tool chat only
  images: true,
  documents: true,
  maxTokens: 200000,
  supportedContentTypes: ["text", "image"],
};

/**
 * Supported model configurations
 */
const SUPPORTED_MODELS = new Map<string, ModelCapabilities>([
  ["gpt-4o-2024-08-06", GPT_4O_CAPABILITIES],
  ["gpt-5-2025-08-07", GPT_5_CAPABILITIES],
]);

/**
 * Get model capabilities for a specific OpenAI model
 *
 * @param modelId - The model identifier to get capabilities for
 * @returns Model capabilities if supported, undefined otherwise
 *
 * @example
 * ```typescript
 * const capabilities = getModelCapabilities("gpt-4o-2024-08-06");
 * if (capabilities) {
 *   console.log("Streaming supported:", capabilities.streaming);
 * }
 * ```
 */
export function getModelCapabilities(
  modelId: string,
): ModelCapabilities | undefined {
  return SUPPORTED_MODELS.get(modelId);
}
