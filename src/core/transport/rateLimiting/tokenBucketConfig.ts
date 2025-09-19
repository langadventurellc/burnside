/**
 * Token Bucket Configuration Interface
 *
 * Defines the configuration options for token bucket initialization,
 * including burst capacity, refill rate, and timing parameters.
 */

/**
 * Configuration interface for token bucket initialization.
 */
export interface TokenBucketConfig {
  /** Maximum number of tokens the bucket can hold (burst capacity) */
  maxTokens: number;
  /** Rate at which tokens are added to the bucket (tokens per second) */
  refillRate: number;
  /** Interval between refill operations in milliseconds (default: 100ms) */
  refillInterval?: number;
}
