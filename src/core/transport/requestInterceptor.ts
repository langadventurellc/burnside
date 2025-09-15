/**
 * Request Interceptor Type
 *
 * Function type for intercepting and potentially modifying HTTP requests
 * before they are sent to provider APIs. Enables request logging,
 * authentication injection, header modification, and other pre-request processing.
 *
 * @example Adding authentication headers
 * ```typescript
 * const authInterceptor: RequestInterceptor = async (request) => {
 *   return {
 *     ...request,
 *     headers: {
 *       ...request.headers,
 *       'Authorization': 'Bearer ' + await getToken()
 *     }
 *   };
 * };
 * ```
 */
import type { ProviderHttpRequest } from "./providerHttpRequest.js";

/**
 * Function type for intercepting HTTP requests before transmission.
 *
 * @param request - Original HTTP request to be intercepted
 * @returns Promise resolving to potentially modified HTTP request
 */
export type RequestInterceptor = (
  request: ProviderHttpRequest,
) => Promise<ProviderHttpRequest>;
