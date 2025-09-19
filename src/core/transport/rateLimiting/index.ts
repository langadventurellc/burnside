/**
 * Rate Limiting Module
 *
 * Provides token bucket algorithm implementation and rate limiter coordinator
 * for rate limiting HTTP requests with configurable burst capacity, refill rates,
 * and scope management. Designed for integration with HTTP transport layers to
 * enforce provider-specific rate limits.
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
 * @example High-level rate limiter with scope management
 * ```typescript
 * import { RateLimiter } from "./rateLimiting";
 *
 * const limiter = new RateLimiter({
 *   maxRps: 10,
 *   scope: "provider:model:key",
 *   enabled: true
 * });
 *
 * const context = { provider: "openai", model: "gpt-4", keyHash: "abc123" };
 * if (limiter.checkLimit(context)) {
 *   // Request allowed
 * } else {
 *   // Rate limited
 * }
 * ```
 */

export { TokenBucket } from "./tokenBucket";
export type { TokenBucketConfig } from "./tokenBucketConfig";
export { RateLimiter } from "./rateLimiter";
export type { RateLimitConfig } from "./rateLimitConfig";
export type { RateLimitContext } from "./rateLimitContext";
export type { RateLimitStatus } from "./rateLimitStatus";
