/**
 * Model Capabilities Interface
 *
 * Interface describing the features and capabilities that a specific
 * LLM model supports, such as streaming, tool calling, and content types.
 *
 * @example
 * ```typescript
 * const gpt4Capabilities: ModelCapabilities = {
 *   streaming: true,
 *   toolCalls: true,
 *   images: true,
 *   documents: false,
 *   temperature: true,
 *   maxTokens: 128000,
 *   supportedContentTypes: ["text", "image"]
 * };
 * ```
 */
export interface ModelCapabilities {
  /** Whether the model supports streaming responses */
  streaming: boolean;
  /** Whether the model supports tool/function calling */
  toolCalls: boolean;
  /** Whether the model supports image inputs */
  images: boolean;
  /** Whether the model supports document inputs */
  documents: boolean;
  /** Whether the model supports temperature parameter */
  temperature?: boolean;
  /** Maximum number of tokens the model can handle */
  maxTokens?: number;
  /** Array of supported content types */
  supportedContentTypes: string[];
  /** Additional capability metadata */
  metadata?: Record<string, unknown>;
}
