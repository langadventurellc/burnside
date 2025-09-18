/**
 * xAI v1 Provider Module
 *
 * Main export module for the xAI v1 provider plugin.
 * Provides the complete provider implementation and related types
 * for integration with the LLM Bridge library.
 */

// Core provider exports
export { XAIV1Provider, XAI_PROVIDER_INFO } from "./xaiV1Provider";
export type { XAIV1Config } from "./configSchema";

// Default export for easy registration
export { XAIV1Provider as default } from "./xaiV1Provider";

// Utility exports for advanced usage
export { parseXAIV1ResponseStream } from "./streamingParser";
export { parseXAIResponse } from "./responseParser";
export { translateChatRequest } from "./translator";
export { translateToolDefinitionToXAI } from "./toolTranslator";
export { translateToolsForXAI } from "./toolsTranslator";
export { XAIV1ResponseSchema, type XAIV1Response } from "./responseSchema";
export {
  XAIV1StreamingResponseSchema,
  type XAIV1StreamingResponse,
} from "./streamingResponseSchema";
export { XAIV1RequestSchema, type XAIV1Request } from "./requestSchema";
export { XAIV1ConfigSchema } from "./configSchema";
export {
  XAIV1ErrorResponseSchema,
  type XAIV1ErrorResponse,
} from "./errorResponseSchema";
export { normalizeXAIError } from "./errorNormalizer";
