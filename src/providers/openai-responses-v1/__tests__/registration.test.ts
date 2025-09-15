/**
 * Tests for OpenAI Responses v1 Provider Registration
 *
 * Validates provider registration functionality including validation,
 * error handling, and registry integration.
 */

import { InMemoryProviderRegistry } from "../../../core/providers/inMemoryProviderRegistry.js";
import { OpenAIResponsesV1Provider } from "../index.js";
import { ValidationError } from "../../../core/errors/validationError.js";
import { BridgeError } from "../../../core/errors/bridgeError.js";

describe("OpenAI Responses v1 Provider Registration", () => {
  let registry: InMemoryProviderRegistry;
  let provider: OpenAIResponsesV1Provider;

  beforeEach(() => {
    registry = new InMemoryProviderRegistry();
    provider = new OpenAIResponsesV1Provider();
  });

  describe("successful registration", () => {
    it("should register provider successfully", () => {
      expect(() => registry.register(provider)).not.toThrow();

      const registered = registry.get("openai", "responses-v1");
      expect(registered).toBeDefined();
      expect(registered?.id).toBe("openai");
      expect(registered?.name).toBe("OpenAI Responses Provider");
      expect(registered?.version).toBe("responses-v1");
    });

    it("should be retrievable by ID only (latest version)", () => {
      registry.register(provider);

      const latest = registry.getLatest("openai");
      expect(latest).toBeDefined();
      expect(latest?.version).toBe("responses-v1");
    });

    it("should appear in registry listings", () => {
      registry.register(provider);

      const all = registry.list();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe("openai");
      expect(all[0].version).toBe("responses-v1");

      const openaiOnly = registry.list("openai");
      expect(openaiOnly).toHaveLength(1);
      expect(openaiOnly[0].id).toBe("openai");
    });

    it("should indicate provider exists", () => {
      registry.register(provider);

      expect(registry.has("openai")).toBe(true);
      expect(registry.has("openai", "responses-v1")).toBe(true);
      expect(registry.has("nonexistent")).toBe(false);
    });

    it("should track registration time", () => {
      const beforeRegistration = new Date();
      registry.register(provider);
      const afterRegistration = new Date();

      const providerInfo = registry.list("openai")[0];
      expect(providerInfo.registeredAt).toBeInstanceOf(Date);
      expect(providerInfo.registeredAt.getTime()).toBeGreaterThanOrEqual(
        beforeRegistration.getTime(),
      );
      expect(providerInfo.registeredAt.getTime()).toBeLessThanOrEqual(
        afterRegistration.getTime(),
      );
    });
  });

  describe("registration validation", () => {
    it("should validate provider plugin structure", () => {
      const invalidProvider = {
        id: "", // Invalid: empty ID
        name: "Test Provider",
        version: "1.0.0",
        initialize: jest.fn(),
        supportsModel: jest.fn(),
        translateRequest: jest.fn(),
        parseResponse: jest.fn(),
        isTerminal: jest.fn(),
        normalizeError: jest.fn(),
      };

      expect(() => registry.register(invalidProvider)).toThrow(ValidationError);
    });

    it("should reject null or undefined providers", () => {
      // @ts-expect-error - Testing invalid input
      expect(() => registry.register(null)).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => registry.register(undefined)).toThrow(ValidationError);
    });

    it("should reject providers with missing required methods", () => {
      const incompleteProvider = {
        id: "test",
        name: "Test Provider",
        version: "1.0.0",
        initialize: jest.fn(),
        supportsModel: jest.fn(),
        // Missing required methods like translateRequest, parseResponse, etc.
      };

      // @ts-expect-error - Testing invalid provider structure
      expect(() => registry.register(incompleteProvider)).toThrow(
        ValidationError,
      );
    });

    it("should validate provider has required methods", () => {
      // Create a provider missing a required method
      const providerMissingMethod = {
        ...provider,
        parseResponse: undefined, // Remove required method
      };

      // @ts-expect-error - Testing invalid provider structure
      expect(() => registry.register(providerMissingMethod)).toThrow(
        ValidationError,
      );
    });
  });

  describe("provider capabilities", () => {
    it("should support all models (model support determined by registry)", () => {
      expect(provider.supportsModel("gpt-4o-2024-08-06")).toBe(true);
      expect(provider.supportsModel("gpt-5-2025-08-07")).toBe(true);
      expect(provider.supportsModel("unknown-model")).toBe(true);
    });

    it("should have proper initialization method", async () => {
      const config = {
        apiKey: "test-key",
        baseUrl: "https://api.openai.com/v1",
      };

      await expect(provider.initialize(config)).resolves.toBeUndefined();
    });

    it("should validate configuration during initialization", () => {
      const invalidConfig = {
        apiKey: "", // Invalid: empty API key
      };

      expect(() => provider.initialize(invalidConfig)).toThrow(BridgeError);
    });
  });

  describe("overwriting registrations", () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should warn when overwriting existing registration", () => {
      registry.register(provider);
      registry.register(provider); // Register again

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Overwriting existing provider registration: openai:responses-v1",
        ),
      );
    });

    it("should replace the existing provider when overwriting", () => {
      registry.register(provider);
      const beforeRegistration = registry.list("openai")[0].registeredAt;

      // Wait a brief moment to ensure different timestamp
      setTimeout(() => {
        registry.register(provider);
        const afterRegistration = registry.list("openai")[0].registeredAt;

        expect(afterRegistration.getTime()).toBeGreaterThan(
          beforeRegistration.getTime(),
        );
      }, 10);
    });
  });

  describe("unregistration", () => {
    beforeEach(() => {
      registry.register(provider);
    });

    it("should unregister specific version", () => {
      expect(registry.has("openai", "responses-v1")).toBe(true);

      const removed = registry.unregister("openai", "responses-v1");
      expect(removed).toBe(true);
      expect(registry.has("openai", "responses-v1")).toBe(false);
    });

    it("should unregister all versions", () => {
      expect(registry.has("openai")).toBe(true);

      const removed = registry.unregister("openai");
      expect(removed).toBe(true);
      expect(registry.has("openai")).toBe(false);
    });

    it("should return false when unregistering non-existent provider", () => {
      const removed = registry.unregister("nonexistent");
      expect(removed).toBe(false);
    });
  });
});
