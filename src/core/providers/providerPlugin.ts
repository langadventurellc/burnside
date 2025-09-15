import type { Message } from "../messages/message.js";
import type { BridgeError } from "../errors/bridgeError.js";
import type { ProviderHttpRequest } from "../transport/providerHttpRequest.js";
import type { ProviderHttpResponse } from "../transport/providerHttpResponse.js";
import type { ChatRequest } from "../../client/chatRequest.js";
import type { StreamDelta } from "../../client/streamDelta.js";
import type { ModelCapabilities } from "./modelCapabilities.js";

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
   * @param request - The unified request to translate (extends ChatRequest with optional stream)
   * @returns Provider-specific HTTP request ready for API call
   * @throws {BridgeError} When request translation fails
   *
   * @example
   * ```typescript
   * const httpRequest = plugin.translateRequest({
   *   messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
   *   model: "gpt-4",
   *   stream: true
   * });
   * ```
   */
  translateRequest?(
    request: ChatRequest & { stream?: boolean },
  ): ProviderHttpRequest;

  /**
   * Parse provider HTTP response back to unified format.
   *
   * Transforms the provider's HTTP response into either a complete
   * unified response or an async stream of delta chunks depending
   * on whether streaming was requested.
   *
   * @param response - The HTTP response from provider API
   * @param isStreaming - Whether the response should be treated as streaming
   * @returns Complete response with message and usage info, or async iterable of streaming deltas
   * @throws {BridgeError} When response parsing fails
   *
   * @example Non-streaming response
   * ```typescript
   * const result = plugin.parseResponse(httpResponse, false) as {
   *   message: Message;
   *   usage?: { promptTokens: number; completionTokens: number; totalTokens?: number };
   *   model: string;
   *   metadata?: Record<string, unknown>;
   * };
   * console.log(result.message.content);
   * ```
   *
   * @example Streaming response
   * ```typescript
   * const stream = plugin.parseResponse(httpResponse, true) as AsyncIterable<StreamDelta>;
   * for await (const delta of stream) {
   *   console.log(delta.delta.content);
   * }
   * ```
   */
  parseResponse?(
    response: ProviderHttpResponse,
    isStreaming: boolean,
  ):
    | {
        message: Message;
        usage?: {
          promptTokens: number;
          completionTokens: number;
          totalTokens?: number;
        };
        model: string;
        metadata?: Record<string, unknown>;
      }
    | AsyncIterable<StreamDelta>;

  /**
   * Detect if streaming response has reached termination.
   *
   * Determines whether a streaming delta or final response indicates
   * that the stream has completed and no more chunks will be sent.
   *
   * @param deltaOrResponse - Either a streaming delta or final response
   * @returns True if this indicates stream termination
   *
   * @example
   * ```typescript
   * for await (const delta of stream) {
   *   console.log(delta.delta.content);
   *   if (plugin.isTerminal(delta)) {
   *     console.log("Stream completed");
   *     break;
   *   }
   * }
   * ```
   */
  isTerminal?(
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
  ): boolean;

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
  normalizeError?(error: unknown): BridgeError;

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
