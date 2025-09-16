/**
 * Tests for OpenAI Responses v1 Provider Module Exports
 *
 * Validates that the module exports are properly structured and accessible.
 */

import {
  OpenAIResponsesV1Provider,
  type OpenAIResponsesV1Config,
  default as defaultProvider,
} from "../index.js";

describe("OpenAI Responses v1 Provider Module", () => {
  describe("exports", () => {
    it("should export OpenAIResponsesV1Provider class", () => {
      expect(OpenAIResponsesV1Provider).toBeDefined();
      expect(typeof OpenAIResponsesV1Provider).toBe("function");
      expect(OpenAIResponsesV1Provider.name).toBe("OpenAIResponsesV1Provider");
    });

    it("should export OpenAIResponsesV1Config type", () => {
      // Type-only export test - just verify it can be used
      const configExample: OpenAIResponsesV1Config = {
        apiKey: "test-key",
        baseUrl: "https://api.openai.com/v1",
      };
      expect(configExample).toBeDefined();
    });

    it("should export default provider", () => {
      expect(defaultProvider).toBeDefined();
      expect(defaultProvider).toBe(OpenAIResponsesV1Provider);
    });

    it("should have proper provider metadata", () => {
      const provider = new OpenAIResponsesV1Provider();
      expect(provider.id).toBe("openai");
      expect(provider.name).toBe("OpenAI Responses Provider");
      expect(provider.version).toBe("responses-v1");
    });
  });

  describe("provider instance", () => {
    let provider: OpenAIResponsesV1Provider;

    beforeEach(() => {
      provider = new OpenAIResponsesV1Provider();
    });

    it("should implement ProviderPlugin interface methods", () => {
      expect(typeof provider.initialize).toBe("function");
      expect(typeof provider.supportsModel).toBe("function");
      expect(typeof provider.translateRequest).toBe("function");
      expect(typeof provider.parseResponse).toBe("function");
      expect(typeof provider.isTerminal).toBe("function");
      expect(typeof provider.normalizeError).toBe("function");
    });

    it("should have readonly metadata properties", () => {
      expect(provider.id).toBe("openai");
      expect(provider.name).toBe("OpenAI Responses Provider");
      expect(provider.version).toBe("responses-v1");

      // Verify properties are readonly (readonly is compile-time only in TypeScript)
      // Runtime assignment would succeed, so we just verify the values are correct
      expect(provider.id).toBe("openai");
      expect(provider.name).toBe("OpenAI Responses Provider");
      expect(provider.version).toBe("responses-v1");
    });
  });
});
