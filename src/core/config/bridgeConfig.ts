import type { ToolsConfig } from "./toolsConfig";

/**
 * Bridge Config Interface
 *
 * Top-level configuration interface for the LLM Bridge library.
 * Defines the main configuration structure for library initialization
 * and operation across different platforms and providers.
 *
 * @example
 * ```typescript
 * const config: BridgeConfig = {
 *   defaultProvider: "openai",
 *   providers: {
 *     openai: { apiKey: "sk-..." },
 *     anthropic: { apiKey: "sk-ant-..." }
 *   },
 *   defaultModel: "gpt-4",
 *   timeout: 30000,
 *   registryOptions: {
 *     providers: {},
 *     models: {}
 *   },
 *   tools: {
 *     enabled: true,
 *     builtinTools: ["echo"],
 *     executionTimeoutMs: 5000
 *   },
 *   rateLimitPolicy: {
 *     enabled: true,
 *     maxRps: 10,
 *     burst: 20,
 *     scope: "provider:model"
 *   },
 *   retryPolicy: {
 *     attempts: 3,
 *     backoff: "exponential",
 *     baseDelayMs: 1000,
 *     maxDelayMs: 30000,
 *     jitter: true,
 *     retryableStatusCodes: [429, 500, 502, 503, 504]
 *   }
 * };
 * ```
 */
export interface BridgeConfig {
  /** Default provider to use when none specified */
  defaultProvider?: string;
  /** Configuration for each provider */
  providers?: Record<string, Record<string, unknown>>;
  /** Default model to use when none specified */
  defaultModel?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Additional global configuration options */
  options?: Record<string, unknown>;
  /** Registry initialization options for Phase 1 (empty state) */
  registryOptions?: {
    /** Provider registry initialization data */
    providers?: Record<string, unknown>;
    /** Model registry initialization data */
    models?: Record<string, unknown>;
  };

  /** Optional model registry seeding configuration */
  modelSeed?:
    | "builtin" // use packaged default seed
    | "none" // do not seed (default)
    | { data?: unknown } // app‑supplied JSON object matching DefaultLlmModels schema
    | { path: string }; // Node-only path; prefer supplying data instead in cross-platform apps

  /** Tool system configuration */
  tools?: ToolsConfig;

  /** Rate limiting policy configuration */
  rateLimitPolicy?: {
    /** Enable/disable rate limiting (default: false) */
    enabled?: boolean;
    /** Maximum requests per second */
    maxRps?: number;
    /** Burst capacity (default: maxRps * 2) */
    burst?: number;
    /** Rate limiting scope granularity */
    scope?: "global" | "provider" | "provider:model" | "provider:model:key";
  };

  /** Retry policy configuration */
  retryPolicy?: {
    /** Number of retry attempts (default: 2) */
    attempts?: number;
    /** Backoff strategy type */
    backoff?: "exponential" | "linear";
    /** Base delay in milliseconds */
    baseDelayMs?: number;
    /** Maximum delay in milliseconds */
    maxDelayMs?: number;
    /** Enable jitter to prevent thundering herd */
    jitter?: boolean;
    /** HTTP status codes that trigger retries */
    retryableStatusCodes?: number[];
  };
}
