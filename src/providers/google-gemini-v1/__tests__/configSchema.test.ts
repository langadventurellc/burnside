/**
 * Google Gemini v1 Configuration Schema Tests
 *
 * Comprehensive unit tests for the Google Gemini v1 provider configuration schema
 * validation, testing both valid and invalid configurations with focus on
 * security validations including HTTPS enforcement and API key format validation.
 */

import { GoogleGeminiV1ConfigSchema } from "../configSchema";

describe("GoogleGeminiV1ConfigSchema", () => {
  describe("valid configurations", () => {
    it("should validate minimal valid configuration", () => {
      const config = {
        apiKey: "AIzaSyTest123",
      };

      const result = GoogleGeminiV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("AIzaSyTest123");
      expect(result.baseUrl).toBe(
        "https://generativelanguage.googleapis.com/v1beta/",
      );
      expect(result.timeout).toBe(30000);
      expect(result.maxRetries).toBe(3);
    });

    it("should validate complete configuration", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "https://custom-gemini-api.example.com/v1/",
        timeout: 60000,
        maxRetries: 5,
      };

      const result = GoogleGeminiV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("AIzaSyTest123");
      expect(result.baseUrl).toBe("https://custom-gemini-api.example.com/v1/");
      expect(result.timeout).toBe(60000);
      expect(result.maxRetries).toBe(5);
    });

    it("should apply default values when optional fields not provided", () => {
      const config = {
        apiKey: "AIzaSyTest123",
      };

      const result = GoogleGeminiV1ConfigSchema.parse(config);

      expect(result.baseUrl).toBe(
        "https://generativelanguage.googleapis.com/v1beta/",
      );
      expect(result.timeout).toBe(30000);
      expect(result.maxRetries).toBe(3);
    });

    it("should accept valid timeout boundary values", () => {
      const config1 = {
        apiKey: "AIzaSyTest123",
        timeout: 1,
      };

      const config2 = {
        apiKey: "AIzaSyTest123",
        timeout: 300000,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config1)).not.toThrow();
      expect(() => GoogleGeminiV1ConfigSchema.parse(config2)).not.toThrow();
    });

    it("should accept valid retry boundary values", () => {
      const config1 = {
        apiKey: "AIzaSyTest123",
        maxRetries: 0,
      };

      const config2 = {
        apiKey: "AIzaSyTest123",
        maxRetries: 5,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config1)).not.toThrow();
      expect(() => GoogleGeminiV1ConfigSchema.parse(config2)).not.toThrow();
    });
  });

  describe("invalid API key validation", () => {
    it("should reject missing apiKey", () => {
      const config = {};

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "API key is required",
      );
    });

    it("should reject empty apiKey", () => {
      const config = {
        apiKey: "",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "API key is required",
      );
    });

    it("should accept various valid API key formats", () => {
      const validKeys = [
        "AIzaSyTest123",
        "AIzaSy-test_key_123",
        "test-api-key-123",
        "gcp-service-account-key",
      ];

      validKeys.forEach((apiKey) => {
        const config = { apiKey };
        expect(() => GoogleGeminiV1ConfigSchema.parse(config)).not.toThrow();
      });
    });
  });

  describe("HTTPS enforcement for baseUrl", () => {
    it("should reject HTTP baseUrl (security vulnerability)", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "http://generativelanguage.googleapis.com/v1beta/",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject malformed baseUrl", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "not-a-url",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Invalid base URL format",
      );
    });

    it("should reject baseUrl without protocol", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "generativelanguage.googleapis.com/v1beta/",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Invalid base URL format",
      );
    });

    it("should accept valid HTTPS baseUrl", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "https://custom-gemini-api.example.com/v1/",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).not.toThrow();
    });
  });

  describe("timeout validation", () => {
    it("should reject negative timeout", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        timeout: -1000,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Timeout must be positive",
      );
    });

    it("should reject zero timeout", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        timeout: 0,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Timeout must be positive",
      );
    });

    it("should reject timeout exceeding maximum", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        timeout: 300001,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Timeout cannot exceed 300000ms",
      );
    });

    it("should reject non-integer timeout", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        timeout: 30.5,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Timeout must be an integer",
      );
    });
  });

  describe("maxRetries validation", () => {
    it("should reject negative maxRetries", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        maxRetries: -1,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Max retries cannot be negative",
      );
    });

    it("should reject maxRetries exceeding maximum", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        maxRetries: 6,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Max retries cannot exceed 5",
      );
    });

    it("should reject non-integer maxRetries", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        maxRetries: 2.5,
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Max retries must be an integer",
      );
    });
  });

  describe("type inference and defaults", () => {
    it("should preserve all provided values", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "https://custom-gemini-api.example.com/v1/",
        timeout: 45000,
        maxRetries: 2,
      };

      const result = GoogleGeminiV1ConfigSchema.parse(config);

      expect(result).toEqual(config);
    });

    it("should apply defaults only for missing fields", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        timeout: 45000,
      };

      const result = GoogleGeminiV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("AIzaSyTest123");
      expect(result.timeout).toBe(45000);
      expect(result.baseUrl).toBe(
        "https://generativelanguage.googleapis.com/v1beta/",
      );
      expect(result.maxRetries).toBe(3);
    });
  });

  describe("security edge cases", () => {
    it("should reject baseUrl with query parameters that could be exploited", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "http://localhost:8080/?redirect=evil.com",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject baseUrl using data: protocol", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "data:text/html,<script>alert('xss')</script>",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should accept HTTPS baseUrl with valid path", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).not.toThrow();
    });

    it("should reject file: protocol baseUrl", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "file:///etc/passwd",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });

    it("should reject ftp: protocol baseUrl", () => {
      const config = {
        apiKey: "AIzaSyTest123",
        baseUrl: "ftp://malicious.example.com/",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(config)).toThrow(
        "Base URL must use HTTPS protocol",
      );
    });
  });
});
