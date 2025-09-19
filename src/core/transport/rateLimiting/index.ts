/**
 * Rate Limiting Module
 *
 * Provides token bucket algorithm implementation for rate limiting HTTP requests
 * with configurable burst capacity and refill rates. Designed for integration
 * with HTTP transport layers to enforce provider-specific rate limits.
 *
 * @example Creating and using a token bucket
 * ```typescript
 * import { TokenBucket } from "./rateLimiting";
 *
 * const bucket = new TokenBucket({
 *   maxTokens: 10,     // Burst capacity
 *   refillRate: 5,     // 5 tokens per second
 *   refillInterval: 100 // Check every 100ms
 * });
 *
 * if (bucket.consume(1)) {
 *   // Proceed with request
 * } else {
 *   // Rate limited - wait for refill
 * }
 * ```
 *
 * @example High-frequency API with burst support
 * ```typescript
 * // Allow 100 RPS with burst capacity of 500
 * const highVolumeApi = new TokenBucket({
 *   maxTokens: 500,
 *   refillRate: 100
 * });
 * ```
 */

export { TokenBucket } from "./tokenBucket";
export type { TokenBucketConfig } from "./tokenBucketConfig";
