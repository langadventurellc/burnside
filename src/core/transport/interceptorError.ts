/**
 * Interceptor Execution Error
 *
 * Specialized error class for failures that occur during interceptor execution.
 * This error is thrown when an interceptor throws an exception, returns invalid
 * data, or fails to execute properly within the interceptor chain.
 *
 * @example Interceptor execution failure
 * ```typescript
 * try {
 *   await interceptorChain.executeRequest(context);
 * } catch (error) {
 *   if (error instanceof InterceptorError) {
 *     console.log(`Interceptor failed: ${error.interceptorType} at index ${error.interceptorIndex}`);
 *     console.log(`Original error:`, error.originalError);
 *   }
 * }
 * ```
 */
import { BridgeError } from "../errors/bridgeError.js";
import type { InterceptorErrorContext } from "./interceptorErrorContext.js";

/**
 * Error thrown when interceptor execution fails.
 *
 * Provides detailed context about which interceptor failed, why it failed,
 * and preserves the original error for debugging purposes.
 */
export class InterceptorError extends BridgeError {
  public readonly interceptorType: "request" | "response";
  public readonly interceptorIndex: number;
  public readonly phase: "validation" | "execution" | "context-threading";
  public readonly originalError?: Error;

  constructor(message: string, context: InterceptorErrorContext) {
    super(message, "INTERCEPTOR_ERROR", context);
    this.interceptorType = context.interceptorType;
    this.interceptorIndex = context.interceptorIndex;
    this.phase = context.phase;
    this.originalError = context.originalError;

    // Maintain proper stack trace for V8-based engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Custom JSON serialization for interceptor error objects.
   * Includes interceptor-specific context alongside base error information.
   */
  override toJSON(): Record<string, unknown> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      interceptorType: this.interceptorType,
      interceptorIndex: this.interceptorIndex,
      phase: this.phase,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}
