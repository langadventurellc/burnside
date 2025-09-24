import { BridgeConfigSchema } from "../bridgeConfigSchema";

describe("Retry Configuration", () => {
  describe("valid configurations", () => {
    it("should accept default configuration (empty object)", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy).toEqual({
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: true,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      });
    });

    it("should accept minimal configuration with just attempts", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          attempts: 3,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy).toEqual({
        attempts: 3,
        backoff: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: true,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      });
    });

    it("should accept full configuration with all fields specified", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          attempts: 5,
          backoff: "linear" as const,
          baseDelayMs: 2000,
          maxDelayMs: 20000,
          jitter: false,
          retryableStatusCodes: [429, 503],
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy).toEqual({
        attempts: 5,
        backoff: "linear",
        baseDelayMs: 2000,
        maxDelayMs: 20000,
        jitter: false,
        retryableStatusCodes: [429, 503],
      });
    });

    it("should accept custom status codes array", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          retryableStatusCodes: [429, 500, 502, 503, 504, 599],
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.retryableStatusCodes).toEqual([
        429, 500, 502, 503, 504, 599,
      ]);
    });

    it("should accept zero attempts (disabling retries)", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          attempts: 0,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.attempts).toBe(0);
    });

    it("should accept maximum allowed attempts", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          attempts: 10,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.attempts).toBe(10);
    });

    it("should accept minimum and maximum delay boundaries", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          baseDelayMs: 1,
          maxDelayMs: 300000, // 5 minutes
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.baseDelayMs).toBe(1);
      expect(result.retryPolicy?.maxDelayMs).toBe(300000);
    });
  });

  describe("validation rules", () => {
    it("should reject negative attempts", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          attempts: -1,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Attempts cannot be negative",
      );
    });

    it("should reject excessive attempts (>10)", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          attempts: 15,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Attempts cannot exceed 10",
      );
    });

    it("should reject non-integer attempts", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          attempts: 2.5,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Attempts must be an integer",
      );
    });

    it("should reject negative base delay", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          baseDelayMs: -500,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Base delay must be positive",
      );
    });

    it("should reject zero base delay", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          baseDelayMs: 0,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Base delay must be positive",
      );
    });

    it("should reject excessive base delay (>60 seconds)", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          baseDelayMs: 61000,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Base delay cannot exceed 60 seconds",
      );
    });

    it("should reject negative max delay", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          maxDelayMs: -1000,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Max delay must be positive",
      );
    });

    it("should reject zero max delay", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          maxDelayMs: 0,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Max delay must be positive",
      );
    });

    it("should reject excessive max delay (>5 minutes)", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          maxDelayMs: 301000,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Max delay cannot exceed 5 minutes",
      );
    });

    it("should reject when baseDelayMs > maxDelayMs", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          baseDelayMs: 5000,
          maxDelayMs: 1000,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "baseDelayMs must be less than or equal to maxDelayMs",
      );
    });

    it("should accept when baseDelayMs equals maxDelayMs", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          baseDelayMs: 5000,
          maxDelayMs: 5000,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.baseDelayMs).toBe(5000);
      expect(result.retryPolicy?.maxDelayMs).toBe(5000);
    });

    it("should reject invalid status codes (<100)", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          retryableStatusCodes: [99, 429],
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject invalid status codes (>599)", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          retryableStatusCodes: [429, 600],
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject non-integer status codes", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          retryableStatusCodes: [429.5, 500],
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject invalid backoff strategy", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          backoff: "invalid" as any,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });
  });

  describe("default value behavior", () => {
    it("should apply correct default attempts", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.attempts).toBe(2);
    });

    it("should apply correct default backoff strategy", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.backoff).toBe("exponential");
    });

    it("should apply correct default baseDelayMs", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.baseDelayMs).toBe(1000);
    });

    it("should apply correct default maxDelayMs", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.maxDelayMs).toBe(30000);
    });

    it("should apply correct default jitter setting", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.jitter).toBe(true);
    });

    it("should apply correct default retryable status codes", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.retryableStatusCodes).toEqual([
        429, 500, 502, 503, 504,
      ]);
    });
  });

  describe("backward compatibility", () => {
    it("should work with configs that don't have retryPolicy", () => {
      const config = {
        providers: { test: {} },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy).toBeUndefined();
    });

    it("should work with existing complex configurations", () => {
      const config = {
        providers: { test: {} },
        timeout: 30000,
        tools: {
          enabled: true,
          builtinTools: ["echo"],
        },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy).toBeUndefined();
      expect(result.rateLimitPolicy).toBeDefined();
      expect(result.tools).toBeDefined();
    });

    it("should work when retryPolicy is combined with other configurations", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          attempts: 3,
        },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 5,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.attempts).toBe(3);
      expect(result.rateLimitPolicy?.enabled).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty retryableStatusCodes array", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          retryableStatusCodes: [],
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.retryableStatusCodes).toEqual([]);
    });

    it("should handle boundary status codes (100, 599)", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          retryableStatusCodes: [100, 599],
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.retryableStatusCodes).toEqual([100, 599]);
    });

    it("should handle boundary delay values", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          baseDelayMs: 1,
          maxDelayMs: 300000,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.baseDelayMs).toBe(1);
      expect(result.retryPolicy?.maxDelayMs).toBe(300000);
    });

    it("should handle linear backoff strategy", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          backoff: "linear" as const,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.backoff).toBe("linear");
    });

    it("should handle jitter disabled", () => {
      const config = {
        providers: { test: {} },
        retryPolicy: {
          jitter: false,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy?.jitter).toBe(false);
    });
  });
});
