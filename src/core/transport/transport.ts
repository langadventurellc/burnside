/**
 * Transport Interface
 *
 * Main interface contract for HTTP operations with streaming support.
 * Defines the core methods for communicating with LLM provider APIs,
 * supporting both standard HTTP requests and streaming responses.
 *
 * @example Basic HTTP request
 * ```typescript
 * const transport: Transport = new HttpTransport();
 * const response = await transport.fetch({
 *   url: "https://api.openai.com/v1/responses",
 *   method: "POST",
 *   headers: { "Authorization": "Bearer sk-..." },
 *   body: JSON.stringify({ model: "gpt-4", messages: [...] })
 * });
 * ```
 *
 * @example Streaming request
 * ```typescript
 * const transport: Transport = new HttpTransport();
 * const stream = await transport.stream({
 *   url: "https://api.openai.com/v1/responses",
 *   method: "POST",
 *   headers: { "Authorization": "Bearer sk-..." },
 *   body: JSON.stringify({ model: "gpt-4", stream: true, messages: [...] })
 * });
 *
 * for await (const chunk of stream) {
 *   console.log(new TextDecoder().decode(chunk));
 * }
 * ```
 */
import type { ProviderHttpRequest } from "./providerHttpRequest";
import type { ProviderHttpResponse } from "./providerHttpResponse";
import type { StreamResponse } from "./streamResponse";

/**
 * Main transport interface for HTTP operations with LLM providers.
 *
 * Provides methods for both standard HTTP requests and streaming responses,
 * with support for request cancellation through AbortSignal. Implementations
 * should handle network errors, timeouts, and platform-specific concerns.
 */
export interface Transport {
  /**
   * Performs a standard HTTP request to a provider API.
   *
   * @param request - HTTP request configuration
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise resolving to HTTP response
   * @throws TransportError for network or HTTP-level failures
   */
  fetch(
    request: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<ProviderHttpResponse>;

  /**
   * Performs a streaming HTTP request to a provider API.
   *
   * Returns a StreamResponse containing both HTTP metadata and raw stream content.
   * For SSE responses (text/event-stream), preserves raw SSE framing for provider parsing.
   * For other content types, maintains current parsing behavior.
   *
   * @param request - HTTP request configuration
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise resolving to StreamResponse with HTTP metadata and stream
   * @throws TransportError for network or HTTP-level failures
   */
  stream(
    request: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<StreamResponse>;
}
