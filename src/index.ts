/**
 * LLM Bridge Library - Main Public API
 *
 * A unified TypeScript library that acts as a bridge to multiple LLM provider APIs
 * for use across Desktop (Electron), Mobile (React Native), and Web (Node) platforms.
 *
 * The library provides an extensible architecture for integrating various LLM providers
 * and tools while maintaining a consistent interface across all platforms with comprehensive
 * Zod validation for runtime type safety.
 *
 * ## Primary Usage
 *
 * The main entry point is the `createClient` function which creates a configured
 * BridgeClient instance ready for chat and streaming operations:
 *
 * @example Basic client creation and usage
 * ```typescript
 * import { createClient, BridgeConfig } from "@llm-bridge/library";
 *
 * // Create client with provider configuration
 * const client = createClient({
 *   defaultProvider: "openai",
 *   providers: {
 *     openai: { apiKey: process.env.OPENAI_API_KEY }
 *   },
 *   defaultModel: "gpt-4",
 *   timeout: 30000
 * });
 *
 * // Phase 2+ functionality (currently no-op in Phase 1)
 * const response = await client.chat({
 *   messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
 *   model: "gpt-4"
 * });
 * ```
 *
 * ## Advanced Usage with Registries
 *
 * For advanced scenarios, you can work directly with provider and model registries
 * to dynamically manage available providers and models:
 *
 * @example Registry-based model management
 * ```typescript
 * import {
 *   createClient,
 *   InMemoryModelRegistry,
 *   createModelId
 * } from "@llm-bridge/library";
 *
 * // Create and configure model registry
 * const modelRegistry = new InMemoryModelRegistry();
 * const modelId = createModelId("openai", "gpt-4");
 *
 * modelRegistry.register(modelId, {
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
 * // Use registry in client configuration
 * const client = createClient({
 *   defaultProvider: "openai",
 *   providers: { openai: { apiKey: process.env.OPENAI_API_KEY } },
 *   registryOptions: {
 *     models: { registry: modelRegistry }
 *   }
 * });
 * ```
 *
 * ## Runtime Validation
 *
 * All public interfaces include Zod schemas for runtime validation:
 *
 * @example Message validation
 * ```typescript
 * import { MessageSchema, validateMessage } from "@llm-bridge/library";
 *
 * const message = {
 *   role: "user" as const,
 *   content: [{ type: "text" as const, text: "Hello!" }]
 * };
 *
 * // Validate message structure
 * const validatedMessage = validateMessage(message);
 *
 * // Or use schema directly
 * const result = MessageSchema.safeParse(message);
 * if (result.success) {
 *   console.log("Valid message:", result.data);
 * }
 * ```
 */

// ============================================================================
// PRIMARY API - Main Entry Points
// ============================================================================

/**
 * Primary client factory function for creating configured BridgeClient instances.
 *
 * This is the recommended entry point for most applications. The function validates
 * the provided configuration, applies defaults, and returns a fully configured client
 * ready for chat and streaming operations.
 */
export { createClient } from "./createClient";

/**
 * Main client class for chat and streaming operations.
 *
 * While `createClient` is the recommended factory function, BridgeClient can be
 * instantiated directly for advanced scenarios requiring custom initialization.
 */
export { BridgeClient } from "./client";

// ============================================================================
// CORE TYPES AND SCHEMAS - Runtime Validation
// ============================================================================

/**
 * Core message and content types with Zod validation schemas.
 * These provide the foundation for all message handling with runtime type safety.
 */
// Message types
export type { Message, ValidatedMessage } from "./core/messages";
export type { ContentPart } from "./core/messages";
export type { Role } from "./core/messages";
export type { SourceRef } from "./core/messages";

// Message validation schemas and utilities
export { MessageSchema, validateMessage } from "./core/messages";
export { ContentPartSchema, validateContentPart } from "./core/messages";

/**
 * Tool definition types and validation schemas.
 * These provide type-safe tool registration and execution contracts.
 */
export type {
  ToolDefinition,
  ToolHandler,
  ToolExecutionContext,
} from "./core/tools";
export { ToolDefinitionSchema } from "./core/tools";

/**
 * Configuration types and validation schemas.
 * These provide runtime validation for all client and provider configurations.
 */
export type { BridgeConfig, ProviderConfig, ModelConfig } from "./core/config";
export { BridgeConfigSchema, type ValidatedBridgeConfig } from "./core/config";

// ============================================================================
// CLIENT API TYPES - Request and Response Interfaces
// ============================================================================

/**
 * Request and response types for chat and streaming operations.
 * These define the public API surface for LLM interactions.
 */
export type { ChatRequest, StreamRequest, StreamDelta } from "./client";
export type { BridgeClientConfig } from "./client";

// ============================================================================
// PROVIDER AND MODEL REGISTRIES - Advanced Usage
// ============================================================================

/**
 * Provider registry interfaces and implementations.
 * These enable dynamic provider plugin registration and management.
 */
export type {
  ProviderRegistry,
  ProviderPlugin,
  ProviderInfo,
  ProviderKey,
  ModelCapabilities,
  ModelInfo,
} from "./core/providers";
export { InMemoryProviderRegistry } from "./core/providers";

/**
 * Model registry interfaces and implementations.
 * These enable dynamic model registration and capability-based querying.
 */
export type { ModelRegistry, ModelId, ModelQuery } from "./core/models";
export {
  InMemoryModelRegistry,
  createModelId,
  parseModelId,
} from "./core/models";

/**
 * Error types and utilities for comprehensive error handling.
 * All library errors extend BridgeError for consistent error handling patterns.
 */
export { BridgeError } from "./core/errors/bridgeError";
