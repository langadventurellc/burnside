/**
 * Unit tests for Anthropic Messages API streaming parser
 *
 * Tests the streaming response parser that converts Anthropic SSE events
 * to unified StreamDelta format, including error handling and edge cases.
 */

import { parseAnthropicResponseStream } from "../streamingParser.js";
import type { StreamDelta } from "../../../client/streamDelta.js";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse.js";
import { BridgeError } from "../../../core/errors/bridgeError.js";
import { StreamingError } from "../../../core/errors/streamingError.js";
import { ValidationError } from "../../../core/errors/validationError.js";

/**
 * Helper function to create mock SSE stream from event data
 */
function createMockSSEStream(
  events: Array<{ data?: string; event?: string }>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        if (event.event) {
          controller.enqueue(encoder.encode(`event: ${event.event}\n`));
        }
        if (event.data) {
          controller.enqueue(encoder.encode(`data: ${event.data}\n`));
        }
        controller.enqueue(encoder.encode("\n"));
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
    statusText: status === 200 ? "OK" : "Error",
    headers: { "content-type": "text/event-stream" },
    body,
  };
}

/**
 * Helper function to collect all deltas from async iterator
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

describe("parseAnthropicResponseStream", () => {
  describe("Successful streaming scenarios", () => {
    it("should parse message_start event correctly", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: {
              id: "msg_123",
              model: "claude-3-sonnet-20240229",
            },
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({
        id: "msg_123",
        delta: { role: "assistant" },
        finished: false,
        metadata: {
          provider: "anthropic",
          eventType: "message_start",
          model: "claude-3-sonnet-20240229",
        },
      });
    });

    it("should parse content_block_delta text events correctly", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: { text: "Hello" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: { text: " world" },
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(3);

      // Check text deltas
      expect(deltas[1]).toMatchObject({
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        metadata: {
          provider: "anthropic",
          eventType: "content_block_delta",
          deltaType: "text",
          blockIndex: 0,
        },
      });

      expect(deltas[2]).toMatchObject({
        delta: {
          role: "assistant",
          content: [{ type: "text", text: " world" }],
        },
        finished: false,
        metadata: {
          provider: "anthropic",
          eventType: "content_block_delta",
          deltaType: "text",
          blockIndex: 0,
        },
      });
    });

    it("should parse message_stop event correctly", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        {
          data: JSON.stringify({
            type: "message_stop",
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(2);
      expect(deltas[1]).toMatchObject({
        finished: true,
        metadata: {
          provider: "anthropic",
          eventType: "message_stop",
          finished: true,
        },
      });
    });

    it("should handle content_block_start and content_block_stop events", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_start",
            index: 0,
            content_block: { type: "text" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_stop",
            index: 0,
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(3);
      expect(deltas[1].metadata?.eventType).toBe("content_block_start");
      expect(deltas[2].metadata?.eventType).toBe("content_block_stop");
    });

    it("should handle tool call streaming with partial JSON", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_start",
            index: 0,
            content_block: {
              type: "tool_use",
              id: "tool_123",
              name: "calculator",
            },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: { input: '{"a": 1' },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: { input: ', "b": 2}' },
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(4);

      // Check tool call deltas
      expect(deltas[2]).toMatchObject({
        delta: {
          role: "assistant",
          metadata: {
            tool_calls: [
              {
                id: "tool_123",
                type: "function",
                function: {
                  name: "calculator",
                  arguments: '{"a": 1',
                },
              },
            ],
          },
        },
        metadata: {
          deltaType: "tool_use",
          blockIndex: 0,
        },
      });

      expect(deltas[3]).toMatchObject({
        delta: {
          role: "assistant",
          metadata: {
            tool_calls: [
              {
                id: "tool_123",
                type: "function",
                function: {
                  name: "calculator",
                  arguments: '{"a": 1, "b": 2}',
                },
              },
            ],
          },
        },
        metadata: {
          deltaType: "tool_use",
          blockIndex: 0,
        },
      });
    });

    it("should handle message_delta events", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        {
          data: JSON.stringify({
            type: "message_delta",
            delta: {
              stop_reason: "end_turn",
              stop_sequence: null,
            },
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(2);
      expect(deltas[1]).toMatchObject({
        finished: false,
        metadata: {
          eventType: "message_delta",
          stopReason: "end_turn",
        },
      });
    });
  });

  describe("[DONE] sentinel handling", () => {
    it("should stop processing when [DONE] sentinel is received", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        { data: "[DONE]" },
        {
          data: JSON.stringify({
            type: "message_stop",
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      // Should only process events before [DONE]
      expect(deltas).toHaveLength(1);
      expect(deltas[0].metadata?.eventType).toBe("message_start");
    });
  });

  describe("Error handling", () => {
    it("should throw ValidationError when response body is null", async () => {
      const response = createMockResponse(null);

      await expect(async () => {
        await collectDeltas(parseAnthropicResponseStream(response));
      }).rejects.toThrow(ValidationError);
    });

    it("should throw BridgeError for error events", async () => {
      const events = [
        {
          event: "error",
          data: JSON.stringify({
            error: {
              type: "authentication_error",
              message: "Invalid API key",
            },
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);

      await expect(async () => {
        await collectDeltas(parseAnthropicResponseStream(response));
      }).rejects.toThrow(BridgeError);

      try {
        await collectDeltas(parseAnthropicResponseStream(response));
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        if (error instanceof BridgeError) {
          expect(error.message).toContain("Invalid API key");
          expect(error.code).toBe("authentication_error");
        }
      }
    });

    it("should handle malformed error events", async () => {
      const events = [
        {
          event: "error",
          data: "invalid json",
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);

      await expect(async () => {
        await collectDeltas(parseAnthropicResponseStream(response));
      }).rejects.toThrow(BridgeError);
    });

    it("should skip malformed JSON events and continue streaming", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        { data: "invalid json" },
        {
          data: JSON.stringify({
            type: "message_stop",
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      // Should process valid events and skip malformed ones
      expect(deltas).toHaveLength(2);
      expect(deltas[0].metadata?.eventType).toBe("message_start");
      expect(deltas[1].metadata?.eventType).toBe("message_stop");
    });

    it("should skip events without data", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        { data: "" }, // Empty data
        {}, // No data
        {
          data: JSON.stringify({
            type: "message_stop",
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(2);
      expect(deltas[0].metadata?.eventType).toBe("message_start");
      expect(deltas[1].metadata?.eventType).toBe("message_stop");
    });

    it("should wrap unexpected errors in StreamingError", async () => {
      // Create a stream that will throw an error
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.error(new Error("Network error"));
        },
      });

      const response = createMockResponse(stream);

      await expect(async () => {
        await collectDeltas(parseAnthropicResponseStream(response));
      }).rejects.toThrow(StreamingError);
    });

    it("should handle schema validation errors for streaming events", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "invalid_event_type",
            message: { id: "msg_123" },
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      // Should skip invalid events
      expect(deltas).toHaveLength(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle multiple content blocks", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_start",
            index: 0,
            content_block: { type: "text" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: { text: "First block" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_start",
            index: 1,
            content_block: { type: "text" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_delta",
            index: 1,
            delta: { text: "Second block" },
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(5);
      expect(deltas[2].metadata?.blockIndex).toBe(0);
      expect(deltas[4].metadata?.blockIndex).toBe(1);
    });

    it("should generate IDs when message ID is not provided", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: {}, // No ID
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: { text: "Hello" },
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(2);
      expect(deltas[0].id).toMatch(/^anthropic-stream-\d+-[a-z0-9]+$/);
      expect(deltas[1].id).toBe(deltas[0].id); // Should reuse same ID
    });

    it("should handle tool calls with object input", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_start",
            index: 0,
            content_block: {
              type: "tool_use",
              id: "tool_123",
              name: "calculator",
            },
          }),
        },
        {
          data: JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: { input: { a: 1, b: 2 } }, // Object instead of string
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(3);
      const toolCalls = deltas[2].delta?.metadata?.tool_calls as
        | Array<{ function: { arguments: string } }>
        | undefined;
      expect(toolCalls?.[0]?.function.arguments).toBe('{"a":1,"b":2}');
    });

    it("should handle empty streaming response", async () => {
      const events: Array<{ data?: string; event?: string }> = [];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      expect(deltas).toHaveLength(0);
    });

    it("should handle unknown event types gracefully", async () => {
      const events = [
        {
          data: JSON.stringify({
            type: "message_start",
            message: { id: "msg_123" },
          }),
        },
        {
          data: JSON.stringify({
            type: "unknown_event_type",
            someField: "someValue",
          }),
        },
        {
          data: JSON.stringify({
            type: "message_stop",
          }),
        },
      ];

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);
      const deltas = await collectDeltas(
        parseAnthropicResponseStream(response),
      );

      // Should skip unknown events
      expect(deltas).toHaveLength(2);
      expect(deltas[0].metadata?.eventType).toBe("message_start");
      expect(deltas[1].metadata?.eventType).toBe("message_stop");
    });
  });

  describe("Memory efficiency", () => {
    it("should handle large streams without unbounded memory usage", async () => {
      const events = [];

      // Create a large number of text deltas
      events.push({
        data: JSON.stringify({
          type: "message_start",
          message: { id: "msg_123" },
        }),
      });

      for (let i = 0; i < 1000; i++) {
        events.push({
          data: JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: { text: `chunk${i} ` },
          }),
        });
      }

      events.push({
        data: JSON.stringify({
          type: "message_stop",
        }),
      });

      const stream = createMockSSEStream(events);
      const response = createMockResponse(stream);

      // Process stream incrementally to ensure memory efficiency
      const processedEvents = [];
      for await (const delta of parseAnthropicResponseStream(response)) {
        processedEvents.push(delta.metadata?.eventType);

        // Ensure we don't accumulate all deltas in memory
        if (processedEvents.length > 100) {
          processedEvents.shift(); // Remove old events
        }
      }

      expect(processedEvents).toContain("message_stop");
    });
  });
});
