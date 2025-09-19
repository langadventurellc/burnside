/**
 * @file Tests for prompt caching capability loading in model loader
 */

import { mapJsonToModelInfo } from "../modelLoader";
import { DefaultLlmModelsSchema } from "../defaultLlmModelsSchema";

describe("Prompt Caching Capability Loading", () => {
  describe("promptCaching capability mapping from JSON", () => {
    test("should map promptCaching: true from JSON to ModelCapabilities", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "anthropic",
            name: "Anthropic",
            models: [
              {
                id: "claude-3-haiku-20240307",
                name: "Claude 3 Haiku",
                contextLength: 200000,
                promptCaching: true,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        provider: "anthropic",
        capabilities: {
          promptCaching: true,
        },
      });
    });

    test("should map promptCaching: false from JSON to ModelCapabilities", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "gpt-4o-2024-08-06",
                name: "GPT-4o",
                contextLength: 128000,
                promptCaching: false,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "gpt-4o-2024-08-06",
        name: "GPT-4o",
        provider: "openai",
        capabilities: {
          promptCaching: false,
        },
      });
    });

    test("should default promptCaching to false when not specified in JSON", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "gpt-4o-2024-08-06",
                name: "GPT-4o",
                contextLength: 128000,
                // No promptCaching field
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "gpt-4o-2024-08-06",
        name: "GPT-4o",
        provider: "openai",
        capabilities: {
          promptCaching: false, // Should default to false
        },
      });
    });

    test("should handle mixed promptCaching capabilities across multiple models", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "mixed",
            name: "Mixed Provider",
            models: [
              {
                id: "model-with-caching",
                name: "Model with Caching",
                contextLength: 100000,
                promptCaching: true,
              },
              {
                id: "model-without-caching",
                name: "Model without Caching",
                contextLength: 50000,
                promptCaching: false,
              },
              {
                id: "model-default-caching",
                name: "Model Default Caching",
                contextLength: 75000,
                // No promptCaching field - should default to false
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(3);
      expect(result[0].capabilities.promptCaching).toBe(true);
      expect(result[1].capabilities.promptCaching).toBe(false);
      expect(result[2].capabilities.promptCaching).toBe(false);
    });
  });

  describe("Schema Validation", () => {
    test("should validate model with promptCaching: true", () => {
      const validModel = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "test",
            name: "Test Provider",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 100000,
                promptCaching: true,
              },
            ],
          },
        ],
      };

      expect(() => DefaultLlmModelsSchema.parse(validModel)).not.toThrow();
    });

    test("should validate model with promptCaching: false", () => {
      const validModel = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "test",
            name: "Test Provider",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 100000,
                promptCaching: false,
              },
            ],
          },
        ],
      };

      expect(() => DefaultLlmModelsSchema.parse(validModel)).not.toThrow();
    });

    test("should validate model without promptCaching field (optional)", () => {
      const validModel = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "test",
            name: "Test Provider",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 100000,
                // No promptCaching field - should be valid
              },
            ],
          },
        ],
      };

      expect(() => DefaultLlmModelsSchema.parse(validModel)).not.toThrow();
    });

    test("should reject model with non-boolean promptCaching value", () => {
      const invalidModelString = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "test",
            name: "Test Provider",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 100000,
                promptCaching: "yes", // Invalid: should be boolean
              },
            ],
          },
        ],
      };

      expect(() => DefaultLlmModelsSchema.parse(invalidModelString)).toThrow();
    });

    test("should reject model with numeric promptCaching value", () => {
      const invalidModelNumber = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "test",
            name: "Test Provider",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 100000,
                promptCaching: 1, // Invalid: should be boolean
              },
            ],
          },
        ],
      };

      expect(() => DefaultLlmModelsSchema.parse(invalidModelNumber)).toThrow();
    });

    test("should reject model with object promptCaching value", () => {
      const invalidModelObject = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "test",
            name: "Test Provider",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 100000,
                promptCaching: { enabled: true }, // Invalid: should be boolean
              },
            ],
          },
        ],
      };

      expect(() => DefaultLlmModelsSchema.parse(invalidModelObject)).toThrow();
    });
  });

  describe("Backward Compatibility", () => {
    test("should maintain existing model configurations without promptCaching", () => {
      const legacyModel = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "legacy",
            name: "Legacy Provider",
            models: [
              {
                id: "legacy-model",
                name: "Legacy Model",
                contextLength: 4000,
                streaming: true,
                toolCalls: false,
                // No promptCaching field - legacy configuration
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(legacyModel);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "legacy-model",
        name: "Legacy Model",
        provider: "legacy",
        capabilities: {
          streaming: true,
          toolCalls: false,
          promptCaching: false, // Should default to false for backward compatibility
        },
      });
    });

    test("should work with all existing capability combinations", () => {
      const complexModel = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "complex",
            name: "Complex Provider",
            models: [
              {
                id: "complex-model",
                name: "Complex Model",
                contextLength: 200000,
                streaming: true,
                toolCalls: true,
                images: true,
                documents: false,
                temperature: true,
                thinking: false,
                promptCaching: true,
                supportedContentTypes: ["text", "image"],
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(complexModel);

      expect(result).toHaveLength(1);
      expect(result[0].capabilities).toMatchObject({
        streaming: true,
        toolCalls: true,
        images: true,
        documents: false,
        temperature: true,
        promptCaching: true,
        supportedContentTypes: ["text", "image"],
      });
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty models array", () => {
      const emptyModels = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "empty",
            name: "Empty Provider",
            models: [], // Empty models array
          },
        ],
      };

      const result = mapJsonToModelInfo(emptyModels);
      expect(result).toHaveLength(0);
    });

    test("should handle empty providers array", () => {
      const emptyProviders = {
        schemaVersion: "1.0.0",
        providers: [], // Empty providers array
      };

      const result = mapJsonToModelInfo(emptyProviders);
      expect(result).toHaveLength(0);
    });

    test("should handle multiple providers with mixed promptCaching configurations", () => {
      const multiProvider = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "caching-provider",
            name: "Caching Provider",
            models: [
              {
                id: "cache-model",
                name: "Cache Model",
                contextLength: 100000,
                promptCaching: true,
              },
            ],
          },
          {
            id: "non-caching-provider",
            name: "Non-Caching Provider",
            models: [
              {
                id: "no-cache-model",
                name: "No Cache Model",
                contextLength: 50000,
                promptCaching: false,
              },
            ],
          },
          {
            id: "legacy-provider",
            name: "Legacy Provider",
            models: [
              {
                id: "legacy-model",
                name: "Legacy Model",
                contextLength: 25000,
                // No promptCaching field
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(multiProvider);

      expect(result).toHaveLength(3);
      expect(result[0].capabilities.promptCaching).toBe(true);
      expect(result[1].capabilities.promptCaching).toBe(false);
      expect(result[2].capabilities.promptCaching).toBe(false);
    });
  });
});
