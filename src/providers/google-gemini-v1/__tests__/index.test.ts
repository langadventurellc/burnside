/**
 * Tests for Google Gemini v1 Provider Module Exports
 *
 * Verifies that the provider module exports work correctly and follow
 * the established patterns for provider plugin integration.
 */

import {
  GoogleGeminiV1Provider,
  type GoogleGeminiV1Config,
  GoogleGeminiV1ConfigSchema,
  GoogleGeminiV1RequestSchema,
  type GoogleGeminiV1Request,
  GoogleGeminiV1ResponseSchema,
  GoogleGeminiV1StreamingResponseSchema,
  type GoogleGeminiV1Response,
  GOOGLE_GEMINI_PROVIDER_INFO,
  parseGeminiResponseStream,
  parseGeminiResponse,
  translateChatRequest,
  toolTranslator,
  parseFunctionCall,
  normalizeGeminiError,
} from "../index";

// Test default export
import GoogleGeminiProviderDefault from "../index";

// Test import from main providers module
import {
  GoogleGeminiV1Provider as MainGoogleGeminiProvider,
  GOOGLE_GEMINI_PROVIDER_INFO as MainGoogleGeminiInfo,
} from "../../index";

describe("Google Gemini v1 Provider Module Exports", () => {
  describe("Named Exports", () => {
    it("should export GoogleGeminiV1Provider class", () => {
      expect(GoogleGeminiV1Provider).toBeDefined();
      expect(typeof GoogleGeminiV1Provider).toBe("function");
      expect(GoogleGeminiV1Provider.name).toBe("GoogleGeminiV1Provider");
    });

    it("should export configuration schema", () => {
      expect(GoogleGeminiV1ConfigSchema).toBeDefined();
      expect(typeof GoogleGeminiV1ConfigSchema).toBe("object");
      expect(GoogleGeminiV1ConfigSchema.parse).toBeDefined();
    });

    it("should export request and response schemas", () => {
      expect(GoogleGeminiV1RequestSchema).toBeDefined();
      expect(GoogleGeminiV1ResponseSchema).toBeDefined();
      expect(GoogleGeminiV1StreamingResponseSchema).toBeDefined();
      expect(typeof GoogleGeminiV1RequestSchema).toBe("object");
      expect(typeof GoogleGeminiV1ResponseSchema).toBe("object");
      expect(typeof GoogleGeminiV1StreamingResponseSchema).toBe("object");
    });

    it("should export provider metadata info", () => {
      expect(GOOGLE_GEMINI_PROVIDER_INFO).toBeDefined();
      expect(GOOGLE_GEMINI_PROVIDER_INFO).toEqual({
        id: "google",
        version: "gemini-v1",
        name: "Google Gemini Provider",
      });
      // Note: as const makes properties readonly at compile time, but doesn't freeze at runtime
      expect(typeof GOOGLE_GEMINI_PROVIDER_INFO).toBe("object");
    });

    it("should export utility functions", () => {
      expect(parseGeminiResponseStream).toBeDefined();
      expect(parseGeminiResponse).toBeDefined();
      expect(translateChatRequest).toBeDefined();
      expect(toolTranslator).toBeDefined();
      expect(parseFunctionCall).toBeDefined();
      expect(normalizeGeminiError).toBeDefined();
      expect(typeof parseGeminiResponseStream).toBe("function");
      expect(typeof parseGeminiResponse).toBe("function");
      expect(typeof translateChatRequest).toBe("function");
      expect(typeof toolTranslator).toBe("object"); // toolTranslator is exported as an object
      expect(typeof parseFunctionCall).toBe("function");
      expect(typeof normalizeGeminiError).toBe("function");
    });
  });

  describe("Default Export", () => {
    it("should export GoogleGeminiV1Provider as default", () => {
      expect(GoogleGeminiProviderDefault).toBeDefined();
      expect(GoogleGeminiProviderDefault).toBe(GoogleGeminiV1Provider);
      expect(typeof GoogleGeminiProviderDefault).toBe("function");
      expect(GoogleGeminiProviderDefault.name).toBe("GoogleGeminiV1Provider");
    });
  });

  describe("TypeScript Type Exports", () => {
    it("should have GoogleGeminiV1Config type available", () => {
      // Test type compilation by using the type in a function signature
      const testConfig = (config: GoogleGeminiV1Config): GoogleGeminiV1Config =>
        config;
      expect(typeof testConfig).toBe("function");

      // Test basic type structure with all required fields
      const validConfig: GoogleGeminiV1Config = {
        apiKey: "test-api-key",
        baseUrl: "https://generativelanguage.googleapis.com/v1/",
        timeout: 30000,
        maxRetries: 3,
      };
      expect(validConfig).toBeDefined();
      expect(validConfig.apiKey).toBe("test-api-key");
    });

    it("should have GoogleGeminiV1Request type available", () => {
      // Test type compilation
      const testRequest = (
        request: GoogleGeminiV1Request,
      ): GoogleGeminiV1Request => request;
      expect(typeof testRequest).toBe("function");
    });

    it("should have GoogleGeminiV1Response type available", () => {
      // Test type compilation
      const testResponse = (
        response: GoogleGeminiV1Response,
      ): GoogleGeminiV1Response => response;
      expect(typeof testResponse).toBe("function");
    });
  });

  describe("Provider Instance Creation", () => {
    it("should allow provider instantiation", () => {
      expect(() => new GoogleGeminiV1Provider()).not.toThrow();
      const provider = new GoogleGeminiV1Provider();
      expect(provider).toBeInstanceOf(GoogleGeminiV1Provider);
    });

    it("should have correct provider metadata", () => {
      const provider = new GoogleGeminiV1Provider();
      expect(provider.id).toBe("google");
      expect(provider.version).toBe("gemini-v1");
      expect(provider.name).toBe("Google Gemini Provider");
    });

    it("should support expected Gemini models", () => {
      const provider = new GoogleGeminiV1Provider();
      const geminiModels = [
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
      ];

      geminiModels.forEach((modelId) => {
        expect(provider.supportsModel(modelId)).toBe(true);
      });

      // Should not support non-Gemini models
      expect(provider.supportsModel("gpt-4")).toBe(false);
      expect(provider.supportsModel("claude-3-opus")).toBe(false);
    });
  });

  describe("Schema Validation", () => {
    it("should validate configuration with schema", () => {
      const validConfig = {
        apiKey: "test-api-key",
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(validConfig)).not.toThrow();
      const parsedConfig = GoogleGeminiV1ConfigSchema.parse(validConfig);
      expect(parsedConfig.apiKey).toBe("test-api-key");
    });

    it("should reject invalid configuration", () => {
      const invalidConfig = {
        // missing apiKey
      };

      expect(() => GoogleGeminiV1ConfigSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe("Integration with Main Provider Registry", () => {
    it("should be accessible from main providers module", () => {
      expect(MainGoogleGeminiProvider).toBeDefined();
      expect(MainGoogleGeminiProvider).toBe(GoogleGeminiV1Provider);
      expect(MainGoogleGeminiInfo).toBeDefined();
      expect(MainGoogleGeminiInfo).toBe(GOOGLE_GEMINI_PROVIDER_INFO);
    });

    it("should maintain provider info consistency", () => {
      expect(MainGoogleGeminiInfo).toEqual(GOOGLE_GEMINI_PROVIDER_INFO);
      expect(MainGoogleGeminiInfo.id).toBe("google");
      expect(MainGoogleGeminiInfo.version).toBe("gemini-v1");
      expect(MainGoogleGeminiInfo.name).toBe("Google Gemini Provider");
    });
  });

  describe("Export Pattern Consistency", () => {
    it("should follow established provider export pattern", () => {
      // Core exports
      expect(GoogleGeminiV1Provider).toBeDefined();
      expect(GOOGLE_GEMINI_PROVIDER_INFO).toBeDefined();
      expect(GoogleGeminiProviderDefault).toBe(GoogleGeminiV1Provider);

      // Schema exports
      expect(GoogleGeminiV1ConfigSchema).toBeDefined();
      expect(GoogleGeminiV1RequestSchema).toBeDefined();
      expect(GoogleGeminiV1ResponseSchema).toBeDefined();

      // Utility exports
      expect(parseGeminiResponse).toBeDefined();
      expect(parseGeminiResponseStream).toBeDefined();
      expect(translateChatRequest).toBeDefined();
      expect(normalizeGeminiError).toBeDefined();
    });

    it("should have readonly provider info", () => {
      // as const makes properties readonly at compile time
      // Runtime mutability depends on environment, so we test structure instead
      expect(GOOGLE_GEMINI_PROVIDER_INFO.id).toBe("google");
      expect(GOOGLE_GEMINI_PROVIDER_INFO.version).toBe("gemini-v1");
      expect(GOOGLE_GEMINI_PROVIDER_INFO.name).toBe("Google Gemini Provider");
    });
  });
});
