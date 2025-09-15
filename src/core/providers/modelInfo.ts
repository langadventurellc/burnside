/**
 * Model Info Interface
 *
 * Interface containing metadata and information about a specific LLM model,
 * including version, provider details, and operational characteristics.
 *
 * @example
 * ```typescript
 * const gpt4Info: ModelInfo = {
 *   id: "gpt-4",
 *   name: "GPT-4",
 *   provider: "openai",
 *   version: "gpt-4-0613",
 *   description: "Large multimodal model with improved reasoning"
 * };
 * ```
 */
export interface ModelInfo {
  /** Unique identifier for the model */
  id: string;
  /** Human-readable name of the model */
  name: string;
  /** Provider that offers this model */
  provider: string;
  /** Specific version or variant of the model */
  version?: string;
  /** Description of the model's capabilities and purpose */
  description?: string;
  /** Additional model metadata */
  metadata?: Record<string, unknown>;
}
