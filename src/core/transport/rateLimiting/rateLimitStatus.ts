/**
 * Rate Limiting Status Interface
 *
 * Defines the status information returned by rate limiting operations,
 * including scope keys, token availability, and enable status.
 */

/**
 * Rate limiting status information.
 */
export interface RateLimitStatus {
  /** Generated scope key for this context */
  scopeKey: string;
  /** Number of tokens currently available */
  availableTokens: number;
  /** Whether rate limiting is enabled */
  isEnabled: boolean;
}
