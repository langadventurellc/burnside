/**
 * xAI v1 Configuration Schema Tests
 *
 * Comprehensive unit tests for the xAI v1 provider configuration schema
 * validation, testing both valid and invalid configurations with focus on
 * security validations including HTTPS enforcement and API key format validation.
 */

import { XAIV1ConfigSchema } from "../configSchema";

describe("XAIV1ConfigSchema", () => {
  describe("valid configurations", () => {
    it("should validate minimal valid configuration", () => {
      const config = {
        apiKey: "xai-test123",
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("xai-test123");
      expect(result.baseUrl).toBe("https://api.x.ai/v1");
      expect(result.maxRetries).toBe(3);
      expect(result.timeout).toBeUndefined();
      expect(result.organization).toBeUndefined();
      expect(result.project).toBeUndefined();
      expect(result.headers).toBeUndefined();
    });

    it("should validate complete configuration", () => {
      const config = {
        apiKey: "xai-api-key-456",
        baseUrl: "https://custom-api.example.com",
        timeout: 60000,
        organization: "test-org",
        project: "test-project",
        headers: { "X-Custom-Header": "value" },
        maxRetries: 5,
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("xai-api-key-456");
      expect(result.baseUrl).toBe("https://custom-api.example.com");
      expect(result.timeout).toBe(60000);
      expect(result.organization).toBe("test-org");
      expect(result.project).toBe("test-project");
      expect(result.headers).toEqual({ "X-Custom-Header": "value" });
      expect(result.maxRetries).toBe(5);
    });

    it("should apply default values when optional fields not provided", () => {
      const config = {
        apiKey: "xai-test123",
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.baseUrl).toBe("https://api.x.ai/v1");
      expect(result.maxRetries).toBe(3);
    });

    it("should validate with empty optional strings", () => {
      const config = {
        apiKey: "xai-test123",
        organization: "",
        project: "",
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("xai-test123");
      expect(result.organization).toBe("");
      expect(result.project).toBe("");
    });

    it("should validate with complex headers", () => {
      const config = {
        apiKey: "xai-test123",
        headers: {
          Authorization: "Bearer token",
          "X-API-Version": "v1",
          "Content-Type": "application/json",
        },
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.headers).toEqual({
        Authorization: "Bearer token",
        "X-API-Version": "v1",
        "Content-Type": "application/json",
      });
    });
  });

  describe("invalid API key validation", () => {
    it("should reject missing API key", () => {
      const config = {};

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "API key is required",
      );
    });

    it("should reject empty API key", () => {
      const config = {
        apiKey: "",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "API key is required",
      );
    });

    it("should reject API key without xai- prefix", () => {
      const config = {
        apiKey: "sk-test123",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "API key must start with 'xai-'",
      );
    });

    it("should reject OpenAI-style API key", () => {
      const config = {
        apiKey: "sk-proj-test123",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "API key must start with 'xai-'",
      );
    });

    it("should reject Anthropic-style API key", () => {
      const config = {
        apiKey: "sk-ant-test123",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "API key must start with 'xai-'",
      );
    });

    it("should reject invalid key format", () => {
      const config = {
        apiKey: "invalid-key",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "API key must start with 'xai-'",
      );
    });
  });

  describe("HTTPS enforcement for baseUrl", () => {
    it("should reject HTTP URLs", () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "http://api.x.ai/v1",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject non-HTTPS protocols", () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "ftp://api.x.ai/v1",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject data URLs (security)", () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "data:text/plain,hello",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject file URLs (security)", () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "file:///etc/passwd",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject malformed URLs", () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "not-a-url",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Invalid base URL format",
      );
    });

    it("should accept valid HTTPS URLs", () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "https://custom-api.example.com/v1",
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.baseUrl).toBe("https://custom-api.example.com/v1");
    });
  });

  describe("timeout validation", () => {
    it("should accept valid timeout values", () => {
      const config = {
        apiKey: "xai-test123",
        timeout: 30000,
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.timeout).toBe(30000);
    });

    it("should accept minimum timeout value", () => {
      const config = {
        apiKey: "xai-test123",
        timeout: 1,
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.timeout).toBe(1);
    });

    it("should accept maximum timeout value", () => {
      const config = {
        apiKey: "xai-test123",
        timeout: 300000,
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.timeout).toBe(300000);
    });

    it("should reject negative timeout", () => {
      const config = {
        apiKey: "xai-test123",
        timeout: -1000,
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Timeout must be positive",
      );
    });

    it("should reject zero timeout", () => {
      const config = {
        apiKey: "xai-test123",
        timeout: 0,
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Timeout must be positive",
      );
    });

    it("should reject timeout exceeding maximum", () => {
      const config = {
        apiKey: "xai-test123",
        timeout: 300001,
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Timeout cannot exceed 300000ms",
      );
    });

    it("should reject non-integer timeout", () => {
      const config = {
        apiKey: "xai-test123",
        timeout: 30000.5,
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Timeout must be an integer",
      );
    });
  });

  describe("maxRetries validation", () => {
    it("should accept valid retry values", () => {
      const config = {
        apiKey: "xai-test123",
        maxRetries: 2,
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.maxRetries).toBe(2);
    });

    it("should accept minimum retry value", () => {
      const config = {
        apiKey: "xai-test123",
        maxRetries: 0,
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.maxRetries).toBe(0);
    });

    it("should accept maximum retry value", () => {
      const config = {
        apiKey: "xai-test123",
        maxRetries: 5,
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.maxRetries).toBe(5);
    });

    it("should reject negative retries", () => {
      const config = {
        apiKey: "xai-test123",
        maxRetries: -1,
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Max retries cannot be negative",
      );
    });

    it("should reject retries exceeding maximum", () => {
      const config = {
        apiKey: "xai-test123",
        maxRetries: 6,
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Max retries cannot exceed 5",
      );
    });

    it("should reject non-integer retries", () => {
      const config = {
        apiKey: "xai-test123",
        maxRetries: 3.5,
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Max retries must be an integer",
      );
    });
  });

  describe("optional fields", () => {
    it("should handle undefined optional fields", () => {
      const config = {
        apiKey: "xai-test123",
        organization: undefined,
        project: undefined,
        headers: undefined,
        timeout: undefined,
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.organization).toBeUndefined();
      expect(result.project).toBeUndefined();
      expect(result.headers).toBeUndefined();
      expect(result.timeout).toBeUndefined();
    });

    it("should validate string organization and project", () => {
      const config = {
        apiKey: "xai-test123",
        organization: "my-org",
        project: "my-project",
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.organization).toBe("my-org");
      expect(result.project).toBe("my-project");
    });

    it("should validate headers as string record", () => {
      const config = {
        apiKey: "xai-test123",
        headers: { key1: "value1", key2: "value2" },
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.headers).toEqual({ key1: "value1", key2: "value2" });
    });

    it("should reject non-string header values", () => {
      const config = {
        apiKey: "xai-test123",
        headers: { key1: 123 },
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow();
    });
  });

  describe("type inference and defaults", () => {
    it("should have correct TypeScript types", () => {
      const config = {
        apiKey: "xai-test123",
      };

      const result = XAIV1ConfigSchema.parse(config);

      // Type assertions to verify TypeScript inference
      const apiKey: string = result.apiKey;
      const baseUrl: string = result.baseUrl;
      const maxRetries: number = result.maxRetries;
      const _timeout: number | undefined = result.timeout;
      const _organization: string | undefined = result.organization;
      const _project: string | undefined = result.project;
      const _headers: Record<string, string> | undefined = result.headers;

      expect(typeof apiKey).toBe("string");
      expect(typeof baseUrl).toBe("string");
      expect(typeof maxRetries).toBe("number");
    });

    it("should preserve all defaults when not overridden", () => {
      const config = {
        apiKey: "xai-test123",
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.baseUrl).toBe("https://api.x.ai/v1");
      expect(result.maxRetries).toBe(3);
    });
  });

  describe("security edge cases", () => {
    it("should reject protocol-relative URLs", () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "//evil.com/api",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Invalid base URL format",
      );
    });

    it("should reject javascript URLs", () => {
      const config = {
        apiKey: "xai-test123",
        baseUrl: "javascript:alert('xss')",
      };

      expect(() => XAIV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject localhost HTTP in headers but allow API key", () => {
      const config = {
        apiKey: "xai-localhost-test", // This should be valid as it starts with xai-
        baseUrl: "https://api.x.ai/v1",
      };

      const result = XAIV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("xai-localhost-test");
    });
  });
});
