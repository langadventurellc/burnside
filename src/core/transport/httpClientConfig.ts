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
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";

/**
 * Configuration interface for HTTP clients with runtime adapter injection.
 *
 * @property runtimeAdapter - Runtime adapter for platform operations
 * @property fetch - Custom fetch function implementation (deprecated - use runtimeAdapter)
 * @property requestInterceptors - Optional array of request interceptors
 * @property responseInterceptors - Optional array of response interceptors
 */
export interface HttpClientConfig {
  /** Runtime adapter for platform operations */
  runtimeAdapter?: RuntimeAdapter;

  /** @deprecated Use RuntimeAdapter.fetch instead */
  fetch?: FetchFunction;

  /** Optional array of request interceptors */
  requestInterceptors?: RequestInterceptor[];

  /** Optional array of response interceptors */
  responseInterceptors?: ResponseInterceptor[];
}
