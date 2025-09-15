import type { BridgeConfig } from "../core/config/bridgeConfig";
import type { Message } from "../core/messages/message";
import { BridgeError } from "../core/errors/bridgeError";
import type { ChatRequest } from "./chatRequest";
import type { StreamRequest } from "./streamRequest";
import type { BridgeClientConfig } from "./bridgeClientConfig";
import type { FeatureFlags } from "./featureFlagsInterface";
import { initializeFeatureFlags } from "./initializeFeatureFlags";
import { isFeatureEnabled } from "./isFeatureEnabled";
import type { ProviderRegistry } from "../core/providers/providerRegistry";
import type { ModelRegistry } from "../core/models/modelRegistry";
import type { ModelCapabilities } from "../core/providers/modelCapabilities";
import { InMemoryProviderRegistry } from "../core/providers/inMemoryProviderRegistry";
import { InMemoryModelRegistry } from "../core/models/inMemoryModelRegistry";

/**
 * Bridge Client Class
 *
 * Primary public API class for the LLM Bridge Library.
 * Provides chat and streaming functionality with feature flag controls
 * for progressive enablement during development phases.
 *
 * @example
 * ```typescript
 * const config: BridgeConfig = {
 *   defaultProvider: "openai",
 *   providers: {
 *     openai: { apiKey: "sk-..." }
 *   },
 *   defaultModel: "gpt-4"
 * };
 *
 * const client = new BridgeClient(config);
 *
 * // Chat completion (Phase 2+)
 * const response = await client.chat({
 *   messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
 *   model: "gpt-4"
 * });
 *
 * // Streaming chat (Phase 2+)
 * for await (const delta of client.stream({
 *   messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
 *   model: "gpt-4"
 * })) {
 *   console.log(delta.delta);
 * }
 * ```
 */
export class BridgeClient {
  private readonly config: BridgeClientConfig;
  private readonly featureFlags: FeatureFlags;
  private readonly providerRegistry: ProviderRegistry;
  private readonly modelRegistry: ModelRegistry;

  /**
   * Create BridgeClient Instance
   *
   * Validates the provided configuration and initializes the client
   * with appropriate feature flags for the current phase.
   *
   * @param config - Bridge configuration object
   * @throws {BridgeError} When configuration validation fails
   */
  constructor(config: BridgeConfig) {
    this.config = this.validateAndTransformConfig(config);
    this.featureFlags = initializeFeatureFlags();

    // Initialize registries with empty state for Phase 1
    this.providerRegistry = new InMemoryProviderRegistry();
    this.modelRegistry = new InMemoryModelRegistry();
  }

  /**
   * Chat Completion
   *
   * Sends a chat completion request to the configured LLM provider.
   * Currently disabled in Phase 1 - will be implemented in Phase 2.
   *
   * @param request - Chat completion request configuration
   * @returns Promise resolving to the completed message
   * @throws {BridgeError} When feature is disabled or not implemented
   */
  chat(request: ChatRequest): Promise<Message> {
    if (!isFeatureEnabled(this.featureFlags, "CHAT_ENABLED")) {
      throw new BridgeError(
        "Chat functionality is not yet implemented",
        "FEATURE_DISABLED",
        {
          feature: "chat",
          phase: "Phase 1",
          availableInPhase: "Phase 2",
        },
      );
    }

    // No-op implementation for Phase 1
    throw new BridgeError(
      "Chat implementation coming in Phase 2",
      "NOT_IMPLEMENTED",
      {
        feature: "chat",
        request: {
          model: request.model,
          messageCount: request.messages.length,
        },
      },
    );
  }

  /**
   * Streaming Chat Completion
   *
   * Sends a streaming chat completion request to the configured LLM provider.
   * Currently disabled in Phase 1 - will be implemented in Phase 2.
   *
   * @param request - Streaming chat completion request configuration
   * @returns AsyncIterable of streaming response deltas
   * @throws {BridgeError} When feature is disabled or not implemented
   */
  stream(request: StreamRequest): AsyncIterable<never> {
    if (!isFeatureEnabled(this.featureFlags, "STREAMING_ENABLED")) {
      throw new BridgeError(
        "Streaming functionality is not yet implemented",
        "FEATURE_DISABLED",
        {
          feature: "streaming",
          phase: "Phase 1",
          availableInPhase: "Phase 2",
        },
      );
    }

    // No-op implementation for Phase 1
    throw new BridgeError(
      "Streaming implementation coming in Phase 2",
      "NOT_IMPLEMENTED",
      {
        feature: "streaming",
        request: {
          model: request.model,
          messageCount: request.messages.length,
          streamEnabled: request.stream,
        },
      },
    );
  }

  /**
   * Get Provider Registry
   *
   * Returns the provider registry instance for accessing registered providers.
   * In Phase 1, registry starts empty and can be populated programmatically.
   *
   * @returns Provider registry instance
   */
  getProviderRegistry(): ProviderRegistry {
    return this.providerRegistry;
  }

  /**
   * Get Model Registry
   *
   * Returns the model registry instance for accessing registered models.
   * In Phase 1, registry starts empty and can be populated programmatically.
   *
   * @returns Model registry instance
   */
  getModelRegistry(): ModelRegistry {
    return this.modelRegistry;
  }

  /**
   * List Available Providers
   *
   * Convenience method to get all currently registered provider IDs.
   * In Phase 1, returns empty array until providers are registered.
   *
   * @returns Array of provider IDs
   */
  listAvailableProviders(): string[] {
    return this.providerRegistry.list().map((info) => info.id);
  }

  /**
   * List Available Models
   *
   * Convenience method to get all currently registered model IDs,
   * optionally filtered by provider.
   *
   * @param providerId - Optional provider ID to filter models
   * @returns Array of model IDs
   */
  listAvailableModels(providerId?: string): string[] {
    return this.modelRegistry.list(providerId).map((info) => info.id);
  }

  /**
   * Get Model Capabilities
   *
   * Convenience method to get capabilities for a specific model.
   * Returns undefined if the model is not registered.
   *
   * @param modelId - Model ID to get capabilities for
   * @returns Model capabilities or undefined if not found
   */
  getModelCapabilities(modelId: string): ModelCapabilities | undefined {
    const model = this.modelRegistry.get(modelId);
    return model?.capabilities;
  }

  /**
   * Get Current Configuration
   *
   * Returns a read-only view of the current client configuration.
   * Useful for debugging and validation purposes.
   *
   * @returns Read-only configuration object
   */
  getConfig(): Readonly<BridgeClientConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Validate and Transform Configuration
   *
   * Private method that validates the input BridgeConfig and transforms
   * it into the internal BridgeClientConfig format with proper defaults.
   *
   * @param config - Input bridge configuration
   * @returns Validated and transformed configuration
   * @throws {BridgeError} When configuration is invalid
   */
  private validateAndTransformConfig(config: BridgeConfig): BridgeClientConfig {
    // Validate required configuration
    if (!config.defaultProvider && !config.providers) {
      throw new BridgeError(
        "Configuration must specify either defaultProvider or providers",
        "INVALID_CONFIG",
        { config },
      );
    }

    // Transform providers object to Map for internal use
    const providersMap = new Map<string, Record<string, unknown>>();
    if (config.providers) {
      for (const [name, providerConfig] of Object.entries(config.providers)) {
        providersMap.set(name, providerConfig);
      }
    }

    // Set sensible defaults and validate
    const defaultProvider =
      config.defaultProvider ||
      (providersMap.size > 0 ? providersMap.keys().next().value : "");

    if (!defaultProvider) {
      throw new BridgeError(
        "Unable to determine default provider from configuration",
        "INVALID_CONFIG",
        { config },
      );
    }

    // Validate that defaultProvider exists in providers map
    if (config.defaultProvider && !providersMap.has(config.defaultProvider)) {
      throw new BridgeError(
        `Default provider '${config.defaultProvider}' not found in providers configuration`,
        "INVALID_CONFIG",
        {
          defaultProvider: config.defaultProvider,
          availableProviders: Array.from(providersMap.keys()),
        },
      );
    }

    const defaultModel = config.defaultModel || "gpt-3.5-turbo";
    const timeout = config.timeout || 30000;

    if (timeout < 1000 || timeout > 300000) {
      throw new BridgeError(
        "Timeout must be between 1000ms and 300000ms",
        "INVALID_CONFIG",
        { timeout },
      );
    }

    return {
      defaultProvider,
      defaultModel,
      timeout,
      providers: providersMap,
      options: config.options || {},
      registryOptions: {
        providers: config.registryOptions?.providers || {},
        models: config.registryOptions?.models || {},
      },
      validated: true,
    };
  }
}
