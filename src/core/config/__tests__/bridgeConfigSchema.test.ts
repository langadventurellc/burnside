import { BridgeConfigSchema } from "../bridgeConfigSchema";

describe("BridgeConfigSchema", () => {
  describe("valid configurations", () => {
    it("should accept minimal valid config with providers only", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should accept minimal valid config with defaultProvider only", () => {
      const config = {
        defaultProvider: "openai",
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should accept complete valid configuration", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test", temperature: 0.7 },
          anthropic: { apiKey: "sk-ant-test" },
        },
        defaultModel: "gpt-4",
        timeout: 30000,
        options: { retries: 3 },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should accept configuration with valid timeout values", () => {
      const configs = [
        { providers: { test: {} }, timeout: 1000 }, // minimum
        { providers: { test: {} }, timeout: 30000 }, // typical
        { providers: { test: {} }, timeout: 300000 }, // maximum
      ];

      configs.forEach((config) => {
        expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
      });
    });

    it("should accept configuration with complex provider configs", () => {
      const config = {
        providers: {
          openai: {
            apiKey: "sk-test",
            baseUrl: "https://api.openai.com/v1",
            maxRetries: 3,
          },
          anthropic: {
            apiKey: "sk-ant-test",
            version: "2023-06-01",
          },
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result).toEqual(config);
    });
  });

  describe("invalid configurations", () => {
    it("should reject empty configuration", () => {
      const config = {};

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject configuration with empty defaultProvider", () => {
      const config = {
        defaultProvider: "",
        providers: { openai: { apiKey: "sk-test" } },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Default provider cannot be empty/,
      );
    });

    it("should reject configuration with empty provider names", () => {
      const config = {
        providers: {
          "": { apiKey: "sk-test" },
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Provider name cannot be empty/,
      );
    });

    it("should reject configuration with empty defaultModel", () => {
      const config = {
        providers: { openai: { apiKey: "sk-test" } },
        defaultModel: "",
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Default model cannot be empty/,
      );
    });

    it("should reject configuration with invalid timeout values", () => {
      const invalidTimeouts = [
        { value: 999, error: /at least 1000ms/ },
        { value: 300001, error: /not exceed 300000ms/ },
        { value: -1000, error: /at least 1000ms/ },
        { value: 0, error: /at least 1000ms/ },
        { value: 1.5, error: /integer/ },
      ];

      invalidTimeouts.forEach(({ value, error }) => {
        const config = {
          providers: { test: {} },
          timeout: value,
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(error);
      });
    });

    it("should reject non-number timeout values", () => {
      const config = {
        providers: { test: {} },
        timeout: "30000" as any,
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject defaultProvider not found in providers", () => {
      const config = {
        defaultProvider: "missing",
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Default provider 'missing' not found in providers configuration/,
      );
    });

    it("should reject invalid provider configuration values", () => {
      const config = {
        providers: {
          openai: "invalid" as any,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject null or undefined values for required structure", () => {
      const invalidConfigs = [
        { providers: null },
        { defaultProvider: null },
        { timeout: null },
        { options: null },
      ];

      invalidConfigs.forEach((config) => {
        expect(() => BridgeConfigSchema.parse(config)).toThrow();
      });
    });
  });

  describe("complex validation scenarios", () => {
    it("should allow defaultProvider without providers when providers is not specified", () => {
      const config = {
        defaultProvider: "openai",
        defaultModel: "gpt-4",
        timeout: 30000,
      };

      expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
    });

    it("should allow providers without defaultProvider", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
          anthropic: { apiKey: "sk-ant-test" },
        },
        defaultModel: "gpt-4",
      };

      expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
    });

    it("should validate multiple providers with matching defaultProvider", () => {
      const config = {
        defaultProvider: "anthropic",
        providers: {
          openai: { apiKey: "sk-test" },
          anthropic: { apiKey: "sk-ant-test" },
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
    });

    it("should handle complex nested provider configurations", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: {
            apiKey: "sk-test",
            config: {
              temperature: 0.7,
              maxTokens: 1000,
              nested: { deep: true },
            },
          },
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
    });
  });

  describe("type inference", () => {
    it("should infer correct types from schema", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test" },
        },
        defaultModel: "gpt-4",
        timeout: 30000,
        options: { retries: 3 },
      };

      const result = BridgeConfigSchema.parse(config);

      // TypeScript compilation test
      const provider: string | undefined = result.defaultProvider;
      const providers: Record<string, Record<string, unknown>> | undefined =
        result.providers;
      const model: string | undefined = result.defaultModel;
      const timeout: number | undefined = result.timeout;
      const options: Record<string, unknown> | undefined = result.options;

      expect(provider).toBe("openai");
      expect(providers).toBeDefined();
      expect(model).toBe("gpt-4");
      expect(timeout).toBe(30000);
      expect(options).toEqual({ retries: 3 });
    });
  });
});
