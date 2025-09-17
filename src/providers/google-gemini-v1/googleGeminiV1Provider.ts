/**
 * Google Gemini v1 Provider Plugin
 *
 * Main provider plugin implementation for Google's Gemini v1 API.
 * Implements the ProviderPlugin interface with full support for chat completions,
 * streaming responses, function calling, and multimodal content processing.
 */

import type { ProviderPlugin } from "../../core/providers/providerPlugin";
import type { ChatRequest } from "../../client/chatRequest";
import type { StreamDelta } from "../../client/streamDelta";
import type { Message } from "../../core/messages/message";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import { BridgeError } from "../../core/errors/bridgeError";
import { ValidationError } from "../../core/errors/validationError";
import { ProviderError } from "../../core/errors/providerError";
import {
  GoogleGeminiV1ConfigSchema,
  type GoogleGeminiV1Config,
} from "./configSchema";
import { translateChatRequest } from "./translator";
import { parseGeminiResponse } from "./responseParser";
import { parseGeminiResponseStream } from "./streamingParser";
import { normalizeGeminiError } from "./errorNormalizer";

/**
 * Google Gemini v1 Provider Plugin
 *
 * Implements the ProviderPlugin interface for Google's Gemini v1 API.
 * Supports all 5 Gemini models with streaming, function calling, and multimodal content.
 */
export class GoogleGeminiV1Provider implements ProviderPlugin {
  /** Unique identifier for the provider plugin */
  readonly id = "google";

  /** Human-readable name of the provider */
  readonly name = "Google Gemini Provider";

  /** Version of the provider plugin */
  readonly version = "gemini-v1";

  /** Provider configuration */
  private config?: GoogleGeminiV1Config;

  /**
   * Initialize the provider with configuration
   *
   * Validates the provided configuration against the Google Gemini schema
   * and stores it for use in subsequent requests.
   *
   * @param config - Configuration object for the Google Gemini provider
   * @throws {BridgeError} When configuration is invalid
   */
  initialize(config: Record<string, unknown>): Promise<void> {
    try {
      this.config = GoogleGeminiV1ConfigSchema.parse(config);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(
        new BridgeError(
          "Invalid Google Gemini configuration",
          "INVALID_CONFIG",
          {
            originalError: error,
          },
        ),
      );
    }
  }

  /**
   * Check if the provider supports a specific model
   *
   * Determines whether the given model ID is supported by this provider.
   * Returns true for all 5 supported Gemini models.
   *
   * @param modelId - The model identifier to check
   * @returns True if the model is a supported Gemini model
   */
  supportsModel(modelId: string): boolean {
    const supportedModels = [
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ];

    return supportedModels.includes(modelId);
  }

  /**
   * Convert unified request format to provider-specific HTTP request
   *
   * Translates the unified ChatRequest format to Google Gemini v1 API format.
   *
   * @param request - The unified request to translate
   * @param modelCapabilities - Optional model capabilities for request adaptation
   * @returns HTTP request for Google Gemini v1 API
   * @throws {BridgeError} When provider is not initialized
   * @throws {ValidationError} When request translation fails
   */
  translateRequest(
    request: ChatRequest & { stream?: boolean },
    modelCapabilities?: { temperature?: boolean },
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
   * Parse responses from the Google Gemini v1 API back to unified format.
   * Handles both streaming and non-streaming responses based on the isStreaming flag.
   *
   * @param response - The HTTP response from provider API
   * @param isStreaming - Whether the response should be treated as streaming
   * @returns Promise of parsed response object for non-streaming or AsyncIterable for streaming
   * @throws {ValidationError} When response validation fails
   * @throws {StreamingError} When streaming parsing fails
   */
  parseResponse(
    response: ProviderHttpResponse,
    isStreaming: boolean,
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
      return parseGeminiResponseStream(response);
    }

    // Return Promise for non-streaming responses
    return this.readResponseBody(response).then((responseText) =>
      parseGeminiResponse(response, responseText),
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
   * - Secondary indicator: finishReason metadata indicating completion
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

    // Secondary indicator: Gemini finishReason metadata
    const finishReason = delta.metadata?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      return true;
    }

    return false;
  }

  /**
   * Normalize provider-specific errors to unified error types
   *
   * Converts Google Gemini-specific errors to appropriate BridgeError subclasses
   * based on HTTP status codes, Gemini error types, and network conditions.
   *
   * @param error - Provider-specific error to normalize
   * @returns Appropriate BridgeError subclass based on error analysis
   */
  normalizeError(error: unknown): BridgeError {
    try {
      return normalizeGeminiError(error);
    } catch (normalizationError) {
      // Fallback to generic ProviderError if normalization fails
      return new ProviderError("Error normalization failed", {
        originalError: error,
        normalizationError,
      });
    }
  }
}
