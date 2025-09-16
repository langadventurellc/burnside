/**
 * OpenAI Configuration Schema Tests
 *
 * Comprehensive unit tests for the OpenAI Responses v1 configuration schema
 * validation, testing both valid and invalid configurations.
 */

import { OpenAIResponsesV1ConfigSchema } from "../configSchema.js";

describe("OpenAIResponsesV1ConfigSchema", () => {
  describe("valid configurations", () => {
    it("should validate minimal valid configuration", () => {
      const config = {
        apiKey: "sk-test123",
      };

      const result = OpenAIResponsesV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("sk-test123");
      expect(result.baseUrl).toBe("https://api.openai.com/v1");
    });

    it("should validate complete configuration", () => {
      const config = {
        apiKey: "sk-test123",
        baseUrl: "https://custom-api.example.com/v1",
        organization: "org-123",
        project: "proj-456",
        timeout: 30000,
        headers: {
          "X-Custom-Header": "custom-value",
        },
      };

      const result = OpenAIResponsesV1ConfigSchema.parse(config);

      expect(result.apiKey).toBe("sk-test123");
      expect(result.baseUrl).toBe("https://custom-api.example.com/v1");
      expect(result.organization).toBe("org-123");
      expect(result.project).toBe("proj-456");
      expect(result.timeout).toBe(30000);
      expect(result.headers).toEqual({ "X-Custom-Header": "custom-value" });
    });

    it("should apply default baseUrl when not provided", () => {
      const config = {
        apiKey: "sk-test123",
      };

      const result = OpenAIResponsesV1ConfigSchema.parse(config);

      expect(result.baseUrl).toBe("https://api.openai.com/v1");
    });
  });

  describe("invalid configurations", () => {
    it("should reject missing apiKey", () => {
      const config = {};

      expect(() => OpenAIResponsesV1ConfigSchema.parse(config)).toThrow();
    });

    it("should reject empty apiKey", () => {
      const config = {
        apiKey: "",
      };

      expect(() => OpenAIResponsesV1ConfigSchema.parse(config)).toThrow();
    });

    it("should reject invalid baseUrl", () => {
      const config = {
        apiKey: "sk-test123",
        baseUrl: "not-a-url",
      };

      expect(() => OpenAIResponsesV1ConfigSchema.parse(config)).toThrow();
    });

    it("should reject timeout exceeding maximum", () => {
      const config = {
        apiKey: "sk-test123",
        timeout: 121000, // Exceeds 60000ms limit
      };

      expect(() => OpenAIResponsesV1ConfigSchema.parse(config)).toThrow();
    });

    it("should reject negative timeout", () => {
      const config = {
        apiKey: "sk-test123",
        timeout: -1000,
      };

      expect(() => OpenAIResponsesV1ConfigSchema.parse(config)).toThrow();
    });

    it("should reject non-integer timeout", () => {
      const config = {
        apiKey: "sk-test123",
        timeout: 30.5,
      };

      expect(() => OpenAIResponsesV1ConfigSchema.parse(config)).toThrow();
    });

    it("should reject invalid headers type", () => {
      const config = {
        apiKey: "sk-test123",
        headers: "invalid-headers",
      };

      expect(() => OpenAIResponsesV1ConfigSchema.parse(config)).toThrow();
    });
  });

  describe("optional fields", () => {
    it("should handle missing optional fields", () => {
      const config = {
        apiKey: "sk-test123",
      };

      const result = OpenAIResponsesV1ConfigSchema.parse(config);

      expect(result.organization).toBeUndefined();
      expect(result.project).toBeUndefined();
      expect(result.timeout).toBeUndefined();
      expect(result.headers).toBeUndefined();
    });

    it("should preserve optional fields when provided", () => {
      const config = {
        apiKey: "sk-test123",
        organization: "org-123",
      };

      const result = OpenAIResponsesV1ConfigSchema.parse(config);

      expect(result.organization).toBe("org-123");
      expect(result.project).toBeUndefined();
    });
  });
});
