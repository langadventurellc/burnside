/**
 * Bridge Client Configuration
 *
 * Internal configuration interface used by BridgeClient after validation
 * and transformation of the public BridgeConfig interface.
 *
 * @example
 * ```typescript
 * const config: BridgeClientConfig = {
 *   defaultProvider: "openai",
 *   defaultModel: "gpt-4",
 *   timeout: 30000,
 *   providers: new Map([
 *     ["openai", { apiKey: "sk-..." }]
 *   ]),
 *   validated: true
 * };
 * ```
 */
export interface BridgeClientConfig {
  /** Default provider to use when none specified */
  defaultProvider: string;
  /** Default model to use when none specified */
  defaultModel: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Validated provider configurations */
  providers: Map<string, Record<string, unknown>>;
  /** Global configuration options */
  options: Record<string, unknown>;
  /** Indicates configuration has been validated */
  validated: boolean;
}
