/**
 * Google Gemini v1 Request Schema Tests
 *
 * Unit tests for the Google Gemini v1 request schema validation.
 */

import {
  GoogleGeminiV1RequestSchema,
  GoogleGeminiV1Request,
} from "../requestSchema";

describe("GoogleGeminiV1RequestSchema", () => {
  describe("valid requests", () => {
    it("should validate minimal valid request", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello, Gemini!" }],
          },
        ],
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].role).toBe("user");
      expect(result.contents[0].parts).toHaveLength(1);
      expect(result.contents[0].parts[0]).toEqual({ text: "Hello, Gemini!" });
    });

    it("should validate request with all optional parameters", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Analyze this image" }],
          },
          {
            role: "model" as const,
            parts: [
              { text: "I can see the image. What would you like to know?" },
            ],
          },
        ],
        tools: [
          {
            function_declarations: [
              {
                name: "get_weather",
                description: "Get current weather information",
                parameters: {
                  type: "object",
                  properties: {
                    location: { type: "string" },
                    unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                  },
                  required: ["location"],
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topK: 40,
          topP: 0.9,
          stopSequences: ["END", "STOP"],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
        systemInstruction: {
          parts: [{ text: "You are a helpful AI assistant." }],
        },
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      expect(result.contents).toHaveLength(2);
      expect(result.tools).toHaveLength(1);
      expect(result.tools![0].function_declarations).toHaveLength(1);
      expect(result.tools![0].function_declarations[0].name).toBe(
        "get_weather",
      );
      expect(result.generationConfig?.temperature).toBe(0.7);
      expect(result.generationConfig?.maxOutputTokens).toBe(1000);
      expect(result.generationConfig?.topK).toBe(40);
      expect(result.generationConfig?.topP).toBe(0.9);
      expect(result.generationConfig?.stopSequences).toEqual(["END", "STOP"]);
      expect(result.safetySettings).toHaveLength(2);
      expect(result.systemInstruction?.parts).toHaveLength(1);
    });

    it("should validate multimodal content with text and inline data", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [
              { text: "What's in this image?" },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: "base64encodedimagedata",
                },
              },
            ],
          },
        ],
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      expect(result.contents[0].parts).toHaveLength(2);
      expect(result.contents[0].parts[0]).toEqual({
        text: "What's in this image?",
      });
      expect(result.contents[0].parts[1]).toEqual({
        inline_data: {
          mime_type: "image/jpeg",
          data: "base64encodedimagedata",
        },
      });
    });

    it("should validate conversation format with multiple messages", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "What is the capital of France?" }],
          },
          {
            role: "model" as const,
            parts: [{ text: "The capital of France is Paris." }],
          },
          {
            role: "user" as const,
            parts: [{ text: "What about Italy?" }],
          },
        ],
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      expect(result.contents).toHaveLength(3);
      expect(result.contents[0].role).toBe("user");
      expect(result.contents[1].role).toBe("model");
      expect(result.contents[2].role).toBe("user");
    });

    it("should validate function calling with tools", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "What's the weather like in New York?" }],
          },
        ],
        tools: [
          {
            function_declarations: [
              {
                name: "get_current_weather",
                description: "Get the current weather in a given location",
                parameters: {
                  type: "object",
                  properties: {
                    location: {
                      type: "string",
                      description: "The city and state, e.g. San Francisco, CA",
                    },
                    unit: {
                      type: "string",
                      enum: ["celsius", "fahrenheit"],
                      description: "The unit for temperature",
                    },
                  },
                  required: ["location"],
                },
              },
            ],
          },
        ],
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      expect(result.tools).toHaveLength(1);
      expect(result.tools![0].function_declarations).toHaveLength(1);
      expect(result.tools![0].function_declarations[0].name).toBe(
        "get_current_weather",
      );
      expect(result.tools![0].function_declarations[0].description).toBe(
        "Get the current weather in a given location",
      );
      expect(
        result.tools![0].function_declarations[0].parameters,
      ).toBeDefined();
    });

    it("should allow content without explicit role", () => {
      const request = {
        contents: [
          {
            parts: [{ text: "Hello without role" }],
          },
        ],
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      expect(result.contents[0].role).toBeUndefined();
      expect(result.contents[0].parts[0]).toEqual({
        text: "Hello without role",
      });
    });
  });

  describe("invalid requests", () => {
    it("should reject request without contents", () => {
      const request = {};

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject request with empty contents array", () => {
      const request = {
        contents: [],
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow(
        "At least one content item is required",
      );
    });

    it("should reject content with empty parts array", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [],
          },
        ],
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow(
        "At least one content part is required",
      );
    });

    it("should reject invalid role values", () => {
      const request = {
        contents: [
          {
            role: "invalid_role",
            parts: [{ text: "Hello" }],
          },
        ],
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject out-of-range temperature", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        generationConfig: {
          temperature: 3.0, // Out of range (max is 2)
        },
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject negative temperature", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        generationConfig: {
          temperature: -0.5, // Out of range (min is 0)
        },
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject out-of-range topP", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        generationConfig: {
          topP: 1.5, // Out of range (max is 1)
        },
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject excessive maxOutputTokens", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10000, // Out of range (max is 8192)
        },
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject tools with empty function_declarations", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        tools: [
          {
            function_declarations: [], // Empty array
          },
        ],
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject function declaration with empty name", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        tools: [
          {
            function_declarations: [
              {
                name: "", // Empty name
                description: "Test function",
              },
            ],
          },
        ],
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow(
        "Function name is required",
      );
    });

    it("should reject invalid safety category", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        safetySettings: [
          {
            category: "INVALID_CATEGORY",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject invalid safety threshold", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "INVALID_THRESHOLD",
          },
        ],
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject too many stop sequences", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        generationConfig: {
          stopSequences: ["1", "2", "3", "4", "5", "6"], // Too many (max is 5)
        },
      };

      expect(() => GoogleGeminiV1RequestSchema.parse(request)).toThrow();
    });
  });

  describe("boundary cases", () => {
    it("should accept edge values for numeric parameters", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        generationConfig: {
          temperature: 0, // Min value
          maxOutputTokens: 1, // Min positive value
          topK: 1, // Min positive value
          topP: 0, // Min value
        },
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      expect(result.generationConfig?.temperature).toBe(0);
      expect(result.generationConfig?.maxOutputTokens).toBe(1);
      expect(result.generationConfig?.topK).toBe(1);
      expect(result.generationConfig?.topP).toBe(0);
    });

    it("should accept maximum values for numeric parameters", () => {
      const request = {
        contents: [
          {
            role: "user" as const,
            parts: [{ text: "Hello" }],
          },
        ],
        generationConfig: {
          temperature: 2, // Max value
          maxOutputTokens: 8192, // Max value
          topK: 100, // Max value
          topP: 1, // Max value
          stopSequences: ["1", "2", "3", "4", "5"], // Max length
        },
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      expect(result.generationConfig?.temperature).toBe(2);
      expect(result.generationConfig?.maxOutputTokens).toBe(8192);
      expect(result.generationConfig?.topK).toBe(100);
      expect(result.generationConfig?.topP).toBe(1);
      expect(result.generationConfig?.stopSequences).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
      ]);
    });
  });

  describe("type inference", () => {
    it("should properly infer TypeScript types", () => {
      const request: GoogleGeminiV1Request = {
        contents: [
          {
            role: "user",
            parts: [{ text: "Test message" }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      };

      const result = GoogleGeminiV1RequestSchema.parse(request);

      // Type assertions to verify inference works
      expect(typeof result.contents[0].role).toBe("string");
      expect(typeof result.contents[0].parts[0]).toBe("object");
      expect(typeof result.generationConfig?.temperature).toBe("number");
      expect(typeof result.generationConfig?.maxOutputTokens).toBe("number");
    });
  });
});
