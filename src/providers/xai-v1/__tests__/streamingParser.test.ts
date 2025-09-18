/**
 * Tests for xAI v1 Streaming Parser
 *
 * Comprehensive test suite covering streaming response parsing, error handling,
 * tool call accumulation, and edge cases for the xAI streaming parser.
 */

import { parseXAIV1ResponseStream } from "../streamingParser";
import type { StreamDelta } from "../../../client/streamDelta";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import { BridgeError } from "../../../core/errors/bridgeError";
import { ValidationError } from "../../../core/errors/validationError";
import {
  INITIAL_TEXT_CHUNK,
  CONTINUATION_TEXT_CHUNK,
  EMPTY_CONTENT_CHUNK,
  ERROR_RESPONSE_CHUNK,
  TEXT_CONVERSATION_FLOW,
  TOOL_CALL_CONVERSATION_FLOW,
  MIXED_CONVERSATION_FLOW,
  MALFORMED_STREAM,
  LARGE_CONTENT_CHUNK,
  MINIMAL_CHUNK,
  MAXIMAL_CHUNK,
} from "./fixtures/streamingEvents";

describe("parseXAIV1ResponseStream", () => {
  /**
   * Helper function to create mock SSE stream from text
   */
  function createMockSSEStream(sseData: string): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const chunks = [encoder.encode(sseData)];

    return new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(chunk));
        controller.close();
      },
    });
  }

  /**
   * Helper function to create mock HTTP response
   */
  function createMockResponse(
    body: ReadableStream<Uint8Array>,
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
   * Helper function to collect all stream deltas
   */
  async function collectDeltas(
    response: ProviderHttpResponse,
  ): Promise<StreamDelta[]> {
    const deltas: StreamDelta[] = [];
    for await (const delta of parseXAIV1ResponseStream(response)) {
      deltas.push(delta);
    }
    return deltas;
  }

  describe("success cases", () => {
    it("should parse basic text content streaming", async () => {
      const stream = createMockSSEStream(TEXT_CONVERSATION_FLOW);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(3);

      // First chunk
      expect(deltas[0]).toEqual({
        id: "response-abc123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello! I'm " }],
        },
        finished: false,
        metadata: {
          provider: "xai",
          eventType: "response.output_text.delta",
        },
      });

      // Second chunk
      expect(deltas[1]).toEqual({
        id: "response-abc123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "happy to help you today!" }],
        },
        finished: false,
        metadata: {
          provider: "xai",
          eventType: "response.output_text.delta",
        },
      });

      // Final chunk with usage
      expect(deltas[2]).toEqual({
        id: "response-abc123",
        delta: {
          role: "assistant",
          content: [],
        },
        finished: true,
        usage: {
          promptTokens: 25,
          completionTokens: 15,
          totalTokens: 40,
        },
        metadata: {
          provider: "xai",
          eventType: "response.completed",
          model: "grok-3",
        },
      });
    });

    it("should parse tool call streaming with accumulation", async () => {
      const stream = createMockSSEStream(TOOL_CALL_CONVERSATION_FLOW);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(3);

      // First chunk - text content
      expect(deltas[0].delta.content).toEqual([
        {
          type: "text",
          text: "I'll help you calculate that.",
        },
      ]);

      // Second chunk - more text content
      expect(deltas[1].delta.content).toEqual([
        {
          type: "text",
          text: " The result is 8.",
        },
      ]);

      // Final chunk with usage
      expect(deltas[2].finished).toBe(true);
      expect(deltas[2].usage).toEqual({
        promptTokens: 25,
        completionTokens: 15,
        totalTokens: 40,
      });
    });

    it("should handle mixed content and tool call scenarios", async () => {
      const stream = createMockSSEStream(MIXED_CONVERSATION_FLOW);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(3);

      // Should have content streaming
      const hasContent = deltas.some((d) => d.delta.content?.length);
      const hasFinishedDelta = deltas.some((d) => d.finished);

      expect(hasContent).toBe(true);
      expect(hasFinishedDelta).toBe(true);
    });

    it("should handle empty content chunks gracefully", async () => {
      const sseData = [
        `data: ${EMPTY_CONTENT_CHUNK}`,
        "",
        "data: [DONE]",
        "",
      ].join("\n");

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.content).toEqual([]);
    });

    it("should handle large content chunks efficiently", async () => {
      const sseData = [
        `data: ${LARGE_CONTENT_CHUNK}`,
        "",
        "data: [DONE]",
        "",
      ].join("\n");

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(1);
      const textContent = deltas[0].delta.content?.[0] as {
        type: "text";
        text: string;
      };
      expect(textContent?.text).toHaveLength(10000);
    });

    it("should handle multiple tool calls in single chunk", async () => {
      const multipleCallsChunk = JSON.stringify({
        sequence_number: 9,
        type: "response.output_text.delta",
        content_index: 0,
        delta: "I'll help you with weather and news.",
        item_id: "msg_response-multi456",
        output_index: 1,
      });

      const sseData = [
        `data: ${multipleCallsChunk}`,
        "",
        "data: [DONE]",
        "",
      ].join("\n");

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.content).toEqual([
        { type: "text", text: "I'll help you with weather and news." },
      ]);
    });

    it("should handle minimal chunks with missing optional fields", async () => {
      const sseData = [`data: ${MINIMAL_CHUNK}`, "", "data: [DONE]", ""].join(
        "\n",
      );

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.content).toEqual([]);
      expect(deltas[0].metadata?.tool_calls).toBeUndefined();
    });

    it("should handle maximal chunks with all optional fields", async () => {
      const sseData = [`data: ${MAXIMAL_CHUNK}`, "", "data: [DONE]", ""].join(
        "\n",
      );

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.content).toEqual([
        { type: "text", text: "Complete response" },
      ]);
      expect(deltas[0].metadata?.eventType).toBe("response.output_text.delta");
      expect(deltas[0].usage).toBeUndefined();
    });
  });

  describe("error cases", () => {
    it("should throw ValidationError for null response body", async () => {
      const response: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: null,
      };

      await expect(async () => {
        for await (const _ of parseXAIV1ResponseStream(response)) {
          // Should not reach here
        }
      }).rejects.toThrow(ValidationError);
    });

    it("should handle non-200 status responses", async () => {
      const stream = createMockSSEStream("error data");
      const response = createMockResponse(stream, 400);

      // Should not throw but should log the error
      const deltas = await collectDeltas(response);
      expect(deltas).toHaveLength(0);
    });

    it("should throw BridgeError for error responses", async () => {
      // Create a proper error stream with just the error event
      const errorStream = [
        `data: ${ERROR_RESPONSE_CHUNK}`,
        "",
        "data: [DONE]",
        "",
      ].join("\n");
      const stream = createMockSSEStream(errorStream);
      const response = createMockResponse(stream);

      let caughtError: unknown;
      try {
        for await (const _ of parseXAIV1ResponseStream(response)) {
          // Should not reach here after error event
        }
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(BridgeError);
      expect((caughtError as BridgeError).message).toContain(
        "Rate limit exceeded",
      );
    });

    it("should skip malformed JSON chunks gracefully", async () => {
      const stream = createMockSSEStream(MALFORMED_STREAM);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      // Should get 2 deltas (initial and continuation), skipping malformed chunk
      expect(deltas).toHaveLength(2);
      const textContent0 = deltas[0].delta.content?.[0] as {
        type: "text";
        text: string;
      };
      const textContent1 = deltas[1].delta.content?.[0] as {
        type: "text";
        text: string;
      };
      expect(textContent0?.text).toBe("Hello! I'm ");
      expect(textContent1?.text).toBe("happy to help you today!");
    });

    it("should handle schema validation failures", async () => {
      const invalidChunk = JSON.stringify({
        id: "test",
        object: "invalid_type", // Should be "response.chunk"
        model: "grok-3",
        output: [],
      });

      const sseData = [`data: ${invalidChunk}`, "", "data: [DONE]", ""].join(
        "\n",
      );
      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      // Should skip invalid chunks gracefully
      const deltas = await collectDeltas(response);
      expect(deltas).toHaveLength(0);
    });

    it("should handle stream interruption", async () => {
      const incompleteData = `data: ${INITIAL_TEXT_CHUNK}\n\n`; // No [DONE]
      const stream = createMockSSEStream(incompleteData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(1);
      expect(deltas[0].finished).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid successive chunks", async () => {
      const rapidChunks = Array.from({ length: 100 }, (_, i) =>
        JSON.stringify({
          sequence_number: i + 1,
          type: "response.output_text.delta",
          content_index: 0,
          delta: `chunk${i} `,
          item_id: "msg_response-rapid",
          output_index: 1,
        }),
      );

      const sseData =
        rapidChunks.map((chunk) => `data: ${chunk}\n\n`).join("") +
        "data: [DONE]\n\n";

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(100);
      const firstTextContent = deltas[0].delta.content?.[0] as {
        type: "text";
        text: string;
      };
      const lastTextContent = deltas[99].delta.content?.[0] as {
        type: "text";
        text: string;
      };
      expect(firstTextContent?.text).toBe("chunk0 ");
      expect(lastTextContent?.text).toBe("chunk99 ");
    });

    it("should handle empty lines and comments in SSE stream", async () => {
      const sseData = [
        ": This is a comment",
        "",
        `data: ${INITIAL_TEXT_CHUNK}`,
        "",
        ": Another comment",
        "",
        `data: ${CONTINUATION_TEXT_CHUNK}`,
        "",
        "data: [DONE]",
        "",
      ].join("\n");

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(2);
    });

    it("should handle complex tool call arguments", async () => {
      const complexChunk = JSON.stringify({
        sequence_number: 10,
        type: "response.output_text.delta",
        content_index: 0,
        delta: "I'll process the data for you.",
        item_id: "msg_response-complex789",
        output_index: 1,
      });

      const sseData = [`data: ${complexChunk}`, "", "data: [DONE]", ""].join(
        "\n",
      );

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      expect(deltas).toHaveLength(1);
      expect(deltas[0].delta.content).toEqual([
        { type: "text", text: "I'll process the data for you." },
      ]);
    });

    it("should preserve response ID across chunks", async () => {
      const stream = createMockSSEStream(TEXT_CONVERSATION_FLOW);
      const response = createMockResponse(stream);

      const deltas = await collectDeltas(response);

      const responseId = deltas[0].id;
      expect(deltas.every((d) => d.id === responseId)).toBe(true);
    });
  });

  describe("performance", () => {
    it("should handle large streams efficiently", async () => {
      const largeStream = Array.from({ length: 1000 }, (_, i) =>
        JSON.stringify({
          sequence_number: i + 1,
          type: "response.output_text.delta",
          content_index: 0,
          delta: `token${i} `,
          item_id: "msg_response-large",
          output_index: 1,
        }),
      );

      const sseData =
        largeStream.map((chunk) => `data: ${chunk}\n\n`).join("") +
        "data: [DONE]\n\n";

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      const startTime = Date.now();
      const deltas = await collectDeltas(response);
      const endTime = Date.now();

      expect(deltas).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it("should have minimal memory footprint during streaming", async () => {
      const measureMemory = () => {
        if (global.gc) {
          global.gc();
        }
        return process.memoryUsage().heapUsed;
      };

      const initialMemory = measureMemory();

      const largeChunks = Array.from(
        { length: 500 },
        () => LARGE_CONTENT_CHUNK,
      );
      const sseData =
        largeChunks.map((chunk) => `data: ${chunk}\n\n`).join("") +
        "data: [DONE]\n\n";

      const stream = createMockSSEStream(sseData);
      const response = createMockResponse(stream);

      await collectDeltas(response);

      const finalMemory = measureMemory();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe("debug mode", () => {
    const originalDebug = process.env.DEBUG_STREAMING;

    afterEach(() => {
      if (originalDebug) {
        process.env.DEBUG_STREAMING = originalDebug;
      } else {
        delete process.env.DEBUG_STREAMING;
      }
    });

    it("should log warnings in debug mode for malformed events", async () => {
      process.env.DEBUG_STREAMING = "1";
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const stream = createMockSSEStream(MALFORMED_STREAM);
      const response = createMockResponse(stream);

      await collectDeltas(response);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to parse xAI SSE event"),
        expect.any(String),
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
