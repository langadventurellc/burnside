/**
 * Google Gemini v1 Response Schema Tests
 *
 * Unit tests for the Google Gemini v1 response schema validation.
 */

import {
  GoogleGeminiV1ResponseSchema,
  GoogleGeminiV1StreamingResponseSchema,
  GoogleGeminiV1Response,
} from "../responseSchema";

describe("GoogleGeminiV1ResponseSchema", () => {
  describe("valid responses", () => {
    it("should validate minimal valid response", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: "Hello! How can I help you today?" }],
              role: "model" as const,
            },
            finishReason: "STOP" as const,
            index: 0,
          },
        ],
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates![0].content?.parts).toHaveLength(1);
      expect(result.candidates![0].content?.parts?.[0]).toEqual({
        text: "Hello! How can I help you today?",
      });
      expect(result.candidates![0].content?.role).toBe("model");
      expect(result.candidates![0].finishReason).toBe("STOP");
      expect(result.candidates![0].index).toBe(0);
    });

    it("should validate response with all optional metadata", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [
                { text: "Here's the weather information you requested." },
              ],
              role: "model" as const,
            },
            finishReason: "STOP" as const,
            index: 0,
            safetyRatings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                probability: "NEGLIGIBLE",
                blocked: false,
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                probability: "LOW",
              },
            ],
            citationMetadata: {
              citationSources: [
                {
                  startIndex: 10,
                  endIndex: 50,
                  uri: "https://example.com/weather",
                  license: "CC-BY-SA",
                },
              ],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 25,
          totalTokenCount: 40,
        },
        modelVersion: "gemini-2.0-flash-lite",
        promptFeedback: {
          blockReason: "SAFETY",
          safetyRatings: [
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "HIGH",
              blocked: true,
            },
          ],
        },
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(result.candidates![0].safetyRatings).toHaveLength(2);
      expect(
        result.candidates![0].citationMetadata?.citationSources,
      ).toHaveLength(1);
      expect(result.usageMetadata?.promptTokenCount).toBe(15);
      expect(result.usageMetadata?.candidatesTokenCount).toBe(25);
      expect(result.usageMetadata?.totalTokenCount).toBe(40);
      expect(result.modelVersion).toBe("gemini-2.0-flash-lite");
      expect(result.promptFeedback?.blockReason).toBe("SAFETY");
    });

    it("should validate function calling response", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "get_current_weather",
                    args: {
                      location: "New York, NY",
                      unit: "fahrenheit",
                    },
                  },
                },
              ],
              role: "model" as const,
            },
            finishReason: "STOP" as const,
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 15,
          totalTokenCount: 35,
        },
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(result.candidates![0].content?.parts).toHaveLength(1);
      const functionCall = result.candidates![0].content?.parts?.[0];
      expect(functionCall).toHaveProperty("functionCall");
      if ("functionCall" in functionCall!) {
        expect(functionCall.functionCall.name).toBe("get_current_weather");
        expect(functionCall.functionCall.args).toEqual({
          location: "New York, NY",
          unit: "fahrenheit",
        });
      }
    });

    it("should validate response with safety ratings and content filtering", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: "I can't provide that information." }],
              role: "model" as const,
            },
            finishReason: "SAFETY" as const,
            index: 0,
            safetyRatings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                probability: "HIGH",
                blocked: true,
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                probability: "MEDIUM",
                blocked: false,
              },
            ],
          },
        ],
        promptFeedback: {
          blockReason: "SAFETY",
          safetyRatings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              probability: "HIGH",
              blocked: true,
            },
          ],
        },
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(result.candidates![0].finishReason).toBe("SAFETY");
      expect(result.candidates![0].safetyRatings).toHaveLength(2);
      expect(result.candidates![0].safetyRatings![0].probability).toBe("HIGH");
      expect(result.candidates![0].safetyRatings![0].blocked).toBe(true);
      expect(result.promptFeedback?.blockReason).toBe("SAFETY");
    });

    it("should validate response without candidates (error case)", () => {
      const response = {
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 0,
          totalTokenCount: 10,
        },
        promptFeedback: {
          blockReason: "OTHER",
        },
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(result.candidates).toBeUndefined();
      expect(result.usageMetadata?.totalTokenCount).toBe(10);
      expect(result.promptFeedback?.blockReason).toBe("OTHER");
    });

    it("should validate empty response", () => {
      const response = {};

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(result.candidates).toBeUndefined();
      expect(result.usageMetadata).toBeUndefined();
      expect(result.modelVersion).toBeUndefined();
    });
  });

  describe("invalid responses", () => {
    it("should reject negative token counts", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: "Hello" }],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: -5, // Invalid negative count
          candidatesTokenCount: 10,
          totalTokenCount: 5,
        },
      };

      expect(() => GoogleGeminiV1ResponseSchema.parse(response)).toThrow();
    });

    it("should reject invalid finish reason", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: "Hello" }],
            },
            finishReason: "INVALID_REASON",
          },
        ],
      };

      expect(() => GoogleGeminiV1ResponseSchema.parse(response)).toThrow();
    });

    it("should reject invalid safety category", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: "Hello" }],
            },
            safetyRatings: [
              {
                category: "INVALID_CATEGORY",
                probability: "LOW",
              },
            ],
          },
        ],
      };

      expect(() => GoogleGeminiV1ResponseSchema.parse(response)).toThrow();
    });

    it("should reject invalid safety probability", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: "Hello" }],
            },
            safetyRatings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                probability: "INVALID_PROBABILITY",
              },
            ],
          },
        ],
      };

      expect(() => GoogleGeminiV1ResponseSchema.parse(response)).toThrow();
    });

    it("should reject invalid content role", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: "Hello" }],
              role: "invalid_role",
            },
          },
        ],
      };

      expect(() => GoogleGeminiV1ResponseSchema.parse(response)).toThrow();
    });

    it("should reject malformed function call", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    // Missing required 'name' field
                    args: { param: "value" },
                  },
                },
              ],
            },
          },
        ],
      };

      expect(() => GoogleGeminiV1ResponseSchema.parse(response)).toThrow();
    });

    it("should reject invalid block reason", () => {
      const response = {
        promptFeedback: {
          blockReason: "INVALID_BLOCK_REASON",
        },
      };

      expect(() => GoogleGeminiV1ResponseSchema.parse(response)).toThrow();
    });
  });

  describe("boundary cases", () => {
    it("should accept zero token counts", () => {
      const response = {
        usageMetadata: {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 0,
        },
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(result.usageMetadata?.promptTokenCount).toBe(0);
      expect(result.usageMetadata?.candidatesTokenCount).toBe(0);
      expect(result.usageMetadata?.totalTokenCount).toBe(0);
    });

    it("should accept large token counts", () => {
      const response = {
        usageMetadata: {
          promptTokenCount: 1000000,
          candidatesTokenCount: 500000,
          totalTokenCount: 1500000,
        },
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(result.usageMetadata?.promptTokenCount).toBe(1000000);
      expect(result.usageMetadata?.candidatesTokenCount).toBe(500000);
      expect(result.usageMetadata?.totalTokenCount).toBe(1500000);
    });

    it("should handle citation metadata with optional fields", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: "Information from various sources." }],
            },
            citationMetadata: {
              citationSources: [
                {
                  uri: "https://example.com",
                  // startIndex and endIndex are optional
                },
                {
                  startIndex: 0,
                  endIndex: 10,
                  // uri and license are optional
                },
              ],
            },
          },
        ],
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      expect(
        result.candidates![0].citationMetadata?.citationSources,
      ).toHaveLength(2);
      expect(
        result.candidates![0].citationMetadata?.citationSources![0].uri,
      ).toBe("https://example.com");
      expect(
        result.candidates![0].citationMetadata?.citationSources![1].startIndex,
      ).toBe(0);
    });
  });
});

describe("GoogleGeminiV1StreamingResponseSchema", () => {
  describe("valid streaming responses", () => {
    it("should validate streaming response chunk", () => {
      const chunk = {
        candidates: [
          {
            content: {
              parts: [{ text: "Partial response text" }],
              role: "model" as const,
            },
            index: 0,
          },
        ],
      };

      const result = GoogleGeminiV1StreamingResponseSchema.parse(chunk);

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates![0].content?.parts).toHaveLength(1);
      expect(result.candidates![0].content?.parts[0]).toEqual({
        text: "Partial response text",
      });
    });

    it("should validate final streaming chunk with usage metadata", () => {
      const chunk = {
        candidates: [
          {
            content: {
              parts: [{ text: "" }],
              role: "model" as const,
            },
            finishReason: "STOP" as const,
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 25,
          totalTokenCount: 40,
        },
        modelVersion: "gemini-2.0-flash-lite",
      };

      const result = GoogleGeminiV1StreamingResponseSchema.parse(chunk);

      expect(result.candidates![0].finishReason).toBe("STOP");
      expect(result.usageMetadata?.totalTokenCount).toBe(40);
      expect(result.modelVersion).toBe("gemini-2.0-flash-lite");
    });

    it("should validate streaming function call chunk", () => {
      const chunk = {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "search_web",
                    args: { query: "weather today" },
                  },
                },
              ],
              role: "model" as const,
            },
            index: 0,
          },
        ],
      };

      const result = GoogleGeminiV1StreamingResponseSchema.parse(chunk);

      expect(result.candidates![0].content?.parts).toHaveLength(1);
      const functionCall = result.candidates![0].content?.parts[0];
      if ("functionCall" in functionCall!) {
        expect(functionCall.functionCall.name).toBe("search_web");
        expect(functionCall.functionCall.args).toEqual({
          query: "weather today",
        });
      }
    });

    it("should validate empty streaming chunk", () => {
      const chunk = {};

      const result = GoogleGeminiV1StreamingResponseSchema.parse(chunk);

      expect(result.candidates).toBeUndefined();
      expect(result.usageMetadata).toBeUndefined();
    });
  });

  describe("type inference", () => {
    it("should properly infer TypeScript types", () => {
      const response: GoogleGeminiV1Response = {
        candidates: [
          {
            content: {
              parts: [{ text: "Test response" }],
              role: "model",
            },
            finishReason: "STOP",
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30,
        },
      };

      const result = GoogleGeminiV1ResponseSchema.parse(response);

      // Type assertions to verify inference works
      expect(typeof result.candidates![0].content?.role).toBe("string");
      expect(typeof result.candidates![0].finishReason).toBe("string");
      expect(typeof result.usageMetadata?.totalTokenCount).toBe("number");
    });
  });
});
