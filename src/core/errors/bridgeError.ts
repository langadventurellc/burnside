/**
 * Base Error Class
 *
 * Provides the foundational error class for all LLM Bridge library errors.
 * All library errors inherit from BridgeError which extends the native Error class
 * with additional context and error code information.
 *
 * @example
 * ```typescript
 * const error = new BridgeError("Something went wrong", "BRIDGE_ERROR", {
 *   component: "transport",
 *   requestId: "req_123"
 * });
 *
 * console.log(error.code); // "BRIDGE_ERROR"
 * console.log(error.context?.requestId); // "req_123"
 * ```
 */
export class BridgeError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;

    // Maintain proper stack trace for V8-based engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Custom JSON serialization for error objects.
   * Ensures that code, context, and other properties are included in JSON.stringify().
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}
