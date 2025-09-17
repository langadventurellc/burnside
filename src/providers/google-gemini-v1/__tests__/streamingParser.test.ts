/**
 * Tests for Google Gemini v1 streaming parser
 *
 * Comprehensive unit tests covering SSE parsing, delta accumulation,
 * error conditions, and edge cases for the streaming parser implementation.
 */

import { parseGeminiResponseStream } from "../streamingParser";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import type { StreamDelta } from "../../../client/streamDelta";
import { StreamingError } from "../../../core/errors/streamingError";
import { ValidationError } from "../../../core/errors/validationError";
import { BridgeError } from "../../../core/errors/bridgeError";

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

describe("parseGeminiResponseStream", () => {
  describe("successful parsing", () => {
    it("should parse basic text streaming response", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":" world"}],"role":"model"}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"!"}],"role":"model"},"finishReason":"STOP"}]}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(3);

      expect(deltas[0].delta.content).toEqual([
        { type: "text", text: "Hello" },
      ]);
      expect(deltas[0].finished).toBe(false);

      expect(deltas[1].delta.content).toEqual([
        { type: "text", text: " world" },
      ]);
      expect(deltas[1].finished).toBe(false);

      expect(deltas[2].delta.content).toEqual([{ type: "text", text: "!" }]);
      expect(deltas[2].finished).toBe(true);
      expect(deltas[2].metadata?.finishReason).toBe("STOP");
    });

    it("should handle empty text chunks", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":""}],"role":"model"}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"finishReason":"STOP"}]}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(2);
      expect(deltas[0].delta.content).toEqual([]);
      expect(deltas[1].delta.content).toEqual([
        { type: "text", text: "Hello" },
      ]);
      expect(deltas[1].finished).toBe(true);
    });

    it("should parse function call in streaming response", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"get_weather","args":{"location":"Paris"}}}],"role":"model"}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"Based on the weather data..."}],"role":"model"},"finishReason":"STOP"}]}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(2);

      // First delta should contain tool call
      expect(deltas[0].delta.metadata?.tool_calls).toEqual([
        {
          id: expect.stringMatching(/^call-\d+$/),
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location":"Paris"}',
          },
        },
      ]);

      // Second delta should have text content and be finished
      expect(deltas[1].delta.content).toEqual([
        { type: "text", text: "Based on the weather data..." },
      ]);
      expect(deltas[1].finished).toBe(true);
    });

    it("should accumulate usage metadata", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":" world"}],"role":"model"},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":10,"candidatesTokenCount":15,"totalTokenCount":25}}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(2);
      expect(deltas[0].usage).toBeUndefined();
      expect(deltas[1].usage).toEqual({
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
      });
      expect(deltas[1].finished).toBe(true);
    });

    it("should handle safety ratings metadata", async () => {
      const safetyRatings = [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          probability: "NEGLIGIBLE",
        },
      ];

      const events = [
        `data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"safetyRatings":${JSON.stringify(safetyRatings)},"finishReason":"STOP"}]}\n\n`,
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.metadata?.safetyRatings).toEqual(safetyRatings);
      expect(deltas[0].finished).toBe(true);
    });

    it("should handle [DONE] termination signal", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"}}]}\n\n',
        "data: [DONE]\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(2);
      expect(deltas[0].finished).toBe(false);
      expect(deltas[1].finished).toBe(true);
      expect(deltas[1].delta.content).toEqual([]);
    });

    it("should handle type=done termination signal", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"}}]}\n\n',
        "event: done\ndata: {}\n\n",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(2);
      expect(deltas[0].finished).toBe(false);
      expect(deltas[1].finished).toBe(true);
    });

    it("should skip empty and keep-alive events", async () => {
      const events = [
        "data: \n\n",
        "   \n\n",
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"finishReason":"STOP"}]}\n\n',
        "",
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.content).toEqual([
        { type: "text", text: "Hello" },
      ]);
      expect(deltas[0].finished).toBe(true);
    });

    it("should handle non-STOP finish reasons", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"finishReason":"SAFETY"}]}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].finished).toBe(true);
      expect(deltas[0].metadata?.finishReason).toBe("SAFETY");
    });
  });

  describe("error handling", () => {
    it("should throw StreamingError for missing response body", async () => {
      const response = createMockResponse(null);

      await expect(async () => {
        for await (const _ of parseGeminiResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow(StreamingError);

      await expect(async () => {
        for await (const _ of parseGeminiResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow("Response body is missing for streaming");
    });

    it("should throw ValidationError for invalid JSON", async () => {
      const events = ["data: {invalid json}\n\n"];

      const response = createMockResponse(createMockSSEStream(events));

      await expect(async () => {
        for await (const _ of parseGeminiResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow(StreamingError);
    });

    it("should throw ValidationError for invalid schema", async () => {
      const events = ['data: {"candidates":"not_an_array"}\n\n'];

      const response = createMockResponse(createMockSSEStream(events));

      await expect(async () => {
        for await (const _ of parseGeminiResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow(ValidationError);
    });

    it("should handle missing candidates gracefully", async () => {
      const events = ['data: {"candidates":[]}\n\n', "data: [DONE]\n\n"];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].finished).toBe(true);
    });

    it("should handle missing content in candidate", async () => {
      const events = ['data: {"candidates":[{"finishReason":"STOP"}]}\n\n'];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.content).toEqual([]);
      expect(deltas[0].finished).toBe(true);
    });

    it("should propagate BridgeError from underlying stream", async () => {
      const customError = new BridgeError(
        "Custom bridge error",
        "CUSTOM_ERROR",
      );

      const errorStream = new ReadableStream({
        start(controller) {
          controller.error(customError);
        },
      });

      const response = createMockResponse(errorStream);

      await expect(async () => {
        for await (const _ of parseGeminiResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow(BridgeError);
    });

    it("should wrap unknown errors in StreamingError", async () => {
      const customError = new Error("Unknown error");

      const errorStream = new ReadableStream({
        start(controller) {
          controller.error(customError);
        },
      });

      const response = createMockResponse(errorStream);

      await expect(async () => {
        for await (const _ of parseGeminiResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow(StreamingError);
    });
  });

  describe("edge cases", () => {
    it("should handle stream ending without explicit termination", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"}}]}\n\n',
        // No explicit [DONE] or finish reason
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(2);
      expect(deltas[0].finished).toBe(false);
      expect(deltas[1].finished).toBe(true); // Implicit termination
    });

    it("should maintain consistent response ID across chunks", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":" world"}],"role":"model"},"finishReason":"STOP"}]}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(2);
      expect(deltas[0].id).toBe(deltas[1].id);
      expect(deltas[0].id).toMatch(/^gemini-stream-\d+-[a-z0-9]+$/);
    });

    it("should handle function calls with empty arguments", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"ping","args":{}}}],"role":"model"},"finishReason":"STOP"}]}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.metadata?.tool_calls).toEqual([
        {
          id: expect.stringMatching(/^call-\d+$/),
          type: "function",
          function: {
            name: "ping",
            arguments: "{}",
          },
        },
      ]);
    });

    it("should handle partial usage metadata", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":10}}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].usage).toBeUndefined(); // Should not include incomplete usage data
    });

    it("should handle mixed content types in same chunk", async () => {
      const events = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Result: "},{"functionCall":{"name":"calculate","args":{"x":5}}}],"role":"model"},"finishReason":"STOP"}]}\n\n',
      ];

      const response = createMockResponse(createMockSSEStream(events));
      const deltas = await collectDeltas(parseGeminiResponseStream(response));

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.content).toEqual([
        { type: "text", text: "Result: " },
      ]);
      expect(deltas[0].delta.metadata?.tool_calls).toEqual([
        {
          id: expect.stringMatching(/^call-\d+$/),
          type: "function",
          function: {
            name: "calculate",
            arguments: '{"x":5}',
          },
        },
      ]);
    });
  });
});
