/**
 * Interceptor Chain System
 *
 * Manages request and response interceptors with priority-based execution order.
 * Request interceptors execute in priority order (higher priority first), while
 * response interceptors execute in reverse priority order (lower priority first).
 *
 * @example Basic usage
 * ```typescript
 * const chain = new InterceptorChain();
 *
 * // Add request interceptor (auth)
 * chain.addRequestInterceptor(async (context) => {
 *   return {
 *     ...context,
 *     request: {
 *       ...context.request,
 *       headers: { ...context.request.headers, 'Authorization': 'Bearer token' }
 *     }
 *   };
 * }, 100);
 *
 * // Execute request chain
 * const result = await chain.executeRequest(context);
 * ```
 */
import { InterceptorError } from "./interceptorError";
import type { InterceptorErrorContext } from "./interceptorErrorContext";
import type { InterceptorContext } from "./interceptorContext";
import type { RequestInterceptor } from "./requestInterceptorChain";
import type { ResponseInterceptor } from "./responseInterceptorChain";

/**
 * Internal interceptor wrapper with priority and registration order.
 */
interface InterceptorEntry<T> {
  interceptor: T;
  priority: number;
  registrationOrder: number;
}

/**
 * Interceptor chain manager for request/response lifecycle hooks.
 *
 * Provides secure, ordered execution of interceptors with proper error handling,
 * context threading, and abort signal support.
 */
export class InterceptorChain {
  private requestInterceptors: InterceptorEntry<RequestInterceptor>[] = [];
  private responseInterceptors: InterceptorEntry<ResponseInterceptor>[] = [];
  private registrationCounter = 0;

  /**
   * Add a request interceptor to the chain.
   *
   * @param interceptor - Function to intercept requests
   * @param priority - Execution priority (higher = earlier, default: 0)
   */
  addRequestInterceptor(interceptor: RequestInterceptor, priority = 0): void {
    this.validateInterceptor(interceptor);

    this.requestInterceptors.push({
      interceptor,
      priority,
      registrationOrder: this.registrationCounter++,
    });

    // Sort by priority (descending), then registration order (ascending)
    this.requestInterceptors.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.registrationOrder - b.registrationOrder;
    });
  }

  /**
   * Add a response interceptor to the chain.
   *
   * @param interceptor - Function to intercept responses
   * @param priority - Execution priority (lower = earlier for responses, default: 0)
   */
  addResponseInterceptor(interceptor: ResponseInterceptor, priority = 0): void {
    this.validateInterceptor(interceptor);

    this.responseInterceptors.push({
      interceptor,
      priority,
      registrationOrder: this.registrationCounter++,
    });

    // Sort by priority (ascending), then reverse registration order
    this.responseInterceptors.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority first for responses
      }
      return b.registrationOrder - a.registrationOrder; // Reverse order
    });
  }

  /**
   * Execute all request interceptors in priority order.
   *
   * @param context - Initial context to process
   * @returns Promise resolving to processed context
   * @throws InterceptorError when interceptor execution fails
   */
  async executeRequest(
    context: InterceptorContext,
  ): Promise<InterceptorContext> {
    this.validateContext(context);

    let currentContext = this.cloneContext(context);

    for (let i = 0; i < this.requestInterceptors.length; i++) {
      const entry = this.requestInterceptors[i];

      try {
        this.checkAbortSignal(currentContext.abortSignal);

        const result = await this.executeInterceptorSafely(
          entry.interceptor,
          currentContext,
        );

        this.checkAbortSignal(currentContext.abortSignal);
        currentContext = this.validateAndCloneContext(result);
      } catch (error) {
        this.throwInterceptorError(`Request interceptor at index ${i} failed`, {
          interceptorType: "request",
          interceptorIndex: i,
          phase: "execution",
          originalError:
            error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    return currentContext;
  }

  /**
   * Execute all response interceptors in reverse priority order.
   *
   * @param context - Context with response to process
   * @returns Promise resolving to processed context
   * @throws InterceptorError when interceptor execution fails
   */
  async executeResponse(
    context: InterceptorContext,
  ): Promise<InterceptorContext> {
    this.validateContext(context);

    if (!context.response) {
      throw new InterceptorError(
        "Response interceptor requires context.response to be defined",
        {
          interceptorType: "response",
          interceptorIndex: -1,
          phase: "validation",
        },
      );
    }

    let currentContext = this.cloneContext(context);

    for (let i = 0; i < this.responseInterceptors.length; i++) {
      const entry = this.responseInterceptors[i];

      try {
        this.checkAbortSignal(currentContext.abortSignal);

        const result = await this.executeInterceptorSafely(
          entry.interceptor,
          currentContext,
        );

        currentContext = this.validateAndCloneContext(result);
      } catch (error) {
        this.throwInterceptorError(
          `Response interceptor at index ${i} failed`,
          {
            interceptorType: "response",
            interceptorIndex: i,
            phase: "execution",
            originalError:
              error instanceof Error ? error : new Error(String(error)),
          },
        );
      }
    }

    return currentContext;
  }

  /**
   * Remove all interceptors from the chain.
   */
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.registrationCounter = 0;
  }

  /**
   * Get count of registered interceptors.
   */
  getInterceptorCounts(): { request: number; response: number } {
    return {
      request: this.requestInterceptors.length,
      response: this.responseInterceptors.length,
    };
  }

  private validateInterceptor(interceptor: unknown): void {
    if (typeof interceptor !== "function") {
      throw new InterceptorError("Interceptor must be a function", {
        interceptorType: "request",
        interceptorIndex: -1,
        phase: "validation",
      });
    }
  }

  private validateContext(context: unknown): void {
    if (!context || typeof context !== "object") {
      throw new InterceptorError("Context must be a non-null object", {
        interceptorType: "request",
        interceptorIndex: -1,
        phase: "validation",
      });
    }

    const ctx = context as Record<string, unknown>;
    if (!ctx.request || typeof ctx.request !== "object") {
      throw new InterceptorError(
        "Context must contain a valid request object",
        {
          interceptorType: "request",
          interceptorIndex: -1,
          phase: "validation",
        },
      );
    }
  }

  private cloneContext(context: InterceptorContext): InterceptorContext {
    return {
      request: { ...context.request },
      response: context.response ? { ...context.response } : context.response,
      metadata: { ...context.metadata },
      abortSignal: context.abortSignal,
    };
  }

  private validateAndCloneContext(result: unknown): InterceptorContext {
    if (!result || typeof result !== "object") {
      throw new InterceptorError(
        "Interceptor must return a valid context object",
        {
          interceptorType: "request",
          interceptorIndex: -1,
          phase: "context-threading",
        },
      );
    }

    const ctx = result as InterceptorContext;
    this.validateContext(ctx);
    return this.cloneContext(ctx);
  }

  private async executeInterceptorSafely(
    interceptor: (
      context: InterceptorContext,
    ) => Promise<InterceptorContext> | InterceptorContext,
    context: InterceptorContext,
  ): Promise<InterceptorContext> {
    const result = interceptor(context);
    return result instanceof Promise ? await result : result;
  }

  private checkAbortSignal(abortSignal?: AbortSignal): void {
    if (abortSignal?.aborted) {
      throw new InterceptorError(
        "Request was aborted during interceptor execution",
        {
          interceptorType: "request",
          interceptorIndex: -1,
          phase: "execution",
        },
      );
    }
  }

  private throwInterceptorError(
    message: string,
    context: InterceptorErrorContext,
  ): never {
    throw new InterceptorError(message, context);
  }
}
