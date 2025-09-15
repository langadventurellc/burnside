/**
 * Interceptor Error Context Interface
 *
 * Context information for interceptor execution failures.
 * Used to provide detailed information about interceptor failures
 * including the type, position, and phase of execution.
 */

/**
 * Context information for interceptor execution failures.
 */
export interface InterceptorErrorContext {
  /** Type of interceptor that failed ("request" or "response") */
  interceptorType: "request" | "response";
  /** Index position of the failed interceptor in the chain */
  interceptorIndex: number;
  /** Execution phase when the error occurred */
  phase: "validation" | "execution" | "context-threading";
  /** Original error that caused the interceptor failure */
  originalError?: Error;
  /** Additional context information */
  [key: string]: unknown;
}
