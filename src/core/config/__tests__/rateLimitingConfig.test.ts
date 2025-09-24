import { BridgeConfigSchema } from "../bridgeConfigSchema";

describe("Rate Limiting Configuration", () => {
  describe("valid configurations", () => {
    it("should accept minimal enabled configuration with just enabled and maxRps", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy).toEqual({
        enabled: true,
        maxRps: 10,
        burst: 20, // Auto-calculated as maxRps * 2
        scope: "provider:model:key", // Default value
      });
    });

    it("should accept full configuration with all fields specified", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 50,
          burst: 200,
          scope: "provider" as const,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy).toEqual({
        enabled: true,
        maxRps: 50,
        burst: 200, // Preserved explicit value
        scope: "provider",
      });
    });

    it("should accept disabled configuration", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: false,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy).toEqual({
        enabled: false,
        scope: "provider:model:key", // Default value
      });
    });

    it("should accept missing rateLimitPolicy (backward compatibility)", () => {
      const config = {
        providers: { test: {} },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy).toBeUndefined();
    });

    it("should accept all valid scope values", () => {
      const scopes = [
        "global",
        "provider",
        "provider:model",
        "provider:model:key",
      ] as const;

      scopes.forEach((scope) => {
        const config = {
          providers: { test: {} },
          rateLimitPolicy: {
            enabled: true,
            maxRps: 5,
            scope,
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.rateLimitPolicy?.scope).toBe(scope);
      });
    });

    it("should accept various valid maxRps values", () => {
      const validMaxRps = [1, 10, 100, 500, 1000];

      validMaxRps.forEach((maxRps) => {
        const config = {
          providers: { test: {} },
          rateLimitPolicy: {
            enabled: true,
            maxRps,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
      });
    });

    it("should accept various valid burst values", () => {
      const validBurst = [1, 50, 1000, 5000, 10000];

      validBurst.forEach((burst) => {
        const config = {
          providers: { test: {} },
          rateLimitPolicy: {
            enabled: true,
            maxRps: 10,
            burst,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
      });
    });
  });

  describe("validation rules", () => {
    it("should fail when enabled is true but maxRps is missing", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          // maxRps missing
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "maxRps is required when rate limiting is enabled",
      );
    });

    it("should fail with negative maxRps", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: -1,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Max RPS must be positive",
      );
    });

    it("should fail with zero maxRps", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 0,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Max RPS must be positive",
      );
    });

    it("should fail with excessive maxRps (>1000)", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 1001,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Max RPS cannot exceed 1000",
      );
    });

    it("should fail with negative burst", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
          burst: -1,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Burst capacity must be positive",
      );
    });

    it("should fail with zero burst", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
          burst: 0,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Burst capacity must be positive",
      );
    });

    it("should fail with excessive burst (>10000)", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
          burst: 10001,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        "Burst capacity cannot exceed 10000",
      );
    });

    it("should fail with invalid scope enum", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
          scope: "invalid-scope",
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });
  });

  describe("default value behavior", () => {
    it("should default enabled to false when not specified", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy?.enabled).toBe(false);
    });

    it("should default scope to 'provider:model:key' when not specified", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy?.scope).toBe("provider:model:key");
    });

    it("should auto-calculate burst as maxRps * 2 when not specified", () => {
      const testCases = [
        { maxRps: 5, expectedBurst: 10 },
        { maxRps: 10, expectedBurst: 20 },
        { maxRps: 25, expectedBurst: 50 },
        { maxRps: 100, expectedBurst: 200 },
      ];

      testCases.forEach(({ maxRps, expectedBurst }) => {
        const config = {
          providers: { test: {} },
          rateLimitPolicy: {
            enabled: true,
            maxRps,
            // burst not specified
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.rateLimitPolicy?.burst).toBe(expectedBurst);
      });
    });

    it("should preserve explicit burst value when specified", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
          burst: 100, // Explicitly set to different value than maxRps * 2
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy?.burst).toBe(100);
    });

    it("should not auto-calculate burst when disabled", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: false,
          maxRps: 10,
          // burst not specified
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy?.burst).toBeUndefined();
    });
  });

  describe("backward compatibility", () => {
    it("should validate existing configs without rateLimitPolicy", () => {
      const existingConfigs = [
        {
          providers: {
            openai: {
              default: { apiKey: "sk-test" },
            },
          },
        },
        {
          defaultProvider: "openai",
          providers: {
            openai: {
              default: { apiKey: "sk-test" },
            },
          },
          defaultModel: "gpt-4",
        },
        {
          providers: {
            openai: {
              default: { apiKey: "sk-test" },
            },
          },
          timeout: 30000,
          tools: { enabled: true, builtinTools: ["echo"] },
        },
      ];

      existingConfigs.forEach((config) => {
        expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
        const result = BridgeConfigSchema.parse(config);
        expect(result.rateLimitPolicy).toBeUndefined();
      });
    });

    it("should not break existing validation rules", () => {
      // Test that existing validation still works
      const invalidConfigs = [
        { rateLimitPolicy: { enabled: true, maxRps: 10 } }, // Missing providers
        {
          providers: { test: {} },
          timeout: -1, // Invalid timeout
          rateLimitPolicy: { enabled: true, maxRps: 10 },
        },
        {
          providers: { test: {} },
          defaultModel: "", // Empty model
          rateLimitPolicy: { enabled: true, maxRps: 10 },
        },
      ];

      invalidConfigs.forEach((config) => {
        expect(() => BridgeConfigSchema.parse(config)).toThrow();
      });
    });

    it("should maintain type compatibility", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
        },
      };

      const result = BridgeConfigSchema.parse(config);

      // These should all be properly typed
      expect(typeof result.rateLimitPolicy?.enabled).toBe("boolean");
      expect(typeof result.rateLimitPolicy?.maxRps).toBe("number");
      expect(typeof result.rateLimitPolicy?.burst).toBe("number");
      expect(typeof result.rateLimitPolicy?.scope).toBe("string");
    });
  });

  describe("edge cases", () => {
    it("should handle null rateLimitPolicy", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: null,
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should handle empty rateLimitPolicy object", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {},
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy).toEqual({
        enabled: false,
        scope: "provider:model:key",
      });
    });

    it("should handle fractional maxRps values", () => {
      const config = {
        providers: { test: {} },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10.5,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy?.maxRps).toBe(10.5);
      expect(result.rateLimitPolicy?.burst).toBe(21); // 10.5 * 2
    });

    it("should handle maxRps at boundary values", () => {
      const boundaryValues = [1, 1000];

      boundaryValues.forEach((maxRps) => {
        const config = {
          providers: { test: {} },
          rateLimitPolicy: {
            enabled: true,
            maxRps,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
      });
    });

    it("should handle burst at boundary values", () => {
      const boundaryValues = [1, 10000];

      boundaryValues.forEach((burst) => {
        const config = {
          providers: { test: {} },
          rateLimitPolicy: {
            enabled: true,
            maxRps: 10,
            burst,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
      });
    });
  });
});
