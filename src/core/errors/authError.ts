/**
 * Authentication Error Class
 *
 * Error class for authentication and authorization failures.
 * Used when API keys are invalid, expired, or when authorization
 * checks fail during provider communication.
 *
 * @example
 * ```typescript
 * const error = new AuthError("Invalid API key", {
 *   provider: "openai",
 *   keyType: "api_key",
 *   lastFourChars: "sk-..1234"
 * });
 * ```
 */
import { BridgeError } from "./bridgeError";

export class AuthError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "AUTH_ERROR", context);
  }
}
