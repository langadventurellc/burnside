import type { ModelInfo } from "../providers/modelInfo";
import type { ModelCapabilities } from "../providers/modelCapabilities";

/**
 * ModelRegistry interface for managing model capability and configuration metadata
 *
 * Provides a unified interface for registering, querying, and managing LLM models
 * with their capabilities and metadata. Supports provider-specific configurations
 * and capability-based queries for intelligent model selection.
 *
 * @example
 * ```typescript
 * const registry = new InMemoryModelRegistry();
 *
 * registry.register("openai:gpt-4", {
 *   id: "openai:gpt-4",
 *   name: "GPT-4",
 *   provider: "openai",
 *   capabilities: {
 *     streaming: true,
 *     toolCalls: true,
 *     images: true,
 *     documents: false,
 *     supportedContentTypes: ["text", "image"]
 *   }
 * });
 *
 * const streamingModels = registry.getByCapability("streaming");
 * ```
 */
export interface ModelRegistry {
  /**
   * Register a model with its capabilities and metadata
   *
   * @param modelId - Unique model identifier (provider:model format)
   * @param info - Model information including capabilities
   * @throws ValidationError if model information is invalid
   */
  register(modelId: string, info: ModelInfo): void;

  /**
   * Get model information by ID
   *
   * @param modelId - The model ID to retrieve
   * @returns Model information or undefined if not found
   */
  get(modelId: string): ModelInfo | undefined;

  /**
   * List all registered models, optionally filtered by provider
   *
   * @param providerId - Optional provider ID to filter by
   * @returns Array of registered models
   */
  list(providerId?: string): ModelInfo[];

  /**
   * Check if a model is registered
   *
   * @param modelId - The model ID to check
   * @returns True if model is registered, false otherwise
   */
  has(modelId: string): boolean;

  /**
   * Get models that have a specific capability
   *
   * @param capability - The capability to filter by
   * @returns Array of models with the specified capability
   */
  getByCapability(capability: keyof ModelCapabilities): ModelInfo[];

  /**
   * Remove a model registration
   *
   * @param modelId - The model ID to unregister
   * @returns True if model was removed, false if it didn't exist
   */
  unregister(modelId: string): boolean;
}
