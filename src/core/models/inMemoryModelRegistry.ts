import { z } from "zod";
import type { ModelInfo } from "../providers/modelInfo";
import type { ModelCapabilities } from "../providers/modelCapabilities";
import type { ModelRegistry } from "./modelRegistry";
import { validateOrThrow } from "../validation/validateOrThrow";
import { ValidationError } from "../errors/validationError";

/**
 * Zod schema for validating ModelInfo during registration
 */
const modelInfoSchema = z.object({
  id: z.string().min(1, "Model ID is required"),
  name: z.string().min(1, "Model name is required"),
  provider: z.string().min(1, "Provider is required"),
  capabilities: z.object({
    streaming: z.boolean(),
    toolCalls: z.boolean(),
    images: z.boolean(),
    documents: z.boolean(),
    maxTokens: z.number().positive().optional(),
    supportedContentTypes: z.array(z.string()),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  version: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * In-memory implementation of ModelRegistry
 *
 * Provides a Map-based storage implementation suitable for runtime model
 * management. Models are stored by their ID and can be queried efficiently
 * by capability or provider.
 *
 * @example
 * ```typescript
 * const registry = new InMemoryModelRegistry();
 *
 * // Register models
 * registry.register("openai:gpt-4", modelInfo);
 * registry.register("anthropic:claude-3", claudeInfo);
 *
 * // Query by capability
 * const toolModels = registry.getByCapability("toolCalls");
 * const streamingModels = registry.getByCapability("streaming");
 *
 * // Filter by provider
 * const openaiModels = registry.list("openai");
 * ```
 */
export class InMemoryModelRegistry implements ModelRegistry {
  private models = new Map<string, ModelInfo>();

  /**
   * Validates model information using Zod schema
   *
   * @private
   * @param modelId - The model ID for error context
   * @param info - The model info to validate
   * @throws ValidationError if validation fails
   */
  private validateModelInfo(modelId: string, info: ModelInfo): void {
    try {
      validateOrThrow(modelInfoSchema, info, {
        errorPrefix: `Invalid model information for ${modelId}`,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ValidationError(
        `Model validation failed for ${modelId}: ${errorMessage}`,
        {
          modelId,
          originalError: error,
        },
      );
    }
  }

  register(modelId: string, info: ModelInfo): void {
    if (!modelId || typeof modelId !== "string") {
      throw new ValidationError("Model ID must be a non-empty string", {
        modelId,
      });
    }

    // Validate model information
    this.validateModelInfo(modelId, info);

    // Ensure the model info ID matches the provided ID
    const updatedInfo: ModelInfo = { ...info, id: modelId };

    this.models.set(modelId, updatedInfo);
  }

  get(modelId: string): ModelInfo | undefined {
    return this.models.get(modelId);
  }

  list(providerId?: string): ModelInfo[] {
    const allModels = Array.from(this.models.values());

    if (!providerId) {
      return allModels;
    }

    return allModels.filter((model) => model.provider === providerId);
  }

  has(modelId: string): boolean {
    return this.models.has(modelId);
  }

  getByCapability(capability: keyof ModelCapabilities): ModelInfo[] {
    return Array.from(this.models.values()).filter((model) => {
      const capabilityValue = model.capabilities[capability];
      // For boolean capabilities, filter by true values
      // For optional properties like maxTokens, check if they exist
      if (typeof capabilityValue === "boolean") {
        return capabilityValue === true;
      }
      return capabilityValue !== undefined && capabilityValue !== null;
    });
  }

  unregister(modelId: string): boolean {
    return this.models.delete(modelId);
  }
}
