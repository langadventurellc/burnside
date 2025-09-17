/**
 * Bridge Error Type Guard
 *
 * Type guard to check if a value is a BridgeError instance.
 * Provides runtime type checking with TypeScript type narrowing.
 *
 * @example
 * ```typescript
 * import { isBridgeError } from "./isBridgeError";
 *
 * try {
 *   // some operation
 * } catch (error) {
 *   if (isBridgeError(error)) {
 *     // error is typed as BridgeError
 *     console.log("Bridge error:", error.code);
 *   }
 * }
 * ```
 */
import { BridgeError } from "./bridgeError";

export function isBridgeError(value: unknown): value is BridgeError {
  return value instanceof BridgeError;
}
