/**
 * Google Gemini v1 Response Parser Tests
 *
 * Comprehensive unit tests for the Gemini response parser functionality.
 * Tests all parsing scenarios including successful responses, error handling,
 * and edge cases.
 */

import { parseGeminiResponse } from "../responseParser";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import { ValidationError } from "../../../core/errors/validationError";

/**
 * Create a mock ProviderHttpResponse for testing
 */
function createMockResponse(
  status: number = 200,
  statusText: string = "OK",
): ProviderHttpResponse {
  return {
    status,
    statusText,
    headers: { "content-type": "application/json" },
    body: null, // Body is not used since we pass responseText directly
  };
}

describe("parseGeminiResponse", () => {
  describe("Successful parsing", () => {
    test("should parse simple text response correctly", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Hello, how can I help you today?" }],
              role: "model",
            },
            finishReason: "STOP",
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 8,
          totalTokenCount: 18,
        },
        modelVersion: "gemini-2.0-flash",
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message).toEqual({
        id: expect.stringMatching(/^gemini-\d+-[a-z0-9]+$/),
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello, how can I help you today?",
          },
        ],
        sources: undefined,
        toolCalls: undefined,
      });

      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18,
      });

      expect(result.model).toBe("gemini-2.0-flash");
      expect(result.metadata).toEqual({
        provider: "google-gemini-v1",
        modelVersion: "gemini-2.0-flash",
        finishReason: "STOP",
        candidateIndex: 0,
      });
    });

    test("should handle response without usage metadata", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Response without usage data" }],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.usage).toBeUndefined();
      expect(result.model).toBe("gemini-unknown");
      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "Response without usage data",
      });
    });

    test("should handle multiple content parts", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                { text: "First part of the response." },
                { text: " Second part continues here." },
              ],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message.content).toEqual([
        { type: "text", text: "First part of the response." },
        { type: "text", text: " Second part continues here." },
      ]);
    });
  });

  describe("Function call parsing", () => {
    test("should parse function calls correctly", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                { text: "I'll help you calculate that." },
                {
                  functionCall: {
                    name: "calculate_sum",
                    args: { a: 5, b: 3 },
                  },
                },
              ],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message.content).toEqual([
        { type: "text", text: "I'll help you calculate that." },
      ]);

      expect(result.message.toolCalls).toHaveLength(1);
      expect(result.message.toolCalls![0]).toEqual({
        id: expect.stringMatching(/^gemini-\d+-[a-z0-9]+$/),
        name: "calculate_sum",
        parameters: { a: 5, b: 3 },
        metadata: {
          providerId: "google-gemini-v1",
          timestamp: expect.any(String),
        },
      });
    });

    test("should handle multiple function calls", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "get_weather",
                    args: { location: "New York" },
                  },
                },
                {
                  functionCall: {
                    name: "get_time",
                    args: { timezone: "EST" },
                  },
                },
              ],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message.toolCalls).toHaveLength(2);
      expect(result.message.toolCalls![0].name).toBe("get_weather");
      expect(result.message.toolCalls![1].name).toBe("get_time");
    });

    test("should handle function calls with empty arguments", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "get_current_time",
                    args: {},
                  },
                },
              ],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message.toolCalls![0].parameters).toEqual({});
    });
  });

  describe("Citation processing", () => {
    test("should parse citation metadata correctly", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "According to recent studies..." }],
            },
            citationMetadata: {
              citationSources: [
                {
                  startIndex: 0,
                  endIndex: 25,
                  uri: "https://example.com/study1",
                  license: "CC BY 4.0",
                },
                {
                  startIndex: 26,
                  endIndex: 50,
                  uri: "https://example.com/study2",
                },
              ],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message.sources).toHaveLength(2);
      expect(result.message.sources![0]).toEqual({
        id: "gemini-citation-https___example_com_study1",
        url: "https://example.com/study1",
        title: "Citation from https://example.com/study1",
        metadata: {
          startIndex: 0,
          endIndex: 25,
          license: "CC BY 4.0",
          provider: "google-gemini-v1",
        },
      });
      expect(result.message.sources![1]).toEqual({
        id: "gemini-citation-https___example_com_study2",
        url: "https://example.com/study2",
        title: "Citation from https://example.com/study2",
        metadata: {
          startIndex: 26,
          endIndex: 50,
          license: undefined,
          provider: "google-gemini-v1",
        },
      });
    });

    test("should handle citations without URIs", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Based on information..." }],
            },
            citationMetadata: {
              citationSources: [
                {
                  startIndex: 0,
                  endIndex: 20,
                },
              ],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message.sources![0]).toEqual({
        id: "gemini-citation-0",
        url: undefined,
        title: "Citation 1",
        metadata: {
          startIndex: 0,
          endIndex: 20,
          license: undefined,
          provider: "google-gemini-v1",
        },
      });
    });
  });

  describe("Usage metadata extraction", () => {
    test("should extract complete usage metadata", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Test response" }],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 10,
          totalTokenCount: 25,
        },
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.usage).toEqual({
        promptTokens: 15,
        completionTokens: 10,
        totalTokens: 25,
      });
    });

    test("should handle missing candidatesTokenCount", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Test response" }],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          totalTokenCount: 25,
        },
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.usage).toEqual({
        promptTokens: 15,
        completionTokens: 0,
        totalTokens: 25,
      });
    });
  });

  describe("Error handling", () => {
    test("should throw ValidationError for empty response text", () => {
      const mockResponse = createMockResponse();

      expect(() => parseGeminiResponse(mockResponse, "")).toThrow(
        ValidationError,
      );
      expect(() => parseGeminiResponse(mockResponse, "   ")).toThrow(
        ValidationError,
      );
    });

    test("should throw ValidationError for invalid JSON", () => {
      const mockResponse = createMockResponse();
      const invalidJson = "{ invalid json structure";

      expect(() => parseGeminiResponse(mockResponse, invalidJson)).toThrow(
        ValidationError,
      );
    });

    test("should throw ValidationError for invalid response structure", () => {
      const mockResponse = createMockResponse();
      const invalidResponse = JSON.stringify({
        invalidField: "not a valid Gemini response",
      });

      expect(() => parseGeminiResponse(mockResponse, invalidResponse)).toThrow(
        ValidationError,
      );
    });

    test("should throw ValidationError when no candidates found", () => {
      const mockResponse = createMockResponse();
      const responseText = JSON.stringify({
        candidates: [],
      });

      expect(() => parseGeminiResponse(mockResponse, responseText)).toThrow(
        ValidationError,
      );
    });

    test("should throw ValidationError for malformed function calls", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    // Missing required 'name' field
                    args: { a: 5, b: 3 },
                  },
                },
              ],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();

      expect(() => parseGeminiResponse(mockResponse, responseText)).toThrow(
        ValidationError,
      );
    });
  });

  describe("Edge cases", () => {
    test("should handle response with no content parts", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [],
            },
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message.content).toEqual([]);
      expect(result.message.toolCalls).toBeUndefined();
      expect(result.message.sources).toBeUndefined();
    });

    test("should handle response with missing content", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            finishReason: "STOP",
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.message.content).toEqual([]);
    });

    test("should include safety ratings in metadata when present", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Safe response" }],
            },
            safetyRatings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                probability: "NEGLIGIBLE",
                blocked: false,
              },
            ],
          },
        ],
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.metadata?.safetyRatings).toEqual([
        {
          category: "HARM_CATEGORY_HARASSMENT",
          probability: "NEGLIGIBLE",
          blocked: false,
        },
      ]);
    });

    test("should include prompt feedback in metadata when present", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Response with feedback" }],
            },
          },
        ],
        promptFeedback: {
          blockReason: "SAFETY",
          safetyRatings: [
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "LOW",
            },
          ],
        },
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.metadata?.promptFeedback).toEqual({
        blockReason: "SAFETY",
        safetyRatings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            probability: "LOW",
          },
        ],
      });
    });

    test("should handle response with all metadata fields", () => {
      const responseText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: "Complete response" }],
            },
            finishReason: "STOP",
            index: 0,
            safetyRatings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                probability: "NEGLIGIBLE",
              },
            ],
            citationMetadata: {
              citationSources: [
                {
                  uri: "https://example.com/source",
                  startIndex: 0,
                  endIndex: 10,
                },
              ],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 3,
          totalTokenCount: 8,
        },
        modelVersion: "gemini-2.5-flash",
        promptFeedback: {
          safetyRatings: [],
        },
      });

      const mockResponse = createMockResponse();
      const result = parseGeminiResponse(mockResponse, responseText);

      expect(result.model).toBe("gemini-2.5-flash");
      expect(result.usage?.totalTokens).toBe(8);
      expect(result.message.sources).toHaveLength(1);
      expect(result.metadata).toEqual({
        provider: "google-gemini-v1",
        modelVersion: "gemini-2.5-flash",
        promptFeedback: { safetyRatings: [] },
        finishReason: "STOP",
        safetyRatings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            probability: "NEGLIGIBLE",
          },
        ],
        candidateIndex: 0,
      });
    });
  });
});
