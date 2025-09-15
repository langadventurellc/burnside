/**
 * Server-Sent Events (SSE) Parser
 *
 * Parses Server-Sent Events streams according to the W3C specification.
 * Handles streaming text/event-stream data from LLM providers with proper
 * buffering, multi-line data blocks, and error recovery.
 *
 * @example Basic SSE parsing
 * ```typescript
 * const chunks = [
 *   new Uint8Array(new TextEncoder().encode('data: {"content": "Hello"}\n\n')),
 *   new Uint8Array(new TextEncoder().encode('data: [DONE]\n\n'))
 * ];
 *
 * async function* mockStream() {
 *   for (const chunk of chunks) yield chunk;
 * }
 *
 * for await (const event of SseParser.parse(mockStream())) {
 *   if (event.data === '[DONE]') break;
 *   console.log(JSON.parse(event.data!));
 * }
 * ```
 */

import { StreamingError } from "../errors/streamingError.js";
import type { SseEvent } from "./sseEvent.js";

/**
 * Default configuration for SSE parsing.
 */
const DEFAULT_CONFIG = {
  maxEventSize: 1024 * 1024, // 1MB max event size
  encoding: "utf-8" as const,
};

/**
 * SSE Parser processes streaming Server-Sent Events data.
 * Handles field parsing, multi-line data, and graceful error recovery.
 */
export class SseParser {
  /**
   * Parses Server-Sent Events from streaming Uint8Array chunks.
   *
   * @param chunks - Async iterable of Uint8Array chunks containing SSE data
   * @returns Async iterable of parsed SSE events
   *
   * @example
   * ```typescript
   * for await (const event of SseParser.parse(stream)) {
   *   if (event.data) {
   *     console.log('Received:', event.data);
   *   }
   * }
   * ```
   */
  static async *parse(
    chunks: AsyncIterable<Uint8Array>,
  ): AsyncIterable<SseEvent> {
    const decoder = new TextDecoder(DEFAULT_CONFIG.encoding);
    let buffer = "";
    let currentEvent: Partial<SseEvent> = {};

    try {
      for await (const chunk of chunks) {
        buffer = SseParser.processChunk(chunk, decoder, buffer);
        const result = SseParser.processLines(buffer, currentEvent);
        buffer = result.remainingBuffer;
        currentEvent = result.currentEvent;

        for (const event of result.events) {
          yield event;
        }
      }

      // Handle final data and remaining buffer
      const finalEvents = SseParser.finalizeParsing(
        decoder,
        buffer,
        currentEvent,
      );
      for (const event of finalEvents) {
        yield event;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new StreamingError(`SSE parsing failed: ${errorMessage}`, {
        buffer: buffer.substring(0, 100),
        currentEvent,
      });
    }
  }

  /**
   * Processes a single chunk and updates the buffer.
   */
  private static processChunk(
    chunk: Uint8Array,
    decoder: TextDecoder,
    buffer: string,
  ): string {
    return buffer + decoder.decode(chunk, { stream: true });
  }

  /**
   * Processes complete lines from buffer and returns events.
   */
  private static processLines(
    buffer: string,
    currentEvent: Partial<SseEvent>,
  ): {
    remainingBuffer: string;
    currentEvent: Partial<SseEvent>;
    events: SseEvent[];
  } {
    const lines = buffer.split("\n");
    const remainingBuffer = lines.pop() || "";
    const events: SseEvent[] = [];
    let workingEvent = { ...currentEvent };

    for (const line of lines) {
      const result = SseParser.processLine(line, workingEvent);

      if (result.shouldYield) {
        if (SseParser.isValidEvent(workingEvent)) {
          events.push({ ...workingEvent });
        }
        workingEvent = {};
      }
    }

    return {
      remainingBuffer,
      currentEvent: workingEvent,
      events,
    };
  }

  /**
   * Finalizes parsing and returns any remaining events.
   */
  private static finalizeParsing(
    decoder: TextDecoder,
    buffer: string,
    currentEvent: Partial<SseEvent>,
  ): SseEvent[] {
    const events: SseEvent[] = [];
    const remaining = decoder.decode();
    const finalBuffer = buffer + remaining;

    if (finalBuffer) {
      const lines = finalBuffer.split("\n");
      let workingEvent = { ...currentEvent };

      for (const line of lines) {
        const result = SseParser.processLine(line, workingEvent);
        if (result.shouldYield && SseParser.isValidEvent(workingEvent)) {
          events.push({ ...workingEvent });
          workingEvent = {};
        }
      }

      // Add final event if it has content
      if (SseParser.isValidEvent(workingEvent)) {
        events.push({ ...workingEvent });
      }
    }

    return events;
  }

  /**
   * Validates if an event is worth yielding.
   */
  private static isValidEvent(event: Partial<SseEvent>): boolean {
    const eventSize = JSON.stringify(event).length;
    if (eventSize > DEFAULT_CONFIG.maxEventSize) {
      console.warn(
        `SSE event exceeds size limit (${eventSize} bytes), skipping`,
      );
      return false;
    }
    return Object.keys(event).length > 0;
  }

  /**
   * Processes a single SSE line and updates the current event.
   *
   * @param line - Line to process
   * @param currentEvent - Current event being built
   * @returns Object indicating whether to yield the current event
   */
  private static processLine(
    line: string,
    currentEvent: Partial<SseEvent>,
  ): { shouldYield: boolean } {
    const trimmedLine = line.trim();

    // Empty line signals end of event
    if (trimmedLine === "") {
      return { shouldYield: true };
    }

    // Comment lines (start with :) are ignored
    if (trimmedLine.startsWith(":")) {
      return { shouldYield: false };
    }

    // Parse field line
    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex === -1) {
      // Line without colon is treated as field name with empty value
      const fieldName = trimmedLine;
      if (fieldName === "data") {
        currentEvent.data = (currentEvent.data || "") + "\n";
      }
      return { shouldYield: false };
    }

    const fieldName = trimmedLine.substring(0, colonIndex);
    let fieldValue = trimmedLine.substring(colonIndex + 1);

    // Remove leading space from field value if present
    if (fieldValue.startsWith(" ")) {
      fieldValue = fieldValue.substring(1);
    }

    try {
      switch (fieldName) {
        case "data":
          // Concatenate multiple data fields with newlines
          currentEvent.data = currentEvent.data
            ? currentEvent.data + "\n" + fieldValue
            : fieldValue;
          break;

        case "event":
          currentEvent.event = fieldValue;
          break;

        case "id":
          currentEvent.id = fieldValue;
          break;

        case "retry": {
          const retryValue = parseInt(fieldValue, 10);
          if (!isNaN(retryValue) && retryValue >= 0) {
            currentEvent.retry = retryValue;
          } else {
            console.warn(`Invalid retry value: ${fieldValue}, ignoring`);
          }
          break;
        }

        default:
          // Unknown fields are ignored per SSE specification
          console.warn(`Unknown SSE field: ${fieldName}, ignoring`);
          break;
      }
    } catch (error) {
      // Log error but continue parsing
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `Error processing SSE field ${fieldName}: ${errorMessage}, ignoring`,
      );
    }

    return { shouldYield: false };
  }
}
