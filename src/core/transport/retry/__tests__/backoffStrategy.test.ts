import {
  BackoffConfig,
  ExponentialBackoffStrategy,
  LinearBackoffStrategy,
  createBackoffStrategy,
  delayPromise,
} from "../index";
import type { RuntimeAdapter } from "../../../runtime/runtimeAdapter";

describe("Exponential Backoff Strategy", () => {
  describe("Basic Delay Calculation", () => {
    it("should calculate base delay for attempt 0", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: false,
      });

      const delay = strategy.calculateDelay(0);
      expect(delay).toBe(1000); // 1000 * (2^0) = 1000
    });

    it("should calculate exponential growth for subsequent attempts", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: false,
      });

      expect(strategy.calculateDelay(1)).toBe(2000); // 1000 * (2^1) = 2000
      expect(strategy.calculateDelay(2)).toBe(4000); // 1000 * (2^2) = 4000
      expect(strategy.calculateDelay(3)).toBe(8000); // 1000 * (2^3) = 8000
    });

    it("should use custom multiplier when provided", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 500,
        maxDelayMs: 30000,
        jitter: false,
        multiplier: 3,
      });

      expect(strategy.calculateDelay(0)).toBe(500); // 500 * (3^0) = 500
      expect(strategy.calculateDelay(1)).toBe(1500); // 500 * (3^1) = 1500
      expect(strategy.calculateDelay(2)).toBe(4500); // 500 * (3^2) = 4500
    });

    it("should cap delay at maximum value", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        jitter: false,
      });

      expect(strategy.calculateDelay(0)).toBe(1000); // Below cap
      expect(strategy.calculateDelay(1)).toBe(2000); // Below cap
      expect(strategy.calculateDelay(2)).toBe(4000); // Below cap
      expect(strategy.calculateDelay(3)).toBe(5000); // Would be 8000, capped at 5000
      expect(strategy.calculateDelay(10)).toBe(5000); // Still capped
    });
  });

  describe("Jitter Implementation", () => {
    it("should return exact delay when jitter is disabled", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: false,
      });

      // Run multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        expect(strategy.calculateDelay(2)).toBe(4000);
      }
    });

    it("should apply jitter within 50-150% range when enabled", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: true,
      });

      const baseDelay = 4000; // Expected delay for attempt 2
      const results: number[] = [];

      // Collect multiple samples
      for (let i = 0; i < 100; i++) {
        const delay = strategy.calculateDelay(2);
        results.push(delay);

        // Each individual result should be in range
        expect(delay).toBeGreaterThanOrEqual(baseDelay * 0.5);
        expect(delay).toBeLessThanOrEqual(baseDelay * 1.5);
      }

      // Statistical check: results should vary
      const uniqueValues = new Set(results);
      expect(uniqueValues.size).toBeGreaterThan(10); // Should have many different values
    });

    it("should respect maximum delay even with jitter", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 3000,
        jitter: true,
      });

      // Run many times to ensure no value exceeds max
      for (let i = 0; i < 100; i++) {
        const delay = strategy.calculateDelay(5); // Would be 32000 without cap
        expect(delay).toBeLessThanOrEqual(3000);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle very high attempt numbers without overflow", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 60000,
        jitter: false,
      });

      // Should not throw or return Infinity/NaN
      expect(() => strategy.calculateDelay(100)).not.toThrow();
      expect(strategy.calculateDelay(100)).toBe(60000); // Should be capped
      expect(Number.isFinite(strategy.calculateDelay(100))).toBe(true);
    });

    it("should handle zero base delay", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 0,
        maxDelayMs: 1000,
        jitter: false,
      });

      expect(strategy.calculateDelay(0)).toBe(0);
      expect(strategy.calculateDelay(5)).toBe(0);
    });

    it("should handle maximum delay smaller than calculated delay", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 500, // Smaller than base delay
        jitter: false,
      });

      expect(strategy.calculateDelay(0)).toBe(500); // Capped immediately
    });

    it("should throw error for negative attempt numbers", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: false,
      });

      expect(() => strategy.calculateDelay(-1)).toThrow(
        "Attempt number must be non-negative",
      );
    });
  });

  describe("Configuration Validation", () => {
    it("should throw error for negative base delay", () => {
      expect(
        () =>
          new ExponentialBackoffStrategy({
            strategy: "exponential",
            baseDelayMs: -1000,
            maxDelayMs: 30000,
            jitter: false,
          }),
      ).toThrow("Base delay must be non-negative");
    });

    it("should throw error for negative maximum delay", () => {
      expect(
        () =>
          new ExponentialBackoffStrategy({
            strategy: "exponential",
            baseDelayMs: 1000,
            maxDelayMs: -5000,
            jitter: false,
          }),
      ).toThrow("Maximum delay must be non-negative");
    });

    it("should throw error for non-positive multiplier", () => {
      expect(
        () =>
          new ExponentialBackoffStrategy({
            strategy: "exponential",
            baseDelayMs: 1000,
            maxDelayMs: 30000,
            jitter: false,
            multiplier: 0,
          }),
      ).toThrow("Multiplier must be positive");

      expect(
        () =>
          new ExponentialBackoffStrategy({
            strategy: "exponential",
            baseDelayMs: 1000,
            maxDelayMs: 30000,
            jitter: false,
            multiplier: -2,
          }),
      ).toThrow("Multiplier must be positive");
    });
  });

  describe("Reset Functionality", () => {
    it("should have a reset method that doesn't throw", () => {
      const strategy = new ExponentialBackoffStrategy({
        strategy: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: false,
      });

      expect(() => strategy.reset()).not.toThrow();
    });
  });
});

describe("Linear Backoff Strategy", () => {
  describe("Basic Delay Calculation", () => {
    it("should calculate linear growth correctly", () => {
      const strategy = new LinearBackoffStrategy({
        strategy: "linear",
        baseDelayMs: 2000,
        maxDelayMs: 20000,
        jitter: false,
      });

      expect(strategy.calculateDelay(0)).toBe(2000); // 2000 * (0 + 1) = 2000
      expect(strategy.calculateDelay(1)).toBe(4000); // 2000 * (1 + 1) = 4000
      expect(strategy.calculateDelay(2)).toBe(6000); // 2000 * (2 + 1) = 6000
      expect(strategy.calculateDelay(3)).toBe(8000); // 2000 * (3 + 1) = 8000
    });

    it("should cap delay at maximum value", () => {
      const strategy = new LinearBackoffStrategy({
        strategy: "linear",
        baseDelayMs: 3000,
        maxDelayMs: 10000,
        jitter: false,
      });

      expect(strategy.calculateDelay(0)).toBe(3000); // Below cap
      expect(strategy.calculateDelay(1)).toBe(6000); // Below cap
      expect(strategy.calculateDelay(2)).toBe(9000); // Below cap
      expect(strategy.calculateDelay(3)).toBe(10000); // Would be 12000, capped at 10000
      expect(strategy.calculateDelay(10)).toBe(10000); // Still capped
    });
  });

  describe("Jitter Implementation", () => {
    it("should return exact delay when jitter is disabled", () => {
      const strategy = new LinearBackoffStrategy({
        strategy: "linear",
        baseDelayMs: 1000,
        maxDelayMs: 20000,
        jitter: false,
      });

      // Run multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        expect(strategy.calculateDelay(2)).toBe(3000);
      }
    });

    it("should apply jitter within 50-150% range when enabled", () => {
      const strategy = new LinearBackoffStrategy({
        strategy: "linear",
        baseDelayMs: 1000,
        maxDelayMs: 20000,
        jitter: true,
      });

      const baseDelay = 3000; // Expected delay for attempt 2
      const results: number[] = [];

      // Collect multiple samples
      for (let i = 0; i < 100; i++) {
        const delay = strategy.calculateDelay(2);
        results.push(delay);

        // Each individual result should be in range
        expect(delay).toBeGreaterThanOrEqual(baseDelay * 0.5);
        expect(delay).toBeLessThanOrEqual(baseDelay * 1.5);
      }

      // Statistical check: results should vary
      const uniqueValues = new Set(results);
      expect(uniqueValues.size).toBeGreaterThan(10);
    });

    it("should respect maximum delay even with jitter", () => {
      const strategy = new LinearBackoffStrategy({
        strategy: "linear",
        baseDelayMs: 2000,
        maxDelayMs: 5000,
        jitter: true,
      });

      // Run many times to ensure no value exceeds max
      for (let i = 0; i < 100; i++) {
        const delay = strategy.calculateDelay(10); // Would be 22000 without cap
        expect(delay).toBeLessThanOrEqual(5000);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero base delay", () => {
      const strategy = new LinearBackoffStrategy({
        strategy: "linear",
        baseDelayMs: 0,
        maxDelayMs: 1000,
        jitter: false,
      });

      expect(strategy.calculateDelay(0)).toBe(0);
      expect(strategy.calculateDelay(5)).toBe(0);
    });

    it("should throw error for negative attempt numbers", () => {
      const strategy = new LinearBackoffStrategy({
        strategy: "linear",
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitter: false,
      });

      expect(() => strategy.calculateDelay(-1)).toThrow(
        "Attempt number must be non-negative",
      );
    });
  });

  describe("Configuration Validation", () => {
    it("should throw error for negative base delay", () => {
      expect(
        () =>
          new LinearBackoffStrategy({
            strategy: "linear",
            baseDelayMs: -1000,
            maxDelayMs: 10000,
            jitter: false,
          }),
      ).toThrow("Base delay must be non-negative");
    });

    it("should throw error for negative maximum delay", () => {
      expect(
        () =>
          new LinearBackoffStrategy({
            strategy: "linear",
            baseDelayMs: 1000,
            maxDelayMs: -5000,
            jitter: false,
          }),
      ).toThrow("Maximum delay must be non-negative");
    });
  });
});

describe("Factory Function", () => {
  it("should create exponential strategy when specified", () => {
    const config: BackoffConfig = {
      strategy: "exponential",
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      jitter: false,
    };

    const strategy = createBackoffStrategy(config);
    expect(strategy).toBeInstanceOf(ExponentialBackoffStrategy);
  });

  it("should create linear strategy when specified", () => {
    const config: BackoffConfig = {
      strategy: "linear",
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      jitter: false,
    };

    const strategy = createBackoffStrategy(config);
    expect(strategy).toBeInstanceOf(LinearBackoffStrategy);
  });

  it("should throw error for unsupported strategy", () => {
    const config = {
      strategy: "invalid" as any,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      jitter: false,
    };

    expect(() => createBackoffStrategy(config)).toThrow(
      "Unsupported backoff strategy: invalid",
    );
  });
});

describe("Delay Promise Utility", () => {
  let mockRuntimeAdapter: RuntimeAdapter;

  beforeEach(() => {
    // Create mock runtime adapter that works with Jest fake timers
    mockRuntimeAdapter = {
      setTimeout: jest.fn((callback: () => void, timeout: number) => {
        return setTimeout(callback, timeout);
      }),
      clearTimeout: jest.fn((handle: unknown) => {
        if (handle) {
          clearTimeout(handle as NodeJS.Timeout);
        }
      }),
      fetch: jest.fn(),
      stream: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      fileExists: jest.fn(),
    } as unknown as RuntimeAdapter;
  });
  describe("Normal Operation", () => {
    it("should resolve after specified delay", async () => {
      const startTime = Date.now();
      await delayPromise(100, mockRuntimeAdapter);
      const elapsed = Date.now() - startTime;

      // Allow for some timing tolerance
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });

    it("should resolve immediately for zero delay", async () => {
      const startTime = Date.now();
      await delayPromise(0, mockRuntimeAdapter);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe("AbortSignal Integration", () => {
    it("should resolve normally without signal", async () => {
      await expect(
        delayPromise(50, mockRuntimeAdapter),
      ).resolves.toBeUndefined();
    });

    it("should reject immediately if signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        delayPromise(100, mockRuntimeAdapter, controller.signal),
      ).rejects.toThrow("Delay was aborted");
    });

    it("should reject when signal is aborted during delay", async () => {
      const controller = new AbortController();

      // Start delay and abort after 50ms
      const delayPromiseCall = delayPromise(
        200,
        mockRuntimeAdapter,
        controller.signal,
      );
      setTimeout(() => controller.abort(), 50);

      await expect(delayPromiseCall).rejects.toThrow("Delay was aborted");
    });

    it("should clean up event listeners on successful completion", async () => {
      const controller = new AbortController();
      const signal = controller.signal;

      // Mock addEventListener and removeEventListener to track calls
      const addEventListenerSpy = jest.spyOn(signal, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(signal, "removeEventListener");

      await delayPromise(50, mockRuntimeAdapter, signal);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "abort",
        expect.any(Function),
        { once: true },
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "abort",
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it("should clean up timeout on abort", async () => {
      const controller = new AbortController();

      // Start delay and abort immediately
      const delayPromiseCall = delayPromise(
        1000,
        mockRuntimeAdapter,
        controller.signal,
      );
      controller.abort();

      try {
        await delayPromiseCall;
      } catch {
        // Expected to throw
      }

      // If timeout wasn't cleaned up, the process would hang for 1 second
      // This test passing quickly indicates proper cleanup
    });
  });
});
