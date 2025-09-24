import { BridgeClient } from "../bridgeClient";
import type { BridgeConfig } from "../../core/config/bridgeConfig";
import type { ProviderRegistry } from "../../core/providers/providerRegistry";
import type { ModelRegistry } from "../../core/models/modelRegistry";
import { InMemoryProviderRegistry } from "../../core/providers/inMemoryProviderRegistry";
import { InMemoryModelRegistry } from "../../core/models/inMemoryModelRegistry";
import { ProviderError } from "../../core/errors/providerError";

describe("BridgeClient Registry Integration", () => {
  const validConfig: BridgeConfig = {
    defaultProvider: "openai",
    providers: {
      openai: {
        default: { apiKey: "sk-test" },
      },
    },
    defaultModel: "gpt-4",
    timeout: 30000,
  };

  describe("registry initialization", () => {
    it("initializes default registries when not provided", () => {
      const client = new BridgeClient(validConfig);

      expect(client.getProviderRegistry()).toBeInstanceOf(
        InMemoryProviderRegistry,
      );
      expect(client.getModelRegistry()).toBeInstanceOf(InMemoryModelRegistry);
    });

    it("initializes registries with empty state for Phase 1", () => {
      const client = new BridgeClient(validConfig);

      const providers = client.listAvailableProviders();
      const models = client.listAvailableModels();

      expect(providers).toEqual([]);
      expect(models).toEqual([]);
    });

    it("handles registry options in configuration", () => {
      const configWithRegistryOptions: BridgeConfig = {
        ...validConfig,
        registryOptions: {
          providers: { customData: "test" },
          models: { customModels: "test" },
        },
      };

      const client = new BridgeClient(configWithRegistryOptions);
      const config = client.getConfig();

      expect(config.registryOptions.providers).toEqual({
        customData: "test",
      });
      expect(config.registryOptions.models).toEqual({ customModels: "test" });
    });

    it("provides default empty registry options when not specified", () => {
      const client = new BridgeClient(validConfig);
      const config = client.getConfig();

      expect(config.registryOptions.providers).toEqual({});
      expect(config.registryOptions.models).toEqual({});
    });
  });

  describe("registry access methods", () => {
    let client: BridgeClient;

    beforeEach(() => {
      client = new BridgeClient(validConfig);
    });

    it("getProviderRegistry returns valid registry instance", () => {
      const registry = client.getProviderRegistry();

      expect(registry).toBeInstanceOf(InMemoryProviderRegistry);
      expect(typeof registry.register).toBe("function");
      expect(typeof registry.get).toBe("function");
      expect(typeof registry.list).toBe("function");
    });

    it("getModelRegistry returns valid registry instance", () => {
      const registry = client.getModelRegistry();

      expect(registry).toBeInstanceOf(InMemoryModelRegistry);
      expect(typeof registry.register).toBe("function");
      expect(typeof registry.get).toBe("function");
      expect(typeof registry.list).toBe("function");
    });

    it("registry instances are consistent across calls", () => {
      const providerRegistry1 = client.getProviderRegistry();
      const providerRegistry2 = client.getProviderRegistry();
      const modelRegistry1 = client.getModelRegistry();
      const modelRegistry2 = client.getModelRegistry();

      expect(providerRegistry1).toBe(providerRegistry2);
      expect(modelRegistry1).toBe(modelRegistry2);
    });

    it("registries are isolated between client instances", () => {
      const client2 = new BridgeClient(validConfig);

      const providerRegistry1 = client.getProviderRegistry();
      const providerRegistry2 = client2.getProviderRegistry();
      const modelRegistry1 = client.getModelRegistry();
      const modelRegistry2 = client2.getModelRegistry();

      expect(providerRegistry1).not.toBe(providerRegistry2);
      expect(modelRegistry1).not.toBe(modelRegistry2);
    });
  });

  describe("convenience methods", () => {
    let client: BridgeClient;
    let providerRegistry: ProviderRegistry;
    let modelRegistry: ModelRegistry;

    beforeEach(() => {
      client = new BridgeClient(validConfig);
      providerRegistry = client.getProviderRegistry();
      modelRegistry = client.getModelRegistry();
    });

    describe("listAvailableProviders", () => {
      it("returns empty array for Phase 1 default state", () => {
        const providers = client.listAvailableProviders();
        expect(providers).toEqual([]);
      });

      it("returns provider IDs after registration", () => {
        const testProvider = {
          id: "test-provider",
          name: "Test Provider",
          version: "1.0.0",
          description: "Test provider for unit tests",
          models: [],
          chat: jest.fn(),
          stream: jest.fn(),
          translateRequest: jest.fn().mockReturnValue({
            url: "https://api.example.com/chat",
            method: "POST",
            headers: {},
            body: "{}",
          }),
          parseResponse: jest.fn().mockResolvedValue({
            message: {
              role: "assistant",
              content: [{ type: "text", text: "test response" }],
            },
            model: "test-model",
          }),
          normalizeError: jest
            .fn()
            .mockImplementation(
              (error: unknown) =>
                new ProviderError(String(error), { originalError: error }),
            ),
        };

        providerRegistry.register(testProvider);

        const providers = client.listAvailableProviders();
        expect(providers).toEqual(["test-provider"]);
      });

      it("returns multiple provider IDs in correct order", () => {
        const provider1 = {
          id: "provider-a",
          name: "Provider A",
          version: "1.0.0",
          description: "First provider",
          models: [],
          chat: jest.fn(),
          stream: jest.fn(),
          translateRequest: jest.fn().mockReturnValue({
            url: "https://api.example.com/chat",
            method: "POST",
            headers: {},
            body: "{}",
          }),
          parseResponse: jest.fn().mockResolvedValue({
            message: {
              role: "assistant",
              content: [{ type: "text", text: "test response" }],
            },
            model: "test-model",
          }),
          normalizeError: jest
            .fn()
            .mockImplementation(
              (error: unknown) =>
                new ProviderError(String(error), { originalError: error }),
            ),
        };

        const provider2 = {
          id: "provider-b",
          name: "Provider B",
          version: "1.0.0",
          description: "Second provider",
          models: [],
          chat: jest.fn(),
          stream: jest.fn(),
          translateRequest: jest.fn().mockReturnValue({
            url: "https://api.example.com/chat",
            method: "POST",
            headers: {},
            body: "{}",
          }),
          parseResponse: jest.fn().mockResolvedValue({
            message: {
              role: "assistant",
              content: [{ type: "text", text: "test response" }],
            },
            model: "test-model",
          }),
          normalizeError: jest
            .fn()
            .mockImplementation(
              (error: unknown) =>
                new ProviderError(String(error), { originalError: error }),
            ),
        };

        providerRegistry.register(provider1);
        providerRegistry.register(provider2);

        const providers = client.listAvailableProviders();
        expect(providers).toContain("provider-a");
        expect(providers).toContain("provider-b");
        expect(providers).toHaveLength(2);
      });
    });

    describe("listAvailableModels", () => {
      it("returns empty array for Phase 1 default state", () => {
        const models = client.listAvailableModels();
        expect(models).toEqual([]);
      });

      it("returns empty array when filtering by non-existent provider", () => {
        const models = client.listAvailableModels("non-existent");
        expect(models).toEqual([]);
      });

      it("returns model IDs after registration", () => {
        const testModel = {
          id: "test:model",
          name: "Test Model",
          provider: "test",
          capabilities: {
            streaming: true,
            toolCalls: false,
            images: false,
            documents: false,
            supportedContentTypes: ["text"],
          },
        };

        modelRegistry.register("test:model", testModel);

        const models = client.listAvailableModels();
        expect(models).toEqual(["test:model"]);
      });

      it("filters models by provider ID", () => {
        const openaiModel = {
          id: "openai:gpt-4",
          name: "GPT-4",
          provider: "openai",
          capabilities: {
            streaming: true,
            toolCalls: true,
            images: true,
            documents: false,
            supportedContentTypes: ["text", "image"],
          },
        };

        const anthropicModel = {
          id: "anthropic:claude-3",
          name: "Claude 3",
          provider: "anthropic",
          capabilities: {
            streaming: true,
            toolCalls: true,
            images: true,
            documents: true,
            supportedContentTypes: ["text", "image", "document"],
          },
        };

        modelRegistry.register("openai:gpt-4", openaiModel);
        modelRegistry.register("anthropic:claude-3", anthropicModel);

        const openaiModels = client.listAvailableModels("openai");
        const anthropicModels = client.listAvailableModels("anthropic");
        const allModels = client.listAvailableModels();

        expect(openaiModels).toEqual(["openai:gpt-4"]);
        expect(anthropicModels).toEqual(["anthropic:claude-3"]);
        expect(allModels).toHaveLength(2);
        expect(allModels).toContain("openai:gpt-4");
        expect(allModels).toContain("anthropic:claude-3");
      });
    });

    describe("getModelCapabilities", () => {
      it("returns undefined for non-existent models", () => {
        const capabilities = client.getModelCapabilities("non-existent");
        expect(capabilities).toBeUndefined();
      });

      it("returns capabilities for registered models", () => {
        const testCapabilities = {
          streaming: true,
          toolCalls: false,
          images: true,
          documents: false,
          supportedContentTypes: ["text", "image"],
        };

        const testModel = {
          id: "test:model",
          name: "Test Model",
          provider: "test",
          capabilities: testCapabilities,
        };

        modelRegistry.register("test:model", testModel);

        const capabilities = client.getModelCapabilities("test:model");
        expect(capabilities).toEqual(testCapabilities);
      });

      it("handles models with different capability configurations", () => {
        const basicModel = {
          id: "basic:model",
          name: "Basic Model",
          provider: "basic",
          capabilities: {
            streaming: false,
            toolCalls: false,
            images: false,
            documents: false,
            supportedContentTypes: ["text"],
          },
        };

        const advancedModel = {
          id: "advanced:model",
          name: "Advanced Model",
          provider: "advanced",
          capabilities: {
            streaming: true,
            toolCalls: true,
            images: true,
            documents: true,
            supportedContentTypes: ["text", "image", "document"],
          },
        };

        modelRegistry.register("basic:model", basicModel);
        modelRegistry.register("advanced:model", advancedModel);

        const basicCapabilities = client.getModelCapabilities("basic:model");
        const advancedCapabilities =
          client.getModelCapabilities("advanced:model");

        expect(basicCapabilities?.streaming).toBe(false);
        expect(basicCapabilities?.toolCalls).toBe(false);
        expect(basicCapabilities?.images).toBe(false);
        expect(basicCapabilities?.documents).toBe(false);

        expect(advancedCapabilities?.streaming).toBe(true);
        expect(advancedCapabilities?.toolCalls).toBe(true);
        expect(advancedCapabilities?.images).toBe(true);
        expect(advancedCapabilities?.documents).toBe(true);
      });
    });
  });

  describe("configuration integration", () => {
    it("includes registryOptions in getConfig() output", () => {
      const configWithRegistryOptions: BridgeConfig = {
        ...validConfig,
        registryOptions: {
          providers: { testProvider: "config" },
          models: { testModel: "config" },
        },
      };

      const client = new BridgeClient(configWithRegistryOptions);
      const config = client.getConfig();

      expect(config.registryOptions).toBeDefined();
      expect(config.registryOptions.providers).toEqual({
        testProvider: "config",
      });
      expect(config.registryOptions.models).toEqual({
        testModel: "config",
      });
    });

    it("validates configuration with registry options", () => {
      expect(() => {
        new BridgeClient({
          ...validConfig,
          registryOptions: {
            providers: {},
            models: {},
          },
        });
      }).not.toThrow();
    });

    it("handles partial registry options", () => {
      const configWithPartialOptions: BridgeConfig = {
        ...validConfig,
        registryOptions: {
          providers: { test: "value" },
          // models option omitted
        },
      };

      const client = new BridgeClient(configWithPartialOptions);
      const config = client.getConfig();

      expect(config.registryOptions.providers).toEqual({ test: "value" });
      expect(config.registryOptions.models).toEqual({});
    });
  });

  describe("error handling", () => {
    let client: BridgeClient;

    beforeEach(() => {
      client = new BridgeClient(validConfig);
    });

    it("handles registry operation failures gracefully", () => {
      // Test that registry methods handle errors properly
      expect(() => client.listAvailableProviders()).not.toThrow();
      expect(() => client.listAvailableModels()).not.toThrow();
      expect(() => client.getModelCapabilities("any-id")).not.toThrow();
    });

    it("registry methods return appropriate values for empty registries", () => {
      const providers = client.listAvailableProviders();
      const models = client.listAvailableModels();
      const capabilities = client.getModelCapabilities("any-model");

      expect(providers).toEqual([]);
      expect(models).toEqual([]);
      expect(capabilities).toBeUndefined();
    });
  });

  describe("type safety", () => {
    it("maintains full type safety for registry operations", () => {
      const client = new BridgeClient(validConfig);

      // These should all have proper TypeScript types
      const providerRegistry: ProviderRegistry = client.getProviderRegistry();
      const modelRegistry: ModelRegistry = client.getModelRegistry();
      const providers: string[] = client.listAvailableProviders();
      const models: string[] = client.listAvailableModels();
      const modelsFiltered: string[] = client.listAvailableModels("openai");
      const capabilities = client.getModelCapabilities("test:model");

      expect(providerRegistry).toBeDefined();
      expect(modelRegistry).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
      expect(Array.isArray(models)).toBe(true);
      expect(Array.isArray(modelsFiltered)).toBe(true);
      expect(capabilities).toBeUndefined(); // No models registered
    });

    it("ensures registry methods return correct types", () => {
      const client = new BridgeClient(validConfig);

      const providers = client.listAvailableProviders();
      const models = client.listAvailableModels();

      // Type checks - these would fail compilation if types are wrong
      providers.forEach((provider: string) => {
        expect(typeof provider).toBe("string");
      });

      models.forEach((model: string) => {
        expect(typeof model).toBe("string");
      });
    });
  });
});
