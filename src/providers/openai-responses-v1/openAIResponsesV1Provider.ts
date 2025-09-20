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
import type { UnifiedTerminationSignal } from "../../core/agent/unifiedTerminationSignal";
import type { ConversationContext } from "../../core/agent/conversationContext";
import type { MultiTurnState } from "../../core/agent/multiTurnState";
import { BridgeError } from "../../core/errors/bridgeError";
import { ValidationError } from "../../core/errors/validationError";
import { ProviderError } from "../../core/errors/providerError";
import { createTerminationSignal } from "../../core/agent/createTerminationSignal";
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
import { logger } from "../../core/logging/simpleLogger";

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
   * Detect termination with provider-specific finish_reason mapping
   *
   * Implements the unified termination detection interface for OpenAI/xAI providers.
   * Maps OpenAI's finish_reason field to standardized termination signals with
   * appropriate confidence levels and metadata preservation.
   *
   * @param deltaOrResponse - Either a streaming delta or final response
   * @param _conversationContext - Optional conversation context (unused for OpenAI)
   * @returns Detailed termination signal with reasoning and confidence
   */
  detectTermination(
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
  ): UnifiedTerminationSignal {
    // Handle complete response object (non-streaming)
    if ("message" in deltaOrResponse) {
      const response = deltaOrResponse;
      const finishReason = response.metadata?.finish_reason as
        | string
        | null
        | undefined;

      return this.createOpenAITerminationSignal(
        finishReason,
        true, // Non-streaming responses are always terminal
        response.metadata || {},
      );
    }

    // Handle streaming delta
    const delta = deltaOrResponse;
    const finishReason = delta.metadata?.finish_reason as
      | string
      | null
      | undefined;

    // Check if stream is finished
    const isFinished =
      delta.finished || delta.metadata?.eventType === "response.completed";

    return this.createOpenAITerminationSignal(
      finishReason,
      isFinished,
      delta.metadata || {},
    );
  }

  /**
   * Create OpenAI-specific termination signal from finish_reason
   *
   * Maps OpenAI finish_reason values to unified termination model with
   * appropriate confidence levels and metadata preservation.
   *
   * @param finishReason - OpenAI finish_reason value
   * @param shouldTerminate - Whether termination should occur
   * @param metadata - Original response metadata for preservation
   * @returns Standardized termination signal
   */
  private createOpenAITerminationSignal(
    finishReason: string | null | undefined,
    shouldTerminate: boolean,
    metadata: Record<string, unknown>,
  ): UnifiedTerminationSignal {
    // Handle cases where finish_reason is not available
    if (!finishReason || finishReason === null) {
      return createTerminationSignal(
        shouldTerminate,
        "finished", // Field name for streaming finished flag
        shouldTerminate.toString(),
        "unknown",
        "low",
        shouldTerminate
          ? "Stream marked as finished but no finish_reason provided"
          : "Stream not finished and no finish_reason available",
        metadata,
      );
    }

    // Map OpenAI finish_reason values to unified termination signals
    switch (finishReason) {
      case "stop":
        return createTerminationSignal(
          true,
          "finish_reason",
          finishReason,
          "natural_completion",
          "high",
          "Model completed response naturally",
          metadata,
        );

      case "length":
        return createTerminationSignal(
          true,
          "finish_reason",
          finishReason,
          "token_limit_reached",
          "high",
          "Response terminated due to token limit",
          metadata,
        );

      case "content_filter":
        return createTerminationSignal(
          true,
          "finish_reason",
          finishReason,
          "content_filtered",
          "high",
          "Response terminated by content filter",
          metadata,
        );

      case "function_call":
        return createTerminationSignal(
          shouldTerminate,
          "finish_reason",
          finishReason,
          "natural_completion",
          "high",
          shouldTerminate
            ? "Function call completed and marked terminal"
            : "Function call detected but not terminal",
          metadata,
        );

      case "tool_calls":
        return createTerminationSignal(
          shouldTerminate,
          "finish_reason",
          finishReason,
          "natural_completion",
          "high",
          shouldTerminate
            ? "Tool calls completed and marked terminal"
            : "Tool calls detected but not terminal",
          metadata,
        );

      default:
        return createTerminationSignal(
          shouldTerminate,
          "finish_reason",
          finishReason,
          "unknown",
          "medium",
          `Unknown finish_reason: ${finishReason}`,
          metadata,
        );
    }
  }

  /**
   * Detect if streaming response has reached termination
   *
   * Determines whether a streaming delta or final response indicates
   * that the stream has completed. Delegates to detectTermination for
   * backward compatibility.
   *
   * @param deltaOrResponse - Either a streaming delta or final response
   * @param conversationContext - Optional conversation context
   * @returns True if this indicates stream termination
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
    conversationContext?: ConversationContext,
  ): boolean {
    return this.detectTermination(deltaOrResponse, conversationContext)
      .shouldTerminate;
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
      // Log raw error before normalization
      logger.error("OpenAI provider error before normalization", {
        provider: "openai",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return normalizeOpenAIError(error);
    } catch (normalizationError) {
      // Log normalization failure
      logger.error("OpenAI error normalization failed", {
        provider: "openai",
        originalError: error instanceof Error ? error.message : String(error),
        normalizationError:
          normalizationError instanceof Error
            ? normalizationError.message
            : String(normalizationError),
      });

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
