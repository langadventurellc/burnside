import type { BridgeClientConfig } from "../bridgeClientConfig";

describe("BridgeClientConfig", () => {
  describe("interface structure", () => {
    it("should accept valid configuration with all required fields", () => {
      const config: BridgeClientConfig = {
        timeout: 30000,
        providers: new Map([
          ["openai.default", { apiKey: "sk-test" }],
          ["anthropic.default", { apiKey: "sk-ant-test" }],
        ]),
        options: {},
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      expect(config.timeout).toBe(30000);
      expect(config.providers.size).toBe(2);
      expect(config.validated).toBe(true);
    });

    it("should enforce Map type for providers", () => {
      const providersMap = new Map<string, Record<string, unknown>>();
      providersMap.set("openai", {
        apiKey: "sk-test",
        baseURL: "https://api.openai.com",
      });
      providersMap.set("anthropic", { apiKey: "sk-ant-test" });

      const config: BridgeClientConfig = {
        timeout: 60000,
        providers: providersMap,
        options: { retries: 3 },
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      expect(config.providers.get("openai")).toEqual({
        apiKey: "sk-test",
        baseURL: "https://api.openai.com",
      });
      expect(config.providers.get("anthropic")).toEqual({
        apiKey: "sk-ant-test",
      });
    });

    it("should accept empty providers Map", () => {
      const config: BridgeClientConfig = {
        timeout: 15000,
        providers: new Map(),
        options: {},
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      expect(config.providers.size).toBe(0);
    });

    it("should accept complex options object", () => {
      const options = {
        logging: { level: "debug", enabled: true },
        retries: { count: 3, backoff: "exponential" },
        cache: { enabled: false, ttl: 300 },
      };

      const config: BridgeClientConfig = {
        timeout: 45000,
        providers: new Map([
          ["custom.default", { endpoint: "http://localhost:8080" }],
        ]),
        options,
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      expect(config.options).toEqual(options);
      expect((config.options as any).logging.level).toBe("debug");
      expect((config.options as any).retries.count).toBe(3);
    });

    it("should preserve logging configuration structure", () => {
      const loggingConfig = {
        enabled: true,
        level: "info",
      };

      const config: BridgeClientConfig = {
        timeout: 30000,
        providers: new Map([["test.default", { apiKey: "test-key" }]]),
        options: {
          logging: loggingConfig,
        },
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      expect(config.options.logging).toEqual(loggingConfig);
      expect((config.options as any).logging.enabled).toBe(true);
      expect((config.options as any).logging.level).toBe("info");
    });

    it("should handle various logging level configurations", () => {
      const levels = ["error", "warn", "info", "debug"];

      levels.forEach((level) => {
        const config: BridgeClientConfig = {
          timeout: 30000,
          providers: new Map([["test.default", { apiKey: "test-key" }]]),
          options: {
            logging: { level },
          },
          registryOptions: {
            providers: {},
            models: {},
          },
          validated: true,
        };

        expect((config.options as any).logging.level).toBe(level);
      });
    });
  });

  describe("providers Map behavior", () => {
    it("should maintain Map functionality", () => {
      const config: BridgeClientConfig = {
        timeout: 20000,
        providers: new Map(),
        options: {},
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      // Test Map methods
      config.providers.set("provider1", { key: "value1" });
      config.providers.set("provider2", { key: "value2" });

      expect(config.providers.has("provider1")).toBe(true);
      expect(config.providers.has("provider3")).toBe(false);
      expect(config.providers.get("provider1")).toEqual({ key: "value1" });
      expect(config.providers.size).toBe(2);

      // Test iteration
      const providerNames = Array.from(config.providers.keys());
      expect(providerNames).toEqual(["provider1", "provider2"]);
    });

    it("should support complex provider configurations", () => {
      const openaiConfig: Record<string, unknown> = {
        apiKey: "sk-openai-test",
        baseURL: "https://api.openai.com/v1",
        organization: "org-test",
        timeout: 30000,
        defaultHeaders: { "User-Agent": "LLM-Bridge/1.0" },
      };

      const anthropicConfig: Record<string, unknown> = {
        apiKey: "sk-ant-test",
        baseURL: "https://api.anthropic.com",
        version: "2023-06-01",
        maxRetries: 3,
      };

      const config: BridgeClientConfig = {
        timeout: 30000,
        providers: new Map<string, Record<string, unknown>>([
          ["openai.default", openaiConfig],
          ["anthropic.default", anthropicConfig],
        ]),
        options: {},
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      expect(config.providers.get("openai.default")).toEqual(openaiConfig);
      expect(config.providers.get("anthropic.default")).toEqual(
        anthropicConfig,
      );
    });
  });

  describe("TypeScript compilation", () => {
    it("should enforce all required fields", () => {
      const valid: BridgeClientConfig = {
        timeout: 30000,
        providers: new Map(),
        options: {},
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      expect(valid).toBeDefined();
    });

    it("should allow proper type inference", () => {
      const config: BridgeClientConfig = {
        timeout: 30000,
        providers: new Map([["openai.default", { apiKey: "test" }]]),
        options: { debug: true },
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      // TypeScript should infer correct types
      const timeout: number = config.timeout;
      const providers: Map<string, Record<string, unknown>> = config.providers;
      const options: Record<string, unknown> = config.options;
      const validated: boolean = config.validated;

      expect(timeout).toBe(30000);
      expect(providers.size).toBe(1);
      expect(options.debug).toBe(true);
      expect(validated).toBe(true);
    });

    it("should maintain type safety for provider configurations", () => {
      const config: BridgeClientConfig = {
        timeout: 30000,
        providers: new Map(),
        options: {},
        registryOptions: {
          providers: {},
          models: {},
        },
        validated: true,
      };

      // Should accept any Record<string, unknown> for provider config
      config.providers.set("provider1", { stringProp: "value" });
      config.providers.set("provider2", { numberProp: 42 });
      config.providers.set("provider3", { booleanProp: true });
      config.providers.set("provider4", { objectProp: { nested: "value" } });

      expect(config.providers.get("provider1")).toEqual({
        stringProp: "value",
      });
      expect(config.providers.get("provider2")).toEqual({ numberProp: 42 });
      expect(config.providers.get("provider3")).toEqual({ booleanProp: true });
      expect(config.providers.get("provider4")).toEqual({
        objectProp: { nested: "value" },
      });
    });
  });
});
