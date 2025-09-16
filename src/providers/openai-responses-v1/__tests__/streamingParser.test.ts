/**
 * Tests for OpenAI Responses v1 streaming parser
 *
 * Comprehensive unit tests covering all event types, error conditions,
 * and edge cases for the SSE streaming parser implementation.
 */

import { parseOpenAIResponseStream } from "../streamingParser.js";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse.js";
import type { StreamDelta } from "../../../client/streamDelta.js";
import { StreamingError } from "../../../core/errors/streamingError.js";
import { ValidationError } from "../../../core/errors/validationError.js";
import { BridgeError } from "../../../core/errors/bridgeError.js";

/**
 * Helper function to create mock SSE stream from events
 */
function createMockSSEStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });
}

/**
 * Helper function to create mock ProviderHttpResponse
 */
function createMockResponse(
  body: ReadableStream<Uint8Array> | null,
  status = 200,
): ProviderHttpResponse {
  return {
    status,
    statusText: "OK",
    headers: {},
    body,
  };
}

/**
 * Helper function to collect all deltas from async iterable
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

describe("parseOpenAIResponseStream", () => {
  describe("successful parsing", () => {
    it("should parse response.created event", async () => {
      const events = [
        'event: response.created\ndata: {"type":"response.created","response":{"id":"resp_123"}}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toEqual({
        id: "resp_123",
        delta: {},
        finished: false,
        metadata: { eventType: "response.created" },
      });
    });

    it("should parse response.output_text.delta event", async () => {
      const events = [
        'data: {"type":"response.output_text.delta","delta":"Hello","response":{"id":"resp_123"}}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toEqual({
        id: "resp_123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        metadata: { eventType: "response.output_text.delta" },
      });
    });

    it("should parse response.completed event with usage", async () => {
      const events = [
        'data: {"type":"response.completed","response":{"id":"resp_123"},"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toEqual({
        id: "resp_123",
        delta: {},
        finished: true,
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
        metadata: { eventType: "response.completed" },
      });
    });

    it("should handle complete streaming conversation", async () => {
      const events = [
        'data: {"type":"response.created","response":{"id":"resp_123"}}\n\n',
        'data: {"type":"response.output_text.delta","delta":"Hello","response":{"id":"resp_123"}}\n\n',
        'data: {"type":"response.output_text.delta","delta":" world","response":{"id":"resp_123"}}\n\n',
        'data: {"type":"response.completed","response":{"id":"resp_123"},"usage":{"prompt_tokens":10,"completion_tokens":5}}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(4);

      // Check response.created
      expect(deltas[0]).toEqual({
        id: "resp_123",
        delta: {},
        finished: false,
        metadata: { eventType: "response.created" },
      });

      // Check first delta
      expect(deltas[1]).toEqual({
        id: "resp_123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        metadata: { eventType: "response.output_text.delta" },
      });

      // Check second delta
      expect(deltas[2]).toEqual({
        id: "resp_123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: " world" }],
        },
        finished: false,
        metadata: { eventType: "response.output_text.delta" },
      });

      // Check completion
      expect(deltas[3]).toEqual({
        id: "resp_123",
        delta: {},
        finished: true,
        usage: {
          promptTokens: 10,
          completionTokens: 5,
        },
        metadata: { eventType: "response.completed" },
      });
    });

    it("should handle events without response ID", async () => {
      const events = [
        'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].id).toBeDefined();
      expect(deltas[0].id).toMatch(/^stream-\d+-[a-z0-9]+$/);
    });

    it("should maintain response ID consistency across events", async () => {
      const events = [
        'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n',
        'data: {"type":"response.output_text.delta","delta":" world"}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(2);
      expect(deltas[0].id).toBeDefined();
      expect(deltas[1].id).toBe(deltas[0].id);
    });
  });

  describe("error handling", () => {
    it("should throw ValidationError when response body is null", async () => {
      const response = createMockResponse(null);

      await expect(async () => {
        for await (const _ of parseOpenAIResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow(ValidationError);
    });

    it("should throw BridgeError for OpenAI error events", async () => {
      const events = [
        'data: {"type":"error","error":{"message":"Rate limit exceeded","type":"rate_limit_error","code":"429"}}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));

      let caughtError: unknown;
      try {
        for await (const _ of parseOpenAIResponseStream(response)) {
          // Should not reach here
        }
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(BridgeError);
      expect((caughtError as BridgeError).message).toContain(
        "Rate limit exceeded",
      );
      expect((caughtError as BridgeError).code).toBe("429");
    });

    it("should handle malformed JSON gracefully", async () => {
      const events = [
        "data: {invalid json}\n\n",
        'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      // Should skip malformed event and process valid one
      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
      });
    });

    it("should handle unknown event types gracefully", async () => {
      const events = [
        'data: {"type":"unknown.event","someData":"value"}\n\n',
        'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      // Should skip unknown event and process valid one
      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
      });
    });

    it("should skip events without data", async () => {
      const events = [
        "event: heartbeat\n\n", // Event without data
        'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
      });
    });

    it("should handle empty text deltas", async () => {
      const events = [
        'data: {"type":"response.output_text.delta","delta":""}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "" }],
      });
    });

    it("should handle missing delta field", async () => {
      const events = [
        'data: {"type":"response.output_text.delta"}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "" }],
      });
    });

    it("should throw StreamingError for stream processing failures", async () => {
      // Create a stream that will error during reading
      const errorStream = new ReadableStream({
        start(controller) {
          controller.error(new Error("Network error"));
        },
      });

      const response = createMockResponse(errorStream);

      await expect(async () => {
        for await (const _ of parseOpenAIResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow(StreamingError);
    });
  });

  describe("edge cases", () => {
    it("should handle empty stream", async () => {
      const events: string[] = [];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(0);
    });

    it("should handle [DONE] without other events", async () => {
      const events = ["data: [DONE]\n\n"];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(0);
    });

    it("should handle completion without usage", async () => {
      const events = [
        'data: {"type":"response.completed","response":{"id":"resp_123"}}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toEqual({
        id: "resp_123",
        delta: {},
        finished: true,
        metadata: { eventType: "response.completed" },
      });
    });

    it("should handle partial usage information", async () => {
      const events = [
        'data: {"type":"response.completed","response":{"id":"resp_123"},"usage":{"prompt_tokens":10}}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].usage).toEqual({
        promptTokens: 10,
        completionTokens: 0,
      });
    });
  });

  describe("state management", () => {
    it("should track response ID across events", async () => {
      const events = [
        'data: {"type":"response.created","response":{"id":"resp_123"}}\n\n',
        'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n', // No response ID
        'data: {"type":"response.completed","response":{"id":"resp_456"}}\n\n', // Different ID
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(3);
      expect(deltas[0].id).toBe("resp_123"); // From created event
      expect(deltas[1].id).toBe("resp_123"); // Inherited from state
      expect(deltas[2].id).toBe("resp_456"); // From completed event
    });

    it("should accumulate usage information", async () => {
      const events = [
        'data: {"type":"response.output_text.delta","delta":"Hello","response":{"id":"resp_123"}}\n\n',
        'data: {"type":"response.completed","response":{"id":"resp_123"},"usage":{"prompt_tokens":10,"completion_tokens":5}}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseOpenAIResponseStream(response));

      expect(deltas).toHaveLength(2);
      expect(deltas[0].usage).toBeUndefined(); // Delta event has no usage
      expect(deltas[1].usage).toEqual({
        promptTokens: 10,
        completionTokens: 5,
      });
    });
  });
});
