/**
 * HTTP Client Configuration Interface
 *
 * Configuration interface for HTTP clients with fetch injection and
 * interceptor support. Enables platform-specific fetch implementations
 * and request/response processing hooks.
 *
 * @example Basic configuration with custom fetch
 * ```typescript
 * const config: HttpClientConfig = {
 *   fetch: customFetch,
 *   requestInterceptors: [authInterceptor],
 *   responseInterceptors: [logInterceptor]
 * };
 * ```
 */
import type { FetchFunction } from "./fetchFunction";
import type { RequestInterceptor } from "./requestInterceptor";
import type { ResponseInterceptor } from "./responseInterceptor";

/**
 * Configuration interface for HTTP clients with fetch injection.
 *
 * @property fetch - Custom fetch function implementation
 * @property requestInterceptors - Optional array of request interceptors
 * @property responseInterceptors - Optional array of response interceptors
 */
export interface HttpClientConfig {
  /** Custom fetch function implementation */
  fetch: FetchFunction;

  /** Optional array of request interceptors */
  requestInterceptors?: RequestInterceptor[];

  /** Optional array of response interceptors */
  responseInterceptors?: ResponseInterceptor[];
}
