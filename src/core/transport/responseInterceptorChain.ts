/**
 * Response Interceptor Type for Chain
 *
 * Response interceptor function type for the interceptor chain system.
 * Receives context and returns potentially modified context.
 */
import type { InterceptorContext } from "./interceptorContext";

/**
 * Response interceptor function type.
 * Receives context and returns potentially modified context.
 */
export type ResponseInterceptor = (
  context: InterceptorContext,
) => Promise<InterceptorContext> | InterceptorContext;
