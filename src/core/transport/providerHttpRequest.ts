/**
 * Provider HTTP Request Interface
 *
 * HTTP request interface for provider API calls.
 *
 * Provides a platform-agnostic abstraction for HTTP requests that can be
 * implemented using Node.js fetch, browser fetch, or custom HTTP clients.
 * All properties align with the modern fetch API standard.
 *
 * @example Basic HTTP request
 * ```typescript
 * const request: ProviderHttpRequest = {
 *   url: "https://api.openai.com/v1/responses",
 *   method: "POST",
 *   headers: {
 *     "Content-Type": "application/json",
 *     "Authorization": "Bearer sk-..."
 *   },
 *   body: JSON.stringify({ model: "gpt-4", messages: [...] })
 * };
 * ```
 *
 * @example HTTP request with cancellation
 * ```typescript
 * const controller = new AbortController();
 * const request: ProviderHttpRequest = {
 *   url: "https://api.anthropic.com/v1/messages",
 *   method: "POST",
 *   signal: controller.signal
 * };
 * ```
 */
import type { HttpMethod } from "./httpMethod.js";

/**
 * HTTP request interface for provider API calls.
 *
 * @property url - Target URL for the HTTP request
 * @property method - HTTP method to use for the request
 * @property headers - Optional HTTP headers as key-value pairs
 * @property body - Optional request body as string or binary data
 * @property signal - Optional AbortSignal for request cancellation
 */
export interface ProviderHttpRequest {
  /** Target URL for the HTTP request */
  url: string;

  /** HTTP method to use for the request */
  method: HttpMethod;

  /** Optional HTTP headers as key-value pairs */
  headers?: Record<string, string>;

  /** Optional request body as string or binary data */
  body?: string | Uint8Array;

  /** Optional AbortSignal for request cancellation */
  signal?: AbortSignal;
}
