import type { BridgeConfig } from "../core/config/bridgeConfig";
import type { Message } from "../core/messages/message";
import { BridgeError } from "../core/errors/bridgeError";
import type { ChatRequest } from "./chatRequest";
import type { StreamRequest } from "./streamRequest";
import type { BridgeClientConfig } from "./bridgeClientConfig";
import type { FeatureFlags } from "./featureFlagsInterface";
import { initializeFeatureFlags } from "./initializeFeatureFlags";
import { isFeatureEnabled } from "./isFeatureEnabled";

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
      validated: true,
    };
  }
}
