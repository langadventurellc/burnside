/**
 * Stream Chunk Interface
 *
 * Interface for individual data chunks within a streaming response.
 * Provides the raw data along with optional metadata about the chunk
 * for processing by streaming consumers.
 *
 * @example Basic stream chunk
 * ```typescript
 * const chunk: StreamChunk = {
 *   data: new Uint8Array([65, 66, 67]), // "ABC"
 *   metadata: {
 *     timestamp: Date.now(),
 *     sequence: 1
 *   }
 * };
 * ```
 */

/**
 * Individual data chunk within a streaming response.
 *
 * @property data - Raw chunk data as bytes
 * @property metadata - Optional metadata about the chunk
 */
export interface StreamChunk {
  /** Raw chunk data as bytes */
  data: Uint8Array;

  /** Optional metadata about the chunk */
  metadata?: Record<string, unknown>;
}
