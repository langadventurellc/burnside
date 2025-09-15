/**
 * Model Config Interface
 *
 * Configuration interface for model-specific settings and parameters.
 * Defines the structure for configuring individual models within
 * the bridge library.
 *
 * @example
 * ```typescript
 * const gpt4Config: ModelConfig = {
 *   modelId: "gpt-4",
 *   temperature: 0.7,
 *   maxTokens: 2000,
 *   topP: 0.9,
 *   presencePenalty: 0.1
 * };
 * ```
 */
export interface ModelConfig {
  /** Identifier for the specific model */
  modelId: string;
  /** Temperature for response randomness (0.0 to 2.0) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Presence penalty for response diversity */
  presencePenalty?: number;
  /** Frequency penalty for response diversity */
  frequencyPenalty?: number;
  /** Additional model-specific parameters */
  parameters?: Record<string, unknown>;
}
