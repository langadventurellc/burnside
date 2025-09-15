import { describe, it, expect, beforeEach } from "@jest/globals";
import { InMemoryProviderRegistry } from "../inMemoryProviderRegistry.js";
import type { ProviderRegistry, ProviderPlugin } from "../index.js";
import { ValidationError } from "../../errors/validationError.js";
import { BridgeError } from "../../errors/bridgeError.js";

/**
 * Creates a mock ProviderPlugin for testing purposes
 */
function createMockProvider(
  id: string,
  version: string,
  name?: string,
): ProviderPlugin {
  return {
    id,
    name: name || `${id} Provider`,
    version,
    initialize: async () => {},
    supportsModel: () => true,
    metadata: { test: true },
    translateRequest: () => ({
      url: "https://api.example.com/chat",
      method: "POST",
      headers: {},
      body: "{}",
    }),
    parseResponse: () => ({
      message: {
        role: "assistant",
        content: [{ type: "text", text: "test response" }],
      },
      model: "test-model",
    }),
    isTerminal: () => true,
    normalizeError: (error: unknown) =>
      new BridgeError(String(error), "PROVIDER_ERROR"),
  };
}

describe("InMemoryProviderRegistry", () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new InMemoryProviderRegistry();
  });

  describe("register()", () => {
    it("registers valid provider successfully", () => {
      const provider = createMockProvider("openai", "1.0.0");

      expect(() => registry.register(provider)).not.toThrow();
      expect(registry.has("openai", "1.0.0")).toBe(true);
    });

    it("allows multiple versions of same provider", () => {
      const providerV1 = createMockProvider("openai", "1.0.0");
      const providerV2 = createMockProvider("openai", "2.0.0");

      registry.register(providerV1);
      registry.register(providerV2);

      expect(registry.has("openai", "1.0.0")).toBe(true);
      expect(registry.has("openai", "2.0.0")).toBe(true);
    });

    it("overwrites existing registration for same id:version", () => {
      const provider1 = createMockProvider("openai", "1.0.0", "OpenAI v1");
      const provider2 = createMockProvider(
        "openai",
        "1.0.0",
        "OpenAI v1 Updated",
      );

      registry.register(provider1);
      registry.register(provider2);

      const retrieved = registry.get("openai", "1.0.0");
      expect(retrieved?.name).toBe("OpenAI v1 Updated");
    });

    it("throws ValidationError for null/undefined provider", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(() => registry.register(null as any)).toThrow(ValidationError);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(() => registry.register(undefined as any)).toThrow(
        ValidationError,
      );
    });

    it("throws ValidationError for provider with missing required fields", () => {
      const invalidProvider = { id: "test" } as ProviderPlugin;

      expect(() => registry.register(invalidProvider)).toThrow(ValidationError);
    });

    it("throws ValidationError for provider with empty id", () => {
      const invalidProvider = createMockProvider("", "1.0.0");

      expect(() => registry.register(invalidProvider)).toThrow(ValidationError);
    });

    it("throws ValidationError for provider with empty version", () => {
      const invalidProvider = {
        ...createMockProvider("test", "1.0.0"),
        version: "",
      };

      expect(() => registry.register(invalidProvider)).toThrow(ValidationError);
    });

    it("accepts provider with minimal required fields", () => {
      const minimalProvider: ProviderPlugin = {
        id: "minimal",
        name: "Minimal Provider",
        version: "1.0.0",
        translateRequest: () => ({
          url: "https://api.example.com/chat",
          method: "POST",
          headers: {},
          body: "{}",
        }),
        parseResponse: () => ({
          message: {
            role: "assistant",
            content: [{ type: "text", text: "test response" }],
          },
          model: "test-model",
        }),
        isTerminal: () => true,
        normalizeError: (error: unknown) =>
          new BridgeError(String(error), "PROVIDER_ERROR"),
      };

      expect(() => registry.register(minimalProvider)).not.toThrow();
      expect(registry.has("minimal")).toBe(true);
    });
  });

  describe("get()", () => {
    beforeEach(() => {
      registry.register(createMockProvider("openai", "1.0.0"));
      registry.register(createMockProvider("openai", "1.5.0"));
      registry.register(createMockProvider("openai", "2.0.0"));
      registry.register(createMockProvider("anthropic", "1.0.0"));
    });

    it("retrieves provider by exact id and version", () => {
      const provider = registry.get("openai", "1.5.0");

      expect(provider).toBeDefined();
      expect(provider?.id).toBe("openai");
      expect(provider?.version).toBe("1.5.0");
    });

    it("returns latest version when version not specified", () => {
      const provider = registry.get("openai");

      expect(provider).toBeDefined();
      expect(provider?.version).toBe("2.0.0");
    });

    it("returns undefined for non-existent provider", () => {
      const provider = registry.get("nonexistent");

      expect(provider).toBeUndefined();
    });

    it("returns undefined for non-existent version", () => {
      const provider = registry.get("openai", "3.0.0");

      expect(provider).toBeUndefined();
    });

    it("handles empty or invalid id gracefully", () => {
      expect(registry.get("")).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(registry.get(null as any)).toBeUndefined();
    });

    it("handles complex version strings", () => {
      registry.register(createMockProvider("test", "1.0.0-beta.1"));
      registry.register(createMockProvider("test", "1.0.0-alpha.2"));

      const provider = registry.get("test", "1.0.0-beta.1");
      expect(provider?.version).toBe("1.0.0-beta.1");
    });
  });

  describe("getLatest()", () => {
    it("returns latest version of provider", () => {
      registry.register(createMockProvider("openai", "1.0.0"));
      registry.register(createMockProvider("openai", "2.1.0"));
      registry.register(createMockProvider("openai", "1.5.0"));

      const latest = registry.getLatest("openai");

      expect(latest?.version).toBe("2.1.0");
    });

    it("returns undefined for non-existent provider", () => {
      const latest = registry.getLatest("nonexistent");

      expect(latest).toBeUndefined();
    });

    it("handles semantic version sorting correctly", () => {
      registry.register(createMockProvider("test", "1.10.0"));
      registry.register(createMockProvider("test", "1.9.0"));
      registry.register(createMockProvider("test", "1.2.0"));

      const latest = registry.getLatest("test");

      expect(latest?.version).toBe("1.10.0");
    });
  });

  describe("list()", () => {
    beforeEach(() => {
      registry.register(createMockProvider("openai", "1.0.0"));
      registry.register(createMockProvider("openai", "2.0.0"));
      registry.register(createMockProvider("anthropic", "1.0.0"));
    });

    it("lists all providers when no id specified", () => {
      const providers = registry.list();

      expect(providers).toHaveLength(3);
      expect(providers.map((p) => `${p.id}:${p.version}`).sort()).toEqual(
        ["anthropic:1.0.0", "openai:1.0.0", "openai:2.0.0"].sort(),
      );
    });

    it("lists versions of specific provider when id specified", () => {
      const openaiProviders = registry.list("openai");

      expect(openaiProviders).toHaveLength(2);
      expect(openaiProviders.every((p) => p.id === "openai")).toBe(true);
      // Versions are sorted latest first by the registry
      expect(openaiProviders.map((p) => p.version)).toEqual(["2.0.0", "1.0.0"]);
    });

    it("returns empty array for non-existent provider", () => {
      const providers = registry.list("nonexistent");

      expect(providers).toHaveLength(0);
    });

    it("returns empty array when registry is empty", () => {
      const emptyRegistry = new InMemoryProviderRegistry();
      const providers = emptyRegistry.list();

      expect(providers).toHaveLength(0);
    });

    it("includes registration timestamp in provider info", () => {
      const beforeRegistration = new Date();
      registry.register(createMockProvider("test", "1.0.0"));
      const afterRegistration = new Date();

      const providers = registry.list("test");

      expect(providers).toHaveLength(1);
      expect(providers[0].registeredAt).toBeInstanceOf(Date);
      expect(providers[0].registeredAt.getTime()).toBeGreaterThanOrEqual(
        beforeRegistration.getTime(),
      );
      expect(providers[0].registeredAt.getTime()).toBeLessThanOrEqual(
        afterRegistration.getTime(),
      );
    });

    it("sorts providers by id then version (latest first)", () => {
      const testRegistry = new InMemoryProviderRegistry();
      testRegistry.register(createMockProvider("zebra", "1.0.0"));
      testRegistry.register(createMockProvider("alpha", "2.0.0"));
      testRegistry.register(createMockProvider("alpha", "1.0.0"));

      const providers = testRegistry.list();

      expect(providers.map((p) => `${p.id}:${p.version}`)).toEqual([
        "alpha:2.0.0",
        "alpha:1.0.0",
        "zebra:1.0.0",
      ]);
    });
  });

  describe("has()", () => {
    beforeEach(() => {
      registry.register(createMockProvider("openai", "1.0.0"));
      registry.register(createMockProvider("openai", "2.0.0"));
    });

    it("returns true for existing provider id (any version)", () => {
      expect(registry.has("openai")).toBe(true);
    });

    it("returns true for existing provider with specific version", () => {
      expect(registry.has("openai", "1.0.0")).toBe(true);
      expect(registry.has("openai", "2.0.0")).toBe(true);
    });

    it("returns false for non-existent provider", () => {
      expect(registry.has("nonexistent")).toBe(false);
    });

    it("returns false for existing provider with non-existent version", () => {
      expect(registry.has("openai", "3.0.0")).toBe(false);
    });

    it("handles empty or invalid inputs gracefully", () => {
      expect(registry.has("")).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(registry.has(null as any)).toBe(false);
    });
  });

  describe("unregister()", () => {
    beforeEach(() => {
      registry.register(createMockProvider("openai", "1.0.0"));
      registry.register(createMockProvider("openai", "2.0.0"));
      registry.register(createMockProvider("anthropic", "1.0.0"));
    });

    it("removes specific version when version specified", () => {
      const removed = registry.unregister("openai", "1.0.0");

      expect(removed).toBe(true);
      expect(registry.has("openai", "1.0.0")).toBe(false);
      expect(registry.has("openai", "2.0.0")).toBe(true);
    });

    it("removes all versions when version not specified", () => {
      const removed = registry.unregister("openai");

      expect(removed).toBe(true);
      expect(registry.has("openai")).toBe(false);
      expect(registry.has("anthropic")).toBe(true);
    });

    it("returns false for non-existent provider", () => {
      const removed = registry.unregister("nonexistent");

      expect(removed).toBe(false);
    });

    it("returns false for non-existent version", () => {
      const removed = registry.unregister("openai", "3.0.0");

      expect(removed).toBe(false);
    });

    it("handles empty or invalid inputs gracefully", () => {
      expect(registry.unregister("")).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(registry.unregister(null as any)).toBe(false);
    });

    it("cleans up registration timestamps when removing", () => {
      registry.unregister("openai", "1.0.0");

      // Re-register same version and verify new timestamp
      const beforeReRegistration = new Date();
      registry.register(createMockProvider("openai", "1.0.0"));

      const providers = registry.list("openai");
      const reRegistered = providers.find((p) => p.version === "1.0.0");

      expect(reRegistered?.registeredAt.getTime()).toBeGreaterThanOrEqual(
        beforeReRegistration.getTime(),
      );
    });
  });

  describe("getVersions()", () => {
    beforeEach(() => {
      registry.register(createMockProvider("openai", "1.0.0"));
      registry.register(createMockProvider("openai", "1.10.0"));
      registry.register(createMockProvider("openai", "1.2.0"));
      registry.register(createMockProvider("openai", "2.0.0"));
    });

    it("returns all versions for provider sorted latest first", () => {
      const versions = registry.getVersions("openai");

      expect(versions).toEqual(["2.0.0", "1.10.0", "1.2.0", "1.0.0"]);
    });

    it("returns empty array for non-existent provider", () => {
      const versions = registry.getVersions("nonexistent");

      expect(versions).toHaveLength(0);
    });

    it("handles complex version strings correctly", () => {
      const testRegistry = new InMemoryProviderRegistry();
      testRegistry.register(createMockProvider("test", "1.0.0-alpha.1"));
      testRegistry.register(createMockProvider("test", "1.0.0-beta.1"));
      testRegistry.register(createMockProvider("test", "1.0.0"));

      const versions = testRegistry.getVersions("test");

      // The version comparison logic sorts in descending order (latest first)
      expect(versions).toEqual(["1.0.0-beta.1", "1.0.0-alpha.1", "1.0.0"]);
    });

    it("handles empty or invalid inputs gracefully", () => {
      expect(registry.getVersions("")).toHaveLength(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(registry.getVersions(null as any)).toHaveLength(0);
    });
  });

  describe("edge cases and concurrent operations", () => {
    it("handles providers with complex version strings", () => {
      const provider = createMockProvider("test", "1.0.0-alpha.1+build.123");

      registry.register(provider);

      expect(registry.has("test", "1.0.0-alpha.1+build.123")).toBe(true);
      expect(registry.get("test", "1.0.0-alpha.1+build.123")?.version).toBe(
        "1.0.0-alpha.1+build.123",
      );
    });

    it("handles providers with versions containing colons", () => {
      const provider = createMockProvider("test", "v1.0:stable");

      registry.register(provider);

      expect(registry.has("test", "v1.0:stable")).toBe(true);
      expect(registry.get("test", "v1.0:stable")?.version).toBe("v1.0:stable");
    });

    it("maintains consistency during rapid register/unregister operations", () => {
      // Simulate concurrent-like operations
      for (let i = 0; i < 100; i++) {
        registry.register(createMockProvider("stress", `${i}.0.0`));
      }

      expect(registry.getVersions("stress")).toHaveLength(100);

      // Remove odd versions
      for (let i = 1; i < 100; i += 2) {
        registry.unregister("stress", `${i}.0.0`);
      }

      expect(registry.getVersions("stress")).toHaveLength(50);
      expect(registry.getLatest("stress")?.version).toBe("98.0.0");
    });

    it("validates provider structure consistently", () => {
      const validProvider = createMockProvider("test", "1.0.0");
      const invalidProvider = { ...validProvider, id: "" };

      registry.register(validProvider);
      expect(() => registry.register(invalidProvider)).toThrow(ValidationError);

      // Original should still be there
      expect(registry.has("test", "1.0.0")).toBe(true);
    });
  });
});
