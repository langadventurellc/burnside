import { defaultLlmModels } from "../defaultLlmModels";
import { DefaultLlmModelsSchema } from "../../core/models/defaultLlmModelsSchema";

describe("defaultLlmModels", () => {
  describe("Anthropic Models Configuration", () => {
    const anthropicProvider = defaultLlmModels.providers.find(
      (provider) => provider.id === "anthropic",
    );

    it("should have Anthropic provider configured", () => {
      expect(anthropicProvider).toBeDefined();
      expect(anthropicProvider?.name).toBe("Anthropic");
    });

    it("should use anthropic-2023-06-01 provider plugin for all Anthropic models", () => {
      expect(anthropicProvider?.models).toBeDefined();

      const anthropicModels = anthropicProvider!.models;
      expect(anthropicModels).toHaveLength(5);

      anthropicModels.forEach((model) => {
        expect(model.providerPlugin).toBe("anthropic-2023-06-01");
      });
    });

    it("should have all expected Anthropic models with correct IDs", () => {
      const anthropicModels = anthropicProvider!.models;
      const expectedModelIds = [
        "claude-3-haiku-20240307",
        "claude-3-5-haiku-latest",
        "claude-sonnet-4-20250514",
        "claude-opus-4-20250514",
        "claude-opus-4-1-20250805",
      ];

      const actualModelIds = anthropicModels.map((model) => model.id);
      expectedModelIds.forEach((expectedId) => {
        expect(actualModelIds).toContain(expectedId);
      });
    });

    it("should maintain correct model metadata for all Anthropic models", () => {
      const anthropicModels = anthropicProvider!.models;

      anthropicModels.forEach((model) => {
        // Verify required fields are present
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.contextLength).toBe(200000);
        expect(model.providerPlugin).toBe("anthropic-2023-06-01");

        // Verify capabilities
        expect(model.streaming).toBe(true);
        expect(model.toolCalls).toBe(true);
        expect(model.images).toBe(true);
        expect(model.documents).toBe(true);

        // Verify supported content types
        expect(model.supportedContentTypes).toEqual([
          "text",
          "image",
          "document",
        ]);
      });
    });

    it("should have specific model configurations match expected values", () => {
      const anthropicModels = anthropicProvider!.models;

      const claudeHaiku = anthropicModels.find(
        (m) => m.id === "claude-3-haiku-20240307",
      );
      expect(claudeHaiku?.name).toBe("Claude 3 Haiku");

      const claudeHaikuLatest = anthropicModels.find(
        (m) => m.id === "claude-3-5-haiku-latest",
      );
      expect(claudeHaikuLatest?.name).toBe("Claude 3.5 Haiku");

      const claudeSonnet4 = anthropicModels.find(
        (m) => m.id === "claude-sonnet-4-20250514",
      );
      expect(claudeSonnet4?.name).toBe("Claude Sonnet 4");

      const claudeOpus4 = anthropicModels.find(
        (m) => m.id === "claude-opus-4-20250514",
      );
      expect(claudeOpus4?.name).toBe("Claude Opus 4");

      const claudeOpus41 = anthropicModels.find(
        (m) => m.id === "claude-opus-4-1-20250805",
      );
      expect(claudeOpus41?.name).toBe("Claude Opus 4.1");
    });
  });

  describe("Provider Plugin Validation", () => {
    it("should validate schema compliance with updated provider plugins", () => {
      expect(() =>
        DefaultLlmModelsSchema.parse(defaultLlmModels),
      ).not.toThrow();
    });

    it("should not contain any old anthropic-messages-v1 provider plugin references", () => {
      const allModels = defaultLlmModels.providers.flatMap(
        (provider) => provider.models,
      );

      allModels.forEach((model) => {
        expect(model.providerPlugin).not.toBe("anthropic-messages-v1");
      });
    });

    it("should have consistent provider plugin mapping for Anthropic models", () => {
      const anthropicProvider = defaultLlmModels.providers.find(
        (provider) => provider.id === "anthropic",
      );

      const anthropicModels = anthropicProvider!.models;
      const providerPlugins = anthropicModels.map(
        (model) => model.providerPlugin,
      );
      const uniqueProviderPlugins = new Set(providerPlugins);

      expect(uniqueProviderPlugins.size).toBe(1);
      expect(uniqueProviderPlugins.has("anthropic-2023-06-01")).toBe(true);
    });
  });

  describe("Schema Validation", () => {
    it("should have valid structure matching DefaultLlmModelsSchema", () => {
      const parsedData = DefaultLlmModelsSchema.parse(defaultLlmModels);

      expect(parsedData.schemaVersion).toBe("1.0.0");
      expect(parsedData.providers).toBeDefined();
      expect(Array.isArray(parsedData.providers)).toBe(true);
    });

    it("should maintain type safety with schema inference", () => {
      type SchemaType = ReturnType<typeof DefaultLlmModelsSchema.parse>;

      // This test ensures type compatibility
      const typedData: SchemaType = defaultLlmModels;
      expect(typedData).toBeDefined();
    });
  });

  describe("Integration Requirements", () => {
    it("should have provider plugins that can be mapped by BridgeClient", () => {
      // This test verifies that the provider plugins used match expected mapping patterns
      const anthropicProvider = defaultLlmModels.providers.find(
        (provider) => provider.id === "anthropic",
      );

      const anthropicModels = anthropicProvider!.models;

      anthropicModels.forEach((model) => {
        // Verify the provider plugin follows the expected date-based pattern
        expect(model.providerPlugin).toMatch(/^anthropic-\d{4}-\d{2}-\d{2}$/);
        expect(model.providerPlugin).toBe("anthropic-2023-06-01");
      });
    });

    it("should maintain backward compatibility for model IDs", () => {
      const anthropicProvider = defaultLlmModels.providers.find(
        (provider) => provider.id === "anthropic",
      );

      const anthropicModels = anthropicProvider!.models;

      // Verify model IDs remain stable (important for existing client code)
      anthropicModels.forEach((model) => {
        expect(model.id).toMatch(/^claude-/);
        expect(model.id).not.toContain("anthropic");
        expect(model.id).not.toContain("messages");
      });
    });
  });
});
