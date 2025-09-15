/**
 * Tests for SSE Parser functionality.
 */

import {
  describe,
  expect,
  test,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { SseParser } from "../sseParser.js";
import type { SseEvent } from "../sseEvent.js";
import { StreamingError } from "../../errors/streamingError.js";

// Helper function to create async iterable from chunks
async function* createStream(chunks: string[]): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();
  for (const chunk of chunks) {
    yield encoder.encode(chunk);
    // Add a minimal async operation to satisfy the linter
    await Promise.resolve();
  }
}

// Helper to collect all events from async iterable
async function collectEvents(
  stream: AsyncIterable<SseEvent>,
): Promise<SseEvent[]> {
  const events: SseEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

describe("SseParser", () => {
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("basic SSE parsing", () => {
    test("should parse single data event", async () => {
      const chunks = ['data: {"content": "hello"}\n\n'];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        data: '{"content": "hello"}',
      });
    });

    test("should parse multiple events", async () => {
      const chunks = [
        'data: {"chunk": 1}\n\n',
        'data: {"chunk": 2}\n\n',
        "data: [DONE]\n\n",
      ];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ data: '{"chunk": 1}' });
      expect(events[1]).toEqual({ data: '{"chunk": 2}' });
      expect(events[2]).toEqual({ data: "[DONE]" });
    });

    test("should parse event with all fields", async () => {
      const chunks = [
        "id: 123\n",
        "event: message\n",
        "retry: 1000\n",
        'data: {"content": "test"}\n\n',
      ];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        id: "123",
        event: "message",
        retry: 1000,
        data: '{"content": "test"}',
      });
    });

    test("should handle multi-line data blocks", async () => {
      const chunks = ["data: line 1\n", "data: line 2\n", "data: line 3\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        data: "line 1\nline 2\nline 3",
      });
    });

    test("should handle empty events", async () => {
      const chunks = ["\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(0);
    });
  });

  describe("field parsing", () => {
    test("should parse data field correctly", async () => {
      const chunks = ["data: test content\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events[0].data).toBe("test content");
    });

    test("should parse event field correctly", async () => {
      const chunks = ["event: custom\ndata: test\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events[0].event).toBe("custom");
      expect(events[0].data).toBe("test");
    });

    test("should parse id field correctly", async () => {
      const chunks = ["id: unique-123\ndata: test\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events[0].id).toBe("unique-123");
    });

    test("should parse valid retry field", async () => {
      const chunks = ["retry: 5000\ndata: test\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events[0].retry).toBe(5000);
    });

    test("should ignore invalid retry field", async () => {
      const chunks = ["retry: invalid\ndata: test\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events[0].retry).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Invalid retry value: invalid, ignoring",
      );
    });

    test("should ignore negative retry field", async () => {
      const chunks = ["retry: -100\ndata: test\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events[0].retry).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Invalid retry value: -100, ignoring",
      );
    });

    test("should handle field without colon", async () => {
      const chunks = ["data\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events[0].data).toBe("\n");
    });

    test("should handle field with leading space in value", async () => {
      const chunks = ["data:  spaced content\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events[0].data).toBe(" spaced content");
    });
  });

  describe("comment handling", () => {
    test("should ignore comment lines", async () => {
      const chunks = [
        ": This is a comment\n",
        'data: {"content": "test"}\n',
        ": Another comment\n\n",
      ];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        data: '{"content": "test"}',
      });
    });
  });

  describe("unknown fields", () => {
    test("should ignore unknown fields", async () => {
      const chunks = [
        "unknown: field\n",
        "data: test\n",
        "another: unknown\n\n",
      ];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ data: "test" });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Unknown SSE field: unknown, ignoring",
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Unknown SSE field: another, ignoring",
      );
    });
  });

  describe("streaming scenarios", () => {
    test("should handle chunks split across event boundaries", async () => {
      const chunks = ['data: {"chu', 'nk": 1}\n\ndata: {"chunk": 2}\n\n'];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(2);
      expect(events[0].data).toBe('{"chunk": 1}');
      expect(events[1].data).toBe('{"chunk": 2}');
    });

    test("should handle partial lines across chunks", async () => {
      const chunks = ["da", "ta: partial", " line\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("partial line");
    });

    test("should handle empty chunks", async () => {
      const chunks = ["", "data: test\n\n", ""];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("test");
    });

    test("should handle mixed chunk sizes", async () => {
      const chunks = [
        "d",
        "ata: ",
        "test content that spans multiple small chunks",
        "\n\n",
      ];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe(
        "test content that spans multiple small chunks",
      );
    });
  });

  describe("termination handling", () => {
    test("should parse [DONE] termination signal", async () => {
      const chunks = ['data: {"content": "hello"}\n\n', "data: [DONE]\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(2);
      expect(events[0].data).toBe('{"content": "hello"}');
      expect(events[1].data).toBe("[DONE]");
    });

    test("should handle final event without trailing newlines", async () => {
      const chunks = ["data: final event"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("final event");
    });
  });

  describe("error handling", () => {
    test("should handle large events within limit", async () => {
      const largeData = "x".repeat(1000); // Well within 1MB limit
      const chunks = [`data: ${largeData}\n\n`];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe(largeData);
    });

    test("should skip events exceeding size limit", async () => {
      const largeData = "x".repeat(2 * 1024 * 1024); // 2MB, exceeds 1MB limit
      const chunks = [`data: ${largeData}\n\n`, "data: normal\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("normal");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/SSE event exceeds size limit/),
      );
    });

    test("should handle malformed field gracefully", async () => {
      // Mock console.warn to simulate field processing error
      const processLineSpy = jest.spyOn(SseParser as any, "processLine");
      processLineSpy.mockImplementationOnce(() => {
        throw new Error("Field processing error");
      });

      const chunks = ["data: test\n\n"];
      const stream = createStream(chunks);

      await expect(async () => {
        await collectEvents(SseParser.parse(stream));
      }).rejects.toThrow(StreamingError);

      processLineSpy.mockRestore();
    });
  });

  describe("async iteration", () => {
    test("should work with for-await-of", async () => {
      const chunks = ['data: {"chunk": 1}\n\n', 'data: {"chunk": 2}\n\n'];
      const stream = createStream(chunks);

      const results: SseEvent[] = [];
      for await (const event of SseParser.parse(stream)) {
        results.push(event);
      }

      expect(results).toHaveLength(2);
      expect(results[0].data).toBe('{"chunk": 1}');
      expect(results[1].data).toBe('{"chunk": 2}');
    });

    test("should handle early break in iteration", async () => {
      const chunks = [
        'data: {"chunk": 1}\n\n',
        'data: {"chunk": 2}\n\n',
        'data: {"chunk": 3}\n\n',
      ];
      const stream = createStream(chunks);

      const results: SseEvent[] = [];
      for await (const event of SseParser.parse(stream)) {
        results.push(event);
        if (results.length === 2) break;
      }

      expect(results).toHaveLength(2);
    });
  });

  describe("real-world scenarios", () => {
    test("should handle OpenAI-style streaming", async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        "data: [DONE]\n\n",
      ];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(3);
      expect(events[2].data).toBe("[DONE]");
    });

    test("should handle Anthropic-style streaming", async () => {
      const chunks = [
        "event: content_block_delta\n",
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n',
        "event: content_block_stop\n",
        'data: {"type":"content_block_stop","index":0}\n\n',
      ];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(2);
      expect(events[0].event).toBe("content_block_delta");
      expect(events[1].event).toBe("content_block_stop");
    });

    test("should handle rapid multiple events", async () => {
      const chunks = ["data: event1\n\ndata: event2\n\ndata: event3\n\n"];
      const stream = createStream(chunks);
      const events = await collectEvents(SseParser.parse(stream));

      expect(events).toHaveLength(3);
      expect(events.map((e) => e.data)).toEqual(["event1", "event2", "event3"]);
    });
  });
});
