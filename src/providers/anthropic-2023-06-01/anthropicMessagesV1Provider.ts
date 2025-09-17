/**
 * Anthropic Messages v1 Provider Plugin
 *
 * Main provider plugin implementation for Anthropic's Messages API v2023-06-01.
 * Implements the ProviderPlugin interface with placeholder implementations
 * for core methods that will be implemented in subsequent tasks.
 */

import type { ProviderPlugin } from "../../core/providers/providerPlugin";
import type { ChatRequest } from "../../client/chatRequest";
import type { StreamDelta } from "../../client/streamDelta";
import type { Message } from "../../core/messages/message";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import { BridgeError } from "../../core/errors/bridgeError";
import { ValidationError } from "../../core/errors/validationError";
import {
  AnthropicMessagesConfigSchema,
  type AnthropicMessagesConfigType,
} from "./configSchema";
import { translateChatRequest } from "./translator";
import { parseAnthropicResponse } from "./responseParser";
import { parseAnthropicResponseStream } from "./streamingParser";
import { normalizeAnthropicError } from "./errorNormalizer";

/**
 * Anthropic Messages v1 Provider Plugin
 *
 * Implements the ProviderPlugin interface for Anthropic's Messages API v2023-06-01.
 * Provides foundational structure with placeholder implementations that
 * will be completed in subsequent development tasks.
 */
export class AnthropicMessagesV1Provider implements ProviderPlugin {
  /** Unique identifier for the provider plugin */
  readonly id = "anthropic";

  /** Human-readable name of the provider */
  readonly name = "Anthropic Messages Provider";

  /** Version of the provider plugin */
  readonly version = "2023-06-01";

  /** Provider configuration */
  private config?: AnthropicMessagesConfigType;

  /**
   * Initialize the provider with configuration
   *
   * Validates the provided configuration against the Anthropic schema
   * and stores it securely for subsequent operations.
   *
   * @param config - Provider configuration object
   * @throws {ValidationError} When configuration validation fails
   */
  initialize(config: Record<string, unknown>): Promise<void> {
    try {
      this.config = AnthropicMessagesConfigSchema.parse(config);
      return Promise.resolve();
    } catch (error) {
      throw new ValidationError("Invalid Anthropic provider configuration", {
        cause: error instanceof Error ? error : new Error(String(error)),
        context: { provider: "anthropic", version: "2023-06-01" },
      });
    }
  }

  /**
   * Check if the provider supports a specific model
   *
   * Returns true for any model ID as this provider follows the model-agnostic
   * pattern where the provider registry routes models to this provider.
   *
   * @param _modelId - The model identifier to check
   * @returns True if the model is supported
   */
  supportsModel(_modelId: string): boolean {
    // Model-agnostic: accept any model ID routed to this provider
    return true;
  }

  /**
   * Convert unified request format to provider-specific HTTP request
   *
   * Transforms the standardized request into an Anthropic Messages API
   * compatible HTTP request format.
   *
   * @param _request - The unified request to translate
   * @param _modelCapabilities - Optional model capabilities context
   * @returns Provider-specific HTTP request
   * @throws {BridgeError} When provider is not initialized or translation fails
   */
  translateRequest(
    request: ChatRequest & { stream?: boolean },
    _modelCapabilities?: { temperature?: boolean },
  ): ProviderHttpRequest {
    if (!this.config) {
      throw new BridgeError("Provider not initialized", "NOT_INITIALIZED", {
        provider: "anthropic",
        version: "2023-06-01",
      });
    }

    try {
      return translateChatRequest(request, this.config);
    } catch (error: unknown) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Parse provider HTTP response back to unified format
   *
   * Transforms the Anthropic API response into either a complete
   * unified response (for non-streaming) or an async stream
   * of delta chunks (for streaming responses).
   *
   * @param response - The HTTP response from Anthropic API
   * @param isStreaming - Whether the response should be treated as streaming
   * @returns Promise of complete response for non-streaming, or async iterable of streaming deltas
   * @throws {BridgeError} When response parsing fails
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
    if (!this.config) {
      throw new BridgeError("Provider not initialized", "NOT_INITIALIZED", {
        provider: "anthropic",
        version: "2023-06-01",
      });
    }

    try {
      if (isStreaming) {
        return parseAnthropicResponseStream(response);
      } else {
        // Return promise for non-streaming responses
        return (async () => {
          try {
            // Read response body first, then pass to parser
            if (!response.body) {
              throw new ValidationError("Response body is required");
            }

            const responseText = await this.readResponseBody(response.body);
            return parseAnthropicResponse(response, responseText);
          } catch (error: unknown) {
            throw this.normalizeError(error);
          }
        })();
      }
    } catch (error: unknown) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Detect if streaming response has reached termination
   *
   * Determines whether a streaming delta or final response indicates
   * that the stream has completed.
   *
   * @param deltaOrResponse - Either a streaming delta or final response
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
  ): boolean {
    // Handle complete response object (non-streaming)
    if ("message" in deltaOrResponse) {
      return true; // Non-streaming responses are always terminal
    }

    // Handle StreamDelta (streaming)
    return deltaOrResponse.finished === true;
  }

  /**
   * Normalize provider-specific errors to unified error types
   *
   * Converts Anthropic-specific error responses and exceptions into
   * standardized BridgeError instances with appropriate error codes.
   *
   * @param error - Provider-specific error to normalize
   * @returns Standardized BridgeError with appropriate code and context
   */
  normalizeError(error: unknown): BridgeError {
    // Add provider context internally since interface doesn't accept context parameter
    const enhancedContext = {
      provider: this.id,
      version: this.version,
      timestamp: new Date().toISOString(),
    };

    return normalizeAnthropicError(error, enhancedContext);
  }

  /**
   * Read response body from ReadableStream
   *
   * @param body - The response body as ReadableStream
   * @returns Promise resolving to response text
   */
  private async readResponseBody(
    body: ReadableStream<Uint8Array>,
  ): Promise<string> {
    const reader = body.getReader();
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

    // Combine chunks and decode as UTF-8
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(combined);
  }
}
