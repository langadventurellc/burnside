/**
 * Error Taxonomy Foundation Module
 *
 * Comprehensive error handling system for the LLM Bridge library providing
 * standardized error classes, normalization interfaces, and utility functions
 * for consistent error handling across all providers and platforms.
 *
 * @example
 * ```typescript
 * import { TransportError, ERROR_CODES, serializeError } from "./errors/index";
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
export { BridgeError } from "./bridgeError";
export { TransportError } from "./transportError";
export { AuthError } from "./authError";
export { RateLimitError } from "./rateLimitError";
export { TimeoutError } from "./timeoutError";
export { ValidationError } from "./validationError";
export { ProviderError } from "./providerError";
export { StreamingError } from "./streamingError";
export { ToolError } from "./toolError";

// Error Normalization
export { HttpErrorNormalizer } from "./httpErrorNormalizer";
export type { ErrorNormalizer } from "./errorNormalizer";
export type { ErrorContext } from "./errorContext";
export type { NormalizedError } from "./normalizedError";
export type { ErrorNormalizationConfig } from "./errorNormalizationConfig";
export type { ErrorCodeMapping } from "./errorCodeMapping";
export type { ErrorFactory } from "./errorFactory";

// Utility Functions and Constants
export { ERROR_CODES } from "./errorCodes";
export type { SerializedError } from "./serializedError";
export { serializeError } from "./serializeError";
export { isBridgeError } from "./isBridgeError";
