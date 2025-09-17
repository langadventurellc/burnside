import type { ToolsConfig } from "../core/config/toolsConfig";

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
  /** Default provider to use when none specified */
  defaultProvider: string;
  /** Default model to use when none specified */
  defaultModel: string;
  /** Request timeout in milliseconds */
  timeout: number;
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
}
