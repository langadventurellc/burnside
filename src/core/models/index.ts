/**
 * Models Module Exports
 *
 * This module provides model management functionality including type-safe
 * model identifiers, registry interfaces, and implementation for managing
 * LLM model capabilities and metadata throughout the library.
 *
 * The ModelRegistry provides a unified interface for registering, querying,
 * and managing models with their capabilities, supporting provider-specific
 * configurations and capability-based queries for intelligent model selection.
 *
 * @example
 * ```typescript
 * import { InMemoryModelRegistry, createModelId } from "./models/index";
 *
 * const registry = new InMemoryModelRegistry();
 * const modelId = createModelId("openai", "gpt-4");
 *
 * registry.register(modelId, {
 *   id: modelId,
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

// Type exports
export type { ModelId } from "./modelId";
export type { ModelQuery } from "./modelQuery";

// Interface exports
export type { ModelRegistry } from "./modelRegistry";

// Implementation exports
export { InMemoryModelRegistry } from "./inMemoryModelRegistry";

// Utility function exports
export { createModelId } from "./createModelId";
export { parseModelId } from "./parseModelId";
export { mapJsonToModelInfo } from "./modelLoader";
export { DefaultLlmModelsSchema } from "./defaultLlmModelsSchema";
