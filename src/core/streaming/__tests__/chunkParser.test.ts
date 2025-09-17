/**
 * Chunk Parser Tests
 *
 * Tests for the ChunkParser utility class.
 */

import { ChunkParser } from "../chunkParser";
import { StreamingError } from "../../errors/streamingError";
import type { ParsedChunk } from "../parsedChunk";

describe("ChunkParser", () => {
  describe("parseJson", () => {
    describe("basic JSON parsing", () => {
      it("should parse single JSON object in one chunk", async () => {
        const jsonData = '{"type":"message","content":"hello"}';
        const chunks = [new Uint8Array(new TextEncoder().encode(jsonData))];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ type: "message", content: "hello" });
        expect(results[0].raw).toBe(jsonData);
      });

      it("should parse JSON object split across multiple chunks", async () => {
        const chunks = [
          new Uint8Array(new TextEncoder().encode('{"type":"start"')),
          new Uint8Array(new TextEncoder().encode(',"data":"hello"')),
          new Uint8Array(new TextEncoder().encode(',"end":true}')),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({
          type: "start",
          data: "hello",
          end: true,
        });
        expect(results[0].raw).toBe(
          '{"type":"start","data":"hello","end":true}',
        );
      });

      it("should parse multiple JSON objects in sequence", async () => {
        const chunks = [
          new Uint8Array(new TextEncoder().encode('{"id":1}{"id":2}')),
          new Uint8Array(new TextEncoder().encode('{"id":3}')),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(3);
        expect(results[0].data).toEqual({ id: 1 });
        expect(results[1].data).toEqual({ id: 2 });
        expect(results[2].data).toEqual({ id: 3 });
      });

      it("should handle empty JSON objects", async () => {
        const chunks = [new Uint8Array(new TextEncoder().encode("{}"))];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({});
      });

      it("should handle JSON with various data types", async () => {
        const jsonData =
          '{"string":"test","number":42,"boolean":true,"null":null,"array":[1,2],"nested":{"key":"value"}}';
        const chunks = [new Uint8Array(new TextEncoder().encode(jsonData))];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({
          string: "test",
          number: 42,
          boolean: true,
          null: null,
          array: [1, 2],
          nested: { key: "value" },
        });
      });
    });

    describe("buffer management", () => {
      it("should handle large JSON objects across many chunks", async () => {
        const largeArray = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: `item-${i}`,
        }));
        const jsonData = JSON.stringify({ items: largeArray });

        // Split into small chunks
        const encoder = new TextEncoder();
        const chunks: Uint8Array[] = [];
        const chunkSize = 100;
        for (let i = 0; i < jsonData.length; i += chunkSize) {
          const chunk = jsonData.slice(i, i + chunkSize);
          chunks.push(encoder.encode(chunk));
        }

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ items: largeArray });
      });

      it("should handle partial UTF-8 characters at boundaries", async () => {
        // Create JSON with UTF-8 characters that might split across chunks
        const jsonData = '{"emoji":"🚀","text":"café"}';
        const encoder = new TextEncoder();
        const fullBytes = encoder.encode(jsonData);

        // Split at a point that might break UTF-8 encoding
        const chunks = [fullBytes.slice(0, 15), fullBytes.slice(15)];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ emoji: "🚀", text: "café" });
      });

      it("should handle mixed chunk sizes", async () => {
        const chunks = [
          new Uint8Array(new TextEncoder().encode('{"a":')), // 6 bytes
          new Uint8Array(new TextEncoder().encode("1")), // 1 byte
          new Uint8Array(new TextEncoder().encode(',"b":2,"c":3}')), // 13 bytes
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ a: 1, b: 2, c: 3 });
      });
    });

    describe("error handling", () => {
      it("should handle malformed JSON gracefully", async () => {
        const chunks = [
          new Uint8Array(
            new TextEncoder().encode(
              '{"valid":true}{"invalid":malformed}{"valid2":true}',
            ),
          ),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        // Mock console.warn to capture warnings
        const warnSpy = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(2);
        expect(results[0].data).toEqual({ valid: true });
        expect(results[1].data).toEqual({ valid2: true });
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("JSON parse error:"),
          expect.anything(),
          expect.stringContaining("Raw:"),
          expect.stringContaining('{"invalid":malformed}'),
        );

        warnSpy.mockRestore();
      });

      it("should handle incomplete JSON at stream end", async () => {
        const chunks = [
          new Uint8Array(
            new TextEncoder().encode('{"complete":true}{"incomplete":'),
          ),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ complete: true });
      });

      it("should throw error when buffer exceeds maximum size", async () => {
        const largeString = "x".repeat(2000);
        const chunks = [
          new Uint8Array(new TextEncoder().encode(`{"data":"${largeString}"}`)),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const iterator = ChunkParser.parseJson(mockStream(), {
          maxObjectSize: 1000,
        });

        await expect(async () => {
          for await (const _ of iterator) {
            // Should throw before yielding any results
          }
        }).rejects.toThrow(StreamingError);
      });

      it("should handle empty chunks", async () => {
        const chunks = [
          new Uint8Array(new TextEncoder().encode('{"test":')),
          new Uint8Array(0), // Empty chunk
          new Uint8Array(new TextEncoder().encode("true}")),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ test: true });
      });
    });

    describe("string handling", () => {
      it("should handle JSON with escaped quotes", async () => {
        const jsonData = '{"message":"He said \\"hello\\" to me"}';
        const chunks = [new Uint8Array(new TextEncoder().encode(jsonData))];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ message: 'He said "hello" to me' });
      });

      it("should handle JSON with braces in strings", async () => {
        const jsonData = '{"template":"Hello {name}, welcome to {place}!"}';
        const chunks = [new Uint8Array(new TextEncoder().encode(jsonData))];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({
          template: "Hello {name}, welcome to {place}!",
        });
      });

      it("should handle split across string boundaries", async () => {
        const chunks = [
          new Uint8Array(new TextEncoder().encode('{"message":"Hello ')),
          new Uint8Array(new TextEncoder().encode('world","done":true}')),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ message: "Hello world", done: true });
      });
    });

    describe("configuration options", () => {
      it("should respect custom maxObjectSize", async () => {
        const chunks = [
          new Uint8Array(new TextEncoder().encode('{"data":"small"}')),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream(), {
          maxObjectSize: 500,
        })) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ data: "small" });
      });

      it("should use custom encoding", async () => {
        const jsonData = '{"test":"value"}';
        const chunks = [new Uint8Array(new TextEncoder().encode(jsonData))];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJson(mockStream(), {
          encoding: "utf-8",
        })) {
          results.push(parsed);
        }

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ test: "value" });
      });
    });
  });

  describe("parseJsonLines", () => {
    describe("basic JSON Lines parsing", () => {
      it("should parse single JSON object per line", async () => {
        const chunks = [
          new Uint8Array(
            new TextEncoder().encode('{"id":1}\n{"id":2}\n{"id":3}'),
          ),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJsonLines(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(3);
        expect(results[0].data).toEqual({ id: 1 });
        expect(results[1].data).toEqual({ id: 2 });
        expect(results[2].data).toEqual({ id: 3 });
      });

      it("should handle lines split across chunks", async () => {
        const chunks = [
          new Uint8Array(
            new TextEncoder().encode('{"type":"start"}\n{"data":'),
          ),
          new Uint8Array(new TextEncoder().encode('"hello"}\n{"type":"end"}')),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJsonLines(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(3);
        expect(results[0].data).toEqual({ type: "start" });
        expect(results[1].data).toEqual({ data: "hello" });
        expect(results[2].data).toEqual({ type: "end" });
      });

      it("should skip empty lines", async () => {
        const chunks = [
          new Uint8Array(
            new TextEncoder().encode('{"id":1}\n\n{"id":2}\n   \n{"id":3}'),
          ),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJsonLines(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(3);
        expect(results[0].data).toEqual({ id: 1 });
        expect(results[1].data).toEqual({ id: 2 });
        expect(results[2].data).toEqual({ id: 3 });
      });

      it("should handle final line without newline", async () => {
        const chunks = [
          new Uint8Array(new TextEncoder().encode('{"id":1}\n{"id":2}')),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJsonLines(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(2);
        expect(results[0].data).toEqual({ id: 1 });
        expect(results[1].data).toEqual({ id: 2 });
      });
    });

    describe("error handling", () => {
      it("should handle malformed JSON lines gracefully", async () => {
        const chunks = [
          new Uint8Array(
            new TextEncoder().encode(
              '{"valid":true}\nmalformed-json\n{"valid2":true}',
            ),
          ),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        // Mock console.warn to capture warnings
        const warnSpy = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});

        const results: ParsedChunk[] = [];
        for await (const parsed of ChunkParser.parseJsonLines(mockStream())) {
          results.push(parsed);
        }

        expect(results).toHaveLength(2);
        expect(results[0].data).toEqual({ valid: true });
        expect(results[1].data).toEqual({ valid2: true });
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("JSON Lines parse error:"),
          expect.anything(),
          expect.stringContaining("Line:"),
          expect.stringContaining("malformed-json"),
        );

        warnSpy.mockRestore();
      });

      it("should throw error when buffer exceeds maximum size", async () => {
        const largeString = "x".repeat(2000);
        const chunks = [
          new Uint8Array(new TextEncoder().encode(`{"data":"${largeString}"}`)),
        ];

        async function* mockStream() {
          for (const chunk of chunks) {
            yield chunk;
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        const iterator = ChunkParser.parseJsonLines(mockStream(), {
          maxObjectSize: 1000,
        });

        await expect(async () => {
          for await (const _ of iterator) {
            // Should throw before yielding any results
          }
        }).rejects.toThrow(StreamingError);
      });
    });
  });
});
