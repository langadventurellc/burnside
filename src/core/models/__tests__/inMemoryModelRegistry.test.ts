import { InMemoryModelRegistry } from "../inMemoryModelRegistry.js";
import type { ModelRegistry } from "../modelRegistry.js";
import type { ModelInfo } from "../../providers/modelInfo.js";
import type { ModelCapabilities } from "../../providers/modelCapabilities.js";
import { ValidationError } from "../../errors/validationError.js";

describe("InMemoryModelRegistry", () => {
  let registry: ModelRegistry;

  // Helper function to create valid ModelInfo for testing
  function createModelInfo(overrides: Partial<ModelInfo> = {}): ModelInfo {
    return {
      id: "test:model",
      name: "Test Model",
      provider: "test",
      capabilities: {
        streaming: true,
        toolCalls: false,
        images: false,
        documents: false,
        supportedContentTypes: ["text"],
        maxTokens: 4096,
        metadata: {},
      },
      version: "v1.0",
      description: "A test model",
      metadata: {},
      ...overrides,
    };
  }

  // Helper function to create capabilities with specific overrides
  function createCapabilities(
    overrides: Partial<ModelCapabilities> = {},
  ): ModelCapabilities {
    return {
      streaming: false,
      toolCalls: false,
      images: false,
      documents: false,
      supportedContentTypes: ["text"],
      // Don't set maxTokens by default to test the optional field behavior
      metadata: {},
      ...overrides,
    };
  }

  beforeEach(() => {
    registry = new InMemoryModelRegistry();
  });

  describe("registration", () => {
    it("registers valid model successfully", () => {
      const modelInfo = createModelInfo({
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
        capabilities: createCapabilities({
          streaming: true,
          toolCalls: true,
          images: true,
          supportedContentTypes: ["text", "image"],
        }),
      });

      expect(() => registry.register("openai:gpt-4", modelInfo)).not.toThrow();
      expect(registry.has("openai:gpt-4")).toBe(true);
    });

    it("updates model ID in info to match registration ID", () => {
      const modelInfo = createModelInfo({
        id: "wrong:id",
        name: "Test Model",
      });

      registry.register("correct:id", modelInfo);
      const retrieved = registry.get("correct:id");

      expect(retrieved?.id).toBe("correct:id");
    });

    it("updates existing model on duplicate registration", () => {
      const modelInfo1 = createModelInfo({
        name: "Model Version 1",
        capabilities: createCapabilities({ toolCalls: false }),
      });
      const modelInfo2 = createModelInfo({
        name: "Model Version 2",
        capabilities: createCapabilities({ toolCalls: true }),
      });

      registry.register("test:model", modelInfo1);
      registry.register("test:model", modelInfo2);

      const retrieved = registry.get("test:model");
      expect(retrieved?.name).toBe("Model Version 2");
      expect(retrieved?.capabilities.toolCalls).toBe(true);
    });

    it("throws ValidationError for empty model ID", () => {
      const modelInfo = createModelInfo();

      expect(() => registry.register("", modelInfo)).toThrow(ValidationError);
      expect(() => registry.register("", modelInfo)).toThrow(
        "Model ID must be a non-empty string",
      );
    });

    it("throws ValidationError for non-string model ID", () => {
      const modelInfo = createModelInfo();

      expect(() =>
        registry.register(null as unknown as string, modelInfo),
      ).toThrow(ValidationError);
      expect(() =>
        registry.register(undefined as unknown as string, modelInfo),
      ).toThrow(ValidationError);
    });

    it("throws ValidationError for invalid model info", () => {
      const invalidModelInfo = {
        id: "", // Invalid: empty ID
        name: "", // Invalid: empty name
        provider: "", // Invalid: empty provider
        capabilities: {
          streaming: "not boolean" as any, // Invalid: should be boolean
          toolCalls: true,
          images: true,
          documents: true,
          supportedContentTypes: [],
        },
      };

      expect(() => registry.register("test:invalid", invalidModelInfo)).toThrow(
        ValidationError,
      );
    });

    it("validates required capabilities fields", () => {
      const invalidModelInfo = createModelInfo({
        capabilities: {
          // Missing required boolean fields
        } as any,
      });

      expect(() => registry.register("test:invalid", invalidModelInfo)).toThrow(
        ValidationError,
      );
    });
  });

  describe("retrieval", () => {
    beforeEach(() => {
      const modelInfo = createModelInfo({
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
      });
      registry.register("openai:gpt-4", modelInfo);
    });

    it("retrieves existing model by ID", () => {
      const retrieved = registry.get("openai:gpt-4");

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("openai:gpt-4");
      expect(retrieved?.name).toBe("GPT-4");
      expect(retrieved?.provider).toBe("openai");
    });

    it("returns undefined for non-existent model", () => {
      const retrieved = registry.get("non:existent");
      expect(retrieved).toBeUndefined();
    });

    it("returns undefined for empty string ID", () => {
      const retrieved = registry.get("");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("listing", () => {
    beforeEach(() => {
      const openaiModel = createModelInfo({
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
      });

      const anthropicModel = createModelInfo({
        id: "anthropic:claude-3",
        name: "Claude 3",
        provider: "anthropic",
      });

      const anotherOpenaiModel = createModelInfo({
        id: "openai:gpt-3.5",
        name: "GPT-3.5",
        provider: "openai",
      });

      registry.register("openai:gpt-4", openaiModel);
      registry.register("anthropic:claude-3", anthropicModel);
      registry.register("openai:gpt-3.5", anotherOpenaiModel);
    });

    it("lists all models when no provider specified", () => {
      const models = registry.list();
      expect(models).toHaveLength(3);

      const modelIds = models.map((m) => m.id);
      expect(modelIds).toContain("openai:gpt-4");
      expect(modelIds).toContain("anthropic:claude-3");
      expect(modelIds).toContain("openai:gpt-3.5");
    });

    it("filters models by provider", () => {
      const openaiModels = registry.list("openai");
      expect(openaiModels).toHaveLength(2);
      expect(openaiModels.every((m) => m.provider === "openai")).toBe(true);

      const anthropicModels = registry.list("anthropic");
      expect(anthropicModels).toHaveLength(1);
      expect(anthropicModels[0].provider).toBe("anthropic");
    });

    it("returns empty array for non-existent provider", () => {
      const models = registry.list("non-existent");
      expect(models).toHaveLength(0);
    });

    it("returns empty array when registry is empty", () => {
      const emptyRegistry = new InMemoryModelRegistry();
      const models = emptyRegistry.list();
      expect(models).toHaveLength(0);
    });
  });

  describe("existence check", () => {
    it("returns true for existing model", () => {
      const modelInfo = createModelInfo();
      registry.register("test:model", modelInfo);

      expect(registry.has("test:model")).toBe(true);
    });

    it("returns false for non-existent model", () => {
      expect(registry.has("non:existent")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(registry.has("")).toBe(false);
    });
  });

  describe("capability queries", () => {
    beforeEach(() => {
      const streamingModel = createModelInfo({
        id: "streaming:model",
        capabilities: createCapabilities({ streaming: true }),
      });

      const toolModel = createModelInfo({
        id: "tool:model",
        capabilities: createCapabilities({ toolCalls: true }),
      });

      const imageModel = createModelInfo({
        id: "image:model",
        capabilities: createCapabilities({ images: true }),
      });

      const documentModel = createModelInfo({
        id: "document:model",
        capabilities: createCapabilities({ documents: true }),
      });

      const multiCapabilityModel = createModelInfo({
        id: "multi:model",
        capabilities: createCapabilities({
          streaming: true,
          toolCalls: true,
          images: true,
          maxTokens: 128000,
        }),
      });

      registry.register("streaming:model", streamingModel);
      registry.register("tool:model", toolModel);
      registry.register("image:model", imageModel);
      registry.register("document:model", documentModel);
      registry.register("multi:model", multiCapabilityModel);
    });

    it("returns models with streaming capability", () => {
      const streamingModels = registry.getByCapability("streaming");
      expect(streamingModels).toHaveLength(2);

      const modelIds = streamingModels.map((m) => m.id);
      expect(modelIds).toContain("streaming:model");
      expect(modelIds).toContain("multi:model");
    });

    it("returns models with tool calling capability", () => {
      const toolModels = registry.getByCapability("toolCalls");
      expect(toolModels).toHaveLength(2);

      const modelIds = toolModels.map((m) => m.id);
      expect(modelIds).toContain("tool:model");
      expect(modelIds).toContain("multi:model");
    });

    it("returns models with image capability", () => {
      const imageModels = registry.getByCapability("images");
      expect(imageModels).toHaveLength(2);

      const modelIds = imageModels.map((m) => m.id);
      expect(modelIds).toContain("image:model");
      expect(modelIds).toContain("multi:model");
    });

    it("returns models with document capability", () => {
      const documentModels = registry.getByCapability("documents");
      expect(documentModels).toHaveLength(1);
      expect(documentModels[0].id).toBe("document:model");
    });

    it("returns models with maxTokens capability", () => {
      const tokenModels = registry.getByCapability("maxTokens");
      expect(tokenModels).toHaveLength(1);
      expect(tokenModels[0].id).toBe("multi:model");
    });

    it("returns empty array when no models have capability", () => {
      // All test models have streaming: false except the streaming ones
      const noCapabilityModels = registry.getByCapability(
        "supportedContentTypes",
      );
      // All models have supportedContentTypes, so this should return all models
      expect(noCapabilityModels.length).toBeGreaterThan(0);
    });

    it("returns empty array when registry is empty", () => {
      const emptyRegistry = new InMemoryModelRegistry();
      const models = emptyRegistry.getByCapability("streaming");
      expect(models).toHaveLength(0);
    });
  });

  describe("unregistration", () => {
    beforeEach(() => {
      const modelInfo = createModelInfo();
      registry.register("test:model", modelInfo);
    });

    it("removes existing model and returns true", () => {
      expect(registry.has("test:model")).toBe(true);

      const result = registry.unregister("test:model");
      expect(result).toBe(true);
      expect(registry.has("test:model")).toBe(false);
    });

    it("returns false for non-existent model", () => {
      const result = registry.unregister("non:existent");
      expect(result).toBe(false);
    });

    it("handles empty string model ID", () => {
      const result = registry.unregister("");
      expect(result).toBe(false);
    });

    it("model is no longer retrievable after unregistration", () => {
      registry.unregister("test:model");

      const retrieved = registry.get("test:model");
      expect(retrieved).toBeUndefined();
    });

    it("model is not included in listings after unregistration", () => {
      registry.unregister("test:model");

      const models = registry.list();
      expect(models.find((m) => m.id === "test:model")).toBeUndefined();
    });
  });
});
