import { mapJsonToModelInfo } from "../modelLoader";
import { DefaultLlmModelsSchema } from "../defaultLlmModelsSchema";
import { ValidationError } from "../../errors/validationError";
import type { ModelInfo } from "../../providers/modelInfo";

describe("modelLoader", () => {
  // Helper function to create valid JSON structure for testing
  function createValidJsonStructure() {
    return {
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
            },
            {
              id: "gpt-4.1-2025-04-14",
              name: "GPT-4.1",
              contextLength: 1000000,
            },
          ],
        },
        {
          id: "anthropic",
          name: "Anthropic",
          models: [
            {
              id: "claude-sonnet-4-20250514",
              name: "Claude Sonnet 4",
              contextLength: 200000,
            },
          ],
        },
      ],
    };
  }

  // Helper function to create provider data
  function createProviderData(overrides: any = {}) {
    return {
      id: "test-provider",
      name: "Test Provider",
      models: [
        {
          id: "test-model-1",
          name: "Test Model 1",
          contextLength: 50000,
        },
      ],
      ...overrides,
    };
  }

  // Helper function to create model data
  function createModelData(overrides: any = {}) {
    return {
      id: "test-model",
      name: "Test Model",
      contextLength: 32000,
      ...overrides,
    };
  }

  describe("JSON Schema Validation", () => {
    it("should validate valid JSON structure", () => {
      const validJson = createValidJsonStructure();
      expect(() => DefaultLlmModelsSchema.parse(validJson)).not.toThrow();
    });

    it("should reject invalid schema version", () => {
      const invalidJson = {
        ...createValidJsonStructure(),
        schemaVersion: 123, // Should be string
      };
      expect(() => DefaultLlmModelsSchema.parse(invalidJson)).toThrow();
    });

    it("should reject missing providers array", () => {
      const invalidJson = {
        schemaVersion: "1.0.0",
        // Missing providers
      };
      expect(() => DefaultLlmModelsSchema.parse(invalidJson)).toThrow();
    });

    it("should reject invalid provider structure", () => {
      const invalidJson = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            // Missing name and models
          },
        ],
      };
      expect(() => DefaultLlmModelsSchema.parse(invalidJson)).toThrow();
    });

    it("should reject invalid model structure", () => {
      const invalidJson = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "gpt-4",
                // Missing name and contextLength
              },
            ],
          },
        ],
      };
      expect(() => DefaultLlmModelsSchema.parse(invalidJson)).toThrow();
    });

    it("should reject negative contextLength", () => {
      const invalidJson = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "gpt-4",
                name: "GPT-4",
                contextLength: -1000, // Should be positive
              },
            ],
          },
        ],
      };
      expect(() => DefaultLlmModelsSchema.parse(invalidJson)).toThrow();
    });
  });

  describe("JSON-to-ModelInfo Mapping", () => {
    it("should successfully map valid JSON data to ModelInfo array", () => {
      const jsonData = createValidJsonStructure();
      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(3); // 2 OpenAI + 1 Anthropic
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "gpt-4o-2024-08-06",
            name: "GPT-4o",
            provider: "openai",
          }),
          expect.objectContaining({
            id: "gpt-4.1-2025-04-14",
            name: "GPT-4.1",
            provider: "openai",
          }),
          expect.objectContaining({
            id: "claude-sonnet-4-20250514",
            name: "Claude Sonnet 4",
            provider: "anthropic",
          }),
        ]),
      );
    });

    it("should correctly infer provider ID from parent objects", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          createProviderData({
            id: "custom-provider",
            name: "Custom Provider",
          }),
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result[0].provider).toBe("custom-provider");
      expect(result[0].metadata?.originalProviderId).toBe("custom-provider");
    });

    it("should set default capabilities correctly", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [createProviderData()],
      };

      const result = mapJsonToModelInfo(jsonData);
      const model = result[0];

      expect(model.capabilities).toEqual({
        streaming: false,
        toolCalls: false,
        images: false,
        documents: false,
        temperature: true, // Default value when not specified
        promptCaching: false, // Default value when not specified
        maxTokens: 50000, // From createProviderData contextLength
        supportedContentTypes: [],
      });
    });

    it("should map contextLength to both maxTokens and metadata", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "test",
            name: "Test",
            models: [createModelData({ contextLength: 75000 })],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);
      const model = result[0];

      expect(model.capabilities.maxTokens).toBe(75000);
      expect(model.metadata?.contextLength).toBe(75000);
    });

    it("should process multiple providers and models", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          createProviderData({
            id: "provider1",
            models: [
              createModelData({ id: "model1" }),
              createModelData({ id: "model2" }),
            ],
          }),
          createProviderData({
            id: "provider2",
            models: [createModelData({ id: "model3" })],
          }),
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(3);
      expect(result.map((m) => m.id)).toEqual(["model1", "model2", "model3"]);
      expect(result.map((m) => m.provider)).toEqual([
        "provider1",
        "provider1",
        "provider2",
      ]);
    });

    it("should handle empty providers array", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [],
      };

      const result = mapJsonToModelInfo(jsonData);
      expect(result).toEqual([]);
    });

    it("should handle providers with empty models array", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "empty-provider",
            name: "Empty Provider",
            models: [],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);
      expect(result).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should throw ValidationError for invalid JSON structure", () => {
      const invalidJson = {
        invalidField: "invalid",
      };

      expect(() =>
        mapJsonToModelInfo(
          invalidJson as unknown as Parameters<typeof mapJsonToModelInfo>[0],
        ),
      ).toThrow(ValidationError);
    });

    it("should provide clear error messages for malformed data", () => {
      const invalidJson = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                // Missing required fields
                id: "gpt-4",
              },
            ],
          },
        ],
      };

      expect(() =>
        mapJsonToModelInfo(
          invalidJson as unknown as Parameters<typeof mapJsonToModelInfo>[0],
        ),
      ).toThrow("Invalid defaultLlmModelson structure");
    });

    it("should preserve error context for debugging", () => {
      const invalidJson = {
        schemaVersion: "1.0.0",
        providers: "not-an-array", // Should be array
      };

      try {
        mapJsonToModelInfo(
          invalidJson as unknown as Parameters<typeof mapJsonToModelInfo>[0],
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.context).toHaveProperty("zodErrors");
          expect(error.context).toHaveProperty("receivedData");
        }
      }
    });

    it("should handle null input", () => {
      expect(() =>
        mapJsonToModelInfo(
          null as unknown as Parameters<typeof mapJsonToModelInfo>[0],
        ),
      ).toThrow(ValidationError);
    });

    it("should handle undefined input", () => {
      expect(() =>
        mapJsonToModelInfo(
          undefined as unknown as Parameters<typeof mapJsonToModelInfo>[0],
        ),
      ).toThrow(ValidationError);
    });

    it("should re-throw non-Zod errors unchanged", () => {
      // Mock DefaultLlmModelsSchema.parse to throw a non-Zod error
      const originalParse = DefaultLlmModelsSchema.parse;
      const customError = new Error("Custom error");
      DefaultLlmModelsSchema.parse = jest.fn().mockImplementation(() => {
        throw customError;
      });

      try {
        expect(() => mapJsonToModelInfo(createValidJsonStructure())).toThrow(
          customError,
        );
      } finally {
        // Restore original parse method
        DefaultLlmModelsSchema.parse = originalParse;
      }
    });
  });

  describe("Type Safety", () => {
    it("should return ModelInfo array type", () => {
      const jsonData = createValidJsonStructure();
      const result = mapJsonToModelInfo(jsonData);

      // Type check - should be ModelInfo[]
      expect(Array.isArray(result)).toBe(true);
      result.forEach((model: ModelInfo) => {
        expect(model).toHaveProperty("id");
        expect(model).toHaveProperty("name");
        expect(model).toHaveProperty("provider");
        expect(model).toHaveProperty("capabilities");
        expect(typeof model.id).toBe("string");
        expect(typeof model.name).toBe("string");
        expect(typeof model.provider).toBe("string");
        expect(typeof model.capabilities).toBe("object");
      });
    });

    it("should handle required vs optional fields correctly", () => {
      const jsonData = createValidJsonStructure();
      const result = mapJsonToModelInfo(jsonData);
      const model = result[0];

      // Required fields
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.provider).toBeDefined();
      expect(model.capabilities).toBeDefined();

      // Optional fields may or may not be present
      expect(model.version).toBeUndefined(); // Not set by mapping function
      expect(model.description).toBeUndefined(); // Not set by mapping function
      expect(model.metadata).toBeDefined(); // Set by mapping function
    });

    it("should ensure capabilities have all required fields", () => {
      const jsonData = createValidJsonStructure();
      const result = mapJsonToModelInfo(jsonData);
      const capabilities = result[0].capabilities;

      expect(capabilities.streaming).toBeDefined();
      expect(capabilities.toolCalls).toBeDefined();
      expect(capabilities.images).toBeDefined();
      expect(capabilities.documents).toBeDefined();
      expect(capabilities.supportedContentTypes).toBeDefined();
      expect(Array.isArray(capabilities.supportedContentTypes)).toBe(true);
      expect(capabilities.maxTokens).toBeDefined();
    });
  });

  describe("Integration with Real JSON Data", () => {
    it("should handle actual defaultLlmModelson structure", () => {
      // Simulate the actual JSON structure from docs/defaultLlmModelson
      const realJsonStructure = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "gpt-5-nano-2025-08-07",
                name: "GPT-5 Nano",
                contextLength: 400000,
              },
              {
                id: "gpt-4o-2024-08-06",
                name: "GPT-4o",
                contextLength: 128000,
              },
            ],
          },
          {
            id: "anthropic",
            name: "Anthropic",
            models: [
              {
                id: "claude-sonnet-4-20250514",
                name: "Claude Sonnet 4",
                contextLength: 200000,
              },
            ],
          },
          {
            id: "google",
            name: "Google",
            models: [
              {
                id: "gemini-2.0-flash",
                name: "Gemini 2.0 Flash",
                contextLength: 1000000,
              },
            ],
          },
          {
            id: "xai",
            name: "xAI",
            models: [
              {
                id: "grok-3",
                name: "Grok 3",
                contextLength: 256000,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(realJsonStructure);

      expect(result).toHaveLength(5); // 2 + 1 + 1 + 1
      expect(result.map((m) => m.provider)).toEqual([
        "openai",
        "openai",
        "anthropic",
        "google",
        "xai",
      ]);
      expect(result.every((m) => m.capabilities.maxTokens! > 0)).toBe(true);
      expect(
        result.every((m) => m.capabilities.supportedContentTypes.length === 0),
      ).toBe(true);
      expect(result.every((m) => m.capabilities.streaming === false)).toBe(
        true,
      );
    });
  });
});
