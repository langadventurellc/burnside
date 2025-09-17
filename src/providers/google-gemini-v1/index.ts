/**
 * Google Gemini v1 Provider Module
 *
 * Main export module for the Google Gemini v1 provider plugin.
 * Provides the complete provider implementation and related types
 * for integration with the LLM Bridge library.
 */

// Core provider exports
export { GoogleGeminiV1Provider } from "./googleGeminiV1Provider";
export type { GoogleGeminiV1Config } from "./configSchema";

// Default export for easy registration
export { GoogleGeminiV1Provider as default } from "./googleGeminiV1Provider";

/**
 * Provider plugin metadata for identification
 */
export const GOOGLE_GEMINI_PROVIDER_INFO = {
  id: "google",
  version: "gemini-v1",
  name: "Google Gemini Provider",
} as const;

// Utility exports for advanced usage
export { parseGeminiResponseStream } from "./streamingParser";
export { parseGeminiResponse } from "./responseParser";
export { translateChatRequest } from "./translator";
export { toolTranslator, parseFunctionCall } from "./toolTranslator";
export {
  GoogleGeminiV1ResponseSchema,
  GoogleGeminiV1StreamingResponseSchema,
  type GoogleGeminiV1Response,
} from "./responseSchema";
export {
  GoogleGeminiV1RequestSchema,
  type GoogleGeminiV1Request,
} from "./requestSchema";
export { GoogleGeminiV1ConfigSchema } from "./configSchema";
export { normalizeGeminiError } from "./errorNormalizer";
