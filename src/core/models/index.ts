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
 * import { InMemoryModelRegistry, createModelId } from "./models/index.js";
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
export type { ModelId } from "./modelId.js";
export type { ModelQuery } from "./modelQuery.js";

// Interface exports
export type { ModelRegistry } from "./modelRegistry.js";

// Implementation exports
export { InMemoryModelRegistry } from "./inMemoryModelRegistry.js";

// Utility function exports
export { createModelId } from "./createModelId.js";
export { parseModelId } from "./parseModelId.js";
