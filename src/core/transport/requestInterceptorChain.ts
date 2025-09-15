/**
 * Request Interceptor Type for Chain
 *
 * Request interceptor function type for the interceptor chain system.
 * Receives context and returns potentially modified context.
 */
import type { InterceptorContext } from "./interceptorContext.js";

/**
 * Request interceptor function type.
 * Receives context and returns potentially modified context.
 */
export type RequestInterceptor = (
  context: InterceptorContext,
) => Promise<InterceptorContext> | InterceptorContext;
