/**
 * @file Tests for temperature capability loading in model loader
 */

import { mapJsonToModelInfo } from "../modelLoader";

describe("Temperature Capability Loading", () => {
  describe("temperature capability mapping from JSON", () => {
    test("should map temperature: true from JSON to ModelCapabilities", () => {
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
                temperature: true,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(1);
      expect(result[0].capabilities.temperature).toBe(true);
    });

    test("should map temperature: false from JSON to ModelCapabilities", () => {
      const jsonData = {
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
                temperature: false,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(1);
      expect(result[0].capabilities.temperature).toBe(false);
    });

    test("should default temperature to true when not specified in JSON", () => {
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
                // No temperature field
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(1);
      expect(result[0].capabilities.temperature).toBe(true);
    });

    test("should handle multiple models with different temperature capabilities", () => {
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
                temperature: true,
              },
              {
                id: "gpt-5-nano-2025-08-07",
                name: "GPT-5 Nano",
                contextLength: 400000,
                temperature: false,
              },
              {
                id: "gpt-3.5-turbo",
                name: "GPT-3.5 Turbo",
                contextLength: 16385,
                // No temperature field - should default to true
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(3);

      // GPT-4o should have temperature: true
      const gpt4o = result.find((m) => m.id === "gpt-4o-2024-08-06");
      expect(gpt4o?.capabilities.temperature).toBe(true);

      // GPT-5 Nano should have temperature: false
      const gpt5nano = result.find((m) => m.id === "gpt-5-nano-2025-08-07");
      expect(gpt5nano?.capabilities.temperature).toBe(false);

      // GPT-3.5 should default to temperature: true
      const gpt35 = result.find((m) => m.id === "gpt-3.5-turbo");
      expect(gpt35?.capabilities.temperature).toBe(true);
    });

    test("should work with GPT-5 models having temperature: false", () => {
      const jsonData = {
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
                streaming: true,
                toolCalls: true,
                images: true,
                documents: true,
                temperature: false,
              },
              {
                id: "gpt-5-mini-2025-08-07",
                name: "GPT-5 Mini",
                contextLength: 400000,
                streaming: true,
                toolCalls: true,
                images: true,
                documents: true,
                temperature: false,
              },
              {
                id: "gpt-5-2025-08-07",
                name: "GPT-5",
                contextLength: 400000,
                streaming: true,
                toolCalls: true,
                images: true,
                documents: true,
                temperature: false,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(3);

      // All GPT-5 models should have temperature: false
      result.forEach((model) => {
        expect(model.id).toMatch(/^gpt-5/);
        expect(model.capabilities.temperature).toBe(false);
      });
    });
  });

  describe("temperature capability with other fields", () => {
    test("should preserve all other capabilities when temperature is specified", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 128000,
                streaming: true,
                toolCalls: true,
                images: true,
                documents: false,
                temperature: false,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(1);
      const capabilities = result[0].capabilities;

      // Verify temperature is correctly set
      expect(capabilities.temperature).toBe(false);

      // Verify other capabilities are read from the JSON data
      expect(capabilities.streaming).toBe(true); // Read from JSON data
      expect(capabilities.toolCalls).toBe(true);
      expect(capabilities.images).toBe(true);
      expect(capabilities.documents).toBe(false);
      expect(capabilities.maxTokens).toBe(128000);
      expect(capabilities.supportedContentTypes).toEqual([]);
    });

    test("should handle temperature with metadata preservation", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 128000,
                providerPlugin: "openai-responses-v1",
                temperature: false,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(jsonData);

      expect(result).toHaveLength(1);
      const model = result[0];

      expect(model.capabilities.temperature).toBe(false);
      expect(model.metadata?.providerPlugin).toBe("openai-responses-v1");
      expect(model.metadata?.contextLength).toBe(128000);
      expect(model.metadata?.originalProviderId).toBe("openai");
    });
  });

  describe("schema validation with temperature field", () => {
    test("should pass schema validation when temperature field is included", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 128000,
                temperature: true,
              },
            ],
          },
        ],
      };

      // This should not throw a ValidationError
      expect(() => mapJsonToModelInfo(jsonData)).not.toThrow();
    });

    test("should pass schema validation when temperature field is not included", () => {
      const jsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "openai",
            name: "OpenAI",
            models: [
              {
                id: "test-model",
                name: "Test Model",
                contextLength: 128000,
                // Temperature field is not included
              },
            ],
          },
        ],
      };

      // This should not throw a ValidationError
      expect(() => mapJsonToModelInfo(jsonData)).not.toThrow();
    });

    test("should maintain backward compatibility with existing JSON structures", () => {
      // This represents existing JSON without temperature field
      const legacyJsonData = {
        schemaVersion: "1.0.0",
        providers: [
          {
            id: "anthropic",
            name: "Anthropic",
            models: [
              {
                id: "claude-sonnet-4-20250514",
                name: "Claude Sonnet 4",
                contextLength: 200000,
                streaming: true,
                toolCalls: true,
              },
            ],
          },
        ],
      };

      const result = mapJsonToModelInfo(legacyJsonData);

      expect(result).toHaveLength(1);
      expect(result[0].capabilities.temperature).toBe(true); // Default value
      expect(result[0].id).toBe("claude-sonnet-4-20250514");
    });
  });
});
