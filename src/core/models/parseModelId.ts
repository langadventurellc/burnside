import type { ModelId } from "./modelId";

/**
 * Parses a ModelId into its provider and model components
 *
 * @param modelId - The ModelId to parse
 * @returns Object with provider and model properties
 *
 * @example
 * ```typescript
 * const { provider, model } = parseModelId("openai:gpt-4" as ModelId);
 * // provider: "openai", model: "gpt-4"
 * ```
 */
export function parseModelId(modelId: ModelId): {
  provider: string;
  model: string;
} {
  const parts = modelId.split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid model ID format: ${modelId}`);
  }

  return {
    provider: parts[0],
    model: parts[1],
  };
}
