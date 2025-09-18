import type { Message } from "../messages/message";
import type { BridgeError } from "../errors/bridgeError";
import type { ProviderHttpRequest } from "../transport/providerHttpRequest";
import type { ProviderHttpResponse } from "../transport/providerHttpResponse";
import type { ChatRequest } from "../../client/chatRequest";
import type { StreamDelta } from "../../client/streamDelta";
import type { ModelCapabilities } from "./modelCapabilities";
import type { ConversationContext } from "../agent/conversationContext";
import type { MultiTurnState } from "../agent/multiTurnState";

/**
 * Provider Plugin Interface
 *
 * Complete interface for provider plugin implementations that enables
 * seamless integration with the LLM Bridge library. Defines both basic
 * metadata and the core contract methods required for request translation,
 * response parsing, error normalization, and capability detection.
 *
 * @example Basic provider plugin structure
 * ```typescript
 * const openaiPlugin: ProviderPlugin = {
 *   id: "openai",
 *   name: "OpenAI Provider",
 *   version: "1.0.0",
 *   capabilities: {
 *     streaming: true,
 *     toolCalls: true,
 *     images: true,
 *     documents: false,
 *     maxTokens: 128000,
 *     supportedContentTypes: ["text", "image"]
 *   },
 *   initialize: async (config) => { ... },
 *   supportsModel: (modelId) => modelId.startsWith("gpt-"),
 *   translateRequest: (request) => ({ ... }),
 *   parseResponse: (response, isStreaming) => ({ ... }),
 *   isTerminal: (deltaOrResponse) => deltaOrResponse.finished,
 *   normalizeError: (error) => new BridgeError(error.message, "PROVIDER_ERROR")
 * };
 * ```
 */
export interface ProviderPlugin {
  /** Unique identifier for the provider plugin */
  id: string;
  /** Human-readable name of the provider */
  name: string;
  /** Version of the provider plugin */
  version: string;
  /** Initialize the provider with configuration */
  initialize?: (config: Record<string, unknown>) => Promise<void>;
  /** Check if the provider supports a specific model */
  supportsModel?: (modelId: string) => boolean;
  /** Additional provider-specific metadata */
  metadata?: Record<string, unknown>;

  /**
   * Convert unified request format to provider-specific HTTP request.
   *
   * Transforms the standardized request (ChatRequest with optional stream flag)
   * into a provider-specific HTTP request that can be sent to the provider's API endpoint.
   *
   * Enhanced with optional multi-turn conversation context for providers to optimize
   * request translation based on conversation history, iteration patterns, and state.
   *
   * @param request - The unified request to translate (extends ChatRequest with optional stream)
   * @param modelCapabilities - Optional model capabilities for request optimization
   * @param conversationContext - Optional multi-turn conversation context for enhanced translation
   * @returns Provider-specific HTTP request ready for API call
   * @throws {BridgeError} When request translation fails
   *
   * @example Single-turn usage (backward compatible)
   * ```typescript
   * const httpRequest = plugin.translateRequest({
   *   messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
   *   model: "gpt-4",
   *   stream: true
   * });
   * ```
   *
   * @example Multi-turn usage with conversation context
   * ```typescript
   * const httpRequest = plugin.translateRequest({
   *   messages: [{ role: "user", content: [{ type: "text", text: "Continue our math discussion" }] }],
   *   model: "gpt-4",
   *   stream: true
   * }, undefined, {
   *   conversationHistory: [...previousMessages],
   *   currentIteration: 3,
   *   totalIterations: 10,
   *   streamingState: "streaming",
   *   toolExecutionHistory: [...],
   *   estimatedTokensUsed: 250
   * });
   * ```
   */
  translateRequest(
    request: ChatRequest & { stream?: boolean },
    modelCapabilities?: { temperature?: boolean },
    conversationContext?: ConversationContext,
  ): ProviderHttpRequest;

  /**
   * Parse provider HTTP response back to unified format.
   *
   * Transforms the provider's HTTP response into either a complete
   * unified response (async for non-streaming) or an async stream
   * of delta chunks depending on whether streaming was requested.
   *
   * Enhanced with optional multi-turn state context for providers to optimize
   * response parsing based on conversation state, iteration tracking, and streaming context.
   *
   * @param response - The HTTP response from provider API
   * @param isStreaming - Whether the response should be treated as streaming
   * @param multiTurnState - Optional multi-turn conversation state for enhanced parsing
   * @returns Promise of complete response for non-streaming, or async iterable of streaming deltas
   * @throws {BridgeError} When response parsing fails
   *
   * @example Non-streaming response (backward compatible)
   * ```typescript
   * const result = await plugin.parseResponse(httpResponse, false) as {
   *   message: Message;
   *   usage?: { promptTokens: number; completionTokens: number; totalTokens?: number };
   *   model: string;
   *   metadata?: Record<string, unknown>;
   * };
   * console.log(result.message.content);
   * ```
   *
   * @example Streaming response with multi-turn state
   * ```typescript
   * const stream = plugin.parseResponse(httpResponse, true, {
   *   iteration: 3,
   *   streamingState: "streaming",
   *   pendingToolCalls: [],
   *   terminationReason: undefined
   * }) as AsyncIterable<StreamDelta>;
   * for await (const delta of stream) {
   *   console.log(delta.delta.content);
   * }
   * ```
   */
  parseResponse(
    response: ProviderHttpResponse,
    isStreaming: boolean,
    multiTurnState?: MultiTurnState,
  ):
    | Promise<{
        message: Message;
        usage?: {
          promptTokens: number;
          completionTokens: number;
          totalTokens?: number;
        };
        model: string;
        metadata?: Record<string, unknown>;
      }>
    | AsyncIterable<StreamDelta>;

  /**
   * Enhanced termination detection with provider-aware reasoning.
   *
   * Optional method that provides detailed termination analysis beyond the basic
   * boolean result of isTerminal(). Returns a unified termination signal with
   * confidence levels, standardized reasons, and provider-specific metadata.
   *
   * When implemented, this method should be the primary termination detection
   * mechanism, with isTerminal() delegating to it for backward compatibility.
   *
   * @param deltaOrResponse - Either a streaming delta or final response
   * @param conversationContext - Optional conversation context for intelligent termination detection
   * @returns Detailed termination signal with reasoning and confidence
   *
   * @example Basic enhanced termination detection
   * ```typescript
   * const signal = plugin.detectTermination?.(response);
   * if (signal?.shouldTerminate) {
   *   console.log(`Terminated: ${signal.reason} (${signal.confidence} confidence)`);
   *   console.log(`Provider: ${signal.providerSpecific.originalField}=${signal.providerSpecific.originalValue}`);
   * }
   * ```
   *
   * @example Fallback to isTerminal() for backward compatibility
   * ```typescript
   * const signal = plugin.detectTermination?.(response) ?? {
   *   shouldTerminate: plugin.isTerminal(response),
   *   reason: "unknown",
   *   confidence: "low",
   *   providerSpecific: { originalField: "isTerminal", originalValue: "boolean" }
   * };
   * ```
   *
   * @example Integration with conversation context
   * ```typescript
   * const signal = plugin.detectTermination?.(response, {
   *   conversationHistory: [...],
   *   currentIteration: 3,
   *   streamingState: "completed"
   * });
   * // Provider can use context for more intelligent termination decisions
   * ```
   */
  detectTermination?(
    deltaOrResponse:
      | StreamDelta
      | {
          message: Message;
          usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens?: number;
          };
          model: string;
          metadata?: Record<string, unknown>;
        },
    conversationContext?: ConversationContext,
  ): import("../agent/unifiedTerminationSignal").UnifiedTerminationSignal;

  /**
   * Normalize provider-specific errors to unified error types.
   *
   * Converts provider-specific error responses and exceptions into
   * standardized BridgeError instances with appropriate error codes
   * and context information.
   *
   * @param error - Provider-specific error to normalize
   * @returns Standardized BridgeError with appropriate code and context
   *
   * @example
   * ```typescript
   * try {
   *   await makeProviderRequest();
   * } catch (providerError) {
   *   const bridgeError = plugin.normalizeError(providerError);
   *   console.log(bridgeError.code); // "RATE_LIMIT_ERROR", "AUTH_ERROR", etc.
   * }
   * ```
   */
  normalizeError(error: unknown): BridgeError;

  /**
   * Estimate token usage for a request with optional conversation context.
   *
   * Provides token usage estimation for conversation planning and optimization.
   * Helps multi-turn orchestration make decisions about continuation and limits.
   *
   * @param request - The request to estimate tokens for
   * @param conversationContext - Optional conversation context for more accurate estimation
   * @returns Estimated token usage breakdown
   *
   * @example Basic token estimation
   * ```typescript
   * const estimation = plugin.estimateTokenUsage?.({
   *   messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
   *   model: "gpt-4"
   * });
   * console.log(estimation?.estimatedTokens); // 50
   * ```
   *
   * @example Context-aware token estimation
   * ```typescript
   * const estimation = plugin.estimateTokenUsage?.({
   *   messages: [...],
   *   model: "gpt-4"
   * }, conversationContext);
   * console.log(estimation?.estimatedTokens); // 250 (includes conversation history)
   * ```
   */
  estimateTokenUsage?(
    request: ChatRequest & { stream?: boolean },
    conversationContext?: ConversationContext,
  ): {
    estimatedTokens: number;
    breakdown?: {
      promptTokens: number;
      maxCompletionTokens: number;
      conversationTokens?: number;
    };
  };

  /**
   * Determine if conversation should continue based on response and state.
   *
   * Provides intelligent conversation continuation logic based on provider-specific
   * completion signals, conversation patterns, and multi-turn state analysis.
   *
   * @param response - The response to analyze for continuation signals
   * @param multiTurnState - Current multi-turn conversation state
   * @returns Recommendation on whether conversation should continue
   *
   * @example Basic continuation check
   * ```typescript
   * const shouldContinue = plugin.shouldContinueConversation?.({
   *   message: { role: "assistant", content: [{ type: "text", text: "Done!" }] },
   *   model: "gpt-4"
   * }, multiTurnState);
   * console.log(shouldContinue?.shouldContinue); // false
   * ```
   */
  shouldContinueConversation?(
    response: {
      message: Message;
      usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens?: number;
      };
      model: string;
      metadata?: Record<string, unknown>;
    },
    multiTurnState: MultiTurnState,
  ): {
    shouldContinue: boolean;
    reason?: string;
    confidence?: number;
  };

  /**
   * Provider capability descriptors.
   *
   * Describes the features and capabilities that this provider supports,
   * such as streaming, tool calls, image processing, and content types.
   * Used by the bridge to route requests appropriately and validate
   * feature compatibility.
   */
  capabilities?: ModelCapabilities;
}
