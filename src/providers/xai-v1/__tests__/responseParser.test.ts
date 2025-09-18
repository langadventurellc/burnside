/**
 * Tests for xAI Response Parser
 *
 * Comprehensive test coverage for parsing xAI API responses
 * and converting them to unified message format.
 */

import { parseXAIResponse } from "../responseParser";
import { ValidationError } from "../../../core/errors/validationError";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import {
  validTextResponse,
  validTextResponseWithToolCalls,
  validMultipleToolCallsResponse,
  validMinimalResponse,
  validResponseWithoutUsage,
  validResponseWithReasoningOutput,
  validResponseWithEmptyContent,
  emptyResponse,
  invalidJsonResponse,
  nonObjectResponse,
  emptyOutputArrayResponse,
  noMessageTypeResponse,
  malformedToolCallsResponse,
  invalidToolCallStructureResponse,
  missingRequiredFieldsResponse,
} from "./fixtures";

/**
 * Helper function to create mock HTTP response
 */
function createMockResponse(
  status = 200,
  statusText = "OK",
): ProviderHttpResponse {
  return {
    status,
    statusText,
    headers: {},
    body: null,
  };
}

describe("parseXAIResponse", () => {
  describe("Successful parsing", () => {
    it("should parse valid text response correctly", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validTextResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message).toEqual({
        id: "resp_2024_12_xai_text",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello! I'm Grok, an AI assistant created by xAI. How can I help you today?",
          },
        ],
        timestamp: expect.any(String),
        metadata: {
          provider: "xai",
          id: "resp_2024_12_xai_text",
          created_at: 1703097600,
          status: "completed",
          finishReason: null,
        },
      });

      expect(result.usage).toEqual({
        promptTokens: 12,
        completionTokens: 23,
        totalTokens: 35,
      });

      expect(result.model).toBe("grok-3");
      expect(result.metadata).toEqual({
        provider: "xai",
        id: "resp_2024_12_xai_text",
        created_at: 1703097600,
        status: "completed",
        finishReason: null,
      });
    });

    it("should parse response with tool calls correctly", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validTextResponseWithToolCalls);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.content).toEqual([
        {
          type: "text",
          text: "I'll help you check the weather. Let me get that information for you.",
        },
      ]);

      expect(result.message.toolCalls).toHaveLength(1);
      expect(result.message.toolCalls?.[0]).toEqual({
        id: "call_weather_123",
        name: "get_weather",
        parameters: {
          location: "San Francisco, CA",
          unit: "celsius",
        },
        metadata: {
          providerId: "xai",
          timestamp: expect.any(String),
          rawCall: expect.any(Object),
        },
      });
    });

    it("should parse response with multiple tool calls correctly", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validMultipleToolCallsResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.toolCalls).toHaveLength(2);
      expect(result.message.toolCalls?.[0].name).toBe("web_search");
      expect(result.message.toolCalls?.[1].name).toBe("calculate");

      expect(result.usage).toEqual({
        promptTokens: 20,
        completionTokens: 35,
        totalTokens: 55,
      });
    });

    it("should parse minimal response correctly", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validMinimalResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.content).toEqual([
        {
          type: "text",
          text: "OK",
        },
      ]);
      expect(result.message.toolCalls).toBeUndefined();
      expect(result.usage).toBeUndefined();
      expect(result.model).toBe("grok-3-mini");
    });

    it("should handle response without usage information", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validResponseWithoutUsage);

      const result = parseXAIResponse(response, responseText);

      expect(result.usage).toBeUndefined();
      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "Response without usage information.",
      });
    });

    it("should handle response with reasoning output", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validResponseWithReasoningOutput);

      const result = parseXAIResponse(response, responseText);

      // Should find and parse the message output, ignoring reasoning output
      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "Based on my reasoning, the answer is 42.",
      });

      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
      });
    });

    it("should handle response with empty content", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validResponseWithEmptyContent);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "",
      });
    });

    it("should generate valid timestamps", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validTextResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.timestamp).toBeDefined();
      expect(() => new Date(result.message.timestamp as string)).not.toThrow();
    });
  });

  describe("Error handling", () => {
    it("should throw ValidationError for empty response", () => {
      const response = createMockResponse();

      expect(() => parseXAIResponse(response, emptyResponse)).toThrow(
        ValidationError,
      );
      expect(() => parseXAIResponse(response, emptyResponse)).toThrow(
        "Response body is empty",
      );
    });

    it("should throw ValidationError for invalid JSON", () => {
      const response = createMockResponse();

      expect(() => parseXAIResponse(response, invalidJsonResponse)).toThrow(
        ValidationError,
      );
      expect(() => parseXAIResponse(response, invalidJsonResponse)).toThrow(
        "Failed to parse response as JSON",
      );
    });

    it("should throw ValidationError for non-object JSON response", () => {
      const response = createMockResponse();

      expect(() => parseXAIResponse(response, nonObjectResponse)).toThrow(
        ValidationError,
      );
      expect(() => parseXAIResponse(response, nonObjectResponse)).toThrow(
        "Invalid xAI response structure",
      );
    });

    it("should throw ValidationError for empty output array", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(emptyOutputArrayResponse);

      expect(() => parseXAIResponse(response, responseText)).toThrow(
        ValidationError,
      );
      expect(() => parseXAIResponse(response, responseText)).toThrow(
        "xAI response contains no output",
      );
    });

    it("should throw ValidationError when no message type found", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(noMessageTypeResponse);

      expect(() => parseXAIResponse(response, responseText)).toThrow(
        ValidationError,
      );
      expect(() => parseXAIResponse(response, responseText)).toThrow(
        "No message type found in xAI response output",
      );
    });

    it("should throw ValidationError for malformed tool calls", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(malformedToolCallsResponse);

      expect(() => parseXAIResponse(response, responseText)).toThrow(
        ValidationError,
      );
      expect(() => parseXAIResponse(response, responseText)).toThrow(
        "Failed to parse tool calls in response",
      );
    });

    it("should throw ValidationError for invalid tool call structure", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(invalidToolCallStructureResponse);

      expect(() => parseXAIResponse(response, responseText)).toThrow(
        ValidationError,
      );
    });

    it("should throw ValidationError for missing required fields", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(missingRequiredFieldsResponse);

      expect(() => parseXAIResponse(response, responseText)).toThrow(
        ValidationError,
      );
      expect(() => parseXAIResponse(response, responseText)).toThrow(
        "Invalid xAI response structure",
      );
    });

    it("should include HTTP context in error messages", () => {
      const response = createMockResponse(500, "Internal Server Error");

      try {
        parseXAIResponse(response, emptyResponse);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toMatchObject({
          status: 500,
          statusText: "Internal Server Error",
        });
      }
    });

    it("should include response context for schema validation errors", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(missingRequiredFieldsResponse);

      try {
        parseXAIResponse(response, responseText);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty("validationErrors");
        expect(validationError.context).toHaveProperty("responseData");
      }
    });

    it("should truncate long response text in error context", () => {
      const response = createMockResponse();
      const longInvalidJson = "{ invalid json " + "x".repeat(1000);

      try {
        parseXAIResponse(response, longInvalidJson);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        const responseText = validationError.context?.responseText as string;
        expect(responseText).toHaveLength(500);
      }
    });
  });

  describe("Content conversion", () => {
    it("should convert output_text content to text content parts", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validTextResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.content).toEqual([
        {
          type: "text",
          text: "Hello! I'm Grok, an AI assistant created by xAI. How can I help you today?",
        },
      ]);
    });

    it("should preserve multiple content parts", () => {
      const multiPartResponse = {
        ...validTextResponse,
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "First part",
                annotations: null,
                logprobs: null,
              },
              {
                type: "output_text",
                text: "Second part",
                annotations: null,
                logprobs: null,
              },
            ],
          },
        ],
      };

      const response = createMockResponse();
      const responseText = JSON.stringify(multiPartResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.content).toEqual([
        { type: "text", text: "First part" },
        { type: "text", text: "Second part" },
      ]);
    });
  });

  describe("Usage information extraction", () => {
    it("should extract usage information correctly", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validTextResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.usage).toEqual({
        promptTokens: 12,
        completionTokens: 23,
        totalTokens: 35,
      });
    });

    it("should handle missing usage information", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validResponseWithoutUsage);

      const result = parseXAIResponse(response, responseText);

      expect(result.usage).toBeUndefined();
    });

    it("should map token fields correctly", () => {
      const responseWithDetailedUsage = {
        ...validTextResponse,
        usage: {
          input_tokens: 100,
          input_tokens_details: { cached_tokens: 10 },
          output_tokens: 50,
          output_tokens_details: { reasoning_tokens: 20 },
          total_tokens: 150,
        },
      };

      const response = createMockResponse();
      const responseText = JSON.stringify(responseWithDetailedUsage);

      const result = parseXAIResponse(response, responseText);

      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });
    });
  });

  describe("Metadata extraction", () => {
    it("should extract metadata correctly", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validTextResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.metadata).toEqual({
        provider: "xai",
        id: "resp_2024_12_xai_text",
        created_at: 1703097600,
        status: "completed",
        finishReason: null,
      });
    });

    it("should include provider metadata in message", () => {
      const response = createMockResponse();
      const responseText = JSON.stringify(validTextResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.metadata).toMatchObject({
        provider: "xai",
      });
    });

    it("should handle optional metadata fields", () => {
      const responseWithoutOptional = {
        id: "resp_minimal_meta",
        object: "completion",
        status: "completed",
        model: "grok-3",
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Test",
                annotations: null,
                logprobs: null,
              },
            ],
          },
        ],
        tool_choice: "auto",
        tools: [],
        // Add required nullable fields
        max_output_tokens: null,
        metadata: null,
        previous_response_id: null,
        temperature: null,
        top_p: null,
        user: null,
        incomplete_details: null,
        debug_output: {
          attempts: 1,
          cache_read_count: 0,
          cache_read_input_bytes: 0,
          cache_write_count: 0,
          cache_write_input_bytes: 0,
          engine_request: "req_123",
          lb_address: "10.0.0.1",
          prompt: "Hello",
          request: "original_request",
          responses: [],
          sampler_tag: "default",
        },
        reasoning: {
          effort: null,
          generate_summary: false,
          summary: null,
        },
        store: false,
        parallel_tool_calls: false,
        text: {
          format: {
            type: "text",
          },
        },
      };

      const response = createMockResponse();
      const responseText = JSON.stringify(responseWithoutOptional);

      const result = parseXAIResponse(response, responseText);

      expect(result.metadata).toEqual({
        provider: "xai",
        id: "resp_minimal_meta",
        created_at: undefined,
        status: "completed",
        finishReason: null,
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle whitespace-only response", () => {
      const response = createMockResponse();

      expect(() => parseXAIResponse(response, "   \n\t   ")).toThrow(
        ValidationError,
      );
    });

    it("should handle very long response IDs", () => {
      const longIdResponse = {
        ...validTextResponse,
        id: "resp_" + "x".repeat(1000),
      };

      const response = createMockResponse();
      const responseText = JSON.stringify(longIdResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.id).toBe("resp_" + "x".repeat(1000));
    });

    it("should handle special characters in content", () => {
      const specialCharResponse = {
        ...validTextResponse,
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Special chars: 🤖 ñáéíóú \"quotes\" 'apostrophes' \\backslash",
                annotations: null,
                logprobs: null,
              },
            ],
          },
        ],
      };

      const response = createMockResponse();
      const responseText = JSON.stringify(specialCharResponse);

      const result = parseXAIResponse(response, responseText);

      expect(result.message.content[0]).toEqual({
        type: "text",
        text: "Special chars: 🤖 ñáéíóú \"quotes\" 'apostrophes' \\backslash",
      });
    });
  });
});
