/**
 * HTTP Client Interface
 *
 * Interface for configurable HTTP clients with fetch injection support.
 * Extends the Transport interface with configuration capabilities,
 * enabling platform-specific fetch implementations and interceptor hooks.
 *
 * @example Creating a configured HTTP client
 * ```typescript
 * class CustomHttpClient implements HttpClient {
 *   constructor(private config: HttpClientConfig) {}
 *
 *   async fetch(request: ProviderHttpRequest, signal?: AbortSignal) {
 *     // Implementation using this.config.fetch
 *   }
 *
 *   async stream(request: ProviderHttpRequest, signal?: AbortSignal) {
 *     // Implementation using this.config.fetch for streaming
 *   }
 * }
 * ```
 */
import type { Transport } from "./transport.js";
import type { HttpClientConfig } from "./httpClientConfig.js";

/**
 * HTTP client interface with configuration support.
 *
 * Extends the Transport interface to include configuration capabilities,
 * allowing for fetch injection and interceptor patterns while maintaining
 * the same HTTP operation contracts.
 */
export interface HttpClient extends Transport {
  /** HTTP client configuration including fetch function and interceptors */
  readonly config: HttpClientConfig;
}
