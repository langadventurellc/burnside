import { z } from "zod";
import type { ModelId } from "./modelId.js";

/**
 * Zod schema for validating model ID format (provider:model)
 */
const modelIdSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/,
    "Model ID must be in format 'provider:model'",
  )
  .min(3, "Model ID must be at least 3 characters")
  .max(100, "Model ID must be at most 100 characters");

/**
 * Creates a type-safe ModelId from provider and model name
 *
 * @param provider - The provider name (e.g., "openai", "anthropic")
 * @param model - The model name (e.g., "gpt-4", "claude-3")
 * @returns Validated ModelId
 * @throws ValidationError if the combined ID is invalid
 *
 * @example
 * ```typescript
 * const modelId = createModelId("openai", "gpt-4"); // "openai:gpt-4"
 * const invalidId = createModelId("", "gpt-4"); // throws ValidationError
 * ```
 */
export function createModelId(provider: string, model: string): ModelId {
  if (!provider || !model) {
    throw new Error("Provider and model name are required");
  }

  const modelId = `${provider}:${model}`;
  const result = modelIdSchema.safeParse(modelId);

  if (!result.success) {
    throw new Error(`Invalid model ID format: ${result.error.message}`);
  }

  return modelId as ModelId;
}
