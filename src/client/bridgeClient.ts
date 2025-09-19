/* eslint-disable statement-count/function-statement-count-warn */
/* eslint-disable max-lines */
import type { BridgeConfig } from "../core/config/bridgeConfig";
import type { Message } from "../core/messages/message";
import { BridgeError } from "../core/errors/bridgeError";
import type { ChatRequest } from "./chatRequest";
import type { StreamRequest } from "./streamRequest";
import type { StreamDelta } from "./streamDelta";
import type { BridgeClientConfig } from "./bridgeClientConfig";
import type { ProviderRegistry } from "../core/providers/providerRegistry";
import type { ProviderPlugin } from "../core/providers/providerPlugin";
import type { ModelRegistry } from "../core/models/modelRegistry";
import type { ModelCapabilities } from "../core/providers/modelCapabilities";
import { InMemoryProviderRegistry } from "../core/providers/inMemoryProviderRegistry";
import { InMemoryModelRegistry } from "../core/models/inMemoryModelRegistry";
import { mapJsonToModelInfo } from "../core/models/modelLoader";
import { DefaultLlmModelsSchema } from "../core/models/defaultLlmModelsSchema";
import { defaultLlmModels } from "../data/defaultLlmModels";
import { ValidationError } from "../core/errors/validationError";
import type { ModelInfo } from "../core/providers/modelInfo";
import {
  HttpTransport,
  InterceptorChain,
  type HttpClientConfig,
  type FetchFunction,
} from "../core/transport/index";
import { HttpErrorNormalizer } from "../core/errors/httpErrorNormalizer";
import {
  ToolRouter,
  InMemoryToolRegistry,
  type ToolDefinition,
} from "../core/tools/index";
import { AgentLoop } from "../core/agent/index";
import { fromAbortSignal } from "../core/agent/cancellation/fromAbortSignal";
import { extractToolCallsFromMessage } from "./extractToolCallsFromMessage";
import { formatToolResultsAsMessages } from "./formatToolResultsAsMessages";
import { shouldExecuteTools } from "./shouldExecuteTools";
import { validateToolDefinitions } from "./validateToolDefinitions";
import { shouldExecuteMultiTurn } from "./shouldExecuteMultiTurn";
import { StreamingInterruptionWrapper } from "./streamingInterruptionWrapper";

/**
 * Bridge Client Class
 *
 * Primary public API class for the LLM Bridge Library.
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
 * // Chat completion
 * const response = await client.chat({
 *   messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
 *   model: "gpt-4"
 * });
 *
 * // Streaming chat
 * for await (const delta of await client.stream({
 *   messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
 *   model: "gpt-4"
 * })) {
 *   console.log(delta.delta);
 * }
 * ```
 */
export class BridgeClient {
  private readonly config: BridgeClientConfig;
  private readonly providerRegistry: ProviderRegistry;
  private readonly modelRegistry: ModelRegistry;
  private readonly httpTransport: HttpTransport;
  private readonly initializedProviders = new Set<string>();
  private toolRouter?: ToolRouter;
  private agentLoop?: AgentLoop;

  /**
   * Create BridgeClient Instance
   *
   * Validates the provided configuration and initializes the client.
   *
   * @param config - Bridge configuration object
   * @throws {BridgeError} When configuration validation fails
   */
  constructor(
    config: BridgeConfig,
    deps?: {
      transport?: HttpTransport;
      providerRegistry?: ProviderRegistry;
      modelRegistry?: ModelRegistry;
    },
  ) {
    this.config = this.validateAndTransformConfig(config);

    // Initialize registries
    this.providerRegistry =
      deps?.providerRegistry ?? new InMemoryProviderRegistry();
    this.modelRegistry = deps?.modelRegistry ?? new InMemoryModelRegistry();

    // Build default transport or use injected one
    if (deps?.transport) {
      this.httpTransport = deps.transport;
    } else {
      const httpClientConfig: HttpClientConfig = {
        fetch: globalThis.fetch as FetchFunction,
      };
      const interceptors = new InterceptorChain();
      const errorNormalizer = new HttpErrorNormalizer();
      this.httpTransport = new HttpTransport(
        httpClientConfig,
        interceptors,
        errorNormalizer,
      );
    }

    // Optionally seed model registry based on configuration
    this.seedModelsIfConfigured(config);

    // Initialize tool system if enabled
    if (this.isToolsEnabled()) {
      this.initializeToolSystem();
    }
  }

  /**
   * Qualify model ID with provider prefix if needed
   */
  private qualifyModelId(model: string): string {
    if (model.includes(":")) {
      return model;
    }
    throw new BridgeError(
      "Unqualified model IDs are not supported. Please specify the full model ID with provider prefix.",
      "MODEL_NOT_REGISTERED",
      { modelId: model },
    );
  }

  /**
   * Ensure model is registered, throw if not
   */
  private ensureModelRegistered(modelId: string): void {
    if (!this.modelRegistry.get(modelId)) {
      throw new BridgeError("Model not registered", "MODEL_NOT_REGISTERED", {
        modelId,
      });
    }
  }

  /**
   * Get provider key from model configuration
   */
  private getProviderKeyFromModel(modelId: string): {
    id: string;
    version: string;
  } {
    const model = this.modelRegistry.get(modelId);
    if (!model?.metadata?.providerPlugin) {
      throw new BridgeError(
        "Provider plugin mapping not found",
        "PROVIDER_PLUGIN_UNMAPPED",
        { modelId, providerPlugin: model?.metadata?.providerPlugin },
      );
    }

    const providerKey = this.getProviderKeyFromPluginString(
      model.metadata.providerPlugin as string,
    );
    if (!providerKey) {
      throw new BridgeError(
        "Provider plugin mapping not found",
        "PROVIDER_PLUGIN_UNMAPPED",
        { modelId, providerPlugin: model.metadata.providerPlugin },
      );
    }

    return providerKey;
  }

  /**
   * Get provider config or throw if missing
   */
  private getProviderConfigOrThrow(
    providerId: string,
  ): Record<string, unknown> {
    const config = this.config.providers.get(providerId);
    if (!config) {
      throw new BridgeError(
        "Provider configuration not found",
        "PROVIDER_CONFIG_MISSING",
        { providerId },
      );
    }
    return config;
  }

  /**
   * Initialize provider if not already initialized
   */
  private async initializeProviderIfNeeded(
    plugin: ProviderPlugin,
    providerConfig: Record<string, unknown>,
  ): Promise<void> {
    const key = `${plugin.id}:${plugin.version}`;
    if (!this.initializedProviders.has(key)) {
      await plugin.initialize?.(providerConfig);
      this.initializedProviders.add(key);
    }
  }

  /**
   * Create timeout signal with cancellation
   *
   * Combines a timeout-based AbortSignal with an optional external AbortSignal.
   * If an external signal is provided, cancellation from either the timeout
   * or the external signal will trigger the returned signal.
   *
   * @param timeoutMs - Timeout in milliseconds for automatic cancellation
   * @param externalSignal - Optional external AbortSignal to combine with timeout
   * @returns Object with combined signal and cancel function
   */
  private createTimeoutSignal(
    timeoutMs: number,
    externalSignal?: AbortSignal,
  ): {
    signal: AbortSignal;
    cancel: () => void;
  } {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Combine with external signal if provided
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener("abort", () => controller.abort(), {
          once: true,
        });
      }
    }

    return {
      signal: controller.signal,
      cancel: () => clearTimeout(timer),
    };
  }

  /**
   * Chat Completion
   *
   * Sends a chat completion request to the configured LLM provider.
   * If tools are provided and enabled, handles tool execution and conversation continuation.
   *
   * @param request - Chat completion request configuration
   * @returns Promise resolving to the completed message
   * @throws {BridgeError} When model is not registered, provider is not registered, or provider configuration is missing
   * @throws {TransportError} When network failures occur (normalized via provider plugin)
   * @throws {AuthError} When authentication fails (normalized via provider plugin)
   * @throws {RateLimitError} When rate limits are exceeded (normalized via provider plugin)
   * @throws {ValidationError} When request validation fails (normalized via provider plugin)
   * @throws {ProviderError} When provider-specific errors occur (normalized via provider plugin)
   */
  async chat(request: ChatRequest): Promise<Message> {
    // Validate tools if provided
    if (request.tools && request.tools.length > 0) {
      validateToolDefinitions(request.tools);

      if (!shouldExecuteTools(true, this.isToolsEnabled())) {
        throw new BridgeError(
          "Tools provided but tool system not enabled in configuration",
          "TOOLS_NOT_ENABLED",
        );
      }
    }
    const modelId = this.qualifyModelId(request.model);
    this.ensureModelRegistered(modelId);

    // Resolve provider
    const { id, version } = this.getProviderKeyFromModel(modelId);
    const plugin = this.providerRegistry.get(id, version);
    if (!plugin) {
      throw new BridgeError(
        "Provider not registered",
        "PROVIDER_NOT_REGISTERED",
        { id, version },
      );
    }

    // Initialize provider once with config
    const providerConfig = this.getProviderConfigOrThrow(id);
    await this.initializeProviderIfNeeded(plugin, providerConfig);

    // Translate request
    const httpReq = plugin.translateRequest({
      ...request,
      model: modelId.split(":")[1],
      stream: false,
    });

    // Apply timeout and combine with external signal
    const providerTimeout =
      typeof providerConfig.timeout === "number"
        ? providerConfig.timeout
        : undefined;
    const timeoutMs = providerTimeout ?? this.config.timeout;
    const { signal, cancel } = this.createTimeoutSignal(
      timeoutMs,
      request.signal,
    );

    try {
      // Execute fetch
      const httpRes = await this.httpTransport.fetch({ ...httpReq, signal });

      // Parse response
      const result = (await plugin.parseResponse(httpRes, false)) as {
        message: Message;
        usage?: {
          promptTokens: number;
          completionTokens: number;
          totalTokens?: number;
        };
        model: string;
        metadata?: Record<string, unknown>;
      };

      // Check for tool calls and execute if needed
      if (request.tools && request.tools.length > 0 && this.isToolsEnabled()) {
        // Determine execution path: multi-turn vs single-turn
        if (shouldExecuteMultiTurn(request, this.isToolsEnabled())) {
          // Multi-turn execution path
          if (!this.agentLoop) {
            throw new ValidationError(
              "Agent loop not initialized for multi-turn execution",
            );
          }

          const multiTurnOptions = request.multiTurn || {};
          const multiTurnResult = await this.agentLoop.executeMultiTurn(
            request.messages,
            {
              ...multiTurnOptions,
              timeoutMs: multiTurnOptions.timeoutMs || timeoutMs,
              signal: request.signal,
            },
          );

          // Return the last message from the multi-turn conversation
          const finalMessages = multiTurnResult.finalMessages;
          return finalMessages[finalMessages.length - 1];
        } else {
          // Single-turn execution path (backward compatibility)
          const toolResultMessages = await this.executeToolCallsInResponse(
            result.message,
          );
          if (toolResultMessages.length > 0) {
            // For now, return the original message. Full conversation continuation would need more complex logic
            return result.message;
          }
        }
      }

      return result.message;
    } catch (error) {
      // Check if this is a cancellation from external AbortSignal
      if (
        error instanceof DOMException &&
        error.name === "AbortError" &&
        request.signal?.aborted
      ) {
        throw fromAbortSignal(request.signal, "execution", false);
      }

      let normalized;
      try {
        normalized = plugin.normalizeError(error);
      } catch {
        // If normalization itself throws, fall back to original error
        throw error instanceof Error ? error : new Error(String(error));
      }
      throw normalized;
    } finally {
      cancel();
    }
  }

  /**
   * Streaming Chat Completion
   *
   * Sends a streaming chat completion request to the configured LLM provider.
   *
   * @param request - Streaming chat completion request configuration
   * @returns Promise resolving to AsyncIterable of streaming response deltas
   * @throws {BridgeError} When model is not registered, provider is not registered, or provider configuration is missing
   * @throws {TransportError} When network failures occur (normalized via provider plugin)
   * @throws {AuthError} When authentication fails (normalized via provider plugin)
   * @throws {RateLimitError} When rate limits are exceeded (normalized via provider plugin)
   * @throws {ValidationError} When request validation fails (normalized via provider plugin)
   * @throws {ProviderError} When provider-specific errors occur (normalized via provider plugin)
   * @note Errors during stream iteration are normalized at the provider layer and may surface as BridgeError subclasses
   */
  async stream(request: StreamRequest): Promise<AsyncIterable<StreamDelta>> {
    const modelId = this.qualifyModelId(request.model);
    this.ensureModelRegistered(modelId);

    // Resolve provider
    const { id, version } = this.getProviderKeyFromModel(modelId);
    const plugin = this.providerRegistry.get(id, version);
    if (!plugin) {
      throw new BridgeError(
        "Provider not registered",
        "PROVIDER_NOT_REGISTERED",
        { id, version },
      );
    }

    // Initialize provider once with config
    const providerConfig = this.getProviderConfigOrThrow(id);
    await this.initializeProviderIfNeeded(plugin, providerConfig);

    // Get model info to check capabilities
    const modelInfo = this.modelRegistry.get(modelId);

    // Translate request with model capabilities
    const httpReq = plugin.translateRequest(
      {
        ...request,
        model: modelId.split(":")[1],
        stream: true,
      },
      { temperature: modelInfo?.capabilities.temperature },
    );

    // Apply timeout and combine with external signal
    const providerTimeout =
      typeof providerConfig.timeout === "number"
        ? providerConfig.timeout
        : undefined;
    const timeoutMs = providerTimeout ?? this.config.timeout;
    const { signal, cancel } = this.createTimeoutSignal(
      timeoutMs,
      request.signal,
    );

    try {
      // Execute fetch
      const httpRes = await this.httpTransport.fetch({ ...httpReq, signal });

      // Parse response - must be AsyncIterable<StreamDelta>
      const providerStream = plugin.parseResponse(
        httpRes,
        true,
      ) as AsyncIterable<StreamDelta>;

      // Check if streaming interruption should be enabled
      const hasTools = Boolean(request.tools && request.tools.length > 0);
      if (
        StreamingInterruptionWrapper.shouldEnableInterruption(hasTools) &&
        this.toolRouter
      ) {
        // Create tool execution context
        const context = {
          userId: undefined,
          sessionId: undefined,
          environment: "production",
          permissions: [],
          metadata: {},
        };

        // Wrap with interruption handling
        const wrapper = new StreamingInterruptionWrapper(
          this.toolRouter,
          context,
        );
        return wrapper.wrap(providerStream);
      }

      // Return unwrapped stream for non-tool requests
      return providerStream;
    } catch (error) {
      // Check if this is a cancellation from external AbortSignal
      if (
        error instanceof DOMException &&
        error.name === "AbortError" &&
        request.signal?.aborted
      ) {
        throw fromAbortSignal(request.signal, "streaming", false);
      }

      let normalized;
      try {
        normalized = plugin.normalizeError(error);
      } catch {
        // If normalization itself throws, fall back to original error
        throw error instanceof Error ? error : new Error(String(error));
      }
      throw normalized;
    } finally {
      cancel();
    }
  }

  /**
   * Get Provider Registry
   *
   * Returns the provider registry instance for accessing registered providers.
   * Registry starts empty and can be populated programmatically.
   *
   * @returns Provider registry instance
   */
  getProviderRegistry(): ProviderRegistry {
    return this.providerRegistry;
  }

  /**
   * Register Provider Plugin
   *
   * Registers a provider plugin with the internal provider registry.
   * The provider will be available for use with the registered ID and version.
   *
   * @param plugin - Provider plugin to register
   * @throws {ValidationError} When provider plugin structure is invalid
   * @throws {BridgeError} When registration fails
   *
   * @example
   * ```typescript
   * import { openaiResponsesV1Provider } from "./providers";
   *
   * const client = new BridgeClient(config);
   * client.registerProvider(openaiResponsesV1Provider);
   *
   * // Provider is now available for use
   * const providers = client.listAvailableProviders();
   * console.log(providers); // includes "openai"
   * ```
   */
  registerProvider(plugin: ProviderPlugin): void {
    try {
      this.providerRegistry.register(plugin);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new BridgeError(
        `Failed to register provider ${plugin.id}:${plugin.version}`,
        "REGISTRATION_FAILED",
        {
          providerId: plugin.id,
          version: plugin.version,
          originalError: error,
        },
      );
    }
  }

  /**
   * Get Model Registry
   *
   * Returns the model registry instance for accessing registered models.
   * Registry starts empty and can be populated programmatically.
   *
   * @returns Model registry instance
   */
  getModelRegistry(): ModelRegistry {
    return this.modelRegistry;
  }

  /**
   * Seeds the model registry from configured sources. Defaults to no seeding.
   * - 'builtin': uses packaged default model seed
   * - { data }: validates and maps provided JSON seed
   * - { path }: not supported cross‑platform; prefer loading via Node helper and passing data
   */
  private seedModelsIfConfigured(config: BridgeConfig): void {
    const seed = config.modelSeed;

    if (!seed || seed === "none") return;

    try {
      if (seed === "builtin") {
        const models = mapJsonToModelInfo(defaultLlmModels);
        this.registerModels(models);
        return;
      }

      if (typeof seed === "object" && "data" in seed) {
        const validated = DefaultLlmModelsSchema.parse(seed.data);
        const models = mapJsonToModelInfo(validated);
        this.registerModels(models);
        return;
      }

      if (typeof seed === "object" && "path" in seed) {
        // Node-only convenience is not wired here to keep core cross‑platform.
        // Guidance: load with runtime/node.loadDefaultModels(path) and pass via { data }.
        // We throw a clear validation error to steer correct usage.
        throw new ValidationError(
          "modelSeed.path is not supported in cross-platform core. Load via Node runtime loader and pass as modelSeed.data.",
        );
      }
    } catch (error) {
      // Non-fatal: leave registry empty if seeding fails

      console.warn("Model registry seeding failed:", error);
    }
  }

  private registerModels(models: ModelInfo[]): void {
    for (const m of models) {
      const modelId = `${m.provider}:${m.id}`;
      this.modelRegistry.register(modelId, {
        id: modelId,
        name: m.name,
        provider: m.provider,
        capabilities: m.capabilities,
        metadata: m.metadata,
      });
    }
  }

  /**
   * List Available Providers
   *
   * Convenience method to get all currently registered provider IDs.
   * Returns empty array until providers are registered.
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
   * Map Provider Plugin String to Registry Key
   *
   * Defines canonical mapping from providerPlugin strings to provider registry keys.
   * Enables dynamic provider selection based on model configuration.
   *
   * @param pluginString - Provider plugin string from model configuration
   * @returns Provider registry key or undefined for unknown plugins
   */
  private getProviderKeyFromPluginString(
    pluginString: string,
  ): { id: string; version: string } | undefined {
    // Define canonical mapping from providerPlugin to provider registry keys
    const mapping: Record<string, { id: string; version: string }> = {
      "openai-responses-v1": { id: "openai", version: "responses-v1" },
      "anthropic-2023-06-01": { id: "anthropic", version: "2023-06-01" },
      "google-gemini-v1": { id: "google", version: "gemini-v1" },
      "xai-v1": { id: "xai", version: "v1" },
    };

    return mapping[pluginString];
  }

  /**
   * Check if tool system is enabled in configuration
   */
  private isToolsEnabled(): boolean {
    return this.config.tools?.enabled === true;
  }

  /**
   * Initialize tool system components
   */
  private initializeToolSystem(): void {
    if (!this.config.tools) {
      return;
    }

    // Initialize tool registry and router
    const toolRegistry = new InMemoryToolRegistry();
    this.toolRouter = new ToolRouter(toolRegistry);
    this.agentLoop = new AgentLoop(this.toolRouter);

    // Mark tool system as initialized
    this.config.toolSystemInitialized = true;
  }

  /**
   * Register a tool with the tool system
   */
  registerTool(
    definition: ToolDefinition,
    handler: (params: Record<string, unknown>) => Promise<unknown>,
  ): void {
    if (!this.toolRouter) {
      throw new BridgeError(
        "Tool system not initialized. Enable tools in configuration first.",
        "TOOL_SYSTEM_NOT_INITIALIZED",
      );
    }

    validateToolDefinitions([definition]);
    this.toolRouter.register(definition.name, definition, handler);
  }

  /**
   * Get tool router for advanced tool system access
   */
  getToolRouter(): ToolRouter | undefined {
    return this.toolRouter;
  }

  /**
   * Execute tool calls found in a response message
   */
  private async executeToolCallsInResponse(
    message: Message,
  ): Promise<Message[]> {
    if (!this.toolRouter || !this.agentLoop) {
      return [];
    }

    const toolCalls = extractToolCallsFromMessage(message);
    if (toolCalls.length === 0) {
      return [];
    }

    const toolResults = [];
    for (const toolCall of toolCalls) {
      try {
        const context = {
          requestId: `req-${Date.now()}`,
          userId: "bridge-client",
          timestamp: new Date().toISOString(),
        };

        const result = await this.toolRouter.execute(toolCall, context);
        toolResults.push(result);
      } catch (error) {
        // Create error result
        toolResults.push({
          callId: toolCall.id,
          success: false,
          error: {
            code: "EXECUTION_FAILED",
            message:
              error instanceof Error ? error.message : "Tool execution failed",
          },
        });
      }
    }

    return formatToolResultsAsMessages(toolResults);
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
        "Configuration must specify providers",
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

    const timeout = config.timeout || 30000;

    if (timeout < 1000 || timeout > 300000) {
      throw new BridgeError(
        "Timeout must be between 1000ms and 300000ms",
        "INVALID_CONFIG",
        { timeout },
      );
    }

    return {
      timeout,
      providers: providersMap,
      tools: config.tools,
      toolSystemInitialized: false,
      options: config.options || {},
      registryOptions: {
        providers: config.registryOptions?.providers || {},
        models: config.registryOptions?.models || {},
      },
      validated: true,
    };
  }
}
