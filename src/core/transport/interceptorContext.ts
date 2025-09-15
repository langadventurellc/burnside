/**
 * Interceptor Context Interface
 *
 * Context object passed through the interceptor chain containing request,
 * optional response, metadata, and abort signal for request cancellation.
 */
import type { ProviderHttpRequest } from "./providerHttpRequest.js";
import type { ProviderHttpResponse } from "./providerHttpResponse.js";

/**
 * Context object passed through the interceptor chain.
 * Contains request, optional response, metadata, and abort signal.
 */
export interface InterceptorContext {
  /** HTTP request being processed */
  request: ProviderHttpRequest;
  /** HTTP response (available in response interceptors) */
  response?: ProviderHttpResponse;
  /** Metadata for passing custom data between interceptors */
  metadata: Record<string, unknown>;
  /** Abort signal for request cancellation */
  abortSignal?: AbortSignal;
}
