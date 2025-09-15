/**
 * Universal Streaming Interface Module
 *
 * This module contains universal streaming parsers for provider-agnostic
 * streaming including chunked response parsing, SSE parsing, and buffer
 * management for real-time response handling.
 *
 * Provides streaming abstractions for all LLM providers.
 */

export { ChunkParser } from "./chunkParser.js";
export { SseParser } from "./sseParser.js";
export type { ParsedChunk } from "./parsedChunk.js";
export type { ChunkParserOptions } from "./chunkParserOptions.js";
export type { SseEvent } from "./sseEvent.js";
