/**
 * @file tokenBucket.test.ts
 * @description Comprehensive unit tests for TokenBucket class covering all functional requirements,
 * edge cases, and performance characteristics as specified in the task acceptance criteria.
 */

import { TokenBucket } from "../tokenBucket";
import type { TokenBucketConfig } from "../tokenBucketConfig";

describe("TokenBucket", () => {
  // Default configuration for tests
  const defaultConfig: TokenBucketConfig = {
    maxTokens: 10,
    refillRate: 5,
    refillInterval: 100,
  };

  // Helper function to create test configurations
  const createConfig = (
    overrides: Partial<TokenBucketConfig> = {},
  ): TokenBucketConfig => ({
    ...defaultConfig,
    ...overrides,
  });

  // Helper function to wait for a specific amount of time
  const waitMs = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Cleanup helper to destroy buckets after each test
  let activeBuckets: TokenBucket[] = [];

  const createBucket = (config: TokenBucketConfig): TokenBucket => {
    const bucket = new TokenBucket(config);
    activeBuckets.push(bucket);
    return bucket;
  };

  afterEach(() => {
    // Clean up all buckets to prevent memory leaks
    activeBuckets.forEach((bucket) => bucket.destroy());
    activeBuckets = [];
  });

  describe("Constructor and Configuration Validation", () => {
    test("should create TokenBucket with valid configuration", () => {
      expect(() => createBucket(defaultConfig)).not.toThrow();
    });

    test("should reject zero or negative max tokens", () => {
      const invalidConfig1 = createConfig({ maxTokens: 0 });
      expect(() => createBucket(invalidConfig1)).toThrow(
        "Max tokens must be greater than 0",
      );

      const invalidConfig2 = createConfig({ maxTokens: -5 });
      expect(() => createBucket(invalidConfig2)).toThrow(
        "Max tokens must be greater than 0",
      );
    });

    test("should reject negative refill rate", () => {
      const invalidConfig = createConfig({ refillRate: -1 });
      expect(() => createBucket(invalidConfig)).toThrow(
        "Refill rate must be non-negative",
      );
    });

    test("should accept zero refill rate (static bucket)", () => {
      expect(() => createBucket(createConfig({ refillRate: 0 }))).not.toThrow();
    });

    test("should reject zero or negative refill interval", () => {
      const invalidConfig1 = createConfig({ refillInterval: 0 });
      expect(() => createBucket(invalidConfig1)).toThrow(
        "Refill interval must be greater than 0",
      );

      const invalidConfig2 = createConfig({ refillInterval: -100 });
      expect(() => createBucket(invalidConfig2)).toThrow(
        "Refill interval must be greater than 0",
      );
    });

    test("should use default refill interval when not specified", () => {
      const config = { maxTokens: 10, refillRate: 5 };
      expect(() => createBucket(config)).not.toThrow();
    });
  });

  describe("Basic Functionality", () => {
    test("should start with full token capacity", () => {
      const bucket = createBucket(defaultConfig);
      expect(bucket.getAvailableTokens()).toBe(10);
    });

    test("should successfully consume tokens when available", () => {
      const bucket = createBucket(defaultConfig);

      expect(bucket.consume(1)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(9);

      expect(bucket.consume(5)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(4);
    });

    test("should fail to consume tokens when insufficient", () => {
      const bucket = createBucket(defaultConfig);

      // Consume all tokens
      expect(bucket.consume(10)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);

      // Should fail to consume more
      expect(bucket.consume(1)).toBe(false);
      expect(bucket.getAvailableTokens()).toBe(0);
    });

    test("should handle default token consumption (1 token)", () => {
      const bucket = createBucket(defaultConfig);

      expect(bucket.consume()).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(9);
    });

    test("should reset bucket to full capacity", () => {
      const bucket = createBucket(defaultConfig);

      bucket.consume(7);
      expect(bucket.getAvailableTokens()).toBe(3);

      bucket.reset();
      expect(bucket.getAvailableTokens()).toBe(10);
    });
  });

  describe("Refill Mechanics", () => {
    // Use longer intervals to make timing more predictable in tests
    const testConfig = createConfig({ refillRate: 10, refillInterval: 200 });

    test("should refill tokens at correct rate over time", async () => {
      const bucket = createBucket(testConfig);

      // Consume all tokens
      bucket.consume(10);
      expect(bucket.getAvailableTokens()).toBe(0);

      // Wait for approximately 1 refill cycle (200ms)
      // At 10 tokens/second with 200ms interval, should add 2 tokens
      await waitMs(250);

      const tokensAfterRefill = bucket.getAvailableTokens();
      expect(tokensAfterRefill).toBeGreaterThan(0);
      expect(tokensAfterRefill).toBeLessThanOrEqual(3); // Allow some timing variance
    });

    test("should stop refilling at maximum capacity", async () => {
      const bucket = createBucket(testConfig);

      // Start with full bucket and wait for refill attempts
      expect(bucket.getAvailableTokens()).toBe(10);

      await waitMs(300);

      // Should not exceed maximum capacity
      expect(bucket.getAvailableTokens()).toBe(10);
    });

    test("should handle high-frequency consumption vs refill rate", async () => {
      const slowRefillConfig = createConfig({
        refillRate: 1,
        refillInterval: 100,
      });
      const bucket = createBucket(slowRefillConfig);

      // Consume all tokens rapidly
      for (let i = 0; i < 10; i++) {
        bucket.consume(1);
      }
      expect(bucket.getAvailableTokens()).toBe(0);

      // Even after waiting, with slow refill rate, shouldn't have many tokens
      await waitMs(150);
      const tokensAfterWait = bucket.getAvailableTokens();
      expect(tokensAfterWait).toBeLessThan(3);
    });
  });

  describe("Burst Capacity", () => {
    test("should allow consuming full burst when bucket is full", () => {
      const burstConfig = createConfig({ maxTokens: 50, refillRate: 10 });
      const bucket = createBucket(burstConfig);

      // Should be able to consume entire burst capacity immediately
      expect(bucket.consume(50)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);
    });

    test("should prevent consumption after burst exhaustion", () => {
      const burstConfig = createConfig({ maxTokens: 20, refillRate: 5 });
      const bucket = createBucket(burstConfig);

      // Exhaust burst capacity
      expect(bucket.consume(20)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);

      // Should prevent further consumption
      expect(bucket.consume(1)).toBe(false);
      expect(bucket.getAvailableTokens()).toBe(0);
    });

    test("should handle partial burst consumption correctly", () => {
      const burstConfig = createConfig({ maxTokens: 30, refillRate: 10 });
      const bucket = createBucket(burstConfig);

      // Consume part of burst capacity
      expect(bucket.consume(15)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(15);

      // Should be able to consume remaining burst
      expect(bucket.consume(15)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);

      // Should not be able to consume more
      expect(bucket.consume(1)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle negative token consumption requests", () => {
      const bucket = createBucket(defaultConfig);

      expect(bucket.consume(-1)).toBe(false);
      expect(bucket.getAvailableTokens()).toBe(10); // Should remain unchanged
    });

    test("should handle zero refill rate (bucket never refills)", async () => {
      const staticConfig = createConfig({ refillRate: 0 });
      const bucket = createBucket(staticConfig);

      // Consume some tokens
      bucket.consume(5);
      expect(bucket.getAvailableTokens()).toBe(5);

      // Wait and verify no refill occurred
      await waitMs(300);
      expect(bucket.getAvailableTokens()).toBe(5);
    });

    test("should reject consuming more tokens than burst capacity", () => {
      const bucket = createBucket(defaultConfig);

      // Try to consume more than max capacity
      expect(bucket.consume(15)).toBe(false);
      expect(bucket.getAvailableTokens()).toBe(10); // Should remain unchanged
    });

    test("should handle concurrent token consumption safely", () => {
      const bucket = createBucket(defaultConfig);

      // Simulate concurrent consumption attempts
      const results: boolean[] = [];

      // Attempt to consume 15 tokens when only 10 are available
      for (let i = 0; i < 15; i++) {
        results.push(bucket.consume(1));
      }

      // Exactly 10 should succeed
      const successCount = results.filter((result) => result).length;
      expect(successCount).toBe(10);
      expect(bucket.getAvailableTokens()).toBe(0);
    });
  });

  describe("Memory Management", () => {
    test("should clean up timers when destroyed", () => {
      const bucket = createBucket(defaultConfig);

      // Consume a token to ensure timer is active
      bucket.consume(1);

      // Destroy should not throw
      expect(() => bucket.destroy()).not.toThrow();

      // Multiple destroy calls should be safe
      expect(() => bucket.destroy()).not.toThrow();
    });

    test("should handle destruction of static bucket (no timer)", () => {
      const staticBucket = createBucket(createConfig({ refillRate: 0 }));

      expect(() => staticBucket.destroy()).not.toThrow();
    });
  });

  describe("Performance Characteristics", () => {
    test("should complete token operations in reasonable time", () => {
      const bucket = createBucket(defaultConfig);

      const startTime = performance.now();

      // Perform multiple operations
      for (let i = 0; i < 1000; i++) {
        bucket.consume(1);
        bucket.getAvailableTokens();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete 2000 operations in under 10ms
      expect(totalTime).toBeLessThan(10);
    });

    test("should maintain stable memory usage", () => {
      const bucket = createBucket(defaultConfig);

      // Perform many operations to test for memory leaks
      for (let i = 0; i < 10000; i++) {
        bucket.consume(1);
        if (i % 100 === 0) {
          bucket.reset();
        }
      }

      // Reset to ensure we have tokens for the final check
      bucket.reset();

      // If we get here without running out of memory, test passes
      expect(bucket.getAvailableTokens()).toBe(10);
    });
  });

  describe("Real-world Scenarios", () => {
    test("should handle high RPS scenario", async () => {
      const highRpsConfig = createConfig({
        maxTokens: 100,
        refillRate: 50, // 50 RPS
        refillInterval: 50,
      });
      const bucket = createBucket(highRpsConfig);

      // Consume burst
      expect(bucket.consume(100)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);

      // Wait for some refill
      await waitMs(100);

      // Should have some tokens available
      expect(bucket.getAvailableTokens()).toBeGreaterThan(0);
    });

    test("should handle low RPS with large burst", () => {
      const lowRpsBurstConfig = createConfig({
        maxTokens: 1000,
        refillRate: 5, // 5 RPS but large burst
        refillInterval: 200,
      });
      const bucket = createBucket(lowRpsBurstConfig);

      // Can handle large initial burst
      expect(bucket.consume(500)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(500);

      // But sustained high rate should eventually exhaust tokens
      expect(bucket.consume(500)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);

      expect(bucket.consume(1)).toBe(false);
    });

    test("should handle no burst scenario (classic rate limiting)", () => {
      const noBurstConfig = createConfig({
        maxTokens: 1,
        refillRate: 2, // 2 RPS but no burst capacity
      });
      const bucket = createBucket(noBurstConfig);

      // Can only consume 1 token at a time
      expect(bucket.consume(1)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);

      // Cannot consume more until refill
      expect(bucket.consume(1)).toBe(false);
    });
  });
});
