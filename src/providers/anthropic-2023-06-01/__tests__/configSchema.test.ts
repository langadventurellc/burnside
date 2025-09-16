/**
 * Anthropic Configuration Schema Tests
 *
 * Comprehensive unit tests for the Anthropic Messages API configuration schema
 * validation, testing both valid and invalid configurations with focus on
 * security validations including HTTPS enforcement and API key format validation.
 */

import { AnthropicMessagesConfigSchema } from "../configSchema.js";

describe("AnthropicMessagesConfigSchema", () => {
  describe("valid configurations", () => {
    it("should validate minimal valid configuration", () => {
      const config = {
        apiKey: "sk-ant-test123",
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.apiKey).toBe("sk-ant-test123");
      expect(result.baseUrl).toBe("https://api.anthropic.com");
      expect(result.version).toBe("2023-06-01");
      expect(result.timeout).toBe(30000);
      expect(result.maxRetries).toBe(3);
    });

    it("should validate complete configuration", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "https://custom-api.example.com",
        version: "2024-01-15",
        timeout: 60000,
        maxRetries: 5,
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.apiKey).toBe("sk-ant-test123");
      expect(result.baseUrl).toBe("https://custom-api.example.com");
      expect(result.version).toBe("2024-01-15");
      expect(result.timeout).toBe(60000);
      expect(result.maxRetries).toBe(5);
    });

    it("should apply default values when optional fields not provided", () => {
      const config = {
        apiKey: "sk-ant-test123",
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.baseUrl).toBe("https://api.anthropic.com");
      expect(result.version).toBe("2023-06-01");
      expect(result.timeout).toBe(30000);
      expect(result.maxRetries).toBe(3);
    });

    it("should accept valid timeout boundary values", () => {
      const config1 = {
        apiKey: "sk-ant-test123",
        timeout: 1,
      };

      const config2 = {
        apiKey: "sk-ant-test123",
        timeout: 300000,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config1)).not.toThrow();
      expect(() => AnthropicMessagesConfigSchema.parse(config2)).not.toThrow();
    });

    it("should accept valid retry boundary values", () => {
      const config1 = {
        apiKey: "sk-ant-test123",
        maxRetries: 0,
      };

      const config2 = {
        apiKey: "sk-ant-test123",
        maxRetries: 5,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config1)).not.toThrow();
      expect(() => AnthropicMessagesConfigSchema.parse(config2)).not.toThrow();
    });
  });

  describe("invalid API key validation", () => {
    it("should reject missing apiKey", () => {
      const config = {};

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "API key is required",
      );
    });

    it("should reject empty apiKey", () => {
      const config = {
        apiKey: "",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "API key is required",
      );
    });

    it("should reject apiKey without sk-ant- prefix", () => {
      const config = {
        apiKey: "sk-test123",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Invalid Anthropic API key format",
      );
    });

    it("should reject apiKey with wrong prefix", () => {
      const config = {
        apiKey: "sk-openai-test123",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Invalid Anthropic API key format",
      );
    });

    it("should reject completely invalid apiKey format", () => {
      const config = {
        apiKey: "invalid-key",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Invalid Anthropic API key format",
      );
    });
  });

  describe("HTTPS enforcement for baseUrl", () => {
    it("should reject HTTP baseUrl (security vulnerability)", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "http://api.anthropic.com",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject malformed baseUrl", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "not-a-url",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Invalid base URL format",
      );
    });

    it("should reject baseUrl without protocol", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "api.anthropic.com",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Invalid base URL format",
      );
    });

    it("should accept valid HTTPS baseUrl", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "https://custom-api.example.com",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).not.toThrow();
    });
  });

  describe("version validation", () => {
    it("should reject invalid version format", () => {
      const config = {
        apiKey: "sk-ant-test123",
        version: "v1.0",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Version must be in YYYY-MM-DD format",
      );
    });

    it("should reject version with wrong date format", () => {
      const config = {
        apiKey: "sk-ant-test123",
        version: "23-06-01",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Version must be in YYYY-MM-DD format",
      );
    });

    it("should accept valid date format version", () => {
      const config = {
        apiKey: "sk-ant-test123",
        version: "2024-12-25",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).not.toThrow();
    });
  });

  describe("timeout validation", () => {
    it("should reject negative timeout", () => {
      const config = {
        apiKey: "sk-ant-test123",
        timeout: -1000,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Timeout must be positive",
      );
    });

    it("should reject zero timeout", () => {
      const config = {
        apiKey: "sk-ant-test123",
        timeout: 0,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Timeout must be positive",
      );
    });

    it("should reject timeout exceeding maximum", () => {
      const config = {
        apiKey: "sk-ant-test123",
        timeout: 300001,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Timeout cannot exceed 300000ms",
      );
    });

    it("should reject non-integer timeout", () => {
      const config = {
        apiKey: "sk-ant-test123",
        timeout: 30.5,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Timeout must be an integer",
      );
    });
  });

  describe("maxRetries validation", () => {
    it("should reject negative maxRetries", () => {
      const config = {
        apiKey: "sk-ant-test123",
        maxRetries: -1,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Max retries cannot be negative",
      );
    });

    it("should reject maxRetries exceeding maximum", () => {
      const config = {
        apiKey: "sk-ant-test123",
        maxRetries: 6,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Max retries cannot exceed 5",
      );
    });

    it("should reject non-integer maxRetries", () => {
      const config = {
        apiKey: "sk-ant-test123",
        maxRetries: 2.5,
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Max retries must be an integer",
      );
    });
  });

  describe("type inference and defaults", () => {
    it("should preserve all provided values", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "https://custom-api.example.com",
        version: "2024-01-15",
        timeout: 45000,
        maxRetries: 2,
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result).toEqual(config);
    });

    it("should apply defaults only for missing fields", () => {
      const config = {
        apiKey: "sk-ant-test123",
        timeout: 45000,
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.apiKey).toBe("sk-ant-test123");
      expect(result.timeout).toBe(45000);
      expect(result.baseUrl).toBe("https://api.anthropic.com");
      expect(result.version).toBe("2023-06-01");
      expect(result.maxRetries).toBe(3);
    });
  });

  describe("security edge cases", () => {
    it("should reject baseUrl with query parameters that could be exploited", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "http://localhost:8080/?redirect=evil.com",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject baseUrl using data: protocol", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "data:text/html,<script>alert('xss')</script>",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should accept HTTPS baseUrl with valid path", () => {
      const config = {
        apiKey: "sk-ant-test123",
        baseUrl: "https://api.anthropic.com/v1/messages",
      };

      expect(() => AnthropicMessagesConfigSchema.parse(config)).not.toThrow();
    });
  });
});
