/**
 * Runtime Error
 *
 * Runtime-specific error class for adapter operations.
 * Extends BridgeError with runtime adapter context.
 */

import { BridgeError } from "../errors/bridgeError.js";

/**
 * Runtime-specific error class for adapter operations.
 * Extends BridgeError with runtime adapter context.
 */
export class RuntimeError extends BridgeError {
  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
  ) {
    super(message, code, {
      ...context,
      component: "runtime",
    });
  }
}
