/**
 * Tests for Anthropic Messages API Provider Module Exports
 *
 * Verifies that the provider module exports work correctly and follow
 * the established patterns for provider plugin integration.
 */

import {
  AnthropicMessagesV1Provider,
  type AnthropicMessagesConfig,
  AnthropicMessagesConfigSchema,
  type AnthropicMessagesConfigType,
  AnthropicMessagesRequestSchema,
  type AnthropicMessagesRequestType,
  AnthropicMessagesResponseSchema,
  AnthropicStreamingResponseSchema,
  AnthropicErrorResponseSchema,
  type AnthropicMessagesResponseType,
  ANTHROPIC_PROVIDER_INFO,
} from "../index.js";

// Test default export
import AnthropicProviderDefault from "../index.js";

// Test import from main providers module
import {
  AnthropicMessagesV1Provider as MainAnthropicProvider,
  ANTHROPIC_PROVIDER_INFO as MainAnthropicInfo,
} from "../../index.js";

describe("Anthropic Provider Module Exports", () => {
  describe("Named Exports", () => {
    it("should export AnthropicMessagesV1Provider class", () => {
      expect(AnthropicMessagesV1Provider).toBeDefined();
      expect(typeof AnthropicMessagesV1Provider).toBe("function");
      expect(AnthropicMessagesV1Provider.name).toBe(
        "AnthropicMessagesV1Provider",
      );
    });

    it("should export configuration schema", () => {
      expect(AnthropicMessagesConfigSchema).toBeDefined();
      expect(typeof AnthropicMessagesConfigSchema).toBe("object");
      expect(AnthropicMessagesConfigSchema.parse).toBeDefined();
    });

    it("should export request and response schemas", () => {
      expect(AnthropicMessagesRequestSchema).toBeDefined();
      expect(AnthropicMessagesResponseSchema).toBeDefined();
      expect(AnthropicStreamingResponseSchema).toBeDefined();
      expect(AnthropicErrorResponseSchema).toBeDefined();
    });

    it("should export provider metadata constant", () => {
      expect(ANTHROPIC_PROVIDER_INFO).toBeDefined();
      expect(ANTHROPIC_PROVIDER_INFO).toEqual({
        id: "anthropic",
        version: "2023-06-01",
        name: "Anthropic Messages Provider",
      });
    });
  });

  describe("Default Export", () => {
    it("should export AnthropicMessagesV1Provider as default", () => {
      expect(AnthropicProviderDefault).toBeDefined();
      expect(AnthropicProviderDefault).toBe(AnthropicMessagesV1Provider);
    });

    it("should be the same class as named export", () => {
      expect(AnthropicProviderDefault.name).toBe("AnthropicMessagesV1Provider");
    });
  });

  describe("TypeScript Type Exports", () => {
    it("should export configuration types", () => {
      // Test that types can be used (compilation test)
      const configTest: AnthropicMessagesConfig = {
        apiKey: "sk-ant-test123",
        baseUrl: "https://api.anthropic.com",
        version: "2023-06-01",
        timeout: 30000,
        maxRetries: 3,
      };
      expect(configTest).toBeDefined();

      const configTypeTest: AnthropicMessagesConfigType = {
        apiKey: "sk-ant-test123",
        baseUrl: "https://api.anthropic.com",
        version: "2023-06-01",
        timeout: 30000,
        maxRetries: 3,
      };
      expect(configTypeTest).toBeDefined();
    });

    it("should export request and response types", () => {
      // Test that types can be used (compilation test)
      const requestTest: AnthropicMessagesRequestType = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: "Hello" }],
      };
      expect(requestTest).toBeDefined();

      const responseTest: AnthropicMessagesResponseType = {
        id: "msg_test",
        type: "message",
        role: "assistant",
        model: "claude-sonnet-4-20250514",
        content: [{ type: "text", text: "Hello!" }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 5 },
      };
      expect(responseTest).toBeDefined();
    });
  });

  describe("Provider Instance", () => {
    it("should create provider instance with correct properties", () => {
      const provider = new AnthropicMessagesV1Provider();

      expect(provider.id).toBe("anthropic");
      expect(provider.version).toBe("2023-06-01");
      expect(provider.name).toBe("Anthropic Messages Provider");
    });

    it("should match metadata constant values", () => {
      const provider = new AnthropicMessagesV1Provider();

      expect(provider.id).toBe(ANTHROPIC_PROVIDER_INFO.id);
      expect(provider.version).toBe(ANTHROPIC_PROVIDER_INFO.version);
      expect(provider.name).toBe(ANTHROPIC_PROVIDER_INFO.name);
    });
  });

  describe("Integration with Main Providers Module", () => {
    it("should be accessible from main providers index", () => {
      expect(MainAnthropicProvider).toBeDefined();
      expect(MainAnthropicProvider).toBe(AnthropicMessagesV1Provider);
    });

    it("should export metadata from main providers index", () => {
      expect(MainAnthropicInfo).toBeDefined();
      expect(MainAnthropicInfo).toEqual(ANTHROPIC_PROVIDER_INFO);
    });
  });

  describe("Schema Export Compatibility", () => {
    it("should export all schema objects for backward compatibility", () => {
      // Verify schemas can be used for validation (using minimal config with just apiKey)
      const validConfig = {
        apiKey: "sk-ant-test123",
      };

      expect(() =>
        AnthropicMessagesConfigSchema.parse(validConfig),
      ).not.toThrow();
    });

    it("should export request schema for validation", () => {
      const validRequest = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: "Hello" }],
      };

      expect(() =>
        AnthropicMessagesRequestSchema.parse(validRequest),
      ).not.toThrow();
    });

    it("should export response schemas for validation", () => {
      const validResponse = {
        id: "msg_test",
        type: "message",
        role: "assistant",
        model: "claude-sonnet-4-20250514",
        content: [{ type: "text", text: "Hello!" }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      expect(() =>
        AnthropicMessagesResponseSchema.parse(validResponse),
      ).not.toThrow();
    });
  });

  describe("Export Pattern Consistency", () => {
    it("should follow OpenAI provider export pattern", () => {
      // Test that the exports follow the same pattern as OpenAI provider
      // Provider class, config type, default export, and metadata
      expect(typeof AnthropicMessagesV1Provider).toBe("function");
      expect(typeof ANTHROPIC_PROVIDER_INFO).toBe("object");
      expect(AnthropicProviderDefault).toBe(AnthropicMessagesV1Provider);
    });

    it("should have consistent metadata structure", () => {
      expect(ANTHROPIC_PROVIDER_INFO).toHaveProperty("id");
      expect(ANTHROPIC_PROVIDER_INFO).toHaveProperty("version");
      expect(ANTHROPIC_PROVIDER_INFO).toHaveProperty("name");
      expect(typeof ANTHROPIC_PROVIDER_INFO.id).toBe("string");
      expect(typeof ANTHROPIC_PROVIDER_INFO.version).toBe("string");
      expect(typeof ANTHROPIC_PROVIDER_INFO.name).toBe("string");
    });
  });
});
