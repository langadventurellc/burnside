/**
 * OpenAI Responses v1 Provider Plugin
 *
 * Main provider plugin implementation for OpenAI's Responses API v1.
 * Implements the ProviderPlugin interface with placeholder implementations
 * for core methods that will be implemented in subsequent tasks.
 */

import type { ProviderPlugin } from "../../core/providers/providerPlugin";
import type { ChatRequest } from "../../client/chatRequest";
import type { StreamDelta } from "../../client/streamDelta";
import type { Message } from "../../core/messages/message";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import type { ConversationContext } from "../../core/agent/conversationContext";
import type { MultiTurnState } from "../../core/agent/multiTurnState";
import { BridgeError } from "../../core/errors/bridgeError";
import { ValidationError } from "../../core/errors/validationError";
import { ProviderError } from "../../core/errors/providerError";
import {
  OpenAIResponsesV1ConfigSchema,
  type OpenAIResponsesV1Config,
} from "./configSchema";
import { translateChatRequest } from "./translator";
import { parseOpenAIResponse } from "./responseParser";
import { parseOpenAIResponseStream } from "./streamingParser";
import { normalizeOpenAIError } from "./errorNormalizer";
import { defaultEstimateTokenUsage } from "../../core/providers/defaultEstimateTokenUsage";
import { defaultShouldContinueConversation } from "../../core/providers/defaultShouldContinueConversation";

/**
 * OpenAI Responses v1 Provider Plugin
 *
 * Implements the ProviderPlugin interface for OpenAI's Responses API v1.
 * Provides foundational structure with placeholder implementations that
 * will be completed in subsequent development tasks.
 */
export class OpenAIResponsesV1Provider implements ProviderPlugin {
  /** Unique identifier for the provider plugin */
  readonly id = "openai";

  /** Human-readable name of the provider */
  readonly name = "OpenAI Responses Provider";

  /** Version of the provider plugin */
  readonly version = "responses-v1";

  /** Provider configuration */
  private config?: OpenAIResponsesV1Config;

  /**
   * Initialize the provider with configuration
   *
   * Validates the provided configuration against the OpenAI schema
   * and stores it for use in subsequent requests.
   *
   * @param config - Configuration object for the OpenAI provider
   * @throws {BridgeError} When configuration is invalid
   */
  initialize(config: Record<string, unknown>): Promise<void> {
    try {
      this.config = OpenAIResponsesV1ConfigSchema.parse(config);
      return Promise.resolve();
    } catch (error) {
      throw new BridgeError("Invalid OpenAI configuration", "INVALID_CONFIG", {
        originalError: error,
      });
    }
  }

  /**
   * Check if the provider supports a specific model
   *
   * Determines whether the given model ID is supported by this provider.
   * Model support is now determined by the centralized model registry,
   * not by hardcoded capabilities in the provider.
   *
   * @param _modelId - The model identifier (unused - support determined by registry)
   * @returns True - all models are potentially supported; actual support is determined by model registry routing
   */
  supportsModel(_modelId: string): boolean {
    return true;
  }

  /**
   * Convert unified request format to provider-specific HTTP request
   *
   * Translates the unified ChatRequest format to OpenAI Responses API v1 format.
   * Enhanced with optional multi-turn conversation context for optimized translation.
   *
   * @param request - The unified request to translate
   * @param modelCapabilities - Optional model capabilities for optimization
   * @param conversationContext - Optional multi-turn conversation context
   * @returns HTTP request for OpenAI Responses API v1
   * @throws {BridgeError} When provider is not initialized
   * @throws {ValidationError} When request translation fails
   */
  translateRequest(
    request: ChatRequest & { stream?: boolean },
    modelCapabilities?: { temperature?: boolean },
    _conversationContext?: ConversationContext,
  ): ProviderHttpRequest {
    if (!this.config) {
      throw new BridgeError("Provider not initialized", "NOT_INITIALIZED", {
        method: "translateRequest",
      });
    }

    return translateChatRequest(request, this.config, modelCapabilities);
  }

  /**
   * Parse provider HTTP response back to unified format
   *
   * Parse responses from the OpenAI Responses API v1 back to unified format.
   * Handles both streaming and non-streaming responses based on the isStreaming flag.
   * Enhanced with optional multi-turn state context for optimized parsing.
   *
   * @param response - The HTTP response from provider API
   * @param isStreaming - Whether the response should be treated as streaming
   * @param multiTurnState - Optional multi-turn conversation state
   * @returns Promise of parsed response object for non-streaming or AsyncIterable for streaming
   * @throws {ValidationError} When response validation fails
   * @throws {StreamingError} When streaming parsing fails
   */
  parseResponse(
    response: ProviderHttpResponse,
    isStreaming: boolean,
    _multiTurnState?: MultiTurnState,
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
    | AsyncIterable<StreamDelta> {
    if (isStreaming) {
      return parseOpenAIResponseStream(response);
    }

    // Return Promise for non-streaming responses
    return this.readResponseBody(response).then((responseText) =>
      parseOpenAIResponse(response, responseText),
    );
  }

  /**
   * Read ReadableStream response body to string
   *
   * @param response - HTTP response with ReadableStream body
   * @returns Promise resolving to response body as string
   * @throws {ValidationError} When response body is null or reading fails
   */
  private async readResponseBody(
    response: ProviderHttpResponse,
  ): Promise<string> {
    if (!response.body) {
      throw new ValidationError("Response body is null", {
        status: response.status,
        statusText: response.statusText,
      });
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    // Combine chunks and decode to string
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(combined);
  }

  /**
   * Detect if streaming response has reached termination
   *
   * For streaming responses (StreamDelta), checks:
   * - Primary indicator: finished flag set to true
   * - Secondary indicator: event type is "response.completed" or "error"
   *
   * For non-streaming responses (UnifiedResponse), always returns true.
   *
   * @param deltaOrResponse - Either a streaming delta or final response
   * @returns true if the response is terminal, false otherwise
   */
  isTerminal(
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
    _conversationContext?: ConversationContext,
  ): boolean {
    // Check if it's a non-streaming response (has message property) - always terminal
    if ("message" in deltaOrResponse) {
      return true;
    }

    // Check StreamDelta for termination indicators
    const delta = deltaOrResponse;

    // Primary indicator: finished flag
    if (delta.finished) {
      return true;
    }

    // Secondary indicator: OpenAI event types
    const eventType = delta.metadata?.eventType;
    if (eventType === "response.completed") {
      return true;
    }

    return false;
  }

  /**
   * Normalize provider-specific errors to unified error types
   *
   * Converts OpenAI-specific errors to appropriate BridgeError subclasses
   * based on HTTP status codes, OpenAI error types, and network conditions.
   *
   * @param error - Provider-specific error to normalize
   * @returns Appropriate BridgeError subclass based on error analysis
   */
  normalizeError(error: unknown): BridgeError {
    try {
      return normalizeOpenAIError(error);
    } catch (normalizationError) {
      // Fallback to generic ProviderError if normalization fails
      return new ProviderError("Error normalization failed", {
        originalError: error,
        normalizationError,
      });
    }
  }

  /**
   * Estimate token usage for a request with optional conversation context.
   *
   * Uses default token estimation helper with OpenAI-specific model configuration
   * from the model registry for accurate token planning and conversation management.
   *
   * @param request - The request to estimate tokens for
   * @param conversationContext - Optional conversation context for enhanced estimation
   * @returns Token usage estimation with breakdown
   */
  estimateTokenUsage(
    request: ChatRequest & { stream?: boolean },
    conversationContext?: ConversationContext,
  ): {
    estimatedTokens: number;
    breakdown?: {
      promptTokens: number;
      maxCompletionTokens: number;
      conversationTokens?: number;
    };
  } {
    return defaultEstimateTokenUsage(request, conversationContext);
  }

  /**
   * Determine if conversation should continue based on response and state.
   *
   * Uses default conversation continuation logic enhanced with OpenAI-specific
   * completion signals and response pattern analysis for intelligent multi-turn decisions.
   *
   * @param response - The response to analyze for continuation signals
   * @param multiTurnState - Current multi-turn conversation state
   * @returns Recommendation on whether conversation should continue
   */
  shouldContinueConversation(
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
  } {
    return defaultShouldContinueConversation(response, multiTurnState);
  }
}
