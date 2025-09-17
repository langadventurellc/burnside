/**
 * Chunked Response Parser
 *
 * Parses streaming JSON responses that may be split across multiple chunks.
 * Essential for providers that don't use SSE format but send streaming JSON
 * data using chunked transfer encoding.
 *
 * @example Parsing streaming JSON
 * ```typescript
 * const chunks = [
 *   new Uint8Array(new TextEncoder().encode('{"type":"start"')),
 *   new Uint8Array(new TextEncoder().encode(',"data":"hello"}')),
 * ];
 *
 * async function* mockStream() {
 *   for (const chunk of chunks) yield chunk;
 * }
 *
 * for await (const parsed of ChunkParser.parseJson(mockStream())) {
 *   console.log(parsed.data); // { type: "start", data: "hello" }
 * }
 * ```
 */

import { StreamingError } from "../errors/streamingError";
import type { ParsedChunk } from "./parsedChunk";
import type { ChunkParserOptions } from "./chunkParserOptions";

/**
 * Default configuration for ChunkParser.
 */
const DEFAULT_OPTIONS: Required<ChunkParserOptions> = {
  maxObjectSize: 1024 * 1024, // 1MB
  encoding: "utf-8",
};

/**
 * ChunkParser processes streaming Uint8Array chunks and extracts complete JSON objects,
 * handling incomplete chunks through buffer accumulation.
 */
export class ChunkParser {
  /**
   * Parses streaming chunks for single JSON objects or multiple objects.
   * Handles JSON boundaries and accumulates incomplete objects across chunks.
   */
  static async *parseJson(
    chunks: AsyncIterable<Uint8Array>,
    options: ChunkParserOptions = {},
  ): AsyncIterable<ParsedChunk> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const decoder = new TextDecoder(config.encoding);

    const state = {
      buffer: "",
      braceDepth: 0,
      inString: false,
      escapeNext: false,
      objectStart: -1,
    };

    for await (const chunk of chunks) {
      yield* this.processChunk(chunk, decoder, config, state);
    }

    // Handle any remaining buffer content
    if (state.buffer.trim() && state.objectStart >= 0) {
      const remainingJson = state.buffer.slice(state.objectStart);
      const parsed = this.tryParseJson(remainingJson);
      if (parsed) {
        yield parsed;
      }
    }
  }

  /**
   * Processes a single chunk and yields any complete JSON objects found.
   */
  private static *processChunk(
    chunk: Uint8Array,
    decoder: TextDecoder,
    config: Required<ChunkParserOptions>,
    state: {
      buffer: string;
      braceDepth: number;
      inString: boolean;
      escapeNext: boolean;
      objectStart: number;
    },
  ): Generator<ParsedChunk> {
    if (chunk.length === 0) {
      return;
    }

    // Decode chunk with stream mode to handle partial UTF-8 sequences
    const chunkText = decoder.decode(chunk, { stream: true });
    state.buffer += chunkText;

    // Check buffer size limit
    this.validateBufferSize(state.buffer, config.maxObjectSize);

    // Process buffer to find JSON boundaries
    const result = this.processJsonBuffer(
      state.buffer,
      state.braceDepth,
      state.inString,
      state.escapeNext,
      state.objectStart,
    );

    // Update state
    state.buffer = result.buffer;
    state.braceDepth = result.braceDepth;
    state.inString = result.inString;
    state.escapeNext = result.escapeNext;
    state.objectStart = result.objectStart;

    // Yield any found objects
    yield* result.parsedObjects;
  }

  /**
   * Validates buffer size against maximum allowed size.
   */
  private static validateBufferSize(buffer: string, maxSize: number): void {
    if (buffer.length > maxSize) {
      throw new StreamingError(
        `Buffer exceeded maximum size of ${maxSize} bytes`,
        { bufferSize: buffer.length, maxSize },
      );
    }
  }

  /**
   * Processes buffer to find complete JSON objects.
   */
  private static processJsonBuffer(
    buffer: string,
    braceDepth: number,
    inString: boolean,
    escapeNext: boolean,
    objectStart: number,
  ): {
    buffer: string;
    braceDepth: number;
    inString: boolean;
    escapeNext: boolean;
    objectStart: number;
    parsedObjects: ParsedChunk[];
  } {
    const parsedObjects: ParsedChunk[] = [];
    let i = 0;

    while (i < buffer.length) {
      const char = buffer[i];

      if (escapeNext) {
        escapeNext = false;
      } else if (char === "\\" && inString) {
        escapeNext = true;
      } else if (char === '"' && !escapeNext) {
        inString = !inString;
      } else if (!inString) {
        const bracketResult = this.processBrackets(
          char,
          braceDepth,
          objectStart,
          i,
          buffer,
        );
        braceDepth = bracketResult.braceDepth;
        objectStart = bracketResult.objectStart;

        if (bracketResult.completedJson) {
          const parsed = this.tryParseJson(bracketResult.completedJson);
          if (parsed) {
            parsedObjects.push(parsed);
          }
          buffer = buffer.slice(i + 1);
          i = -1; // Reset index since buffer changed
          objectStart = -1;
        }
      }

      i++;
    }

    return {
      buffer,
      braceDepth,
      inString,
      escapeNext,
      objectStart,
      parsedObjects,
    };
  }

  /**
   * Processes bracket characters to track JSON object boundaries.
   */
  private static processBrackets(
    char: string,
    braceDepth: number,
    objectStart: number,
    currentIndex: number,
    buffer: string,
  ): {
    braceDepth: number;
    objectStart: number;
    completedJson?: string;
  } {
    if (char === "{") {
      if (braceDepth === 0) {
        objectStart = currentIndex;
      }
      braceDepth++;
    } else if (char === "}") {
      braceDepth--;

      if (braceDepth === 0 && objectStart >= 0) {
        // Complete JSON object found
        const jsonStr = buffer.slice(objectStart, currentIndex + 1);
        return { braceDepth, objectStart, completedJson: jsonStr };
      } else if (braceDepth < 0) {
        // Invalid JSON structure - reset
        braceDepth = 0;
        objectStart = -1;
      }
    }

    return { braceDepth, objectStart };
  }

  /**
   * Attempts to parse JSON string, returning null on failure.
   */
  private static tryParseJson(jsonStr: string): ParsedChunk | null {
    try {
      const parsed: unknown = JSON.parse(jsonStr);
      return {
        data: parsed,
        raw: jsonStr,
      };
    } catch (error) {
      // Log but continue parsing - this allows recovery from malformed JSON
      console.warn("JSON parse error:", error, "Raw:", jsonStr.slice(0, 100));
      return null;
    }
  }

  /**
   * Parses streaming chunks for JSON Lines format (one JSON object per line).
   * Each line should contain a complete JSON object.
   */
  static async *parseJsonLines(
    chunks: AsyncIterable<Uint8Array>,
    options: ChunkParserOptions = {},
  ): AsyncIterable<ParsedChunk> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const decoder = new TextDecoder(config.encoding);
    let buffer = "";

    for await (const chunk of chunks) {
      if (chunk.length === 0) {
        continue;
      }

      // Decode chunk with stream mode to handle partial UTF-8 sequences
      const chunkText = decoder.decode(chunk, { stream: true });
      buffer += chunkText;

      // Check buffer size limit
      if (buffer.length > config.maxObjectSize) {
        throw new StreamingError(
          `Buffer exceeded maximum size of ${config.maxObjectSize} bytes`,
          { bufferSize: buffer.length, maxSize: config.maxObjectSize },
        );
      }

      // Process complete lines
      const lines = buffer.split("\n");

      // Keep the last line in buffer (might be incomplete)
      buffer = lines.pop() || "";

      // Process complete lines
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          continue; // Skip empty lines
        }

        try {
          const parsed: unknown = JSON.parse(trimmedLine);
          yield {
            data: parsed,
            raw: trimmedLine,
          };
        } catch (error) {
          // Log but continue parsing - this allows recovery from malformed JSON
          console.warn(
            "JSON Lines parse error:",
            error,
            "Line:",
            trimmedLine.slice(0, 100),
          );
        }
      }
    }

    // Handle any remaining buffer content
    if (buffer.trim()) {
      try {
        const parsed: unknown = JSON.parse(buffer.trim());
        yield {
          data: parsed,
          raw: buffer.trim(),
        };
      } catch {
        // Incomplete JSON at end of stream - expected behavior
      }
    }
  }
}
