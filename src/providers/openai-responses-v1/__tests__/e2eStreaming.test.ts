/**
 * End-to-End Streaming Tests
 *
 * Tests that validate streaming delta accumulation produces correct final text.
 * These tests specifically address Phase 4 acceptance criteria for E2E streaming
 * delta accumulation and contract testing with recorded fixtures.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import type { ChatRequest } from "../../../client/chatRequest.js";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse.js";
import type { StreamDelta } from "../../../client/streamDelta.js";
import { OpenAIResponsesV1Provider } from "../index.js";
import { streamingEvents } from "./fixtures/index.js";

/**
 * Helper to create mock streaming response from SSE events
 */
function createMockStreamingResponse(
  events: readonly { data: string }[],
): ProviderHttpResponse {
  return {
    status: 200,
    statusText: "OK",
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
    body: new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        for (const event of events) {
          controller.enqueue(encoder.encode(`data: ${event.data}\n\n`));
        }
        controller.close();
      },
    }),
  };
}

/**
 * Helper to accumulate text deltas from streaming deltas
 */
function accumulateDeltas(deltas: StreamDelta[]): string {
  return deltas
    .filter((delta) => delta.delta.content && delta.delta.content.length > 0)
    .map((delta) => {
      const content = delta.delta.content![0];
      return content.type === "text" ? content.text : "";
    })
    .join("");
}

/**
 * Helper to collect all deltas from async iterable
 */
async function collectDeltas(
  stream: AsyncIterable<StreamDelta>,
): Promise<StreamDelta[]> {
  const deltas: StreamDelta[] = [];
  for await (const delta of stream) {
    deltas.push(delta);
  }
  return deltas;
}

describe("End-to-End Streaming Delta Accumulation", () => {
  let provider: OpenAIResponsesV1Provider;

  beforeEach(async () => {
    provider = new OpenAIResponsesV1Provider();
    await provider.initialize({
      apiKey: "sk-test-e2e-streaming-key",
      baseUrl: "https://api.openai.com/v1",
    });
  });

  describe("Phase 4 Acceptance Criteria", () => {
    test("should prove E2E streaming deltas accumulate to final text", async () => {
      // This test specifically addresses Phase 4 acceptance criteria
      const streamFixture = streamingEvents.streamEventsComplete;
      const expectedCompleteText =
        streamingEvents.streamEventsCompleteExpectedText;
      const mockResponse = createMockStreamingResponse(streamFixture);

      const deltas: StreamDelta[] = [];
      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;

      for await (const delta of stream) {
        deltas.push(delta);
        if (provider.isTerminal(delta)) break;
      }

      // Verify deltas accumulate to complete text
      const fullText = accumulateDeltas(deltas);
      expect(fullText).toBe(expectedCompleteText);
      expect(deltas[deltas.length - 1].finished).toBe(true);

      // Additional verification: ensure we got meaningful content
      expect(fullText.length).toBeGreaterThan(0);
      expect(fullText).toContain("Hello");
      expect(fullText).toContain("Claude");
      expect(fullText).toContain("assistant");
    });

    test("should demonstrate contract tests pass with recorded OpenAI fixtures", async () => {
      // Contract test using recorded fixture
      const streamFixture = streamingEvents.streamEventsComplete;
      const mockResponse = createMockStreamingResponse(streamFixture);

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas = await collectDeltas(stream);

      // Verify the fixture represents realistic OpenAI API behavior
      expect(deltas.length).toBeGreaterThan(0);

      // Check event progression follows OpenAI semantic pattern
      let hasCreatedEvent = false;
      let hasDeltaEvents = false;
      let hasCompletedEvent = false;

      for (const delta of deltas) {
        if (delta.metadata?.eventType === "response.created") {
          hasCreatedEvent = true;
        }
        if (delta.metadata?.eventType === "response.output_text.delta") {
          hasDeltaEvents = true;
        }
        if (delta.metadata?.eventType === "response.completed") {
          hasCompletedEvent = true;
        }
      }

      expect(hasCreatedEvent).toBe(true);
      expect(hasDeltaEvents).toBe(true);
      expect(hasCompletedEvent).toBe(true);

      // Verify termination is correctly detected
      const finalDelta = deltas[deltas.length - 1];
      expect(provider.isTerminal(finalDelta)).toBe(true);
    });

    test("should validate BridgeClient compatibility through streaming", async () => {
      // Test demonstrates integration with BridgeClient streaming interface
      const streamFixture = streamingEvents.streamEventsPartialUsage;
      const mockResponse = createMockStreamingResponse(streamFixture);

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas = await collectDeltas(stream);

      // Verify StreamDelta format compatibility
      for (const delta of deltas) {
        expect(delta.id).toBeDefined();
        expect(typeof delta.id).toBe("string");
        expect(delta.delta).toBeDefined();
        expect(typeof delta.finished).toBe("boolean");

        if (delta.delta.content) {
          expect(Array.isArray(delta.delta.content)).toBe(true);
          for (const content of delta.delta.content) {
            expect(content.type).toBeDefined();
            if (content.type === "text") {
              expect(typeof content.text).toBe("string");
            }
          }
        }
      }

      // Verify usage information is preserved
      const deltaWithUsage = deltas.find((delta) => delta.usage);
      expect(deltaWithUsage).toBeDefined();
      expect(deltaWithUsage!.usage!.promptTokens).toBeDefined();
      expect(deltaWithUsage!.usage!.completionTokens).toBeDefined();
    });
  });

  describe("Streaming Performance and Reliability", () => {
    test("should handle long streaming sequences efficiently", async () => {
      const longStreamFixture = streamingEvents.streamEventsLong;
      const expectedLongText = streamingEvents.streamEventsLongExpectedText;
      const mockResponse = createMockStreamingResponse(longStreamFixture);

      const startTime = Date.now();
      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas = await collectDeltas(stream);
      const endTime = Date.now();

      // Verify content accumulation
      const fullText = accumulateDeltas(deltas);
      expect(fullText).toBe(expectedLongText);

      // Performance: should process 50+ events quickly
      expect(deltas.length).toBeGreaterThan(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      // Memory efficiency: no single delta should contain accumulated text
      for (const delta of deltas) {
        if (delta.delta.content && delta.delta.content.length > 0) {
          const text =
            delta.delta.content[0].type === "text"
              ? delta.delta.content[0].text
              : "";
          expect(text.length).toBeLessThan(50); // Individual deltas should be small
        }
      }
    });

    test("should maintain streaming state consistency", async () => {
      const streamFixture = streamingEvents.streamEventsComplete;
      const mockResponse = createMockStreamingResponse(streamFixture);

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas: StreamDelta[] = [];
      let responseId: string | undefined;

      for await (const delta of stream) {
        deltas.push(delta);

        // Track response ID consistency
        if (!responseId) {
          responseId = delta.id;
        } else {
          expect(delta.id).toBe(responseId);
        }

        // Only terminal delta should have finished: true
        if (delta.finished) {
          expect(provider.isTerminal(delta)).toBe(true);
          break;
        } else {
          expect(provider.isTerminal(delta)).toBe(false);
        }
      }

      expect(responseId).toBeDefined();
      expect(deltas.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling in Streaming Context", () => {
    test("should handle streaming errors correctly", async () => {
      const errorStreamFixture = streamingEvents.streamEventsError;
      const mockResponse = createMockStreamingResponse(errorStreamFixture);

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;

      let error: unknown;
      try {
        for await (const _delta of stream) {
          // Should eventually throw due to error event
        }
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      // Should be a proper error type from provider error normalization
      expect(error).toBeInstanceOf(Error);
    });

    test("should gracefully handle malformed streaming events", async () => {
      const malformedEvents = [
        streamingEvents.streamEventsIndividual.responseCreated,
        streamingEvents.streamEventsMalformed.invalidJson,
        streamingEvents.streamEventsIndividual.textDelta,
        streamingEvents.streamEventsIndividual.responseCompleted,
        streamingEvents.streamEventsIndividual.done,
      ];

      const mockResponse = createMockStreamingResponse(malformedEvents);
      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas = await collectDeltas(stream);

      // Should skip malformed events but process valid ones
      expect(deltas.length).toBeGreaterThan(0);

      // Should have some valid text content despite malformed event
      const textContent = deltas
        .filter(
          (delta) => delta.delta.content && delta.delta.content.length > 0,
        )
        .map((delta) => {
          const content = delta.delta.content![0];
          return content.type === "text" ? content.text : "";
        })
        .join("");

      expect(textContent.length).toBeGreaterThan(0);
    });
  });

  describe("Integration with Provider Interface", () => {
    test("should correctly implement isTerminal for streaming responses", async () => {
      const streamFixture = streamingEvents.streamEventsComplete;
      const mockResponse = createMockStreamingResponse(streamFixture);

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas = await collectDeltas(stream);

      let terminalCount = 0;
      for (const delta of deltas) {
        if (provider.isTerminal(delta)) {
          terminalCount++;
        }
      }

      // Should have exactly one terminal delta (the completion event)
      expect(terminalCount).toBe(1);

      // The terminal delta should be the last one
      const lastDelta = deltas[deltas.length - 1];
      expect(provider.isTerminal(lastDelta)).toBe(true);
    });

    test("should demonstrate full chat request to streaming response pipeline", async () => {
      const request: ChatRequest & { stream: boolean } = {
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Tell me a short story." }],
          },
        ],
        stream: true,
      };

      // 1. Translate request
      const translatedRequest = provider.translateRequest(request);
      expect(translatedRequest.url).toContain("/responses");

      const bodyString =
        typeof translatedRequest.body === "string"
          ? translatedRequest.body
          : new TextDecoder().decode(translatedRequest.body as Uint8Array);
      const parsedBody = JSON.parse(bodyString);
      expect(parsedBody.stream).toBe(true);

      // 2. Process streaming response
      const streamFixture = streamingEvents.streamEventsComplete;
      const mockResponse = createMockStreamingResponse(streamFixture);
      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;

      // 3. Accumulate and validate final result
      const deltas = await collectDeltas(stream);
      const finalText = accumulateDeltas(deltas);

      expect(finalText).toBe(streamingEvents.streamEventsCompleteExpectedText);
      expect(deltas[deltas.length - 1].finished).toBe(true);

      // 4. Verify provider integration
      expect(provider.supportsModel(request.model)).toBe(true);
      expect(provider.isTerminal(deltas[deltas.length - 1])).toBe(true);
    });
  });
});
