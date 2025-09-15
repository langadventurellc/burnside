/**
 * Provider Plugin Interface
 *
 * Generic placeholder interface for provider plugin implementations.
 * Defines the basic structure that all provider plugins must implement
 * to integrate with the LLM Bridge library.
 *
 * @example
 * ```typescript
 * const openaiPlugin: ProviderPlugin = {
 *   id: "openai",
 *   name: "OpenAI Provider",
 *   version: "1.0.0",
 *   initialize: async (config) => { ... },
 *   supportsModel: (modelId) => modelId.startsWith("gpt-")
 * };
 * ```
 */
export interface ProviderPlugin {
  /** Unique identifier for the provider plugin */
  id: string;
  /** Human-readable name of the provider */
  name: string;
  /** Version of the provider plugin */
  version: string;
  /** Initialize the provider with configuration */
  initialize?: (config: Record<string, unknown>) => Promise<void>;
  /** Check if the provider supports a specific model */
  supportsModel?: (modelId: string) => boolean;
  /** Additional provider-specific metadata */
  metadata?: Record<string, unknown>;
}
