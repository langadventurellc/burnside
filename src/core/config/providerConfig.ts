/**
 * Provider Config Interface
 *
 * Configuration interface for provider-specific settings.
 * Defines the structure for configuring individual LLM providers
 * within the bridge library.
 *
 * @example
 * ```typescript
 * const openaiConfig: ProviderConfig = {
 *   apiKey: "sk-...",
 *   baseUrl: "https://api.openai.com/v1",
 *   timeout: 30000,
 *   retries: 3
 * };
 * ```
 */
export interface ProviderConfig {
  /** API key for the provider */
  apiKey?: string;
  /** Base URL for the provider's API */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Additional provider-specific configuration */
  options?: Record<string, unknown>;
}
