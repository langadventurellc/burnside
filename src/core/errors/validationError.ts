/**
 * Validation Error Class
 *
 * Error class for input validation failures.
 * Used when user-provided inputs fail validation checks
 * before being sent to providers.
 *
 * @example
 * ```typescript
 * const error = new ValidationError("Invalid message format", {
 *   field: "messages[0].content",
 *   expectedType: "string | ContentPart[]",
 *   receivedType: "number"
 * });
 * ```
 */
import { BridgeError } from "./bridgeError.js";

export class ValidationError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", context);
  }
}
