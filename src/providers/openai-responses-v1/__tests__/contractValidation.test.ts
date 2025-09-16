/**
 * Contract Validation Tests
 *
 * Tests that validate fixture data matches real OpenAI API response structures
 * and ensure API contract compliance for the OpenAI Responses v1 provider.
 */

import { describe, test, expect } from "@jest/globals";
import { OpenAIResponsesV1ResponseSchema } from "../responseSchema.js";
import {
  nonStreamingResponses,
  streamingEvents,
  errorResponses,
  requestResponsePairs,
} from "./fixtures/index.js";

describe("Contract Validation", () => {
  describe("Non-streaming response fixtures validation", () => {
    test("should validate chatCompletionSuccess against OpenAI schema", () => {
      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        nonStreamingResponses.chatCompletionSuccess,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("resp_01J8KRXF7QZQZQZQZQZQZQZQZQ");
        expect(result.data.object).toBe("response");
        expect(result.data.output).toHaveLength(1);
        const output = result.data.output[0];
        if (output.type === "message") {
          expect(output.role).toBe("assistant");
        }
        expect(result.data.usage).toBeDefined();
      }
    });

    test("should validate chatCompletionEmpty against OpenAI schema", () => {
      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        nonStreamingResponses.chatCompletionEmpty,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const output = result.data.output[0];
        if (output.type === "message") {
          expect(output.content[0].text).toBe("");
        }
        expect(result.data.usage?.output_tokens).toBe(0);
      }
    });

    test("should validate chatCompletionWithUsage against OpenAI schema", () => {
      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        nonStreamingResponses.chatCompletionWithUsage,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("gpt-5-2025-08-07");
        expect(result.data.usage?.total_tokens).toBe(123);
      }
    });

    test("should validate chatCompletionWithContentParts against OpenAI schema", () => {
      const result = OpenAIResponsesV1ResponseSchema.safeParse(
        nonStreamingResponses.chatCompletionWithContentParts,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const output = result.data.output[0];
        if (output.type === "message") {
          expect(Array.isArray(output.content)).toBe(true);
          const content = output.content;
          expect(content[0].type).toBe("output_text");
        }
      }
    });

    test("should validate response status values", () => {
      const lengthResult = OpenAIResponsesV1ResponseSchema.safeParse(
        nonStreamingResponses.chatCompletionLengthLimit,
      );
      expect(lengthResult.success).toBe(true);
      if (lengthResult.success) {
        expect(lengthResult.data.status).toBeDefined();
        expect(typeof lengthResult.data.status).toBe("string");
      }

      const filterResult = OpenAIResponsesV1ResponseSchema.safeParse(
        nonStreamingResponses.chatCompletionContentFilter,
      );
      expect(filterResult.success).toBe(true);
      if (filterResult.success) {
        expect(filterResult.data.status).toBeDefined();
        expect(typeof filterResult.data.status).toBe("string");
      }
    });
  });

  describe("Streaming event fixtures validation", () => {
    test("should validate individual streaming events", () => {
      // Test response.created event
      const createdEventData = JSON.parse(
        streamingEvents.streamEventsIndividual.responseCreated.data,
      );
      expect(createdEventData.type).toBe("response.created");
      expect(createdEventData.response).toBeDefined();
      expect(typeof createdEventData.response.id).toBe("string");

      // Test response.output_text.delta event
      const deltaEventData = JSON.parse(
        streamingEvents.streamEventsIndividual.textDelta.data,
      );
      expect(deltaEventData.type).toBe("response.output_text.delta");
      expect(deltaEventData.delta).toBeDefined();
      expect(typeof deltaEventData.delta).toBe("string");

      // Test response.completed event
      const completedEventData = JSON.parse(
        streamingEvents.streamEventsIndividual.responseCompleted.data,
      );
      expect(completedEventData.type).toBe("response.completed");
      expect(completedEventData.response).toBeDefined();
      expect(completedEventData.usage).toBeDefined();
    });

    test("should validate complete event sequence structure", () => {
      for (const event of streamingEvents.streamEventsComplete) {
        if (event.data !== "[DONE]") {
          const eventData = JSON.parse(event.data);
          expect(eventData.type).toBeDefined();
          expect(typeof eventData.type).toBe("string");

          if (eventData.type === "response.output_text.delta") {
            expect(eventData.delta).toBeDefined();
            if (eventData.delta.text) {
              expect(typeof eventData.delta.text).toBe("string");
            }
          }

          if (eventData.type === "response.completed") {
            expect(eventData.response).toBeDefined();
            if (eventData.response.usage) {
              expect(typeof eventData.response.usage.prompt_tokens).toBe(
                "number",
              );
              expect(typeof eventData.response.usage.completion_tokens).toBe(
                "number",
              );
              expect(typeof eventData.response.usage.total_tokens).toBe(
                "number",
              );
            }
          }
        }
      }
    });

    test("should validate streaming event order and consistency", () => {
      const events = streamingEvents.streamEventsComplete;
      let hasCreated = false;
      let hasDeltas = false;
      let hasCompleted = false;
      let responseId: string | undefined;

      for (const event of events) {
        if (event.data === "[DONE]") {
          continue;
        }

        const eventData = JSON.parse(event.data);

        if (eventData.type === "response.created") {
          expect(hasCreated).toBe(false); // Should only have one created event
          hasCreated = true;
          responseId = eventData.response?.id;
        }

        if (eventData.type === "response.output_text.delta") {
          hasDeltas = true;
          // Should maintain consistent response ID if provided
          if (eventData.response?.id && responseId) {
            expect(eventData.response.id).toBe(responseId);
          }
        }

        if (eventData.type === "response.completed") {
          expect(hasCompleted).toBe(false); // Should only have one completed event
          hasCompleted = true;
          if (eventData.response?.id && responseId) {
            expect(eventData.response.id).toBe(responseId);
          }
        }
      }

      expect(hasCreated).toBe(true);
      expect(hasDeltas).toBe(true);
      expect(hasCompleted).toBe(true);
    });

    test("should validate malformed events are structurally invalid", () => {
      // Invalid JSON should not parse
      expect(() => {
        JSON.parse(streamingEvents.streamEventsMalformed.invalidJson.data);
      }).toThrow();

      // Missing type should be detectable
      const missingTypeData = JSON.parse(
        streamingEvents.streamEventsMalformed.missingType.data,
      );
      expect(missingTypeData.type).toBeUndefined();

      // Unknown event type should be identifiable
      const unknownTypeData = JSON.parse(
        streamingEvents.streamEventsMalformed.unknownEventType.data,
      );
      expect(unknownTypeData.type).toBe("unknown.event.type");
    });
  });

  describe("Error response fixtures validation", () => {
    test("should validate HTTP error response structures", () => {
      const errors = [
        errorResponses.error401Auth,
        errorResponses.error429RateLimit,
        errorResponses.error400InvalidModel,
        errorResponses.error500Server,
      ];

      for (const errorResponse of errors) {
        expect(typeof errorResponse.status).toBe("number");
        expect(errorResponse.status).toBeGreaterThanOrEqual(400);
        expect(typeof errorResponse.statusText).toBe("string");
        expect(errorResponse.headers).toBeDefined();
        expect(errorResponse.body).toBeDefined();
        expect(errorResponse.body.error).toBeDefined();
        expect(typeof errorResponse.body.error.message).toBe("string");
        expect(typeof errorResponse.body.error.type).toBe("string");
      }
    });

    test("should validate OpenAI error object structure", () => {
      const authError = errorResponses.error401Auth.body.error;
      expect(authError.message).toContain("API key");
      expect(authError.type).toBe("invalid_request_error");
      expect(authError.code).toBe("invalid_api_key");

      const rateLimitError = errorResponses.error429RateLimit.body.error;
      expect(rateLimitError.message).toContain("Rate limit");
      expect(rateLimitError.type).toBe("requests");
      expect(rateLimitError.code).toBe("rate_limit_exceeded");
    });

    test("should validate streaming error events", () => {
      const streamingErrorData = JSON.parse(errorResponses.streamingError.data);
      expect(streamingErrorData.type).toBe("error");
      expect(streamingErrorData.error).toBeDefined();
      expect(typeof streamingErrorData.error.message).toBe("string");
      expect(typeof streamingErrorData.error.type).toBe("string");

      const rateLimitErrorData = JSON.parse(
        errorResponses.streamingRateLimitError.data,
      );
      expect(rateLimitErrorData.type).toBe("error");
      expect(rateLimitErrorData.error.type).toBe("rate_limit_error");
    });

    test("should validate malformed error responses", () => {
      // Missing error object
      const malformedError = errorResponses.errorMalformedMissingError;
      expect((malformedError.body as any).error).toBeUndefined();
      expect((malformedError.body as any).message).toBeDefined(); // Direct message field

      // Non-JSON response
      const nonJsonError = errorResponses.errorMalformedNonJson;
      expect(typeof nonJsonError.body).toBe("string");
      expect(nonJsonError.body).toContain("502 Bad Gateway");
    });
  });

  describe("Request translation contract validation", () => {
    test("should validate request/response pairs structure", () => {
      for (const pair of requestResponsePairs) {
        // Validate request structure
        expect(pair.request.model).toBeDefined();
        expect(Array.isArray(pair.request.messages)).toBe(true);
        expect(pair.request.messages.length).toBeGreaterThan(0);

        // Validate expected response structure
        expect(pair.expected.url).toContain("/responses");
        expect(pair.expected.method).toBe("POST");
        expect(pair.expected.headers).toBeDefined();
        expect(pair.expected.headers.Authorization).toContain("Bearer");
        expect(pair.expected.headers["Content-Type"]).toBe("application/json");
        expect(pair.expected.body).toBeDefined();

        // Validate body structure
        expect(pair.expected.body.model).toBeDefined();
        expect(Array.isArray((pair.expected.body as any).messages)).toBe(true);
        expect(typeof pair.expected.body.stream).toBe("boolean");
      }
    });

    test("should validate OpenAI Responses API v1 compliance", () => {
      for (const pair of requestResponsePairs) {
        const body = pair.expected.body;

        // Required fields per OpenAI Responses API v1
        const bodyAny = body as any;
        expect(bodyAny.model).toBeDefined();
        expect(bodyAny.messages).toBeDefined();
        expect(Array.isArray(bodyAny.messages)).toBe(true);

        // Stream field should be boolean
        expect(typeof body.stream).toBe("boolean");

        // Optional parameters should have correct types when present
        if (bodyAny.temperature !== undefined) {
          expect(typeof bodyAny.temperature).toBe("number");
          expect(bodyAny.temperature).toBeGreaterThanOrEqual(0);
          expect(bodyAny.temperature).toBeLessThanOrEqual(2);
        }

        if (bodyAny.max_tokens !== undefined) {
          expect(typeof bodyAny.max_tokens).toBe("number");
          expect(bodyAny.max_tokens).toBeGreaterThan(0);
        }
      }
    });

    test("should validate message format compatibility", () => {
      for (const pair of requestResponsePairs) {
        const bodyAny2 = pair.expected.body as any;
        for (const message of bodyAny2.messages) {
          // Each message should have role
          expect(message.role).toBeDefined();
          expect(typeof message.role).toBe("string");
          expect(["system", "user", "assistant"]).toContain(message.role);

          // Content should be string for OpenAI Responses API v1
          expect(message.content).toBeDefined();
          expect(Array.isArray(message.content)).toBe(true);
        }
      }
    });
  });

  describe("Schema evolution and breaking changes", () => {
    test("should detect any schema incompatibilities", () => {
      // Test that all fixtures still conform to current schemas
      const allResponses = Object.values(nonStreamingResponses);

      for (const response of allResponses) {
        const result = OpenAIResponsesV1ResponseSchema.safeParse(response);
        if (!result.success) {
          console.error("Schema validation failed for:", response);
          console.error("Errors:", result.error.errors);
        }
        expect(result.success).toBe(true);
      }
    });

    test("should validate usage statistics consistency", () => {
      const responsesWithUsage = [
        nonStreamingResponses.chatCompletionSuccess,
        nonStreamingResponses.chatCompletionWithUsage,
      ];

      for (const response of responsesWithUsage) {
        expect(response.usage).toBeDefined();
        expect(response.usage.input_tokens).toBeGreaterThanOrEqual(0);
        expect(response.usage.output_tokens).toBeGreaterThanOrEqual(0);
        if (response.usage.total_tokens) {
          expect(response.usage.total_tokens).toBeGreaterThanOrEqual(
            Number(response.usage.input_tokens) +
              Number(response.usage.output_tokens),
          );
        }
      }
    });

    test("should validate model name consistency", () => {
      const expectedModels = ["gpt-4o-2024-08-06", "gpt-5-2025-08-07"];

      for (const response of Object.values(nonStreamingResponses)) {
        expect(expectedModels).toContain(response.model);
      }
    });
  });

  describe("Boundary conditions and edge cases", () => {
    test("should handle empty and minimal content", () => {
      const emptyResponse = nonStreamingResponses.chatCompletionEmpty;
      expect(emptyResponse.output[0].content[0].text).toBe("");
      expect(emptyResponse.usage.output_tokens).toBe(0);
    });

    test("should validate ID format consistency", () => {
      const idPattern = /^resp_[A-Za-z0-9]+$/;

      for (const response of Object.values(nonStreamingResponses)) {
        expect(response.id).toMatch(idPattern);
      }
    });

    test("should validate timestamp format", () => {
      for (const response of Object.values(nonStreamingResponses)) {
        expect(typeof response.created_at).toBe("number");
        expect(response.created_at).toBeGreaterThan(1600000000); // After 2020
        expect(response.created_at).toBeLessThan(2000000000); // Before 2033
      }
    });
  });
});
