import { createClient } from "../createClient";
import { BridgeClient } from "../client";
import { ValidationError } from "../core/errors";

// Mock environment variables for testing
const originalEnv = process.env;

describe("createClient", () => {
  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe("valid configuration", () => {
    it("should create client with minimal valid config (providers only)", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      const client = createClient(config);

      expect(client).toBeInstanceOf(BridgeClient);
      expect(client.getConfig()).toMatchObject({
        defaultModel: "gpt-3.5-turbo",
        timeout: 30000,
        options: {},
      });
    });

    it("should create client with minimal valid config (defaultProvider only)", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      const client = createClient(config);

      expect(client).toBeInstanceOf(BridgeClient);
      expect(client.getConfig()).toMatchObject({
        defaultProvider: "openai",
        defaultModel: "gpt-3.5-turbo",
        timeout: 30000,
      });
    });

    it("should create client with complete valid configuration", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test", temperature: 0.7 },
          anthropic: { apiKey: "sk-ant-test" },
        },
        defaultModel: "gpt-4",
        timeout: 60000,
        options: { retries: 3 },
      };

      const client = createClient(config);

      expect(client).toBeInstanceOf(BridgeClient);
      const clientConfig = client.getConfig();
      expect(clientConfig.defaultProvider).toBe("openai");
      expect(clientConfig.defaultModel).toBe("gpt-4");
      expect(clientConfig.timeout).toBe(60000);
      expect(clientConfig.options).toEqual({ retries: 3 });
    });

    it("should apply default values for optional fields", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.defaultModel).toBe("gpt-3.5-turbo");
      expect(clientConfig.timeout).toBe(30000);
      expect(clientConfig.options).toEqual({});
      expect(clientConfig.registryOptions.providers).toEqual({});
      expect(clientConfig.registryOptions.models).toEqual({});
    });

    it("should not override explicitly provided defaults", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
        defaultModel: "gpt-4",
        timeout: 45000,
        options: { customOption: "value" },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.defaultModel).toBe("gpt-4");
      expect(clientConfig.timeout).toBe(45000);
      expect(clientConfig.options).toEqual({ customOption: "value" });
    });

    it("should handle provided registry options", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
        registryOptions: {
          providers: { customProvider: "config" },
          models: { customModel: "config" },
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.registryOptions.providers).toEqual({
        customProvider: "config",
      });
      expect(clientConfig.registryOptions.models).toEqual({
        customModel: "config",
      });
    });

    it("should handle partial registry options", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
        registryOptions: {
          providers: { test: "value" },
          // models omitted
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.registryOptions.providers).toEqual({ test: "value" });
      expect(clientConfig.registryOptions.models).toEqual({});
    });
  });

  describe("invalid configuration", () => {
    it("should throw ValidationError for empty configuration", () => {
      const config = {};

      expect(() => createClient(config)).toThrow(ValidationError);
      expect(() => createClient(config)).toThrow(
        /Configuration must specify either defaultProvider or providers/,
      );
    });

    it("should throw ValidationError for empty defaultProvider", () => {
      const config = {
        defaultProvider: "",
        providers: { openai: { apiKey: "sk-test" } },
      };

      expect(() => createClient(config)).toThrow(ValidationError);
      expect(() => createClient(config)).toThrow(
        /Default provider cannot be empty/,
      );
    });

    it("should throw ValidationError for invalid timeout values", () => {
      const invalidTimeouts = [999, 300001, -1000, 0, 1.5];

      invalidTimeouts.forEach((timeout) => {
        const config = {
          providers: { test: {} },
          timeout,
        };

        expect(() => createClient(config)).toThrow(ValidationError);
      });
    });

    it("should throw ValidationError when defaultProvider not found in providers", () => {
      const config = {
        defaultProvider: "missing",
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      expect(() => createClient(config)).toThrow(ValidationError);
      expect(() => createClient(config)).toThrow(
        /Default provider 'missing' not found in providers configuration/,
      );
    });

    it("should throw ValidationError for invalid field types", () => {
      const config = {
        providers: { openai: { apiKey: "sk-test" } },
        timeout: "not-a-number" as any,
      };

      expect(() => createClient(config)).toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid provider configuration", () => {
      const config = {
        providers: {
          openai: "invalid" as any,
        },
      };

      expect(() => createClient(config)).toThrow(ValidationError);
    });
  });

  describe("environment variable processing", () => {
    it("should process environment variables in provider configurations", () => {
      process.env.TEST_API_KEY = "sk-env-test";
      process.env.CUSTOM_VALUE = "env-custom";

      const config = {
        providers: {
          openai: {
            apiKey: "${TEST_API_KEY}",
            customField: "${CUSTOM_VALUE}",
          },
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();
      const openaiProvider = clientConfig.providers.get("openai");

      expect(openaiProvider).toBeDefined();
      expect(openaiProvider?.apiKey).toBe("sk-env-test");
      expect(openaiProvider?.customField).toBe("env-custom");
    });

    it("should process nested environment variables", () => {
      process.env.NESTED_VALUE = "nested-test";

      const config = {
        providers: {
          openai: {
            apiKey: "sk-test",
            config: {
              nested: "${NESTED_VALUE}",
              deep: {
                value: "${NESTED_VALUE}",
              },
            },
          },
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();
      const openaiProvider = clientConfig.providers.get("openai") as any;

      expect(openaiProvider.config.nested).toBe("nested-test");
      expect(openaiProvider.config.deep.value).toBe("nested-test");
    });

    it("should handle mixed strings with environment variables", () => {
      process.env.API_KEY_SUFFIX = "test-key";

      const config = {
        providers: {
          openai: {
            apiKey: "sk-${API_KEY_SUFFIX}",
          },
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();
      const openaiProvider = clientConfig.providers.get("openai");

      expect(openaiProvider?.apiKey).toBe("sk-test-key");
    });

    it("should throw ValidationError for missing environment variables", () => {
      delete process.env.MISSING_VAR;

      const config = {
        providers: {
          openai: {
            apiKey: "${MISSING_VAR}",
          },
        },
      };

      expect(() => createClient(config)).toThrow(ValidationError);
      expect(() => createClient(config)).toThrow(
        /Environment variable 'MISSING_VAR' is not defined but required/,
      );
    });

    it("should preserve non-environment variable strings unchanged", () => {
      const config = {
        providers: {
          openai: {
            apiKey: "sk-literal-key",
            baseUrl: "https://api.openai.com/v1",
          },
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();
      const openaiProvider = clientConfig.providers.get("openai");

      expect(openaiProvider?.apiKey).toBe("sk-literal-key");
      expect(openaiProvider?.baseUrl).toBe("https://api.openai.com/v1");
    });
  });

  describe("error handling", () => {
    it("should provide clear error messages for validation failures", () => {
      const config = { timeout: -1 };

      expect(() => createClient(config)).toThrow(ValidationError);
      expect(() => createClient(config)).toThrow(/timeout must be at least/i);
    });

    it("should include context in validation errors", () => {
      process.env.MISSING_KEY = undefined;

      const config = {
        providers: {
          openai: { apiKey: "${MISSING_KEY}" },
        },
      };

      try {
        createClient(config);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.context).toMatchObject({
            envVarName: "MISSING_KEY",
            path: "providers.openai.apiKey",
          });
        }
      }
    });

    it("should handle BridgeClient constructor errors gracefully", () => {
      // Test that createClient handles normal BridgeClient validation errors properly
      // The BridgeClient constructor already validates provider existence
      const config = {
        defaultProvider: "nonexistent",
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      expect(() => createClient(config)).toThrow(ValidationError);
      expect(() => createClient(config)).toThrow(
        /Default provider 'nonexistent' not found in providers configuration/,
      );
    });
  });

  describe("integration with BridgeClient", () => {
    it("should pass validated configuration to BridgeClient constructor", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test" },
        },
        defaultModel: "gpt-4",
        timeout: 45000,
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.defaultProvider).toBe("openai");
      expect(clientConfig.defaultModel).toBe("gpt-4");
      expect(clientConfig.timeout).toBe(45000);
      expect(clientConfig.providers.has("openai")).toBe(true);
    });

    it("should create functional BridgeClient that can access configuration", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test", temperature: 0.7 },
        },
        options: { retries: 3 },
      };

      const client = createClient(config);

      // Test that client is functional
      expect(client.getConfig()).toBeDefined();
      expect(client.getConfig().options).toEqual({ retries: 3 });

      // Test that provider configuration was correctly transformed
      const providers = client.getConfig().providers;
      expect(providers.get("openai")).toMatchObject({
        apiKey: "sk-test",
        temperature: 0.7,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty provider configurations", () => {
      const config = {
        providers: {
          openai: {},
        },
      };

      const client = createClient(config);
      expect(client).toBeInstanceOf(BridgeClient);
    });

    it("should handle complex nested provider configurations", () => {
      const config = {
        providers: {
          openai: {
            apiKey: "sk-test",
            config: {
              temperature: 0.7,
              maxTokens: 1000,
              nested: {
                deep: {
                  value: "complex",
                },
              },
            },
          },
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();
      const openaiProvider = clientConfig.providers.get("openai") as any;

      expect(openaiProvider.config.nested.deep.value).toBe("complex");
    });

    it("should handle multiple providers with different configurations", () => {
      const config = {
        defaultProvider: "anthropic",
        providers: {
          openai: { apiKey: "sk-openai", model: "gpt-4" },
          anthropic: { apiKey: "sk-ant-test", version: "2023-06-01" },
          custom: { endpoint: "https://custom.api.com" },
        },
      };

      const client = createClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.defaultProvider).toBe("anthropic");
      expect(clientConfig.providers.size).toBe(3);
      expect(clientConfig.providers.has("openai")).toBe(true);
      expect(clientConfig.providers.has("anthropic")).toBe(true);
      expect(clientConfig.providers.has("custom")).toBe(true);
    });
  });
});
