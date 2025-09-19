/**
 * Rate Limiter with Scope Management
 *
 * Provides a high-level rate limiting coordinator that manages multiple token buckets
 * with scoped keys (provider:version:model:keyHash[:endpoint]). Features lazy bucket
 * creation, automatic cleanup, memory efficiency, and runtime configuration updates.
 *
 * @example Global rate limiting
 * ```typescript
 * const limiter = new RateLimiter({
 *   maxRps: 10,
 *   scope: "global",
 *   enabled: true
 * });
 *
 * const context = { provider: "openai", model: "gpt-4" };
 * if (limiter.checkLimit(context)) {
 *   // Request allowed
 *   makeApiCall();
 * } else {
 *   // Rate limited
 *   throw new RateLimitError("Rate limit exceeded");
 * }
 * ```
 *
 * @example Provider-specific rate limiting with automatic cleanup
 * ```typescript
 * const limiter = new RateLimiter({
 *   maxRps: 5,
 *   scope: "provider:model:key",
 *   enabled: true
 * });
 *
 * // Each unique combination gets its own bucket
 * const context1 = { provider: "openai", model: "gpt-4", keyHash: "abc123" };
 * const context2 = { provider: "anthropic", model: "claude-3", keyHash: "def456" };
 *
 * // Independent rate limits
 * limiter.checkLimit(context1); // Uses bucket: "openai:gpt-4:abc123"
 * limiter.checkLimit(context2); // Uses bucket: "anthropic:claude-3:def456"
 * ```
 */

import { TokenBucket } from "./tokenBucket";
import type { TokenBucketConfig } from "./tokenBucketConfig";
import type { RateLimitConfig } from "./rateLimitConfig";
import type { RateLimitContext } from "./rateLimitContext";
import type { RateLimitStatus } from "./rateLimitStatus";

/**
 * Internal bucket tracking with automatic cleanup.
 */
interface BucketEntry {
  bucket: TokenBucket;
  lastUsed: number;
  cleanupTimer: NodeJS.Timeout;
}

/**
 * Rate limiter coordinator that manages multiple token buckets with scoped keys.
 *
 * Provides lazy bucket creation, automatic cleanup after 5 minutes of inactivity,
 * memory efficiency with max 1000 active buckets, and thread-safe operations.
 *
 * Features:
 * - Configurable scope levels (global, provider, provider:model, provider:model:key)
 * - Lazy bucket creation on first use
 * - Automatic cleanup to prevent memory leaks
 * - Runtime configuration updates
 * - Thread-safe concurrent access
 * - Memory protection with bucket count limits
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private readonly buckets = new Map<string, BucketEntry>();
  private readonly CLEANUP_DELAY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_BUCKETS = 1000;

  /**
   * Creates a new rate limiter with the specified configuration.
   *
   * @param config - Rate limiting configuration
   * @throws Error if configuration is invalid
   */
  constructor(config: RateLimitConfig) {
    this.validateConfig(config);
    this.config = { ...config };
  }

  /**
   * Checks if a request should be allowed based on rate limits.
   *
   * @param context - Request context for scope key generation
   * @returns true if request is allowed, false if rate limited
   */
  checkLimit(context: RateLimitContext): boolean {
    // Always allow if rate limiting is disabled
    if (!this.config.enabled) {
      return true;
    }

    const scopeKey = this.generateScopeKey(context);
    const bucket = this.getOrCreateBucket(scopeKey);

    // Update last used time and reset cleanup timer
    this.updateBucketUsage(scopeKey);

    return bucket.consume(1);
  }

  /**
   * Gets the current rate limiting status for a context.
   *
   * @param context - Request context for scope key generation
   * @returns Current status including scope key and available tokens
   */
  getStatus(context: RateLimitContext): RateLimitStatus {
    const scopeKey = this.generateScopeKey(context);

    let availableTokens = this.config.burst ?? this.config.maxRps;

    if (this.config.enabled) {
      const bucketEntry = this.buckets.get(scopeKey);
      if (bucketEntry) {
        availableTokens = bucketEntry.bucket.getAvailableTokens();
      }
    }

    return {
      scopeKey,
      availableTokens,
      isEnabled: this.config.enabled,
    };
  }

  /**
   * Updates the rate limiting configuration at runtime.
   *
   * Note: Existing buckets continue with their current configuration until
   * they are cleaned up. New buckets will use the updated configuration.
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    const newConfig = { ...this.config, ...config };
    this.validateConfig(newConfig);
    this.config = newConfig;
  }

  /**
   * Destroys the rate limiter and cleans up all buckets and timers.
   *
   * Important for preventing memory leaks when the rate limiter is no longer needed.
   */
  destroy(): void {
    // Clean up all buckets and their timers
    for (const [, entry] of this.buckets) {
      clearTimeout(entry.cleanupTimer);
      entry.bucket.destroy();
    }
    this.buckets.clear();
  }

  /**
   * Generates a deterministic scope key based on configuration and context.
   *
   * @param context - Request context
   * @returns Scope key string
   */
  private generateScopeKey(context: RateLimitContext): string {
    switch (this.config.scope) {
      case "global":
        return "global";

      case "provider":
        return context.provider;

      case "provider:model":
        return `${context.provider}:${context.model ?? ""}`;

      case "provider:model:key":
        return `${context.provider}:${context.model ?? ""}:${context.keyHash ?? ""}`;

      default:
        // TypeScript should prevent this, but add runtime safety
        throw new Error(`Unknown scope: ${String(this.config.scope)}`);
    }
  }

  /**
   * Gets an existing bucket or creates a new one for the scope key.
   *
   * @param scopeKey - Generated scope key
   * @returns Token bucket instance
   */
  private getOrCreateBucket(scopeKey: string): TokenBucket {
    const existing = this.buckets.get(scopeKey);
    if (existing) {
      return existing.bucket;
    }

    // Enforce memory limit by removing least recently used bucket
    if (this.buckets.size >= this.MAX_BUCKETS) {
      this.evictLeastRecentlyUsedBucket();
    }

    // Create new bucket with current configuration
    const bucketConfig: TokenBucketConfig = {
      maxTokens: this.config.burst ?? this.config.maxRps,
      refillRate: this.config.maxRps,
      refillInterval: 100, // 100ms intervals for smooth refill
    };

    const bucket = new TokenBucket(bucketConfig);
    const cleanupTimer = this.scheduleCleanup(scopeKey);

    this.buckets.set(scopeKey, {
      bucket,
      lastUsed: performance.now(),
      cleanupTimer,
    });

    return bucket;
  }

  /**
   * Updates the last used time for a bucket and resets its cleanup timer.
   *
   * @param scopeKey - Scope key to update
   */
  private updateBucketUsage(scopeKey: string): void {
    const entry = this.buckets.get(scopeKey);
    if (!entry) {
      return;
    }

    entry.lastUsed = performance.now();

    // Reset cleanup timer
    clearTimeout(entry.cleanupTimer);
    entry.cleanupTimer = this.scheduleCleanup(scopeKey);
  }

  /**
   * Schedules automatic cleanup for a bucket after the cleanup delay.
   *
   * @param scopeKey - Scope key to schedule cleanup for
   * @returns Cleanup timer
   */
  private scheduleCleanup(scopeKey: string): NodeJS.Timeout {
    return setTimeout(() => {
      this.cleanupBucket(scopeKey);
    }, this.CLEANUP_DELAY_MS);
  }

  /**
   * Removes and destroys a bucket and its associated timer.
   *
   * @param scopeKey - Scope key to clean up
   */
  private cleanupBucket(scopeKey: string): void {
    const entry = this.buckets.get(scopeKey);
    if (entry) {
      clearTimeout(entry.cleanupTimer);
      entry.bucket.destroy();
      this.buckets.delete(scopeKey);
    }
  }

  /**
   * Evicts the least recently used bucket to make room for new ones.
   */
  private evictLeastRecentlyUsedBucket(): void {
    let oldestKey: string | null = null;
    let oldestTime = Number.MAX_SAFE_INTEGER;

    for (const [key, entry] of this.buckets) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cleanupBucket(oldestKey);
    }
  }

  /**
   * Validates the rate limiting configuration.
   *
   * @param config - Configuration to validate
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: RateLimitConfig): void {
    if (config.maxRps <= 0) {
      throw new Error("maxRps must be greater than 0");
    }

    if (config.burst !== undefined && config.burst <= 0) {
      throw new Error("burst must be greater than 0");
    }

    if (config.burst !== undefined && config.burst < config.maxRps) {
      throw new Error("burst capacity cannot be less than maxRps");
    }

    const validScopes = [
      "global",
      "provider",
      "provider:model",
      "provider:model:key",
    ];
    if (!validScopes.includes(config.scope)) {
      throw new Error(`scope must be one of: ${validScopes.join(", ")}`);
    }
  }
}
