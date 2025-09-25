import { BridgeClient } from "../bridgeClient";
import { mapJsonToModelInfo } from "../../core/models/modelLoader";
import { defaultLlmModels } from "../../data/defaultLlmModels";
import type { BridgeConfig } from "../../core/config/bridgeConfig";
import type { ModelInfo } from "../../core/providers/modelInfo";

describe("BridgeClient Model Seeding with Named Configurations", () => {
  let client: BridgeClient;

  const createModelRegistryMock = () => {
    const registeredModels = new Map<string, any>();
    return {
      register: jest.fn((id: string, model: any) => {
        registeredModels.set(id, model);
      }),
      get: jest.fn((id: string) => registeredModels.get(id)),
      list: jest.fn(() => Array.from(registeredModels.values())),
      has: jest.fn((id: string) => registeredModels.has(id)),
      clear: jest.fn(() => registeredModels.clear()),
      getRegisteredModels: () => registeredModels,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("builtin model seeding", () => {
    it("should seed models only for configured providers when modelSeed is builtin", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-test" },
          },
          anthropic: {
            dev: { apiKey: "test-key" },
          },
        },
        modelSeed: "builtin",
      };

      const modelRegistryMock = createModelRegistryMock();
      client = new BridgeClient(config);

      // Override the model registry with our mock
      (client as any).modelRegistry = modelRegistryMock;

      // Re-run seeding with our mock in place
      (client as any).seedModelsIfConfigured(config);

      const registeredModels = modelRegistryMock.getRegisteredModels();
      const registeredModelIds = Array.from(registeredModels.keys());

      // Should have OpenAI and Anthropic models
      const openaiModels = registeredModelIds.filter((id) =>
        id.startsWith("openai:"),
      );
      const anthropicModels = registeredModelIds.filter((id) =>
        id.startsWith("anthropic:"),
      );

      expect(openaiModels.length).toBeGreaterThan(0);
      expect(anthropicModels.length).toBeGreaterThan(0);

      // Should NOT have Google or xAI models
      const googleModels = registeredModelIds.filter((id) =>
        id.startsWith("google:"),
      );
      const xaiModels = registeredModelIds.filter((id) =>
        id.startsWith("xai:"),
      );

      expect(googleModels.length).toBe(0);
      expect(xaiModels.length).toBe(0);
    });

    it("should handle single provider configuration correctly", () => {
      const config: BridgeConfig = {
        providers: {
          xai: {
            default: { apiKey: "xai-key" },
          },
        },
        modelSeed: "builtin",
      };

      const modelRegistryMock = createModelRegistryMock();
      client = new BridgeClient(config);
      (client as any).modelRegistry = modelRegistryMock;
      (client as any).seedModelsIfConfigured(config);

      const registeredModels = modelRegistryMock.getRegisteredModels();
      const registeredModelIds = Array.from(registeredModels.keys());

      // Should only have xAI models
      const xaiModels = registeredModelIds.filter((id) =>
        id.startsWith("xai:"),
      );
      const otherModels = registeredModelIds.filter(
        (id) => !id.startsWith("xai:"),
      );

      expect(xaiModels.length).toBeGreaterThan(0);
      expect(otherModels.length).toBe(0);
    });

    it("should preserve model metadata and capabilities during filtering", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-test" },
          },
        },
        modelSeed: "builtin",
      };

      const modelRegistryMock = createModelRegistryMock();
      client = new BridgeClient(config);
      (client as any).modelRegistry = modelRegistryMock;
      (client as any).seedModelsIfConfigured(config);

      const registeredModels = modelRegistryMock.getRegisteredModels();
      const openaiModels = Array.from(registeredModels.values()).filter(
        (model) => model.provider === "openai",
      );

      expect(openaiModels.length).toBeGreaterThan(0);

      // Check that the first OpenAI model has expected structure
      const firstModel = openaiModels[0];
      expect(firstModel).toHaveProperty("id");
      expect(firstModel).toHaveProperty("name");
      expect(firstModel).toHaveProperty("provider", "openai");
      expect(firstModel).toHaveProperty("capabilities");
      expect(firstModel).toHaveProperty("metadata");
    });
  });

  describe("helper methods", () => {
    it("should extract provider types from flattened keys correctly", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod" },
            dev: { apiKey: "sk-dev" },
          },
          anthropic: {
            main: { apiKey: "ant-main" },
          },
        },
      };

      client = new BridgeClient(config);
      const providerTypes = (client as any).getConfiguredProviderTypes();

      expect(providerTypes).toContain("openai");
      expect(providerTypes).toContain("anthropic");
      expect(providerTypes).not.toContain("google");
      expect(providerTypes).not.toContain("xai");
    });

    it("should filter models correctly based on configured providers", () => {
      const config: BridgeConfig = {
        providers: {
          openai: { default: { apiKey: "sk-test" } },
        },
      };

      client = new BridgeClient(config);

      // Get all built-in models
      const allModels = mapJsonToModelInfo(defaultLlmModels);
      const filteredModels = (client as any).filterModelsForConfiguredProviders(
        allModels,
      );

      // Should only have OpenAI models
      const openaiModels = filteredModels.filter(
        (model: ModelInfo) => model.provider === "openai",
      );
      const otherModels = filteredModels.filter(
        (model: ModelInfo) => model.provider !== "openai",
      );

      expect(openaiModels.length).toBeGreaterThan(0);
      expect(otherModels.length).toBe(0);
    });

    it("should return empty array when no providers are configured", () => {
      const testModels: ModelInfo[] = [
        {
          provider: "openai",
          id: "gpt-4",
          name: "GPT-4",
          capabilities: {
            streaming: false,
            toolCalls: false,
            images: false,
            documents: false,
            supportedContentTypes: ["text"],
          },
          metadata: {},
        },
      ];

      // Create a client with empty provider list and test direct method call
      const config: BridgeConfig = {
        providers: { temp: { default: { apiKey: "temp" } } },
      };
      const tempClient = new BridgeClient(config);

      // Override the config to simulate empty providers
      (tempClient as any).config.providers = new Map();

      const filteredModels = (
        tempClient as any
      ).filterModelsForConfiguredProviders(testModels);
      expect(filteredModels.length).toBe(0);
    });
  });
});
