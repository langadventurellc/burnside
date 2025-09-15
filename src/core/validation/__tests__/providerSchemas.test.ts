/**
 * Provider Configuration Schema Tests
 *
 * Comprehensive tests for provider configuration schemas and validation utilities.
 */

import { providerSchemas } from "../providerSchemas.js";
import { providerValidation } from "../providerValidation.js";
import { ValidationError } from "../../errors/validationError.js";

describe("providerSchemas", () => {
  describe("BaseProviderConfigSchema", () => {
    it("should validate minimal valid configuration", () => {
      const config = {};
      const result = providerSchemas.BaseProviderConfigSchema.parse(config);
      expect(result).toEqual({});
    });

    it("should validate configuration with all optional fields", () => {
      const config = {
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
        headers: { "Custom-Header": "value" },
        timeout: 30000,
        rateLimiting: {
          requestsPerMinute: 60,
          tokensPerMinute: 10000,
        },
        retry: {
          maxAttempts: 3,
          backoffMs: 1000,
          jitterMs: 100,
        },
      };

      const result = providerSchemas.BaseProviderConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should reject invalid baseUrl", () => {
      const config = { baseUrl: "not-a-url" };
      expect(() => {
        providerSchemas.BaseProviderConfigSchema.parse(config);
      }).toThrow();
    });

    it("should reject empty apiKey", () => {
      const config = { apiKey: "" };
      expect(() => {
        providerSchemas.BaseProviderConfigSchema.parse(config);
      }).toThrow();
    });

    it("should reject negative timeout", () => {
      const config = { timeout: -1000 };
      expect(() => {
        providerSchemas.BaseProviderConfigSchema.parse(config);
      }).toThrow();
    });

    it("should reject timeout exceeding max", () => {
      const config = { timeout: 70000 };
      expect(() => {
        providerSchemas.BaseProviderConfigSchema.parse(config);
      }).toThrow();
    });

    it("should reject invalid retry configuration", () => {
      const config = {
        retry: {
          maxAttempts: 10, // exceeds max of 5
          backoffMs: -100, // negative value
        },
      };
      expect(() => {
        providerSchemas.BaseProviderConfigSchema.parse(config);
      }).toThrow();
    });

    it("should apply retry defaults correctly", () => {
      const config = { retry: {} };
      const result = providerSchemas.BaseProviderConfigSchema.parse(config);
      expect(result.retry).toEqual({
        maxAttempts: 3,
        backoffMs: 1000,
        jitterMs: 100,
      });
    });
  });

  describe("OpenAIProviderConfigSchema", () => {
    it("should validate valid OpenAI configuration", () => {
      const config = {
        apiKey: "sk-test123",
        organization: "org-test",
        project: "proj-test",
      };

      const result = providerSchemas.OpenAIProviderConfigSchema.parse(config);
      expect(result.apiKey).toBe("sk-test123");
      expect(result.baseUrl).toBe("https://api.openai.com/v1");
      expect(result.organization).toBe("org-test");
      expect(result.project).toBe("proj-test");
    });

    it("should require apiKey", () => {
      const config = {};
      expect(() => {
        providerSchemas.OpenAIProviderConfigSchema.parse(config);
      }).toThrow();
    });

    it("should apply default baseUrl", () => {
      const config = { apiKey: "sk-test123" };
      const result = providerSchemas.OpenAIProviderConfigSchema.parse(config);
      expect(result.baseUrl).toBe("https://api.openai.com/v1");
    });

    it("should allow baseUrl override", () => {
      const config = {
        apiKey: "sk-test123",
        baseUrl: "https://custom.openai.com",
      };
      const result = providerSchemas.OpenAIProviderConfigSchema.parse(config);
      expect(result.baseUrl).toBe("https://custom.openai.com");
    });
  });

  describe("AnthropicProviderConfigSchema", () => {
    it("should validate valid Anthropic configuration", () => {
      const config = {
        apiKey: "ant-test123",
        version: "2023-06-01",
      };

      const result =
        providerSchemas.AnthropicProviderConfigSchema.parse(config);
      expect(result.apiKey).toBe("ant-test123");
      expect(result.baseUrl).toBe("https://api.anthropic.com");
      expect(result.version).toBe("2023-06-01");
    });

    it("should require apiKey", () => {
      const config = {};
      expect(() => {
        providerSchemas.AnthropicProviderConfigSchema.parse(config);
      }).toThrow();
    });

    it("should apply default version", () => {
      const config = { apiKey: "ant-test123" };
      const result =
        providerSchemas.AnthropicProviderConfigSchema.parse(config);
      expect(result.version).toBe("2023-06-01");
    });
  });

  describe("GoogleProviderConfigSchema", () => {
    it("should validate valid Google configuration", () => {
      const config = {
        apiKey: "google-test123",
        region: "us-central1",
      };

      const result = providerSchemas.GoogleProviderConfigSchema.parse(config);
      expect(result.apiKey).toBe("google-test123");
      expect(result.baseUrl).toBe(
        "https://generativelanguage.googleapis.com/v1beta",
      );
      expect(result.region).toBe("us-central1");
    });

    it("should require apiKey", () => {
      const config = {};
      expect(() => {
        providerSchemas.GoogleProviderConfigSchema.parse(config);
      }).toThrow();
    });
  });

  describe("XAIProviderConfigSchema", () => {
    it("should validate valid xAI configuration", () => {
      const config = {
        apiKey: "xai-test123",
      };

      const result = providerSchemas.XAIProviderConfigSchema.parse(config);
      expect(result.apiKey).toBe("xai-test123");
      expect(result.baseUrl).toBe("https://api.x.ai/v1");
    });

    it("should require apiKey", () => {
      const config = {};
      expect(() => {
        providerSchemas.XAIProviderConfigSchema.parse(config);
      }).toThrow();
    });
  });

  describe("ProviderConfigSchema", () => {
    it("should accept OpenAI configuration", () => {
      const config = {
        apiKey: "sk-test123",
        organization: "org-test",
      };

      const result = providerSchemas.ProviderConfigSchema.parse(config);
      expect(result.apiKey).toBe("sk-test123");
    });

    it("should accept Anthropic configuration", () => {
      const config = {
        apiKey: "ant-test123",
        version: "2023-06-01",
      };

      const result = providerSchemas.ProviderConfigSchema.parse(config);
      expect(result.apiKey).toBe("ant-test123");
    });

    it("should reject invalid configuration", () => {
      const config = {
        invalidField: "value",
      };

      expect(() => {
        providerSchemas.ProviderConfigSchema.parse(config);
      }).toThrow();
    });
  });

  describe("ProviderRegistrationSchema", () => {
    const mockPlugin = {
      id: "test-plugin",
      name: "Test Plugin",
      version: "1.0.0",
      translateRequest: () => {},
      parseResponse: async () => {},
      isTerminal: () => false,
      normalizeError: () => new Error(),
    };

    it("should validate complete registration", () => {
      const registration = {
        id: "openai",
        version: "1.0.0",
        config: {
          apiKey: "sk-test123",
        },
        plugin: mockPlugin,
      };

      const result =
        providerSchemas.ProviderRegistrationSchema.parse(registration);
      expect(result.id).toBe("openai");
      expect(result.version).toBe("1.0.0");
      expect(result.config.apiKey).toBe("sk-test123");
      expect(result.plugin.id).toBe(mockPlugin.id);
      expect(result.plugin.name).toBe(mockPlugin.name);
      expect(result.plugin.version).toBe(mockPlugin.version);
      expect(typeof result.plugin.translateRequest).toBe("function");
      expect(typeof result.plugin.parseResponse).toBe("function");
      expect(typeof result.plugin.isTerminal).toBe("function");
      expect(typeof result.plugin.normalizeError).toBe("function");
    });

    it("should reject registration with missing fields", () => {
      const registration = {
        id: "openai",
        // missing version, config, plugin
      };

      expect(() => {
        providerSchemas.ProviderRegistrationSchema.parse(registration);
      }).toThrow();
    });

    it("should reject registration with invalid plugin", () => {
      const registration = {
        id: "openai",
        version: "1.0.0",
        config: { apiKey: "sk-test123" },
        plugin: {
          // missing required plugin methods
          id: "test",
          name: "Test",
        },
      };

      expect(() => {
        providerSchemas.ProviderRegistrationSchema.parse(registration);
      }).toThrow();
    });
  });
});

describe("providerValidation", () => {
  describe("validateProviderConfig", () => {
    it("should validate successful configuration", () => {
      const config = { apiKey: "sk-test123" };
      const result = providerValidation.validateProviderConfig(
        "openai",
        config,
        providerSchemas.OpenAIProviderConfigSchema,
      );

      expect(result.apiKey).toBe("sk-test123");
      expect(result.baseUrl).toBe("https://api.openai.com/v1");
    });

    it("should throw ValidationError for invalid configuration", () => {
      const config = { apiKey: "" }; // empty apiKey

      expect(() => {
        providerValidation.validateProviderConfig(
          "openai",
          config,
          providerSchemas.OpenAIProviderConfigSchema,
        );
      }).toThrow(ValidationError);
    });

    it("should include provider ID in error message", () => {
      const config = { apiKey: "" };

      try {
        providerValidation.validateProviderConfig(
          "test-provider",
          config,
          providerSchemas.OpenAIProviderConfigSchema,
        );
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain("test-provider");
      }
    });

    it("should respect custom validation options", () => {
      const config = { apiKey: "", timeout: -1000 };

      try {
        providerValidation.validateProviderConfig(
          "openai",
          config,
          providerSchemas.OpenAIProviderConfigSchema,
          { maxIssues: 1 },
        );
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        const validationError = error as ValidationError;
        expect(Array.isArray(validationError.context?.issues)).toBe(true);
        expect((validationError.context?.issues as unknown[]).length).toBe(1);
      }
    });
  });

  describe("validateProviderRegistration", () => {
    const mockPlugin = {
      id: "test-plugin",
      name: "Test Plugin",
      version: "1.0.0",
      translateRequest: () => {},
      parseResponse: async () => {},
      isTerminal: () => false,
      normalizeError: () => new Error(),
    };

    it("should validate successful registration", () => {
      const registration = {
        id: "openai",
        version: "1.0.0",
        config: { apiKey: "sk-test123" },
        plugin: mockPlugin,
      };

      const result =
        providerValidation.validateProviderRegistration(registration);
      expect(result.id).toBe("openai");
      expect(result.version).toBe("1.0.0");
    });

    it("should throw ValidationError for invalid registration", () => {
      const registration = {
        id: "", // empty ID
        version: "1.0.0",
        config: { apiKey: "sk-test123" },
        plugin: mockPlugin,
      };

      expect(() => {
        providerValidation.validateProviderRegistration(registration);
      }).toThrow(ValidationError);
    });

    it("should include descriptive error message", () => {
      const registration = { id: "" };

      try {
        providerValidation.validateProviderRegistration(registration);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          "Invalid provider registration data",
        );
      }
    });
  });
});
