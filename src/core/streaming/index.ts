/**
 * Universal Streaming Interface Module
 *
 * This module contains universal streaming parsers for provider-agnostic
 * streaming including chunked response parsing, SSE parsing, and buffer
 * management for real-time response handling.
 *
 * Provides streaming abstractions for all LLM providers.
 */

export { ChunkParser } from "./chunkParser";
export { SseParser } from "./sseParser";
export type { ParsedChunk } from "./parsedChunk";
export type { ChunkParserOptions } from "./chunkParserOptions";
export type { SseEvent } from "./sseEvent";
