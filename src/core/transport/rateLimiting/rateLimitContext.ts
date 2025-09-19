/**
 * Rate Limiting Context Interface
 *
 * Defines the context information used for generating scope keys
 * in rate limiting operations.
 */

/**
 * Context information for generating scope keys.
 */
export interface RateLimitContext {
  /** Provider name (e.g., "openai", "anthropic") */
  provider: string;
  /** API version (optional) */
  version?: string;
  /** Model name (e.g., "gpt-4", "claude-3") */
  model?: string;
  /** Hashed API key identifier */
  keyHash?: string;
  /** Specific endpoint path (optional) */
  endpoint?: string;
}
