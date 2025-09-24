import type { ToolsConfig } from "../core/config/toolsConfig";
import type { RateLimitConfig } from "../core/transport/rateLimiting/rateLimitConfig";
import type { RetryConfig } from "../core/transport/retry/retryConfig";

/**
 * Bridge Client Configuration
 *
 * Internal configuration interface used by BridgeClient after validation
 * and transformation of the public BridgeConfig interface.
 *
 * @example
 * ```typescript
 * const config: BridgeClientConfig = {
 *   timeout: 30000,
 *   providers: new Map([
 *     ["openai", { apiKey: "sk-..." }]
 *   ]),
 *   tools: {
 *     enabled: true,
 *     builtinTools: ["echo"],
 *     executionTimeoutMs: 5000,
 *     maxConcurrentTools: 1
 *   },
 *   toolSystemInitialized: false,
 *   registryOptions: {
 *     providers: {},
 *     models: {}
 *   },
 *   validated: true
 * };
 * ```
 */
export interface BridgeClientConfig {
  /** Request timeout in milliseconds */
  timeout: number;
  /** Default provider key (flattened format: providerType.configName) */
  defaultProvider: string;
  /** Validated provider configurations */
  providers: Map<string, Record<string, unknown>>;
  /** Tool system configuration */
  tools?: ToolsConfig;
  /** Tracks whether tool system has been initialized */
  toolSystemInitialized?: boolean;
  /** Global configuration options */
  options: Record<string, unknown>;
  /** Registry initialization options (validated internal configuration) */
  registryOptions: {
    /** Provider registry initialization data */
    providers: Record<string, unknown>;
    /** Model registry initialization data */
    models: Record<string, unknown>;
  };
  /** Indicates configuration has been validated */
  validated: boolean;
  /** Rate limiting policy configuration */
  rateLimitPolicy?: RateLimitConfig;
  /** Retry policy configuration */
  retryPolicy?: RetryConfig;
}
