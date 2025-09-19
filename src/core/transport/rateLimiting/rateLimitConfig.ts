/**
 * Rate Limiting Configuration Interface
 *
 * Defines the configuration options for rate limiting behavior,
 * including scope levels, rate limits, and enable/disable flags.
 */

/**
 * Configuration interface for rate limiting behavior.
 */
export interface RateLimitConfig {
  /** Maximum requests per second */
  maxRps: number;
  /** Burst capacity (defaults to maxRps if not specified) */
  burst?: number;
  /** Scope level for rate limiting isolation */
  scope: "global" | "provider" | "provider:model" | "provider:model:key";
  /** Whether rate limiting is enabled (when false, all requests pass through) */
  enabled: boolean;
}
