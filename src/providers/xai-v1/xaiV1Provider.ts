/**
 * xAI v1 Provider Plugin
 *
 * Main provider plugin implementation for xAI's Grok models.
 * Implements the ProviderPlugin interface, orchestrating all xAI
 * component pieces (configuration, translation, parsing, error handling)
 * into a complete provider implementation.
 */

import type { ProviderPlugin } from "../../core/providers/providerPlugin";
import type { ModelCapabilities } from "../../core/providers/modelCapabilities";
import type { ChatRequest } from "../../client/chatRequest";
import type { StreamDelta } from "../../client/streamDelta";
import type { Message } from "../../core/messages/message";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import { BridgeError } from "../../core/errors/bridgeError";
import { XAIV1ConfigSchema, type XAIV1Config } from "./configSchema";
import { translateChatRequest } from "./translator";
import { parseXAIResponse } from "./responseParser";
import { parseXAIV1ResponseStream } from "./streamingParser";
import { normalizeXAIError } from "./errorNormalizer";

/**
 * xAI v1 Provider Plugin
 *
 * Implements the ProviderPlugin interface for xAI's Grok models.
 * Provides complete integration with xAI's API including streaming,
 * tool calling, and comprehensive error handling.
 */
export class XAIV1Provider implements ProviderPlugin {
  /** Unique identifier for the provider plugin */
  readonly id = "xai";

  /** Human-readable name of the provider */
  readonly name = "xAI Grok Provider";

  /** Version of the provider plugin */
  readonly version = "v1";

  /** Provider configuration */
  private config?: XAIV1Config;

  /**
   * Initialize the provider with configuration
   *
   * Validates the provided configuration against the xAI schema
   * and throws appropriate errors for invalid configurations.
   *
   * @param config - Configuration object for the xAI provider
   * @throws {BridgeError} When configuration validation fails
   */
  initialize(config: Record<string, unknown>): Promise<void> {
    try {
      this.config = XAIV1ConfigSchema.parse(config);
      return Promise.resolve();
    } catch (error) {
      throw new BridgeError("Invalid xAI configuration", "INVALID_CONFIG", {
        originalError: error,
        provider: "xai",
      });
    }
  }

  /**
   * Check if the provider supports a specific model
   *
   * Returns true for all models as model support is determined
   * by the centralized model registry. Provider accepts all
   * models routed to it.
   *
   * @param _modelId - The model ID to check (unused)
   * @returns Always true for registry-based routing
   */
  supportsModel(_modelId: string): boolean {
    return true;
  }

  /**
   * Convert unified request format to provider-specific HTTP request
   *
   * Translates the standardized ChatRequest to xAI API format,
   * including model mapping, message translation, and parameter
   * conversion.
   *
   * @param request - The unified request to translate
   * @param modelCapabilities - Optional model capability information
   * @returns Provider-specific HTTP request ready for API call
   * @throws {BridgeError} When provider not initialized or translation fails
   */
  translateRequest(
    request: ChatRequest & { stream?: boolean },
    modelCapabilities?: { temperature?: boolean },
  ): ProviderHttpRequest {
    if (!this.config) {
      throw new BridgeError("Provider not initialized", "NOT_INITIALIZED", {
        method: "translateRequest",
        provider: "xai",
      });
    }

    try {
      return translateChatRequest(request, this.config, modelCapabilities);
    } catch (error) {
      throw normalizeXAIError(error);
    }
  }

  /**
   * Parse provider HTTP response back to unified format
   *
   * Handles both streaming and non-streaming responses by delegating
   * to the appropriate parser based on the isStreaming flag.
   *
   * @param response - The HTTP response from xAI API
   * @param isStreaming - Whether the response should be treated as streaming
   * @returns Promise of complete response or async iterable of streaming deltas
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
    if (isStreaming) {
      return parseXAIV1ResponseStream(response);
    }

    // Return Promise for non-streaming responses
    return this.readResponseBody(response).then((responseText) =>
      parseXAIResponse(response, responseText),
    );
  }

  /**
   * Read ReadableStream response body to string
   *
   * @param response - HTTP response with ReadableStream body
   * @returns Promise resolving to response body as string
   * @throws {BridgeError} When response body is null or reading fails
   */
  private async readResponseBody(
    response: ProviderHttpResponse,
  ): Promise<string> {
    if (!response.body) {
      throw new BridgeError("Response body is null", "INVALID_RESPONSE", {
        provider: "xai",
        method: "readResponseBody",
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

      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedArray = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      }

      // Decode as UTF-8 string
      const decoder = new TextDecoder();
      return decoder.decode(combinedArray);
    } catch (error) {
      throw normalizeXAIError(error);
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Detect if streaming response has reached termination
   *
   * For non-streaming responses, always returns true.
   * For streaming responses, checks delta for termination indicators.
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
    // For non-streaming responses, always terminal
    if (!("delta" in deltaOrResponse)) {
      return true;
    }

    // For streaming responses, check termination conditions
    return (
      deltaOrResponse.finished ||
      (deltaOrResponse.usage !== undefined && deltaOrResponse.usage !== null)
    );
  }

  /**
   * Normalize provider-specific errors to unified error types
   *
   * Converts xAI-specific error responses and exceptions into
   * standardized BridgeError instances with appropriate error codes.
   *
   * @param error - Provider-specific error to normalize
   * @returns Standardized BridgeError with appropriate code and context
   */
  normalizeError(error: unknown): BridgeError {
    return normalizeXAIError(error);
  }

  /**
   * Provider capability descriptors
   *
   * Describes the features and capabilities that this provider supports,
   * matching xAI's Grok model capabilities.
   */
  capabilities: ModelCapabilities = {
    streaming: true,
    toolCalls: true,
    images: true,
    documents: true,
    maxTokens: 8192,
    supportedContentTypes: ["text", "image", "document"],
    temperature: true,
  };
}

/**
 * Provider metadata for registration and discovery
 */
export const XAI_PROVIDER_INFO = {
  id: "xai",
  version: "v1",
  name: "xAI Grok Provider",
  description:
    "Provider for xAI's Grok models with streaming and tool calling support",
  supportedModels: [
    "grok-3-mini",
    "grok-3",
    "grok-4-0709",
    "grok-2",
    "grok-2-mini",
    "grok-2-vision-1212",
  ],
  capabilities: {
    streaming: true,
    toolCalls: true,
    images: true,
    documents: true,
    maxTokens: 8192,
    supportedContentTypes: ["text", "image", "document"],
    temperature: true,
    topP: true,
    promptCaching: false,
  },
} as const;
