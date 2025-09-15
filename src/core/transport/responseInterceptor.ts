/**
 * Response Interceptor Type
 *
 * Function type for intercepting and potentially modifying HTTP responses
 * after they are received from provider APIs. Enables response logging,
 * error handling, header processing, and other post-response processing.
 *
 * @example Logging response status
 * ```typescript
 * const logInterceptor: ResponseInterceptor = async (response) => {
 *   console.log(`Response: ${response.status} ${response.statusText}`);
 *   return response;
 * };
 * ```
 */
import type { ProviderHttpResponse } from "./providerHttpResponse.js";

/**
 * Function type for intercepting HTTP responses after reception.
 *
 * @param response - HTTP response to be intercepted
 * @returns Promise resolving to potentially modified HTTP response
 */
export type ResponseInterceptor = (
  response: ProviderHttpResponse,
) => Promise<ProviderHttpResponse>;
