/**
 * Provider Error Class
 *
 * Error class for provider-specific API errors.
 * Used when providers return API errors that don't fit into
 * the other standard error categories.
 *
 * @example
 * ```typescript
 * const error = new ProviderError("Model not found", {
 *   provider: "openai",
 *   model: "gpt-4-invalid",
 *   providerCode: "model_not_found",
 *   providerMessage: "The model `gpt-4-invalid` does not exist"
 * });
 * ```
 */
import { BridgeError } from "./bridgeError.js";

export class ProviderError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "PROVIDER_ERROR", context);
  }
}
