/**
 * Error Taxonomy Foundation Module
 *
 * Comprehensive error handling system for the LLM Bridge library providing
 * standardized error classes, normalization interfaces, and utility functions
 * for consistent error handling across all providers and platforms.
 *
 * @example
 * ```typescript
 * import { TransportError, ERROR_CODES, serializeError } from "./errors/index.js";
 *
 * try {
 *   // some operation
 * } catch (error) {
 *   const transportError = new TransportError("Connection failed", {
 *     url: "https://api.provider.com",
 *     timeout: 30000
 *   });
 *
 *   const serialized = serializeError(transportError);
 *   console.log("Error:", serialized);
 * }
 * ```
 */

// Error Classes
export { BridgeError } from "./bridgeError.js";
export { TransportError } from "./transportError.js";
export { AuthError } from "./authError.js";
export { RateLimitError } from "./rateLimitError.js";
export { TimeoutError } from "./timeoutError.js";
export { ValidationError } from "./validationError.js";
export { ProviderError } from "./providerError.js";
export { StreamingError } from "./streamingError.js";
export { ToolError } from "./toolError.js";

// Normalization Interfaces
export type { ErrorNormalizer } from "./errorNormalizer.js";
export type { ErrorContext } from "./errorContext.js";
export type { NormalizedError } from "./normalizedError.js";
export type { ErrorCodeMapping } from "./errorCodeMapping.js";
export type { ErrorFactory } from "./errorFactory.js";

// Utility Functions and Constants
export { ERROR_CODES } from "./errorCodes.js";
export type { SerializedError } from "./serializedError.js";
export { serializeError } from "./serializeError.js";
export { isBridgeError } from "./isBridgeError.js";
