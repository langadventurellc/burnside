import type { HttpMethod } from "../transport/httpMethod.js";
import type { ProviderHttpRequest } from "../transport/providerHttpRequest.js";

/**
 * Create a basic HTTP request object for provider APIs.
 *
 * Helper for constructing HTTP requests with common headers and structure
 * used by most LLM provider APIs.
 *
 * @param config - Request configuration
 * @returns HTTP request object
 *
 * @example
 * ```typescript
 * const request = createHttpRequest({
 *   url: "https://api.openai.com/v1/responses",
 *   method: "POST",
 *   headers: { "Authorization": "Bearer sk-..." },
 *   body: { model: "gpt-4", messages: [...] }
 * });
 * ```
 */
export function createHttpRequest(config: {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}): ProviderHttpRequest {
  const body = config.body
    ? typeof config.body === "string"
      ? config.body
      : JSON.stringify(config.body)
    : undefined;

  return {
    url: config.url,
    method: config.method,
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
    body,
    signal: config.signal,
  };
}
